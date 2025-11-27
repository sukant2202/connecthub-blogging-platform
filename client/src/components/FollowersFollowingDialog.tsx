import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "./UserAvatar";
import { FollowButton } from "./FollowButton";
import { Link } from "wouter";
import type { User } from "@shared/schema";

interface FollowersFollowingDialogProps {
  userId: string;
  username?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "followers" | "following";
  followersCount: number;
  followingCount: number;
}

type UserWithFollowStatus = User & { isFollowing: boolean };

export function FollowersFollowingDialog({
  userId,
  username,
  open,
  onOpenChange,
  initialTab = "followers",
  followersCount,
  followingCount,
}: FollowersFollowingDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);

  // Reset tab when dialog opens with a different initialTab
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const { data: followers, isLoading: followersLoading } = useQuery<UserWithFollowStatus[]>({
    queryKey: ["/api/users", username || userId, "followers"],
    enabled: open && activeTab === "followers",
  });

  const { data: following, isLoading: followingLoading } = useQuery<UserWithFollowStatus[]>({
    queryKey: ["/api/users", username || userId, "following"],
    enabled: open && activeTab === "following",
  });

  const displayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || "Anonymous";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {username ? `@${username}` : "User"}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "followers" | "following")} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              Followers ({followersCount})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({followingCount})
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="followers" className="mt-0 space-y-2">
              {followersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                ))
              ) : followers && followers.length > 0 ? (
                followers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <Link href={`/u/${user.username || user.id}`} onClick={() => onOpenChange(false)}>
                      <UserAvatar user={user} size="lg" className="cursor-pointer" />
                    </Link>
                    <Link 
                      href={`/u/${user.username || user.id}`} 
                      className="flex-1 min-w-0"
                      onClick={() => onOpenChange(false)}
                    >
                      <div className="min-w-0">
                        <p className="font-medium leading-tight truncate">{displayName(user)}</p>
                        {user.username && (
                          <p className="text-sm text-muted-foreground font-mono truncate">
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </Link>
                    <FollowButton
                      userId={user.id}
                      isFollowing={user.isFollowing}
                      onFollowChange={() => {
                        // Invalidate to refresh the list and profile counts
                        queryClient.invalidateQueries({ queryKey: ["/api/users", username || userId, "followers"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/users", username || userId, "following"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/users", username || userId] });
                      }}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No followers yet</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="following" className="mt-0 space-y-2">
              {followingLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                ))
              ) : following && following.length > 0 ? (
                following.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <Link href={`/u/${user.username || user.id}`} onClick={() => onOpenChange(false)}>
                      <UserAvatar user={user} size="lg" className="cursor-pointer" />
                    </Link>
                    <Link 
                      href={`/u/${user.username || user.id}`} 
                      className="flex-1 min-w-0"
                      onClick={() => onOpenChange(false)}
                    >
                      <div className="min-w-0">
                        <p className="font-medium leading-tight truncate">{displayName(user)}</p>
                        {user.username && (
                          <p className="text-sm text-muted-foreground font-mono truncate">
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </Link>
                    <FollowButton
                      userId={user.id}
                      isFollowing={user.isFollowing}
                      onFollowChange={() => {
                        // Invalidate to refresh the list
                        queryClient.invalidateQueries({ queryKey: ["/api/users", username || userId, "following"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/users", username || userId] });
                      }}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Not following anyone yet</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

