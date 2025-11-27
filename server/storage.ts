import {
  users,
  posts,
  follows,
  likes,
  comments,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type Follow,
  type Like,
  type Comment,
  type InsertComment,
  type PostWithAuthor,
  type CommentWithAuthor,
  type UserProfile,
  type UserSearchResult,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ne, inArray, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined>;
  getSuggestedUsers(currentUserId: string, limit?: number): Promise<User[]>;
  searchUsers(
    query: string,
    currentUserId?: string,
    limit?: number,
  ): Promise<UserSearchResult[]>;
  
  // User profile
  getUserProfile(identifier: string, currentUserId?: string): Promise<UserProfile | undefined>;
  
  // Post operations
  createPost(userId: string, content: string, imageUrl?: string | null): Promise<Post>;
  getPost(id: number, currentUserId?: string): Promise<PostWithAuthor | undefined>;
  getPosts(currentUserId?: string, limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  getFeedPosts(userId: string, limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  getUserPosts(userId: string, currentUserId?: string): Promise<PostWithAuthor[]>;
  updatePost(id: number, userId: string, content: string, imageUrl?: string | null): Promise<Post | undefined>;
  deletePost(id: number, userId: string): Promise<boolean>;
  
  // Follow operations
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  
  // Like operations
  likePost(userId: string, postId: number): Promise<Like>;
  unlikePost(userId: string, postId: number): Promise<boolean>;
  isLiked(userId: string, postId: number): Promise<boolean>;
  getLikesCount(postId: number): Promise<number>;
  
  // Comment operations
  createComment(userId: string, postId: number, content: string): Promise<Comment>;
  getComments(postId: number): Promise<CommentWithAuthor[]>;
  deleteComment(id: number, userId: string): Promise<boolean>;
  getCommentsCount(postId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getSuggestedUsers(currentUserId: string, limit = 5): Promise<User[]> {
    const followingSubquery = db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, currentUserId));

    const suggestedUsers = await db
      .select()
      .from(users)
      .where(
        and(
          ne(users.id, currentUserId),
          sql`${users.id} NOT IN (${followingSubquery})`
        )
      )
      .limit(limit)
      .orderBy(desc(users.createdAt));

    return suggestedUsers;
  }

  async searchUsers(
    query: string,
    currentUserId?: string,
    limit = 10,
  ): Promise<UserSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const wildcard = `%${trimmed}%`;
    const nameMatch = or(
      ilike(users.username, wildcard),
      ilike(users.firstName, wildcard),
      ilike(users.lastName, wildcard),
    );
    const whereClause = currentUserId
      ? and(nameMatch, ne(users.id, currentUserId))
      : nameMatch;
    const safeLimit = Math.min(Math.max(limit ?? 10, 1), 25);

    const rows = await db
      .select({
        user: users,
        followersCount: sql<number>`(
          SELECT count(*)::int FROM ${follows}
          WHERE ${follows.followingId} = ${users.id}
        )`,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(safeLimit);

    return Promise.all(
      rows.map(async ({ user, followersCount }) => ({
        ...user,
        followersCount: followersCount ?? 0,
        isFollowing: currentUserId
          ? await this.isFollowing(currentUserId, user.id)
          : false,
      })),
    );
  }

  async getUserProfile(identifier: string, currentUserId?: string): Promise<UserProfile | undefined> {
    // Try to find by username first, then by id
    let user = await this.getUserByUsername(identifier);
    if (!user) {
      user = await this.getUser(identifier);
    }
    if (!user) return undefined;

    const [followersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followingId, user.id));

    const [followingResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followerId, user.id));

    const [postsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(eq(posts.userId, user.id));

    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      isFollowing = await this.isFollowing(currentUserId, user.id);
    }

    return {
      ...user,
      followersCount: followersResult?.count || 0,
      followingCount: followingResult?.count || 0,
      postsCount: postsResult?.count || 0,
      isFollowing,
    };
  }

  // Post operations
  async createPost(userId: string, content: string, imageUrl?: string | null): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({ userId, content, imageUrl })
      .returning();
    return post;
  }

  async getPost(id: number, currentUserId?: string): Promise<PostWithAuthor | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .innerJoin(users, eq(posts.userId, users.id));

    if (!post) return undefined;

    const likesCount = await this.getLikesCount(id);
    const commentsCount = await this.getCommentsCount(id);
    const isLiked = currentUserId ? await this.isLiked(currentUserId, id) : false;

    return {
      ...post.posts,
      author: post.users,
      likesCount,
      commentsCount,
      isLiked,
    };
  }

  async getPosts(currentUserId?: string, limit = 50, offset = 0): Promise<PostWithAuthor[]> {
    const postsWithAuthors = await db
      .select()
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return Promise.all(
      postsWithAuthors.map(async (row) => {
        const likesCount = await this.getLikesCount(row.posts.id);
        const commentsCount = await this.getCommentsCount(row.posts.id);
        const isLiked = currentUserId ? await this.isLiked(currentUserId, row.posts.id) : false;

        return {
          ...row.posts,
          author: row.users,
          likesCount,
          commentsCount,
          isLiked,
        };
      })
    );
  }

  async getFeedPosts(userId: string, limit = 50, offset = 0): Promise<PostWithAuthor[]> {
    // Get posts from users the current user follows
    const followingIds = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followingIdList = followingIds.map((f) => f.id);
    
    // Include the user's own posts too
    followingIdList.push(userId);

    if (followingIdList.length === 0) {
      return [];
    }

    const postsWithAuthors = await db
      .select()
      .from(posts)
      .where(inArray(posts.userId, followingIdList))
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return Promise.all(
      postsWithAuthors.map(async (row) => {
        const likesCount = await this.getLikesCount(row.posts.id);
        const commentsCount = await this.getCommentsCount(row.posts.id);
        const isLiked = await this.isLiked(userId, row.posts.id);

        return {
          ...row.posts,
          author: row.users,
          likesCount,
          commentsCount,
          isLiked,
        };
      })
    );
  }

  async getUserPosts(userId: string, currentUserId?: string): Promise<PostWithAuthor[]> {
    const postsWithAuthors = await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));

    return Promise.all(
      postsWithAuthors.map(async (row) => {
        const likesCount = await this.getLikesCount(row.posts.id);
        const commentsCount = await this.getCommentsCount(row.posts.id);
        const isLiked = currentUserId ? await this.isLiked(currentUserId, row.posts.id) : false;

        return {
          ...row.posts,
          author: row.users,
          likesCount,
          commentsCount,
          isLiked,
        };
      })
    );
  }

  async updatePost(id: number, userId: string, content: string, imageUrl?: string | null): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ content, imageUrl, updatedAt: new Date() })
      .where(and(eq(posts.id, id), eq(posts.userId, userId)))
      .returning();
    return post;
  }

  async deletePost(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Follow operations
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    const [follow] = await db
      .insert(follows)
      .values({ followerId, followingId })
      .returning();
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
      .returning();
    return result.length > 0;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!follow;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    return result.map((r) => r.user);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    return result.map((r) => r.user);
  }

  // Like operations
  async likePost(userId: string, postId: number): Promise<Like> {
    const [like] = await db
      .insert(likes)
      .values({ userId, postId })
      .returning();
    return like;
  }

  async unlikePost(userId: string, postId: number): Promise<boolean> {
    const result = await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
      .returning();
    return result.length > 0;
  }

  async isLiked(userId: string, postId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    return !!like;
  }

  async getLikesCount(postId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .where(eq(likes.postId, postId));
    return result?.count || 0;
  }

  // Comment operations
  async createComment(userId: string, postId: number, content: string): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({ userId, postId, content })
      .returning();
    return comment;
  }

  async getComments(postId: number): Promise<CommentWithAuthor[]> {
    const result = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .innerJoin(users, eq(comments.userId, users.id))
      .orderBy(desc(comments.createdAt));

    return result.map((row) => ({
      ...row.comments,
      author: row.users,
    }));
  }

  async deleteComment(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(comments)
      .where(and(eq(comments.id, id), eq(comments.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getCommentsCount(postId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(eq(comments.postId, postId));
    return result?.count || 0;
  }
}

export const storage = new DatabaseStorage();
