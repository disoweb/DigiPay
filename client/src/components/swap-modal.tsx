import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowUpDown, DollarSign, Coins, Loader2, TrendingUp } from "lucide-react";

interface SwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nairaBalance: string;
  usdtBalance: string;
}

const USDT_RATE = 1485; // ₦1485 per USDT

export function SwapModal({ open, onOpenChange, nairaBalance, usdtBalance }: SwapModalProps) {
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
      setAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to complete swap",
        variant: "destructive",
      });
    },
  });

  const calculateOutput = () => {
    const inputAmount = parseFloat(amount || "0");
    if (fromCurrency === "NGN") {
      return (inputAmount / USDT_RATE).toFixed(6);
    } else {
      return (inputAmount * USDT_RATE).toLocaleString();
    }
  };

  const getMaxBalance = () => {
    return fromCurrency === "NGN" ? parseFloat(nairaBalance) : parseFloat(usdtBalance);
  };

  const handleSwap = () => {
    const swapAmount = parseFloat(amount);
    const maxBalance = getMaxBalance();
    
    if (swapAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    if (swapAmount > maxBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${fromCurrency} for this swap`,
        variant: "destructive",
      });
      return;
    }

    if (fromCurrency === "NGN" && swapAmount < USDT_RATE) {
      toast({
        title: "Minimum Swap Amount",
        description: `Minimum swap amount is ₦${USDT_RATE.toLocaleString()} (1 USDT)`,
        variant: "destructive",
      });
      return;
    }

    swapMutation.mutate({
      fromCurrency,
      amount: swapAmount
    });
  };

  const toggleCurrency = () => {
    setFromCurrency(fromCurrency === "NGN" ? "USDT" : "NGN");
    setAmount("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Currency Swap
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Rate Display */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Current Rate</span>
                </div>
                <span className="font-bold text-blue-900">1 USDT = ₦{USDT_RATE.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* From Currency */}
          <div className="space-y-2">
            <Label>From</Label>
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {fromCurrency === "NGN" ? (
                      <DollarSign className="h-5 w-5 text-green-600" />
                    ) : (
                      <Coins className="h-5 w-5 text-blue-600" />
                    )}
                    <span className="font-semibold">{fromCurrency}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCurrency}
                    className="p-1 h-8 w-8"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg font-semibold"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>Available: {fromCurrency === "NGN" ? `₦${parseFloat(nairaBalance).toLocaleString()}` : `${parseFloat(usdtBalance).toFixed(6)} USDT`}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAmount(getMaxBalance().toString())}
                    className="h-6 p-1 text-xs"
                  >
                    Max
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div className="p-2 bg-gray-100 rounded-full">
              <ArrowUpDown className="h-4 w-4 text-gray-600" />
            </div>
          </div>

          {/* To Currency */}
          <div className="space-y-2">
            <Label>To</Label>
            <Card className="border-2 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {fromCurrency === "NGN" ? (
                    <Coins className="h-5 w-5 text-blue-600" />
                  ) : (
                    <DollarSign className="h-5 w-5 text-green-600" />
                  )}
                  <span className="font-semibold">{fromCurrency === "NGN" ? "USDT" : "NGN"}</span>
                </div>
                <div className="text-lg font-semibold bg-white p-3 rounded border">
                  {amount ? calculateOutput() : "0.00"}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  You will receive: {fromCurrency === "NGN" ? `${calculateOutput()} USDT` : `₦${calculateOutput()}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Swap Fee Info */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-3">
              <p className="text-sm text-yellow-800">
                <strong>No fees:</strong> Direct swap at market rate. Instant processing.
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSwap}
              disabled={!amount || parseFloat(amount) <= 0 || swapMutation.isPending}
              className="flex-1"
            >
              {swapMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowUpDown className="h-4 w-4 mr-2" />
              )}
              Swap {fromCurrency}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}