import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Currency Swap {step === 2 && "- Review"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          // Step 1: Currency Selection and Amount Entry
          <div className="space-y-6">
            {/* Currency Selection */}
            <div className="space-y-3">
              <Label>Swap From</Label>
              <div className="grid grid-cols-2 gap-3">
                <Card 
                  className={`cursor-pointer transition-all ${fromCurrency === "NGN" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
                  onClick={() => setFromCurrency("NGN")}
                >
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="font-medium">Nigerian Naira</p>
                    <p className="text-sm text-gray-500">₦{parseFloat(nairaBalance).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card 
                  className={`cursor-pointer transition-all ${fromCurrency === "USDT" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
                  onClick={() => setFromCurrency("USDT")}
                >
                  <CardContent className="p-4 text-center">
                    <Coins className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="font-medium">USDT</p>
                    <p className="text-sm text-gray-500">{parseFloat(usdtBalance).toFixed(6)}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Swap</Label>
              <div className="relative">
                {fromCurrency === "NGN" ? (
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                ) : (
                  <Coins className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                )}
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  min="0"
                  step={fromCurrency === "NGN" ? "1" : "0.000001"}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Available: {fromCurrency === "NGN" ? "₦" : ""}{getAvailableBalance().toLocaleString()} {fromCurrency}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600"
                  onClick={() => setAmount(getAvailableBalance().toString())}
                >
                  Use Max
                </Button>
              </div>
            </div>

            {/* Exchange Preview */}
            {amount && parseFloat(amount) > 0 && (
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">You will receive approximately</p>
                    <p className="text-2xl font-bold text-green-600">
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
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProceedToPreview}
                disabled={!amount || parseFloat(amount) <= 0}
                className="flex-1"
              >
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
                className="flex-1"
                disabled={swapMutation.isPending}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleConfirmSwap}
                disabled={swapMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
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
      </DialogContent>
    </Dialog>
  );
}