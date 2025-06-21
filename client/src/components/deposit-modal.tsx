import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Info, Loader2, CreditCard, Shield, Clock } from "lucide-react";

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
      <DialogContent className="sm:max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-3">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Add Money to Wallet
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Fund your wallet securely with bank transfer or card payment
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {/* Quick Amount Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Choose Amount
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {[1000, 5000, 10000, 25000, 50000, 100000].map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset.toString() ? "default" : "outline"}
                  onClick={() => setAmount(preset.toString())}
                  className="h-12 text-sm font-medium"
                >
                  ₦{preset.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-3">
            <Label htmlFor="custom-amount" className="text-sm font-medium text-gray-700">
              Or Enter Custom Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                ₦
              </span>
              <Input
                id="custom-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1000"
                step="100"
                className="pl-8 h-12 text-lg font-medium"
              />
            </div>
          </div>

          {/* Payment Method Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900 text-sm">
                    Secure Payment via Paystack
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Instant processing
                    </li>
                    <li>• Bank transfer, cards accepted</li>
                    <li>• SSL encrypted & secure</li>
                    <li>• Minimum: ₦1,000</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button
            onClick={() => {
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
            }}
            disabled={!amount || parseFloat(amount) < 1000 || depositMutation.isPending}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {depositMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Continue with ₦{amount ? parseFloat(amount).toLocaleString() : '0'}
              </>
            )}
          </Button>

          {parseFloat(amount) > 0 && parseFloat(amount) < 1000 && (
            <Alert className="border-amber-200 bg-amber-50">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 text-sm">
                Minimum deposit amount is ₦1,000
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
