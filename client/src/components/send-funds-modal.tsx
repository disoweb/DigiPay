import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, User, Mail, DollarSign, Loader2, ArrowUpDown, Coins } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SendFundsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nairaBalance: string;
  usdtBalance: string;
}

export function SendFundsModal({ open, onOpenChange, nairaBalance, usdtBalance }: SendFundsModalProps) {
  const [currency, setCurrency] = useState<"NGN" | "USDT">("NGN");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipientUser, setRecipientUser] = useState<any>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const lookupMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/users/lookup", { query });
      if (!response.ok) {
        throw new Error("User not found");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setRecipientUser(data);
    },
    onError: () => {
      setRecipientUser(null);
    },
  });

  // Manual lookup function
  const handleLookup = () => {
    if (!recipient.trim()) return;
    lookupMutation.mutate(recipient.trim());
  };

  // Auto-lookup when user types
  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    setRecipientUser(null);
    
    // Auto-lookup if it looks like an email
    if (value.includes('@') && value.includes('.') && value.length > 5) {
      lookupMutation.mutate(value.trim());
    }
  };

  const sendMutation = useMutation({
    mutationFn: async ({ recipientId, amount, description, currency }: { recipientId: number; amount: number; description: string; currency: string }) => {
      const endpoint = currency === "NGN" ? "/api/transfers/send" : "/api/transfers/send-usdt";
      const response = await apiRequest("POST", endpoint, {
        recipientId,
        amount,
        description,
        currency
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Transfer failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transfer Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to send funds",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setRecipient("");
    setAmount("");
    setDescription("");
    setRecipientUser(null);
    setCurrency("NGN");
  };

  const getUserBalance = () => {
    return currency === "NGN" ? parseFloat(nairaBalance) : parseFloat(usdtBalance);
  };

  const getCurrencySymbol = () => {
    return currency === "NGN" ? "₦" : "";
  };

  const getCurrencyLabel = () => {
    return currency === "NGN" ? "NGN" : "USDT";
  };

  const handleSend = () => {
    if (!recipientUser || !amount) return;
    
    const transferAmount = parseFloat(amount);
    const balance = getUserBalance();
    
    if (transferAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    if (transferAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${getCurrencyLabel()} for this transfer`,
        variant: "destructive",
      });
      return;
    }

    sendMutation.mutate({
      recipientId: recipientUser.id,
      amount: transferAmount,
      description: description.trim() || "P2P Transfer",
      currency
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Funds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Currency Selection */}
          <div className="space-y-2">
            <Label>Select Currency</Label>
            <Select value={currency} onValueChange={(value: "NGN" | "USDT") => setCurrency(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NGN">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Nigerian Naira (₦{parseFloat(nairaBalance).toLocaleString()})
                  </div>
                </SelectItem>
                <SelectItem value="USDT">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    USDT ({parseFloat(usdtBalance).toFixed(6)})
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Lookup */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Send to (Email or Username)</Label>
            <div className="flex gap-2">
              <Input
                id="recipient"
                placeholder="Enter email or username"
                value={recipient}
                onChange={(e) => handleRecipientChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              />
              <Button 
                variant="outline" 
                onClick={handleLookup}
                disabled={!recipient.trim() || lookupMutation.isPending}
              >
                {lookupMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Find"
                )}
              </Button>
            </div>
          </div>

          {/* Recipient Display */}
          {recipientUser && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-900">
                      {recipientUser.username || recipientUser.email}
                    </p>
                    {recipientUser.username && (
                      <p className="text-sm text-green-700">{recipientUser.email}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Mail className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                      {recipientUser.kycVerified && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          KYC Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({getCurrencyLabel()})</Label>
            <div className="relative">
              {currency === "NGN" ? (
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
                min="1"
                max={getUserBalance()}
                step={currency === "NGN" ? "1" : "0.000001"}
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Available: {getCurrencySymbol()}{getUserBalance().toLocaleString()} {getCurrencyLabel()}
              </p>
              <p className="text-xs text-orange-600">
                1% fee applies
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="What's this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

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
              onClick={handleSend}
              disabled={!recipientUser || !amount || sendMutation.isPending}
              className="flex-1"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send {getCurrencySymbol()}{amount ? parseFloat(amount).toLocaleString() : "0"} {getCurrencyLabel()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}