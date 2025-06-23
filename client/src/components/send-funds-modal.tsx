import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, User, Mail, DollarSign, Loader2, ArrowUpDown, Coins, CheckCircle, XCircle, Clock, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SendFundsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nairaBalance: string;
  usdtBalance: string;
}

export function SendFundsModal({ open, onOpenChange, nairaBalance, usdtBalance }: SendFundsModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState<any>(null);
  const [currency, setCurrency] = useState<"NGN" | "USDT">("NGN");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lookupQuery, setLookupQuery] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [step, setStep] = useState(1);
  const [recipientUser, setRecipientUser] = useState<any>(null);
  const [lookupTimeout, setLookupTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleLookup = async () => {
    if (!recipientEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a recipient email",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/users/lookup", {
        query: recipientEmail.trim()
      });

      if (response.ok) {
        const userData = await response.json();
        setRecipient(userData);
        toast({
          title: "User Found",
          description: `Found ${userData.username || userData.email}`,
        });
      } else {
        toast({
          title: "User Not Found",
          description: "No user found with that email",
          variant: "destructive",
        });
        setRecipient(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to lookup user",
        variant: "destructive",
      });
      setRecipient(null);
    }
  };

  const lookupMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/users/lookup", { query });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "User not found");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setRecipient(data);
      setIsLookingUp(false);
    },
    onError: (error: any) => {
      setRecipient(null);
      setIsLookingUp(false);
    },
  });

  // Debounced lookup function
  const debouncedLookup = useCallback((query: string) => {
    if (lookupTimeout) {
      clearTimeout(lookupTimeout);
    }

    const timeout = setTimeout(() => {
      if (query.trim().length >= 3) {
        setIsLookingUp(true);
        lookupMutation.mutate(query.trim());
      } else {
        setRecipient(null);
        setIsLookingUp(false);
      }
    }, 500);

    setLookupTimeout(timeout);
  }, [lookupMutation, lookupTimeout]);

  // Auto-lookup when user types
  const handleRecipientChange = (value: string) => {
    setRecipientEmail(value);
    setRecipient(null);
    
    if (value.trim().length >= 3) {
      debouncedLookup(value);
    } else {
      setIsLookingUp(false);
      if (lookupTimeout) {
        clearTimeout(lookupTimeout);
      }
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (lookupTimeout) {
        clearTimeout(lookupTimeout);
      }
    };
  }, [lookupTimeout]);

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
    setRecipientEmail("");
    setAmount("");
    setDescription("");
    setRecipient(null);
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
    if (!recipient || !amount) return;

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
      recipientId: recipient.id,
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
          <DialogDescription>
            Send money to other users on the platform
          </DialogDescription>
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
                    USDT ({parseFloat(usdtBalance).toFixed(2)})
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Lookup */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Send to (Email or Username)</Label>
            <div className="relative">
              <Input
                id="recipient"
                placeholder="Enter email or username (min 3 characters)"
                value={recipientEmail}
                onChange={(e) => handleRecipientChange(e.target.value)}
                className={`pr-10 ${
                  recipient 
                    ? recipient.kycVerified 
                      ? "border-green-500 focus:border-green-500" 
                      : "border-yellow-500 focus:border-yellow-500"
                    : recipientEmail.length >= 3 && !isLookingUp && !recipient
                    ? "border-red-500 focus:border-red-500"
                    : ""
                }`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isLookingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : recipient ? (
                  recipient.kycVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-500" />
                  )
                ) : recipientEmail.length >= 3 ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : null}
              </div>
            </div>
            
            {/* User Details Card */}
            {recipient && (
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {recipient.firstName && recipient.lastName 
                            ? `${recipient.firstName} ${recipient.lastName}`
                            : recipient.username}
                        </p>
                        <p className="text-xs text-gray-600">{recipient.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={recipient.kycVerified ? "default" : "secondary"}
                            className={`text-xs ${
                              recipient.kycVerified 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }`}
                          >
                            {recipient.kycVerified ? "Verified" : "Unverified"}
                          </Badge>
                          {recipient.isOnline && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Online
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {recipient.ratingCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{parseFloat(recipient.averageRating).toFixed(1)}</span>
                          <span>({recipient.ratingCount})</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {!recipient.kycVerified && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      This user is not KYC verified. Proceed with caution.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {recipientEmail.length >= 3 && !recipient && !isLookingUp && (
              <p className="text-xs text-red-600">User not found</p>
            )}
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
              disabled={!recipient || !amount || sendMutation.isPending}
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