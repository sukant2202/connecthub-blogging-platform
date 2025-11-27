import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { PostFeed } from "@/components/PostFeed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FollowButton } from "@/components/FollowButton";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Compass, Search } from "lucide-react";
import { Link } from "wouter";
import type { PostWithAuthor, UserSearchResult } from "@shared/schema";

export default function Explore() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 400);
  const followersFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [],
  );
  
  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts"],
  });

  const {
    data: searchResults,
    isFetching: isSearching,
    isError: isSearchError,
    refetch: refetchSearch,
  } = useQuery<UserSearchResult[]>({
    queryKey: ["user-search", debouncedSearch],
    enabled: debouncedSearch.length >= 2,
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedSearch,
        limit: "12",
      });
      const res = await fetch(`/api/users/search?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const message = (await res.text()) || "Failed to search users";
        throw new Error(message);
      }
      return (await res.json()) as UserSearchResult[];
    },
  });

  const shouldShowResults = debouncedSearch.length >= 2;

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
              <Link href="/login">
                <Button data-testid="button-login-explore">Log in</Button>
              </Link>
            </div>
          </div>
        </header>
      )}
      
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Compass className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Explore</h1>
            <p className="text-sm text-muted-foreground">Discover posts from the community</p>
          </div>
        </div>

        <section className="rounded-2xl border bg-card/70 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold leading-tight">Find people</h2>
              <p className="text-sm text-muted-foreground">
                Search by username or name to discover new creators
              </p>
            </div>
          </div>

          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for people on ConnectHub"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-12 rounded-full bg-background/60 pl-10 pr-24"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-4 text-xs"
                onClick={() => setSearchTerm("")}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {shouldShowResults ? (
              isSearching ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                  >
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                ))
              ) : isSearchError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <p>Something went wrong while searching. Try again.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-0 text-destructive underline underline-offset-2 hover:text-destructive"
                    onClick={() => refetchSearch()}
                  >
                    Retry search
                  </Button>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((result) => {
                  const displayName =
                    result.firstName && result.lastName
                      ? `${result.firstName} ${result.lastName}`
                      : result.username || "User";
                  const usernameLabel = result.username
                    ? `@${result.username}`
                    : "No username yet";
                  const followerLabel = `${followersFormatter.format(
                    result.followersCount,
                  )} followers`;

                  return (
                    <div
                      key={result.id}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border px-4 py-3 hover-elevate"
                    >
                      <Link href={`/u/${result.username || result.id}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 cursor-pointer">
                          <UserAvatar user={result} size="lg" />
                          <div className="min-w-0">
                            <p className="font-medium leading-tight truncate">{displayName}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {usernameLabel}
                            </p>
                            <p className="text-xs text-muted-foreground">{followerLabel}</p>
                          </div>
                        </div>
                      </Link>
                      {isAuthenticated && user && user.id !== result.id ? (
                        <FollowButton userId={result.id} isFollowing={result.isFollowing} />
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  No users found. Try a different name or username.
                </p>
              )
            ) : (
              <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                Start typing above to search the community.
              </p>
            )}
          </div>
        </section>
        
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
