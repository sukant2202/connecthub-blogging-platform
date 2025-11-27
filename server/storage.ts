import {
  User,
  Post,
  Follow,
  Like,
  Comment,
  User as UserModel,
  Post as PostModel,
  Follow as FollowModel,
  Like as LikeModel,
  Comment as CommentModel,
  type IUser,
  type IPost,
  type IFollow,
  type ILike,
  type IComment,
  type UpsertUser,
  type InsertUser,
  type PostWithAuthor,
  type CommentWithAuthor,
  type UserProfile,
  type UserSearchResult,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser & { passwordHash: string }): Promise<User>;
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
  getPost(id: string, currentUserId?: string): Promise<PostWithAuthor | undefined>;
  getPosts(currentUserId?: string, limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  getFeedPosts(userId: string, limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  getUserPosts(userId: string, currentUserId?: string): Promise<PostWithAuthor[]>;
  updatePost(id: string, userId: string, content: string, imageUrl?: string | null): Promise<Post | undefined>;
  deletePost(id: string, userId: string): Promise<boolean>;
  
  // Follow operations
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  
  // Like operations
  likePost(userId: string, postId: string): Promise<Like>;
  unlikePost(userId: string, postId: string): Promise<boolean>;
  isLiked(userId: string, postId: string): Promise<boolean>;
  getLikesCount(postId: string): Promise<number>;
  
  // Comment operations
  createComment(userId: string, postId: string, content: string): Promise<Comment>;
  getComments(postId: string): Promise<CommentWithAuthor[]>;
  deleteComment(id: string, userId: string): Promise<boolean>;
  getCommentsCount(postId: string): Promise<number>;
}

// Helper to convert MongoDB document to API format (id instead of _id)
function toApiFormat<T>(doc: T): Omit<T, '_id'> & { id: string } {
  const obj = (doc as any).toObject ? (doc as any).toObject() : doc;
  const { _id, __v, ...rest } = obj;
  return { ...rest, id: _id ? _id.toString() : '' } as Omit<T, '_id'> & { id: string };
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id);
    return user ? toApiFormat(user) as User : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username });
    return user ? toApiFormat(user) as User : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email });
    return user ? toApiFormat(user) as User : undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    let user;
    if (userData._id) {
      user = await UserModel.findByIdAndUpdate(
        userData._id,
        { ...userData, updatedAt: new Date() },
        { new: true, upsert: true }
      );
    } else {
      user = await UserModel.create({ ...userData, updatedAt: new Date() });
    }
    return toApiFormat(user) as User;
  }

  async createUser(userData: InsertUser & { passwordHash: string }): Promise<User> {
    const user = await UserModel.create({ ...userData, updatedAt: new Date() });
    return toApiFormat(user) as User;
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const user = await UserModel.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true });
    return user ? toApiFormat(user) as User : undefined;
  }

  async getSuggestedUsers(currentUserId: string, limit = 5): Promise<User[]> {
    const followingIds = await FollowModel.find({ followerId: currentUserId }).distinct("followingId");
    followingIds.push(currentUserId);
    
    const users = await UserModel.find({ _id: { $nin: followingIds } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return users.map(u => toApiFormat(u) as User);
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

    const regex = new RegExp(trimmed, "i");
    const searchQuery: any = {
      $or: [
        { username: regex },
        { firstName: regex },
        { lastName: regex },
      ],
    };

    if (currentUserId) {
      searchQuery._id = { $ne: currentUserId };
    }

    const safeLimit = Math.min(Math.max(limit ?? 10, 1), 25);
    const users = await UserModel.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .exec();

    return Promise.all(
      users.map(async (user) => {
        const followersCount = await Follow.countDocuments({ followingId: user._id });
        const isFollowing = currentUserId
          ? await this.isFollowing(currentUserId, user._id.toString())
          : false;

        const userObj = toApiFormat(user);
        return {
          ...userObj,
          followersCount,
          isFollowing,
        } as UserSearchResult;
      })
    );
  }

  async getUserProfile(identifier: string, currentUserId?: string): Promise<UserProfile | undefined> {
    let user = await UserModel.findOne({ username: identifier });
    if (!user) {
      user = await UserModel.findById(identifier);
    }
    if (!user) return undefined;

    const followersCount = await FollowModel.countDocuments({ followingId: user._id });
    const followingCount = await FollowModel.countDocuments({ followerId: user._id });
    const postsCount = await PostModel.countDocuments({ userId: user._id.toString() });

    let isFollowing = false;
    if (currentUserId && currentUserId !== user._id.toString()) {
      isFollowing = await this.isFollowing(currentUserId, user._id.toString());
    }

    const userObj = toApiFormat(user);
    return {
      ...userObj,
      followersCount,
      followingCount,
      postsCount,
      isFollowing,
    } as UserProfile;
  }

  // Post operations
  async createPost(userId: string, content: string, imageUrl?: string | null): Promise<Post> {
    const post = await PostModel.create({ userId, content, imageUrl: imageUrl || undefined });
    return toApiFormat(post) as Post;
  }

  async getPost(id: string, currentUserId?: string): Promise<PostWithAuthor | undefined> {
    const post = await PostModel.findById(id);
    if (!post) return undefined;

    const author = await UserModel.findById(post.userId);
    if (!author) return undefined;

    const likesCount = await this.getLikesCount(id);
    const commentsCount = await this.getCommentsCount(id);
    const isLiked = currentUserId ? await this.isLiked(currentUserId, id) : false;

    const postObj = toApiFormat(post);
    const authorObj = toApiFormat(author);
    return {
      ...postObj,
      author: authorObj,
      likesCount,
      commentsCount,
      isLiked,
    } as PostWithAuthor;
  }

  async getPosts(currentUserId?: string, limit = 50, offset = 0): Promise<PostWithAuthor[]> {
    const posts = await PostModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();

    return Promise.all(
      posts.map(async (post) => {
        const author = await UserModel.findById(post.userId);
        if (!author) return null;

        const likesCount = await this.getLikesCount(post._id.toString());
        const commentsCount = await this.getCommentsCount(post._id.toString());
        const isLiked = currentUserId ? await this.isLiked(currentUserId, post._id.toString()) : false;

        const postObj = toApiFormat(post);
        const authorObj = toApiFormat(author);
        return {
          ...postObj,
          author: authorObj,
          likesCount,
          commentsCount,
          isLiked,
        } as PostWithAuthor;
      })
    ).then(results => results.filter((r): r is PostWithAuthor => r !== null));
  }

  async getFeedPosts(userId: string, limit = 50, offset = 0): Promise<PostWithAuthor[]> {
    const followingIds = await FollowModel.find({ followerId: userId }).distinct("followingId");
    followingIds.push(userId);

    const posts = await PostModel.find({ userId: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();

    return Promise.all(
      posts.map(async (post) => {
        const author = await UserModel.findById(post.userId);
        if (!author) return null;

        const likesCount = await this.getLikesCount(post._id.toString());
        const commentsCount = await this.getCommentsCount(post._id.toString());
        const isLiked = await this.isLiked(userId, post._id.toString());

        const postObj = toApiFormat(post);
        const authorObj = toApiFormat(author);
        return {
          ...postObj,
          author: authorObj,
          likesCount,
          commentsCount,
          isLiked,
        } as PostWithAuthor;
      })
    ).then(results => results.filter((r): r is PostWithAuthor => r !== null));
  }

  async getUserPosts(userId: string, currentUserId?: string): Promise<PostWithAuthor[]> {
    const posts = await PostModel.find({ userId })
      .sort({ createdAt: -1 })
      .exec();

    return Promise.all(
      posts.map(async (post) => {
        const author = await UserModel.findById(post.userId);
        if (!author) return null;

        const likesCount = await this.getLikesCount(post._id.toString());
        const commentsCount = await this.getCommentsCount(post._id.toString());
        const isLiked = currentUserId ? await this.isLiked(currentUserId, post._id.toString()) : false;

        const postObj = toApiFormat(post);
        const authorObj = toApiFormat(author);
        return {
          ...postObj,
          author: authorObj,
          likesCount,
          commentsCount,
          isLiked,
        } as PostWithAuthor;
      })
    ).then(results => results.filter((r): r is PostWithAuthor => r !== null));
  }

  async updatePost(id: string, userId: string, content: string, imageUrl?: string | null): Promise<Post | undefined> {
    const post = await PostModel.findOneAndUpdate(
      { _id: id, userId },
      { content, imageUrl: imageUrl || undefined, updatedAt: new Date() },
      { new: true }
    );
    return post ? toApiFormat(post) as Post : undefined;
  }

  async deletePost(id: string, userId: string): Promise<boolean> {
    const result = await PostModel.findOneAndDelete({ _id: id, userId });
    return !!result;
  }

  // Follow operations
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    const follow = await FollowModel.create({ followerId, followingId });
    return toApiFormat(follow) as Follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await FollowModel.findOneAndDelete({ followerId, followingId });
    return !!result;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await FollowModel.findOne({ followerId, followingId });
    return !!follow;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const follows = await FollowModel.find({ followingId: userId }).distinct("followerId");
    const users = await UserModel.find({ _id: { $in: follows } }).exec();
    return users.map(u => toApiFormat(u) as User);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const follows = await FollowModel.find({ followerId: userId }).distinct("followingId");
    const users = await UserModel.find({ _id: { $in: follows } }).exec();
    return users.map(u => toApiFormat(u) as User);
  }

  // Like operations
  async likePost(userId: string, postId: string): Promise<Like> {
    const like = await LikeModel.create({ userId, postId });
    return toApiFormat(like) as Like;
  }

  async unlikePost(userId: string, postId: string): Promise<boolean> {
    const result = await LikeModel.findOneAndDelete({ userId, postId });
    return !!result;
  }

  async isLiked(userId: string, postId: string): Promise<boolean> {
    const like = await LikeModel.findOne({ userId, postId });
    return !!like;
  }

  async getLikesCount(postId: string): Promise<number> {
    return await LikeModel.countDocuments({ postId });
  }

  // Comment operations
  async createComment(userId: string, postId: string, content: string): Promise<Comment> {
    const comment = await CommentModel.create({ userId, postId, content });
    return toApiFormat(comment) as Comment;
  }

  async getComments(postId: string): Promise<CommentWithAuthor[]> {
    const comments = await CommentModel.find({ postId })
      .sort({ createdAt: -1 })
      .exec();

    return Promise.all(
      comments.map(async (comment) => {
        const author = await UserModel.findById(comment.userId);
        if (!author) return null;

        const commentObj = toApiFormat(comment);
        const authorObj = toApiFormat(author);
        return {
          ...commentObj,
          author: authorObj,
        } as CommentWithAuthor;
      })
    ).then(results => results.filter((r): r is CommentWithAuthor => r !== null));
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    const result = await CommentModel.findOneAndDelete({ _id: id, userId });
    return !!result;
  }

  async getCommentsCount(postId: string): Promise<number> {
    return await CommentModel.countDocuments({ postId });
  }
}

export const storage = new DatabaseStorage();
