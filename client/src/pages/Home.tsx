import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { PostComposer } from "@/components/PostComposer";
import { PostFeed } from "@/components/PostFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { UserAvatar } from "@/components/UserAvatar";
import { Users } from "lucide-react";
import type { PostWithAuthor, User } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  
  const { data: posts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts/feed"],
  });

  const { data: suggestedUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users/suggested"],
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PostComposer user={user} />
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Your Feed</h2>
              <PostFeed 
                posts={posts} 
                isLoading={postsLoading} 
                currentUserId={user.id}
                emptyMessage="Your feed is empty. Follow some people to see their posts here!"
              />
            </div>
          </div>
          
          <div className="hidden lg:block space-y-6">
            <Card className="border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  People to Follow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {usersLoading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : suggestedUsers && suggestedUsers.length > 0 ? (
                  suggestedUsers.slice(0, 5).map((suggestedUser) => (
                    <Link 
                      key={suggestedUser.id} 
                      href={`/u/${suggestedUser.username || suggestedUser.id}`}
                    >
                      <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover-elevate cursor-pointer">
                        <UserAvatar user={suggestedUser} size="md" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {suggestedUser.firstName && suggestedUser.lastName
                              ? `${suggestedUser.firstName} ${suggestedUser.lastName}`
                              : suggestedUser.username || "User"}
                          </p>
                          {suggestedUser.username && (
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              @{suggestedUser.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No suggestions available
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card className="border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground text-center">
                  &copy; {new Date().getFullYear()} ConnectHub
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
