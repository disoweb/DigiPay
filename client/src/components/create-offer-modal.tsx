import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface CreateOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOfferModal({ open, onOpenChange }: CreateOfferModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type: "",
    amount: "",
    rate: "",
    paymentMethod: ""
  });

  const createOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/offers", {
        type: data.type,
        amount: parseFloat(data.amount),
        rate: parseFloat(data.rate),
        paymentMethod: data.paymentMethod
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Success",
        description: "Offer created successfully!",
      });
      onOpenChange(false);
      setFormData({ type: "", amount: "", rate: "", paymentMethod: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create offer",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.amount || !formData.rate || !formData.paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    createOfferMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Offer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select offer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy USDT</SelectItem>
                <SelectItem value="sell">Sell USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDT)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rate">Rate (₦/USDT)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                  placeholder="1500.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Mobile Money (MTN)">Mobile Money (MTN)</SelectItem>
                    <SelectItem value="Mobile Money (Airtel)">Mobile Money (Airtel)</SelectItem>
                    <SelectItem value="Opay">Opay</SelectItem>
                    <SelectItem value="PalmPay">PalmPay</SelectItem>
                    <SelectItem value="Kuda">Kuda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createOfferMutation.isPending}
            >
              {createOfferMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Offer
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