import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get('/api/users/suggested', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const users = await storage.getSuggestedUsers(userId, 5);
      res.json(users);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      res.status(500).json({ message: "Failed to fetch suggested users" });
    }
  });

  app.get('/api/users/:identifier', async (req: any, res) => {
    try {
      const { identifier } = req.params;
      const currentUserId = req.user?.claims?.sub;
      const profile = await storage.getUserProfile(identifier, currentUserId);
      
      if (!profile) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.get('/api/users/:identifier/posts', async (req: any, res) => {
    try {
      const { identifier } = req.params;
      const currentUserId = req.user?.claims?.sub;
      
      // Find user by username or id
      let user = await storage.getUserByUsername(identifier);
      if (!user) {
        user = await storage.getUser(identifier);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const posts = await storage.getUserPosts(user.id, currentUserId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  app.put('/api/users/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const schema = z.object({
        username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").optional(),
        bio: z.string().max(300).optional(),
        profileImageUrl: z.string().url().optional().or(z.literal("")),
      });
      
      const { username, bio, profileImageUrl } = schema.parse(req.body);
      
      // Check if username is taken by another user
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }
      
      // Build update object, preserving empty strings to allow clearing fields
      const updateData: { username?: string; bio?: string | null; profileImageUrl?: string | null } = {};
      
      if (username !== undefined) {
        updateData.username = username;
      }
      
      // Allow clearing bio by sending empty string (convert to null for DB)
      if (bio !== undefined) {
        updateData.bio = bio === "" ? null : bio;
      }
      
      // Allow clearing profileImageUrl by sending empty string (convert to null for DB)
      if (profileImageUrl !== undefined) {
        updateData.profileImageUrl = profileImageUrl === "" ? null : profileImageUrl;
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Follow routes
  app.post('/api/users/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.id;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const follow = await storage.followUser(followerId, followingId);
      res.json(follow);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ message: "Already following this user" });
      }
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/users/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.id;
      
      const success = await storage.unfollowUser(followerId, followingId);
      if (!success) {
        return res.status(404).json({ message: "Follow relationship not found" });
      }
      
      res.json({ message: "Unfollowed successfully" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  // Post routes
  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schema = z.object({
        content: z.string().min(1).max(500),
        imageUrl: z.string().url().nullable().optional(),
      });
      
      const { content, imageUrl } = schema.parse(req.body);
      const post = await storage.createPost(userId, content, imageUrl);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get('/api/posts', async (req: any, res) => {
    try {
      const currentUserId = req.user?.claims?.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const posts = await storage.getPosts(currentUserId, limit, offset);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/posts/feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const posts = await storage.getFeedPosts(userId, limit, offset);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  app.get('/api/posts/:id', async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const currentUserId = req.user?.claims?.sub;
      
      const post = await storage.getPost(postId, currentUserId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.put('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const schema = z.object({
        content: z.string().min(1).max(500),
        imageUrl: z.string().url().nullable().optional(),
      });
      
      const { content, imageUrl } = schema.parse(req.body);
      const post = await storage.updatePost(postId, userId, content, imageUrl);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found or unauthorized" });
      }
      
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      
      const success = await storage.deletePost(postId, userId);
      if (!success) {
        return res.status(404).json({ message: "Post not found or unauthorized" });
      }
      
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Like routes
  app.post('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      
      const like = await storage.likePost(userId, postId);
      res.json(like);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ message: "Already liked this post" });
      }
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      
      const success = await storage.unlikePost(userId, postId);
      if (!success) {
        return res.status(404).json({ message: "Like not found" });
      }
      
      res.json({ message: "Unliked successfully" });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  // Comment routes
  app.post('/api/posts/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const schema = z.object({
        content: z.string().min(1).max(500),
      });
      
      const { content } = schema.parse(req.body);
      const comment = await storage.createComment(userId, postId, content);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/posts/:id/comments', async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.delete('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentId = parseInt(req.params.id);
      
      const success = await storage.deleteComment(commentId, userId);
      if (!success) {
        return res.status(404).json({ message: "Comment not found or unauthorized" });
      }
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  return httpServer;
}
