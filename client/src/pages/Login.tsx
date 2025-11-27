import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
  });
  const [identifier, setIdentifier] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const endpoint =
        mode === "signup"
          ? { url: "/api/auth/signup", body: form }
          : { url: "/api/auth/login", body: { identifier } };

      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(endpoint.body),
      });

      if (!res.ok) {
        const message = (await res.json().catch(() => null))?.message || "Failed to log in";
        throw new Error(message);
      }

      toast({
        title: mode === "signup" ? "Welcome!" : "Welcome back!",
        description: mode === "signup" ? "Account created successfully." : "You are now signed in.",
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary cursor-pointer">
            ConnectHub
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <Card className="border shadow-lg w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in to continue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 pb-6">
              {["signin", "signup"].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={mode === value ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setMode(value as "signin" | "signup")}
                >
                  {value === "signin" ? "Sign in" : "Sign up"}
                </Button>
              ))}
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {mode === "signin" ? (
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or Username</Label>
                  <Input
                    id="identifier"
                    name="identifier"
                    placeholder="you@example.com or your_handle"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleSignupChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      placeholder="your_handle"
                      value={form.username}
                      onChange={handleSignupChange}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Letters, numbers, and underscores only (3-30 characters).
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleSignupChange}
                        placeholder="Jane"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleSignupChange}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : mode === "signin" ? "Sign in" : "Sign up"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

