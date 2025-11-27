import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  isLiked: boolean;
  likesCount: number;
  onLikeChange?: (isLiked: boolean, likesCount: number) => void;
}

export function LikeButton({ postId, isLiked: initialIsLiked, likesCount: initialLikesCount, onLikeChange }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/posts/${postId}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${postId}/like`);
      }
    },
    onSuccess: () => {
      const newIsLiked = !isLiked;
      const newCount = newIsLiked ? likesCount + 1 : likesCount - 1;
      setIsLiked(newIsLiked);
      setLikesCount(newCount);
      onLikeChange?.(newIsLiked, newCount);
      
      if (newIsLiked) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in to like posts",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    likeMutation.mutate();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={likeMutation.isPending}
      className={cn(
        "gap-1.5 text-muted-foreground hover:text-destructive",
        isLiked && "text-destructive"
      )}
      data-testid={`button-like-${postId}`}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-transform",
          isLiked && "fill-current",
          isAnimating && "scale-125"
        )}
      />
      <span className="text-sm font-medium">{likesCount}</span>
    </Button>
  );
}
