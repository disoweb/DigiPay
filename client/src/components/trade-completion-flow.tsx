import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Flag,
  Clock,
  User
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { RatingPrompt } from "@/components/rating-prompt";

interface Trade {
  id: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  fiatAmount: string;
  status: string;
  buyer?: { id: number; email: string };
  seller?: { id: number; email: string };
}

interface TradeCompletionFlowProps {
  trade: Trade;
  currentUserId: number;
  onTradeUpdated: () => void;
}

export function TradeCompletionFlow({ trade, currentUserId, onTradeUpdated }: TradeCompletionFlowProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [showRatingPrompt, setShowRatingPrompt] = useState(true);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeCategory, setDisputeCategory] = useState("");
  
  // User role determination
  const userRole = trade.buyerId === currentUserId ? 'buyer' : 'seller';
  const tradingPartner = userRole === 'buyer' ? trade.seller : trade.buyer;
  
  // Rating submission
  const submitRatingMutation = useMutation({
    mutationFn: async (data: { rating: number; comment?: string; categories?: any }) => {
      const response = await apiRequest("POST", `/api/trades/${trade.id}/rating`, {
        ratedUserId: tradingPartner?.id,
        rating: data.rating,
        comment: data.comment,
        categories: data.categories
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Rating Submitted", description: "Thank you for rating your trading partner!" });
      setShowRatingModal(false);
      setRating(0);
      setRatingComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${trade.id}`] });
      onTradeUpdated();
    },
    onError: (error: any) => {
      toast({ 
        title: "Rating Failed", 
        description: error.message || "Failed to submit rating", 
        variant: "destructive" 
      });
    },
  });

  // Dispute submission
  const submitDisputeMutation = useMutation({
    mutationFn: async (data: { reason: string; category: string }) => {
      const response = await apiRequest("POST", `/api/trades/${trade.id}/dispute`, {
        reason: data.reason,
        category: data.category,
        raisedBy: userRole
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Dispute Submitted", 
        description: "Your dispute has been submitted for admin review" 
      });
      setShowDisputeModal(false);
      setDisputeReason("");
      setDisputeCategory("");
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${trade.id}`] });
      onTradeUpdated();
    },
    onError: (error: any) => {
      toast({ 
        title: "Dispute Failed", 
        description: error.message || "Failed to submit dispute", 
        variant: "destructive" 
      });
    },
  });

  const handleRatingSubmit = () => {
    if (rating === 0) {
      toast({ 
        title: "Rating Required", 
        description: "Please select a star rating", 
        variant: "destructive" 
      });
      return;
    }

    submitRatingMutation.mutate({
      rating,
      comment: ratingComment.trim() || undefined,
      categories: {
        communication: rating >= 4 ? 'good' : rating >= 3 ? 'average' : 'poor',
        speed: rating >= 4 ? 'fast' : rating >= 3 ? 'average' : 'slow',
        trustworthiness: rating >= 4 ? 'high' : rating >= 3 ? 'medium' : 'low'
      }
    });
  };

  const handleDisputeSubmit = () => {
    if (!disputeReason.trim() || !disputeCategory) {
      toast({ 
        title: "Missing Information", 
        description: "Please provide dispute reason and category", 
        variant: "destructive" 
      });
      return;
    }

    submitDisputeMutation.mutate({
      reason: disputeReason,
      category: disputeCategory
    });
  };

  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1 justify-center">
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

  const disputeCategories = [
    { value: "payment_not_received", label: "Payment Not Received" },
    { value: "payment_not_made", label: "Payment Not Made" },
    { value: "wrong_payment_details", label: "Wrong Payment Details" },
    { value: "fake_payment_proof", label: "Fake Payment Proof" },
    { value: "communication_issues", label: "Communication Problems" },
    { value: "other", label: "Other Issues" }
  ];

  // Show completed trade actions
  if (trade.status === 'completed') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center pb-3">
          <CardTitle className="flex items-center justify-center gap-2 text-green-800">
            <CheckCircle className="h-6 w-6" />
            Trade Completed Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-green-700 mb-4">
              Trade #{trade.id} has been completed. Rate your trading partner to help build trust in the community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!hasRated && (
                <Button 
                  onClick={() => setShowRatingPrompt(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Rate Trading Partner
                </Button>
              )}
              
              {hasRated && (
                <Badge className="bg-green-100 text-green-800 px-4 py-2">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Rating Submitted
                </Badge>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => setShowDisputeModal(true)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Flag className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show dispute status if trade is disputed
  if (trade.status === 'disputed') {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            Dispute Under Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-yellow-300">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your dispute is being reviewed by our admin team. Expected resolution time: 24-48 hours.
              You will be notified once the dispute is resolved.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Action buttons for active trades */}
      {['payment_pending', 'payment_made'].includes(trade.status) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setShowDisputeModal(true)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Flag className="h-4 w-4 mr-2" />
                Raise Dispute
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating Prompt */}
      <RatingPrompt
        trade={trade}
        currentUserId={currentUserId}
        show={showRatingPrompt && !hasRated}
        onClose={() => setShowRatingPrompt(false)}
        onRatingSubmitted={() => {
          setHasRated(true);
          onTradeUpdated();
        }}
      />
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Rate Your Trading Partner
            </DialogTitle>
            <DialogDescription>
              How was your experience trading with {tradingPartner?.email?.split('@')[0]}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center">
              <Label className="text-base font-medium">Rating</Label>
              <div className="mt-3">
                {renderStars()}
              </div>
              {rating > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {getRatingText(rating)} ({rating} star{rating !== 1 ? 's' : ''})
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="rating-comment">Comment (Optional)</Label>
              <Textarea
                id="rating-comment"
                placeholder="Share your experience with this trader..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="mt-1"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {ratingComment.length}/500 characters
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRatingModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRatingSubmit}
                disabled={submitRatingMutation.isPending || rating === 0}
              >
                {submitRatingMutation.isPending ? "Submitting..." : "Submit Rating"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal */}
      <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Flag className="h-5 w-5" />
              Raise a Dispute
            </DialogTitle>
            <DialogDescription>
              Describe the issue you're experiencing with this trade. Our admin team will review it promptly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="dispute-category">Issue Category</Label>
              <select
                id="dispute-category"
                value={disputeCategory}
                onChange={(e) => setDisputeCategory(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a category</option>
                {disputeCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="dispute-reason">Detailed Description</Label>
              <Textarea
                id="dispute-reason"
                placeholder="Provide a detailed explanation of the issue..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="mt-1"
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {disputeReason.length}/1000 characters
              </p>
            </div>

            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Disputes should only be raised for legitimate issues. False disputes may result in account penalties.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDisputeModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDisputeSubmit}
                disabled={submitDisputeMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitDisputeMutation.isPending ? "Submitting..." : "Submit Dispute"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}