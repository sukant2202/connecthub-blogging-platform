import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "./UserAvatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Trash2, Send, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { CommentWithAuthor } from "@shared/schema";

interface CommentSectionProps {
  postId: number;
  currentUserId?: string;
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments, isLoading } = useQuery<CommentWithAuthor[]>({
    queryKey: ["/api/posts", postId, "comments"],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in to comment",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You can only delete your own comments",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-3" data-testid="form-add-comment">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 min-h-[80px] resize-none"
          data-testid="input-comment"
        />
        <Button 
          type="submit" 
          disabled={!newComment.trim() || addCommentMutation.isPending}
          size="icon"
          className="self-end"
          data-testid="button-submit-comment"
        >
          {addCommentMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      <div className="space-y-4">
        {comments && comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments?.map((comment) => {
            const displayName = comment.author.firstName && comment.author.lastName
              ? `${comment.author.firstName} ${comment.author.lastName}`
              : comment.author.username || "Anonymous";
            
            const timeAgo = comment.createdAt
              ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
              : "";

            return (
              <Card key={comment.id} className="border" data-testid={`card-comment-${comment.id}`}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Link href={`/u/${comment.author.username || comment.author.id}`}>
                      <UserAvatar user={comment.author} size="sm" className="cursor-pointer" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link href={`/u/${comment.author.username || comment.author.id}`}>
                            <span className="font-semibold text-sm hover:underline cursor-pointer">
                              {displayName}
                            </span>
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {timeAgo}
                          </span>
                        </div>
                        {currentUserId === comment.userId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                            data-testid={`button-delete-comment-${comment.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-foreground leading-relaxed" data-testid={`text-comment-${comment.id}`}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
