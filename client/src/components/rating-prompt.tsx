import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Star, User, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Trade {
  id: number;
  buyerId: number;
  sellerId: number;
  buyer?: { id: number; email: string };
  seller?: { id: number; email: string };
}

interface RatingPromptProps {
  trade: Trade;
  currentUserId: number;
  show: boolean;
  onClose: () => void;
  onRatingSubmitted: () => void;
}

export function RatingPrompt({ trade, currentUserId, show, onClose, onRatingSubmitted }: RatingPromptProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const tradingPartner = trade.buyerId === currentUserId ? trade.seller : trade.buyer;

  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${trade.id}/rating`, {
        ratedUserId: tradingPartner?.id,
        rating,
        comment: comment.trim() || undefined,
        categories: {
          communication: rating >= 4 ? 'good' : rating >= 3 ? 'average' : 'poor',
          speed: rating >= 4 ? 'fast' : rating >= 3 ? 'average' : 'slow',
          trustworthiness: rating >= 4 ? 'high' : rating >= 3 ? 'medium' : 'low'
        }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Rating Submitted", 
        description: "Thank you for rating your trading partner!" 
      });
      onRatingSubmitted();
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Rating Failed", 
        description: error.message || "Failed to submit rating", 
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setRating(0);
    setHoveredRating(0);
    setComment("");
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast({ 
        title: "Rating Required", 
        description: "Please select a star rating", 
        variant: "destructive" 
      });
      return;
    }

    submitRatingMutation.mutate();
  };

  const renderStars = () => {
    return (
      <div className="flex items-center justify-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none transition-transform hover:scale-110"
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
    const texts = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" };
    return texts[rating as keyof typeof texts] || "";
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Trade Completed Successfully!
          </DialogTitle>
          <DialogDescription>
            Rate your experience with {tradingPartner?.email?.split('@')[0]} to help build trust in our community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating Stars */}
          <div className="text-center">
            <Label className="text-base font-medium">How was your experience?</Label>
            <div className="mt-3">
              {renderStars()}
            </div>
            {rating > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {getRatingText(rating)} ({rating} star{rating !== 1 ? 's' : ''})
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="rating-comment">Comment (Optional)</Label>
            <Textarea
              id="rating-comment"
              placeholder="Share your experience with this trader..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Trade Information */}
          <Card className="bg-gray-50">
            <CardContent className="p-3">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Trade ID:</span>
                  <span className="font-medium">#{trade.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trading Partner:</span>
                  <span className="font-medium">
                    {tradingPartner?.email?.replace(/(.{2}).*(@.*)/, '$1***$2')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                onClose();
                resetForm();
              }}
            >
              Skip
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitRatingMutation.isPending || rating === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {submitRatingMutation.isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}