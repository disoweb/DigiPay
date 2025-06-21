import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, Loader2 } from "lucide-react";
import type { Offer } from "@shared/schema";

type EnrichedOffer = Offer & {
  user: {
    id: number;
    email: string;
    averageRating: string;
    ratingCount: number;
  } | null;
};

interface TradeModalProps {
  offer: EnrichedOffer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TradeModal({ offer, open, onOpenChange }: TradeModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");

  const createTradeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/trades", {
        offerId: offer.id,
        amount: parseFloat(amount),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({
        title: "Success",
        description: "Trade initiated successfully!",
      });
      onOpenChange(false);
      setAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate trade",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    if (parseFloat(amount) > parseFloat(offer.amount)) {
      toast({
        title: "Error",
        description: "Amount exceeds available offer",
        variant: "destructive",
      });
      return;
    }
    createTradeMutation.mutate();
  };

  const tradeAmount = parseFloat(amount) || 0;
  const total = tradeAmount * parseFloat(offer.rate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Initiate Trade</DialogTitle>
        </DialogHeader>
        
        {/* Offer Details */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">
              {offer.type === "sell" ? "Buy" : "Sell"} USDT from {offer.user?.email}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Available:</span>
                <span>{parseFloat(offer.amount).toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span>Rate:</span>
                <span>₦{parseFloat(offer.rate).toLocaleString()}/USDT</span>
              </div>
              {offer.user && (
                <div className="flex justify-between">
                  <span>Trader Rating:</span>
                  <span className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                    {parseFloat(offer.user.averageRating).toFixed(1)} ({offer.user.ratingCount})
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trade-amount">Amount to Trade (USDT)</Label>
            <Input
              id="trade-amount"
              type="number"
              step="0.01"
              max={offer.amount}
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {tradeAmount > 0 && (
              <p className="text-sm text-gray-600">
                Total: ₦{total.toLocaleString()}
              </p>
            )}
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createTradeMutation.isPending}
            >
              {createTradeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Start Trade
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
