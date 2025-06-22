import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RatingFormProps {
  tradeId: number;
  ratedUserId: number;
  ratedUserEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RatingForm({ tradeId, ratedUserId, ratedUserEmail, open, onOpenChange }: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const ratingMutation = useMutation({
    mutationFn: async (data: { tradeId: number; ratedUserId: number; rating: number; comment?: string }) => {
      const response = await apiRequest("POST", "/api/ratings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rating Submitted",
        description: "Thank you for rating your trading partner!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${ratedUserId}/ratings`] });
      onOpenChange(false);
      setRating(0);
      setComment("");
    },
    onError: (error: any) => {
      toast({
        title: "Rating Failed",
        description: error.message || "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    ratingMutation.mutate({
      tradeId,
      ratedUserId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hoveredRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Rate Your Trading Partner
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>
              How was your experience trading with {ratedUserEmail.replace(/(.{2}).*(@.*)/, '$1***$2')}?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <Label className="text-base font-medium">Rating</Label>
                <div className="mt-2 flex justify-center">
                  {renderStars()}
                </div>
                {rating > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {getRatingText(rating)} ({rating} star{rating !== 1 ? 's' : ''})
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this trader..."
                  rows={3}
                  maxLength={500}
                  disabled={ratingMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  {comment.length}/500 characters
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={ratingMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={rating === 0 || ratingMutation.isPending}
                  className="flex-1"
                >
                  {ratingMutation.isPending ? "Submitting..." : "Submit Rating"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
