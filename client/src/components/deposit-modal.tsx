import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async () => {
    setIsLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      setAmount("");
    }, 2000);
  };

  const quickAmounts = [1000, 5000, 10000, 20000];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            Add Funds to Wallet
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Instantly add Nigerian Naira using secure payment methods
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Quick Amount Selection - Mobile Optimized */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Quick Select</Label>
            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="h-12 text-sm font-medium hover:bg-green-50 hover:border-green-300"
                >
                  ₦{quickAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input - Mobile Optimized */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
              Custom Amount (NGN)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              className="h-12 text-lg text-center"
              inputMode="numeric"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Minimum: ₦100</span>
              <span>Maximum: ₦1,000,000</span>
            </div>
          </div>

          {/* Preview Card */}
          {amount && parseFloat(amount) >= 100 && (
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">You're depositing</p>
                  <p className="text-2xl font-bold text-green-700">₦{parseFloat(amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">No additional fees</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-blue-900 text-sm mb-1">Secure Payment via Paystack</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Support for cards, bank transfers, USSD, and mobile money. 
                    Bank-grade security with instant processing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              You'll be redirected to Paystack's secure payment page to complete your transaction.
            </AlertDescription>
          </Alert>

          {/* Action Buttons - Mobile Optimized */}
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={handleDeposit} 
              disabled={!amount || parseFloat(amount) < 100 || isLoading}
              className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                `Continue with ₦${amount ? parseFloat(amount).toLocaleString() : "0"}`
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full h-11 text-base"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}