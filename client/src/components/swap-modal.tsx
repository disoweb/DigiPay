import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowUpDown, DollarSign, Coins, Loader2, ChevronLeft, Check } from "lucide-react";

interface SwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nairaBalance: string;
  usdtBalance: string;
}

const USDT_RATE = 1485; // ₦1485 per USDT

export function SwapModal({ open, onOpenChange, nairaBalance, usdtBalance }: SwapModalProps) {
  const [step, setStep] = useState(1);
  const [fromCurrency, setFromCurrency] = useState<"NGN" | "USDT">("NGN");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const swapMutation = useMutation({
    mutationFn: async ({ fromCurrency, amount }: { fromCurrency: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/swap", {
        fromCurrency,
        amount
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Swap failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Swap Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      onOpenChange(false);
      resetModal();
    },
    onError: (error: any) => {
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to complete swap",
        variant: "destructive",
      });
    },
  });

  const resetModal = () => {
    setStep(1);
    setFromCurrency("NGN");
    setAmount("");
  };

  const getAvailableBalance = () => {
    return fromCurrency === "NGN" ? parseFloat(nairaBalance) : parseFloat(usdtBalance);
  };

  const calculateExchange = () => {
    const inputAmount = parseFloat(amount || "0");
    const fee = inputAmount * 0.01; // 1% fee
    const amountAfterFee = inputAmount - fee;

    if (fromCurrency === "NGN") {
      return {
        fee,
        amountAfterFee,
        receiveAmount: amountAfterFee / USDT_RATE,
        receiveCurrency: "USDT"
      };
    } else {
      return {
        fee,
        amountAfterFee,
        receiveAmount: amountAfterFee * USDT_RATE,
        receiveCurrency: "NGN"
      };
    }
  };

  const handleProceedToPreview = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) > getAvailableBalance()) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${fromCurrency}`,
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const handleConfirmSwap = () => {
    swapMutation.mutate({
      fromCurrency,
      amount: parseFloat(amount)
    });
  };

  const exchangeDetails = calculateExchange();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Currency Swap</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Exchange between NGN and USDT at current market rates
          </p>

          {step === 1 ? (
            // Step 1: Currency Selection and Amount Entry
            <div className="space-y-6">
              {/* Currency Toggle Buttons - Send Modal Style */}
              <div className="flex gap-2">
                <Button
                  variant={fromCurrency === "NGN" ? "default" : "outline"}
                  onClick={() => setFromCurrency("NGN")}
                  className="flex-1 h-12"
                >
                  ₦ NGN
                </Button>
                <Button
                  variant={fromCurrency === "USDT" ? "default" : "outline"}
                  onClick={() => setFromCurrency("USDT")}
                  className="flex-1 h-12"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  USDT
                </Button>
              </div>

              {/* Swap Direction Indicator */}
              <div className="text-center">
                <Label className="text-sm font-medium">Swap From {fromCurrency}</Label>
              </div>

              {/* Amount Input - Send Modal Style */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Amount ({fromCurrency})
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">
                    {fromCurrency === "NGN" ? "₦" : "$"}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 h-12 text-lg"
                    min="0"
                    step={fromCurrency === "NGN" ? "1" : "0.000001"}
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    Available: {fromCurrency === "NGN" ? "₦" : ""}{getAvailableBalance().toLocaleString()} {fromCurrency}
                  </span>
                  <span className="text-orange-500 text-xs">
                    1% fee applies
                  </span>
                </div>
              </div>

              {/* Exchange Preview - Optional field style */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Exchange Preview (Optional)
                </Label>
                {amount && parseFloat(amount) > 0 ? (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-600">You will receive approximately</p>
                      <p className="text-lg font-semibold text-green-600">
                        {fromCurrency === "NGN" ? "" : "₦"}
                        {fromCurrency === "NGN" 
                          ? exchangeDetails.receiveAmount.toFixed(6) 
                          : exchangeDetails.receiveAmount.toLocaleString()
                        } {exchangeDetails.receiveCurrency}
                      </p>
                      <p className="text-xs text-gray-500">
                        Fee: {fromCurrency === "NGN" ? "₦" : ""}{exchangeDetails.fee.toLocaleString()} {fromCurrency} (1%)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
                    Enter amount to see exchange preview
                  </div>
                )}
              </div>

              {/* Action Buttons - Send Modal Style */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProceedToPreview}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </div>
            </div>
          ) : (
            // Step 2: Preview and Confirmation
            <div className="space-y-6">
              {/* Swap Summary */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">From</p>
                        <p className="text-lg font-semibold">
                          {fromCurrency === "NGN" ? "₦" : ""}{parseFloat(amount).toLocaleString()} {fromCurrency}
                        </p>
                      </div>
                      <ArrowUpDown className="h-6 w-6 text-gray-400" />
                      <div className="text-center">
                        <p className="text-sm text-gray-600">To</p>
                        <p className="text-lg font-semibold text-green-600">
                          {fromCurrency === "NGN" ? "" : "₦"}
                          {fromCurrency === "NGN" 
                            ? exchangeDetails.receiveAmount.toFixed(6)
                            : exchangeDetails.receiveAmount.toLocaleString()
                          } {exchangeDetails.receiveCurrency}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Exchange Rate:</span>
                        <span>1 USDT = ₦{USDT_RATE.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fee (1%):</span>
                        <span>
                          {fromCurrency === "NGN" ? "₦" : ""}{exchangeDetails.fee.toLocaleString()} {fromCurrency}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>You will receive:</span>
                        <span className="text-green-600">
                          {fromCurrency === "NGN" ? "" : "₦"}
                          {fromCurrency === "NGN" 
                            ? exchangeDetails.receiveAmount.toFixed(6)
                            : exchangeDetails.receiveAmount.toLocaleString()
                          } {exchangeDetails.receiveCurrency}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12"
                  disabled={swapMutation.isPending}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleConfirmSwap}
                  disabled={swapMutation.isPending}
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                >
                  {swapMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {swapMutation.isPending ? "Processing..." : "Confirm Swap"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}