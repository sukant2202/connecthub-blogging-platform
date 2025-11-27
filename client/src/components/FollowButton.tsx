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
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest("DELETE", `/api/users/${userId}/follow`);
      } else {
        await apiRequest("POST", `/api/users/${userId}/follow`);
      }
    },
    onMutate: async () => {
      const newFollowState = !isFollowing;
      setIsFollowing(newFollowState);
      return { previousState: isFollowing };
    },
    onSuccess: () => {
      const newFollowState = isFollowing;
      onFollowChange?.(newFollowState);
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
        queryClient.invalidateQueries({ queryKey: ["user-search"] });
    },
    onError: (error: Error, _, context) => {
      if (context) {
        setIsFollowing(context.previousState);
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
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    followMutation.mutate();
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
