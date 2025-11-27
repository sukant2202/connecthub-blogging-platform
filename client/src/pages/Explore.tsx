import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { PostFeed } from "@/components/PostFeed";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Compass } from "lucide-react";
import type { PostWithAuthor } from "@shared/schema";

export default function Explore() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts"],
  });

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && user ? (
        <Navbar user={user} />
      ) : (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <span className="text-xl font-bold text-primary">ConnectHub</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a href="/api/login">
                <Button data-testid="button-login-explore">Log in</Button>
              </a>
            </div>
          </div>
        </header>
      )}
      
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Compass className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Explore</h1>
            <p className="text-sm text-muted-foreground">Discover posts from the community</p>
          </div>
        </div>
        
        <PostFeed 
          posts={posts} 
          isLoading={isLoading} 
          currentUserId={user?.id}
          emptyMessage="No posts yet. Be the first to share something!"
        />
      </main>
    </div>
  );
}
