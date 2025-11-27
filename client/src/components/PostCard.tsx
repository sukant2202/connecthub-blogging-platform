import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { LikeButton } from "./LikeButton";
import { MessageCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PostWithAuthor } from "@shared/schema";

interface PostCardProps {
  post: PostWithAuthor;
  currentUserId?: string;
  onDelete?: (postId: number) => void;
  onEdit?: (postId: number) => void;
  showFullContent?: boolean;
}

export function PostCard({ post, currentUserId, onDelete, onEdit, showFullContent = false }: PostCardProps) {
  const isOwner = currentUserId === post.userId;
  const displayName = post.author.firstName && post.author.lastName 
    ? `${post.author.firstName} ${post.author.lastName}`
    : post.author.username || "Anonymous";
  
  const timeAgo = post.createdAt 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "";

  return (
    <Card className="border hover-elevate transition-all" data-testid={`card-post-${post.id}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Link href={`/u/${post.author.username || post.author.id}`}>
            <UserAvatar user={post.author} size="md" className="cursor-pointer" />
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
                <Link href={`/u/${post.author.username || post.author.id}`}>
                  <span className="font-semibold text-foreground hover:underline cursor-pointer truncate" data-testid={`text-author-${post.id}`}>
                    {displayName}
                  </span>
                </Link>
                {post.author.username && (
                  <span className="text-sm text-muted-foreground font-mono">
                    @{post.author.username}
                  </span>
                )}
                <span className="text-sm text-muted-foreground hidden sm:inline">·</span>
                <span className="text-xs text-muted-foreground" data-testid={`text-time-${post.id}`}>
                  {timeAgo}
                </span>
              </div>
              
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-post-menu-${post.id}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(post.id)} data-testid={`button-edit-post-${post.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(post.id)} 
                      className="text-destructive focus:text-destructive"
                      data-testid={`button-delete-post-${post.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <Link href={`/post/${post.id}`}>
              <p 
                className={`mt-2 text-foreground leading-relaxed cursor-pointer ${
                  !showFullContent && post.content.length > 280 ? "line-clamp-4" : ""
                }`}
                data-testid={`text-content-${post.id}`}
              >
                {post.content}
              </p>
            </Link>
            
            {post.imageUrl && (
              <Link href={`/post/${post.id}`}>
                <div className="mt-3 rounded-lg overflow-hidden border">
                  <img
                    src={post.imageUrl}
                    alt="Post image"
                    className="w-full max-h-96 object-cover cursor-pointer"
                    data-testid={`img-post-${post.id}`}
                  />
                </div>
              </Link>
            )}
            
            <div className="flex items-center gap-1 mt-3 -ml-2">
              <LikeButton 
                postId={post.id} 
                isLiked={post.isLiked} 
                likesCount={post.likesCount} 
              />
              
              <Link href={`/post/${post.id}`}>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" data-testid={`button-comments-${post.id}`}>
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{post.commentsCount}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
