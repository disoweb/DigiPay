import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, AlertCircle, Wallet, ArrowUpRight, Shield, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: string;
}

export function WithdrawModal({ open, onOpenChange, balance }: WithdrawModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountName, setAccountName] = useState("");

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/withdraw", {
        amount: parseFloat(amount),
        accountNumber,
        bankCode,
        accountName,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully!",
      });
      onOpenChange(false);
      setAmount("");
      setAccountNumber("");
      setBankCode("");
      setAccountName("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!amount || !accountNumber || !bankCode || !accountName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const withdrawAmount = parseFloat(amount);
    const availableBalance = parseFloat(balance);

    if (withdrawAmount <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast({
        title: "Error",
        description: "Insufficient balance",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount < 1000) {
      toast({
        title: "Error",
        description: "Minimum withdrawal amount is ₦1,000",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate();
  };

  const nigerianBanks = [
    { code: "044", name: "Access Bank" },
    { code: "014", name: "Afribank" },
    { code: "023", name: "Citibank" },
    { code: "050", name: "Ecobank" },
    { code: "011", name: "First Bank" },
    { code: "214", name: "First City Monument Bank" },
    { code: "070", name: "Fidelity Bank" },
    { code: "058", name: "Guaranty Trust Bank" },
    { code: "030", name: "Heritage Bank" },
    { code: "082", name: "Keystone Bank" },
    { code: "221", name: "Stanbic IBTC Bank" },
    { code: "068", name: "Standard Chartered" },
    { code: "232", name: "Sterling Bank" },
    { code: "032", name: "Union Bank" },
    { code: "033", name: "United Bank for Africa" },
    { code: "215", name: "Unity Bank" },
    { code: "035", name: "Wema Bank" },
    { code: "057", name: "Zenith Bank" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-3">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Withdraw to Bank
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Transfer money from your wallet to your bank account
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {/* Available Balance */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-green-700">
                    ₦{parseFloat(balance).toLocaleString()}
                  </p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Amount Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Withdrawal Amount
            </Label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[1000, 5000, 10000, 25000].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === preset.toString() ? "default" : "outline"}
                  onClick={() => setAmount(preset.toString())}
                  className="h-10 text-sm font-medium"
                  disabled={preset > parseFloat(balance)}
                >
                  ₦{preset.toLocaleString()}
                </Button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                ₦
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1000"
                max={balance}
                step="100"
                className="pl-8 h-12 text-lg font-medium"
              />
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">
              Bank Details
            </Label>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="bank" className="text-sm text-gray-600">
                  Select Bank
                </Label>
                <Select value={bankCode} onValueChange={setBankCode}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianBanks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="accountNumber" className="text-sm text-gray-600">
                  Account Number
                </Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="Enter 10-digit account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  maxLength={10}
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="accountName" className="text-sm text-gray-600">
                  Account Name
                </Label>
                <Input
                  id="accountName"
                  type="text"
                  placeholder="Enter account holder name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Processing Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900 text-sm">
                    Secure Bank Transfer
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Processed within 24 hours
                    </li>
                    <li>• Bank charges may apply</li>
                    <li>• Minimum: ₦1,000</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button
            onClick={handleSubmit}
            disabled={!amount || !accountNumber || !bankCode || !accountName || parseFloat(amount) < 1000 || parseFloat(amount) > parseFloat(balance) || withdrawMutation.isPending}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {withdrawMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Withdrawal...
              </>
            ) : (
              <>
                <ArrowUpRight className="mr-2 h-5 w-5" />
                Withdraw ₦{amount ? parseFloat(amount).toLocaleString() : '0'}
              </>
            )}
          </Button>

          {parseFloat(amount) > 0 && parseFloat(amount) < 1000 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 text-sm">
                Minimum withdrawal amount is ₦1,000
              </AlertDescription>
            </Alert>
          )}

          {parseFloat(amount) > parseFloat(balance) && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 text-sm">
                Amount exceeds available balance
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}