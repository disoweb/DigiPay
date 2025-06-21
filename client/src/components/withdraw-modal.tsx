import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WithdrawModal({ open, onOpenChange }: WithdrawModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    amount: "",
    bank: "",
    accountNumber: "",
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/transactions/withdraw", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully!",
      });
      onOpenChange(false);
      setFormData({ amount: "", bank: "", accountNumber: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(formData.amount);
    
    if (!withdrawAmount || withdrawAmount < 1000) {
      toast({
        title: "Error",
        description: "Minimum withdrawal is ₦1,000",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount > parseFloat(user.nairaBalance)) {
      toast({
        title: "Error",
        description: "Insufficient balance",
        variant: "destructive",
      });
      return;
    }

    if (!formData.bank || !formData.accountNumber) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({
      amount: withdrawAmount,
      bank: formData.bank,
      accountNumber: formData.accountNumber,
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Naira</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Amount (NGN)</Label>
            <Input
              id="withdraw-amount"
              type="number"
              min="1000"
              max={parseFloat(user.nairaBalance)}
              step="100"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-500">
              Available: ₦{parseFloat(user.nairaBalance).toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bank">Bank</Label>
            <Select value={formData.bank} onValueChange={(value) => setFormData(prev => ({ ...prev, bank: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="access">Access Bank</SelectItem>
                <SelectItem value="gtbank">GTBank</SelectItem>
                <SelectItem value="zenith">Zenith Bank</SelectItem>
                <SelectItem value="uba">UBA</SelectItem>
                <SelectItem value="firstbank">First Bank</SelectItem>
                <SelectItem value="fidelity">Fidelity Bank</SelectItem>
                <SelectItem value="sterling">Sterling Bank</SelectItem>
                <SelectItem value="fcmb">FCMB</SelectItem>
                <SelectItem value="union">Union Bank</SelectItem>
                <SelectItem value="wema">Wema Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="account-number">Account Number</Label>
            <Input
              id="account-number"
              type="text"
              placeholder="Enter account number"
              value={formData.accountNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
              required
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              variant="destructive"
              className="flex-1"
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Withdraw
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
