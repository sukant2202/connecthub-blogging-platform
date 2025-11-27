import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ userId, isFollowing: serverIsFollowing, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(serverIsFollowing);
  const [isHovering, setIsHovering] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setIsFollowing(serverIsFollowing);
  }, [serverIsFollowing]);

  const followMutation = useMutation({
    mutationFn: async (currentFollowingState: boolean) => {
      try {
        if (currentFollowingState) {
          const response = await apiRequest("DELETE", `/api/users/${userId}/follow`);
          await response.json(); // Parse response to ensure it's valid
        } else {
          const response = await apiRequest("POST", `/api/users/${userId}/follow`);
          await response.json(); // Parse response to ensure it's valid
        }
      } catch (error: any) {
        console.error("Follow mutation error:", error);
        // Extract meaningful error message
        const errorMessage = error?.message || "Failed to update follow status";
        throw new Error(errorMessage);
      }
    },
    onMutate: async () => {
      const newFollowState = !isFollowing;
      setIsFollowing(newFollowState);
      onFollowChange?.(newFollowState);
      return { previousState: isFollowing, newState: newFollowState };
    },
    onSuccess: () => {
      // State is already updated in onMutate, just invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      queryClient.invalidateQueries({ queryKey: ["user-search"] });
    },
    onError: (error: Error, _, context) => {
      console.error("Follow mutation onError:", error);
      // Revert optimistic update
      if (context) {
        setIsFollowing(context.previousState);
        onFollowChange?.(context.previousState);
      }
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in to follow users",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      
      // Extract error message from the error
      let errorMessage = "Failed to update follow status";
      if (error.message) {
        // Error format is usually "STATUS: message"
        const match = error.message.match(/^\d+:\s*(.+)$/);
        if (match) {
          errorMessage = match[1];
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    followMutation.mutate(isFollowing);
  };

  if (followMutation.isPending) {
    return (
      <Button variant="outline" size="sm" disabled className="rounded-full px-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (isFollowing) {
    return (
      <Button
        variant={isHovering ? "destructive" : "outline"}
        size="sm"
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="rounded-full px-4 min-w-[100px]"
        data-testid={`button-unfollow-${userId}`}
      >
        {isHovering ? (
          <>
            <UserMinus className="h-4 w-4 mr-1.5" />
            Unfollow
          </>
        ) : (
          "Following"
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleClick}
      className="rounded-full px-4"
      data-testid={`button-follow-${userId}`}
    >
      <UserPlus className="h-4 w-4 mr-1.5" />
      Follow
    </Button>
  );
}
