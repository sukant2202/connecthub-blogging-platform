import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "./UserAvatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Image, Loader2, X } from "lucide-react";
import type { User } from "@shared/schema";

interface PostComposerProps {
  user: User;
  onSuccess?: () => void;
}

export function PostComposer({ user, onSuccess }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const MAX_CHARS = 500;
  const remainingChars = MAX_CHARS - content.length;

  const createPostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/posts", {
        content: content.trim(),
        imageUrl: imageUrl.trim() || null,
      });
    },
    onSuccess: () => {
      setContent("");
      setImageUrl("");
      setShowImageInput(false);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      toast({
        title: "Post created",
        description: "Your post has been published",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in to create posts",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && content.length <= MAX_CHARS) {
      createPostMutation.mutate();
    }
  };

  return (
    <Card className="border" data-testid="card-post-composer">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <UserAvatar user={user} size="md" />
            
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none border-0 p-0 text-base focus-visible:ring-0 placeholder:text-muted-foreground"
                data-testid="input-post-content"
              />
              
              {showImageInput && (
                <div className="flex gap-2 items-center">
                  <Input
                    type="url"
                    placeholder="Enter image URL..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                    data-testid="input-image-url"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setImageUrl("");
                      setShowImageInput(false);
                    }}
                    data-testid="button-remove-image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {imageUrl && (
                <div className="rounded-lg overflow-hidden border max-h-48">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowImageInput(!showImageInput)}
                    className={showImageInput ? "text-primary" : ""}
                    data-testid="button-add-image"
                  >
                    <Image className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${remainingChars < 0 ? "text-destructive" : remainingChars < 50 ? "text-amber-500" : "text-muted-foreground"}`}>
                    {remainingChars}
                  </span>
                  <Button
                    type="submit"
                    disabled={!content.trim() || content.length > MAX_CHARS || createPostMutation.isPending}
                    data-testid="button-create-post"
                  >
                    {createPostMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
