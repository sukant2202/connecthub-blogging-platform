import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

interface UserAvatarProps {
  user: Pick<User, "firstName" | "lastName" | "profileImageUrl" | "username"> | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-24 w-24",
};

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const getInitials = () => {
    if (!user) return "?";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    if (user.firstName) {
      return user.firstName.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage
        src={user?.profileImageUrl || undefined}
        alt={user?.username || "User"}
        className="object-cover"
      />
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}
