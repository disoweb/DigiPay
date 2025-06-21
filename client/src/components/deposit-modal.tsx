import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Info, Loader2 } from "lucide-react";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/transactions/deposit", { amount });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Deposit initiated successfully! You will be redirected to payment.",
      });
      
      // Simulate redirect to Paystack
      setTimeout(() => {
        toast({
          title: "Payment Completed",
          description: "Your deposit has been processed successfully!",
        });
      }, 3000);
      
      onOpenChange(false);
      setAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate deposit",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount < 1000) {
      toast({
        title: "Error",
        description: "Minimum deposit is ₦1,000",
        variant: "destructive",
      });
      return;
    }
    depositMutation.mutate(depositAmount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit Naira</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Amount (NGN)</Label>
            <Input
              id="deposit-amount"
              type="number"
              min="1000"
              step="100"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">Minimum deposit: ₦1,000</p>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You will be redirected to Paystack to complete your payment securely.
            </AlertDescription>
          </Alert>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={depositMutation.isPending}
            >
              {depositMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Continue to Payment
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
