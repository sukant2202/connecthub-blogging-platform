import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Users, MessageCircle, Heart, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold text-primary cursor-pointer">ConnectHub</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button data-testid="button-login">Log in</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Welcome to the community
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Connect, Share, and{" "}
                <span className="text-primary">Grow Together</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Join a vibrant community where ideas flourish, conversations matter, 
                and connections are made. Share your thoughts, follow inspiring people, 
                and engage with content that moves you.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="gap-2 px-8" data-testid="button-get-started">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button variant="outline" size="lg" className="gap-2 px-8" data-testid="button-explore">
                    Explore Posts
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="border hover-elevate">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Build Your Network</h3>
                  <p className="text-muted-foreground">
                    Follow friends, creators, and thought leaders. Build meaningful connections 
                    with people who share your interests.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border hover-elevate">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <MessageCircle className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Share Your Voice</h3>
                  <p className="text-muted-foreground">
                    Create posts, share images, and express yourself. Your perspective 
                    matters and deserves to be heard.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border hover-elevate">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Heart className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Engage & Connect</h3>
                  <p className="text-muted-foreground">
                    Like posts, leave comments, and join conversations. 
                    Be part of a community that values authentic engagement.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Create your account in seconds and start connecting with amazing people today.
            </p>
            <Link href="/login">
              <Button size="lg" className="gap-2 px-8">
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ConnectHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
