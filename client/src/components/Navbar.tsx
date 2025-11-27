import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, Compass, PenSquare, User, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@shared/schema";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface NavbarProps {
  user: UserType;
}

export function Navbar({ user }: NavbarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/compose", label: "Create", icon: PenSquare },
  ];

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.username || "User";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/">
            <span className="text-xl font-bold text-primary cursor-pointer" data-testid="link-logo">
              ConnectHub
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "gap-2",
                    location === item.href && "bg-secondary"
                  )}
                  data-testid={`link-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2" data-testid="button-user-menu">
                  <UserAvatar user={user} size="sm" />
                  <span className="hidden lg:inline max-w-[120px] truncate">
                    {displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{displayName}</p>
                  {user.email && (
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/u/${user.username || user.id}`}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/api/logout" className="text-destructive focus:text-destructive" data-testid="button-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-6 mt-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <UserAvatar user={user} size="lg" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{displayName}</p>
                    {user.email && (
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                </div>
                
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={location === item.href ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  <Link href={`/u/${user.username || user.id}`}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      Profile
                    </Button>
                  </Link>
                </nav>
                
                <div className="mt-auto pt-4 border-t">
                  <a href="/api/logout">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive">
                      <LogOut className="h-5 w-5" />
                      Log out
                    </Button>
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
