import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowUpDown, DollarSign, Coins, Loader2, TrendingUp, CheckCircle } from "lucide-react";

interface SwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nairaBalance: string;
  usdtBalance: string;
}

const USDT_RATE = 1485; // ₦1485 per USDT

export function SwapModal({ open, onOpenChange, nairaBalance, usdtBalance }: SwapModalProps) {
  const [step, setStep] = useState(1); // 1: Select direction, 2: Enter amount and confirm
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
        title: "Swap Completed",
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
    setAmount("");
    setFromCurrency("NGN");
  };

  const calculateOutput = () => {
    const inputAmount = parseFloat(amount || "0");
    const fee = inputAmount * 0.01; // 1% fee
    
    if (fromCurrency === "NGN") {
      const netAmount = inputAmount - fee;
      return (netAmount / USDT_RATE).toFixed(6);
    } else {
      const grossAmount = inputAmount * USDT_RATE;
      const netAmount = grossAmount - (grossAmount * 0.01);
      return netAmount.toLocaleString();
    }
  };

  const calculateFee = () => {
    const inputAmount = parseFloat(amount || "0");
    if (fromCurrency === "NGN") {
      return (inputAmount * 0.01).toFixed(2);
    } else {
      const grossAmount = inputAmount * USDT_RATE;
      return (grossAmount * 0.01).toFixed(2);
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

  const handleDirectionSelect = (direction: "NGN" | "USDT") => {
    setFromCurrency(direction);
    setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowUpDown className="h-5 w-5 text-blue-600" />
            </div>
            Currency Swap {step === 2 && `- Step ${step} of 2`}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {step === 1 ? "Choose your swap direction" : "Confirm your swap details"}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {step === 1 ? (
            // Step 1: Direction Selection
            <>
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Live Exchange Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      1 USDT = ₦{USDT_RATE.toLocaleString()}
                    </div>
                    <p className="text-xs text-blue-700">1% swap fee applies</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Label className="text-base font-medium">Select Swap Direction</Label>
                
                {/* NGN to USDT Option */}
                <Card 
                  className="border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors"
                  onClick={() => handleDirectionSelect("NGN")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">NGN → USDT</p>
                          <p className="text-sm text-gray-600">Convert Nigerian Naira to Tether</p>
                          <p className="text-xs text-gray-500">Available: ₦{parseFloat(nairaBalance).toLocaleString()}</p>
                        </div>
                      </div>
                      <ArrowUpDown className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>

                {/* USDT to NGN Option */}
                <Card 
                  className="border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => handleDirectionSelect("USDT")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Coins className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">USDT → NGN</p>
                          <p className="text-sm text-gray-600">Convert Tether to Nigerian Naira</p>
                          <p className="text-xs text-gray-500">Available: {parseFloat(usdtBalance).toFixed(6)} USDT</p>
                        </div>
                      </div>
                      <ArrowUpDown className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </>
          ) : (
            // Step 2: Amount Entry and Confirmation
            <>
              {/* Current Rate Display */}
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Live Exchange Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      1 USDT = ₦{USDT_RATE.toLocaleString()}
                    </div>
                    <p className="text-xs text-blue-700">1% swap fee applies</p>
                  </div>
                </CardContent>
              </Card>

              {/* From Currency */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">You Pay</Label>
                  <div className="text-sm text-gray-600">
                    {fromCurrency === "NGN" ? "NGN → USDT" : "USDT → NGN"}
                  </div>
                </div>
                <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${fromCurrency === "NGN" ? "bg-green-100" : "bg-blue-100"}`}>
                          {fromCurrency === "NGN" ? (
                            <DollarSign className="h-5 w-5 text-green-600" />
                          ) : (
                            <Coins className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-lg">{fromCurrency}</span>
                          <p className="text-xs text-gray-500">
                            {fromCurrency === "NGN" ? "Nigerian Naira" : "Tether USD"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-xl font-bold border-0 p-0 h-auto focus-visible:ring-0"
                      step={fromCurrency === "NGN" ? "1" : "0.000001"}
                    />
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <span className="text-sm text-gray-600">
                        Available: {fromCurrency === "NGN" ? `₦${parseFloat(nairaBalance).toLocaleString()}` : `${parseFloat(usdtBalance).toFixed(6)} USDT`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAmount(getMaxBalance().toString())}
                        className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
                      >
                        Use Max
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Swap Arrow */}
              <div className="flex justify-center relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-gray-300"></div>
                </div>
                <div className="relative bg-white p-3 rounded-full border-2 border-gray-200">
                  <ArrowUpDown className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              {/* To Currency */}
              <div className="space-y-3">
                <Label className="text-base font-medium">You Receive</Label>
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-full ${fromCurrency === "NGN" ? "bg-blue-100" : "bg-green-100"}`}>
                        {fromCurrency === "NGN" ? (
                          <Coins className="h-5 w-5 text-blue-600" />
                        ) : (
                          <DollarSign className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-lg">{fromCurrency === "NGN" ? "USDT" : "NGN"}</span>
                        <p className="text-xs text-gray-600">
                          {fromCurrency === "NGN" ? "Tether USD" : "Nigerian Naira"}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-2xl font-bold text-green-600">
                        {amount ? calculateOutput() : "0.00"}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {fromCurrency === "NGN" ? "USDT" : "NGN"} • Instant settlement
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction Summary */}
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-800">Transaction Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Exchange Rate</p>
                        <p className="font-semibold">1 USDT = ₦{USDT_RATE.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Processing</p>
                        <p className="font-semibold text-green-600">Instant</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Swap Fee (1%)</p>
                        <p className="font-semibold text-orange-600">₦{amount ? calculateFee() : "0"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Cost</p>
                        <p className="font-semibold">{fromCurrency === "NGN" ? `₦${amount || "0"}` : `${amount || "0"} USDT`}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={handleSwap}
                  disabled={!amount || parseFloat(amount) <= 0 || swapMutation.isPending}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {swapMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing Swap...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-5 w-5" />
                      Swap {amount ? `${fromCurrency} ${parseFloat(amount).toLocaleString()}` : fromCurrency}
                    </div>
                  )}
                </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
          </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}