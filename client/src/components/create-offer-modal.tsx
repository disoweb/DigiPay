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
    type: "buy" as "buy" | "sell",
    amount: "",
    rate: "",
    minAmount: "",
    maxAmount: "",
    terms: "",
    paymentMethod: "",
    timeLimit: "15",
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
      setFormData({ type: "", amount: "", rate: "", minAmount: "", maxAmount: "", terms: "", paymentMethod: "", timeLimit: "15" });
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
    if (!formData.amount || !formData.rate || !formData.paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including payment method",
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
                  <Label htmlFor="minAmount">Min Amount (USDT)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    step="0.01"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    placeholder="e.g., 10"
                  />
                </div>
                <div>
                  <Label htmlFor="maxAmount">Max Amount (USDT)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    step="0.01"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                    placeholder="e.g., 1000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="opay">Opay</SelectItem>
                    <SelectItem value="palmpay">PalmPay</SelectItem>
                    <SelectItem value="kuda">Kuda Bank</SelectItem>
                    <SelectItem value="mtn_mobile">MTN Mobile Money</SelectItem>
                    <SelectItem value="airtel_mobile">Airtel Money</SelectItem>
                    <SelectItem value="moniepoint">Moniepoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeLimit">Payment Time Limit (minutes)</Label>
                <Select value={formData.timeLimit} onValueChange={(value) => setFormData({ ...formData, timeLimit: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
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