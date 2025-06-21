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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DollarSign } from "lucide-react";

interface DepositModalProps {
  children?: React.ReactNode;
}

export default function DepositModal({ children }: DepositModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.authorization_url === '#demo-payment') {
          // Demo mode - simulate successful payment
          toast({
            title: "Demo Payment",
            description: "This is a demo payment. In production, you would be redirected to Paystack.",
          });
          
          // Simulate payment verification
          setTimeout(async () => {
            await fetch("/api/payments/verify-deposit", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ reference: data.reference }),
            });
            window.location.reload();
          }, 2000);
        } else {
          // Redirect to Paystack
          window.location.href = data.authorization_url;
        }
        setOpen(false);
        setAmount("");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to initialize deposit.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <DollarSign className="h-4 w-4 mr-2" />
            Deposit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit Naira</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (NGN)</Label>
            <Input
              id="amount"
              type="number"
              min="100"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (minimum ₦100)"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Proceed to Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
