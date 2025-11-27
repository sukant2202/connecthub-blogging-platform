import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "./UserAvatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Image, Loader2, X, Upload } from "lucide-react";
import type { User } from "@shared/schema";

interface PostComposerProps {
  user: User;
  onSuccess?: () => void;
}

export function PostComposer({ user, onSuccess }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImageInput, setShowImageInput] = useState(false);
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const MAX_CHARS = 500;
  const remainingChars = MAX_CHARS - content.length;

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload image");
      }

      const data = await response.json();
      return data.imageUrl;
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      let finalImageUrl: string | null = null;

      // If there's an uploaded file, upload it first
      if (uploadedImage) {
        try {
          finalImageUrl = await uploadImageMutation.mutateAsync(uploadedImage);
        } catch (error) {
          // Upload error is already handled by uploadImageMutation.onError
          throw error;
        }
      } else if (imageUrl.trim()) {
        finalImageUrl = imageUrl.trim();
      }

      return apiRequest("POST", "/api/posts", {
        content: content.trim(),
        imageUrl: finalImageUrl,
      });
    },
    onSuccess: () => {
      setContent("");
      setImageUrl("");
      setUploadedImage(null);
      setImagePreview(null);
      setShowImageInput(false);
      setUploadMode("url");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      toast({
        title: "Post created",
        description: "Your post has been published",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Create post error:", error);
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
      // Check if it's a validation error
      const errorMessage = error.message || "Failed to create post";
      toast({
        title: "Error",
        description: errorMessage.includes("Invalid") ? errorMessage : "Failed to create post. Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPEG, PNG, GIF, or WebP image",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setUploadedImage(file);
      setImageUrl(""); // Clear URL input if file is selected

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setUploadedImage(null);
    setImagePreview(null);
    setShowImageInput(false);
    setUploadMode("url");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
                <div className="space-y-2">
                  {/* Toggle between URL and file upload */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={uploadMode === "url" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setUploadMode("url");
                        setUploadedImage(null);
                        setImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      Image URL
                    </Button>
                    <Button
                      type="button"
                      variant={uploadMode === "file" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setUploadMode("file");
                        setImageUrl("");
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload from Device
                    </Button>
                  </div>

                  {uploadMode === "url" && (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="url"
                        placeholder="Enter image URL..."
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setUploadedImage(null);
                          setImagePreview(null);
                        }}
                        className="flex-1"
                        data-testid="input-image-url"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveImage}
                        data-testid="button-remove-image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {uploadMode === "file" && (
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                        data-testid="input-image-file"
                      />
                      {uploadedImage && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{uploadedImage.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleRemoveImage}
                            className="h-6 w-6"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {(imageUrl || imagePreview) && (
                <div className="rounded-lg overflow-hidden border max-h-48">
                  <img
                    src={imagePreview || imageUrl}
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
                    disabled={!content.trim() || content.length > MAX_CHARS || createPostMutation.isPending || uploadImageMutation.isPending}
                    data-testid="button-create-post"
                  >
                    {createPostMutation.isPending || uploadImageMutation.isPending ? (
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
