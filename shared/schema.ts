import mongoose, { Schema, Document, type Types } from "mongoose";
import { z } from "zod";

// User Schema
export interface IUser extends Document {
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  username?: string;
  passwordHash?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, sparse: true },
    firstName: String,
    lastName: String,
    profileImageUrl: String,
    username: { type: String, sparse: true },
    passwordHash: String,
    bio: String,
  },
  {
    timestamps: true,
    _id: true,
  }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });

export const User = mongoose.model<IUser>("User", userSchema);

// Post Schema
export interface IPost extends Document {
  userId: string;
  content: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    userId: { type: String, required: true, ref: "User" },
    content: { type: String, required: true },
    imageUrl: String,
  },
  {
    timestamps: true,
  }
);

postSchema.index({ userId: 1 });
postSchema.index({ createdAt: -1 });

export const Post = mongoose.model<IPost>("Post", postSchema);

// Follow Schema
export interface IFollow extends Document {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

const followSchema = new Schema<IFollow>(
  {
    followerId: { type: String, required: true, ref: "User" },
    followingId: { type: String, required: true, ref: "User" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

followSchema.index({ followerId: 1 });
followSchema.index({ followingId: 1 });
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export const Follow = mongoose.model<IFollow>("Follow", followSchema);

// Like Schema
export interface ILike extends Document {
  userId: string;
  postId: string;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    userId: { type: String, required: true, ref: "User" },
    postId: { type: String, required: true, ref: "Post" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

likeSchema.index({ postId: 1 });
likeSchema.index({ userId: 1 });
likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const Like = mongoose.model<ILike>("Like", likeSchema);

// Comment Schema
export interface IComment extends Document {
  userId: string;
  postId: string;
  content: string;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    userId: { type: String, required: true, ref: "User" },
    postId: { type: String, required: true, ref: "Post" },
    content: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

commentSchema.index({ postId: 1 });
commentSchema.index({ userId: 1 });

export const Comment = mongoose.model<IComment>("Comment", commentSchema);

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().url().optional().or(z.literal("")),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(300).optional(),
  passwordHash: z.string().optional(),
});

export const insertPostSchema = z.object({
  userId: z.string(),
  content: z.string().min(1).max(500),
  imageUrl: z.string().url().nullable().optional(),
});

export const insertFollowSchema = z.object({
  followerId: z.string(),
  followingId: z.string(),
});

export const insertLikeSchema = z.object({
  userId: z.string(),
  postId: z.string(),
});

export const insertCommentSchema = z.object({
  userId: z.string(),
  postId: z.string(),
  content: z.string().min(1).max(500),
});

// Types - Plain object versions for API responses (without Mongoose Document methods)
export type User = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  username?: string;
  passwordHash?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Post = {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Follow = {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
};

export type Like = {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
};

export type Comment = {
  id: string;
  userId: string;
  postId: string;
  content: string;
  createdAt: Date;
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = InsertUser & { _id?: string };
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Extended types for frontend
export type PostWithAuthor = Post & {
  author: User;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
};

export type CommentWithAuthor = Comment & {
  author: User;
};

export type UserProfile = User & {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
};

export type UserSearchResult = User & {
  followersCount: number;
  isFollowing: boolean;
};
