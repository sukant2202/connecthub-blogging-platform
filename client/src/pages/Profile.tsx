import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { PostFeed } from "@/components/PostFeed";
import { UserAvatar } from "@/components/UserAvatar";
import { FollowButton } from "@/components/FollowButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CalendarDays, Edit, Loader2, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { UserProfile, PostWithAuthor } from "@shared/schema";

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
    profileImageUrl: "",
  });

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users", username],
    enabled: !!username,
  });

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/users", username, "posts"],
    enabled: !!username,
  });

  useEffect(() => {
    if (profile) {
      setEditForm({
        username: profile.username || "",
        bio: profile.bio || "",
        profileImageUrl: profile.profileImageUrl || "",
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username?: string; bio?: string; profileImageUrl?: string }) => {
      return apiRequest("PUT", "/api/users/me", data);
    },
    onSuccess: () => {
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users", username] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in to update your profile",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      username: editForm.username.trim() || undefined,
      bio: editForm.bio.trim() || undefined,
      profileImageUrl: editForm.profileImageUrl.trim() || undefined,
    });
  };

  const isOwnProfile = currentUser?.id === profile?.id;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        {currentUser && <Navbar user={currentUser} />}
        <main className="max-w-4xl mx-auto px-4 py-6">
          <Card className="border">
            <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/5" />
            <CardContent className="relative pt-0 pb-6">
              <div className="-mt-12 mb-4">
                <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
              </div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-16 w-full max-w-lg" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        {currentUser && <Navbar user={currentUser} />}
        <main className="max-w-4xl mx-auto px-4 py-6">
          <Card className="border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">User not found</p>
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Go back home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const displayName = profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile.username || "Anonymous";

  const memberSince = profile.createdAt
    ? formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })
    : "";

  return (
    <div className="min-h-screen bg-background">
      {currentUser && <Navbar user={currentUser} />}
      
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="border overflow-hidden" data-testid="card-profile">
          <div className="h-48 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10" />
          
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="-mt-12">
                <UserAvatar 
                  user={profile} 
                  size="xl" 
                  className="border-4 border-background"
                />
              </div>
              
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2" data-testid="button-edit-profile">
                        <Edit className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            placeholder="Enter username"
                            data-testid="input-edit-username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            placeholder="Tell us about yourself"
                            className="resize-none"
                            rows={3}
                            data-testid="input-edit-bio"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="avatar">Profile Image URL</Label>
                          <Input
                            id="avatar"
                            type="url"
                            value={editForm.profileImageUrl}
                            onChange={(e) => setEditForm({ ...editForm, profileImageUrl: e.target.value })}
                            placeholder="https://example.com/avatar.jpg"
                            data-testid="input-edit-avatar"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
                            {updateProfileMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                ) : currentUser && (
                  <FollowButton 
                    userId={profile.id} 
                    isFollowing={profile.isFollowing} 
                  />
                )}
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-profile-name">
                  {displayName}
                </h1>
                {profile.username && (
                  <p className="text-muted-foreground font-mono" data-testid="text-profile-username">
                    @{profile.username}
                  </p>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-foreground max-w-lg leading-relaxed" data-testid="text-profile-bio">
                  {profile.bio}
                </p>
              )}
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>Joined {memberSince}</span>
              </div>
              
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-semibold" data-testid="text-posts-count">{profile.postsCount}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
                <div>
                  <span className="font-semibold" data-testid="text-followers-count">{profile.followersCount}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-semibold" data-testid="text-following-count">{profile.followingCount}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
            <TabsTrigger 
              value="posts" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              data-testid="tab-posts"
            >
              Posts
            </TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="mt-6">
            <PostFeed 
              posts={posts} 
              isLoading={postsLoading}
              currentUserId={currentUser?.id}
              emptyMessage={isOwnProfile ? "You haven't posted anything yet" : "This user hasn't posted anything yet"}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
