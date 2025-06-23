import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Banknote, Clock, Shield, AlertTriangle, CheckCircle, ArrowRight, Copy, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface EnhancedWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: string;
}

type WithdrawStep = "amount" | "details" | "confirm" | "processing" | "complete";

interface BankDetail {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
}

const POPULAR_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "GTBank", code: "058" },
  { name: "First Bank", code: "011" },
  { name: "Zenith Bank", code: "057" },
  { name: "UBA", code: "033" },
  { name: "Fidelity Bank", code: "070" },
  { name: "Union Bank", code: "032" },
  { name: "Sterling Bank", code: "232" },
  { name: "Stanbic IBTC", code: "221" },
  { name: "FCMB", code: "214" }
];

export default function EnhancedWithdrawModal({ isOpen, onClose, availableBalance }: EnhancedWithdrawModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState<WithdrawStep>("amount");
  const [amount, setAmount] = useState("");
  const [bankDetails, setBankDetails] = useState<BankDetail>({
    accountNumber: "",
    accountName: "",
    bankName: "",
    bankCode: ""
  });
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [transactionPin, setTransactionPin] = useState("");
  const [withdrawalReference, setWithdrawalReference] = useState("");

  const balance = parseFloat(availableBalance || "0");
  const withdrawAmount = parseFloat(amount || "0");
  const fee = withdrawAmount * 0.015; // 1.5% fee
  const totalDeduction = withdrawAmount + fee;

  const withdrawMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/withdraw", "POST", data),
    onSuccess: (data) => {
      setWithdrawalReference(data.reference);
      setCurrentStep("complete");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "Withdrawal Initiated",
        description: `₦${withdrawAmount.toLocaleString()} withdrawal request submitted successfully`,
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    }
  });

  const quickAmounts = [1000, 5000, 10000, 50000, 100000];

  const resetForm = () => {
    setCurrentStep("amount");
    setAmount("");
    setBankDetails({
      accountNumber: "",
      accountName: "",
      bankName: "",
      bankCode: ""
    });
    setAccountVerified(false);
    setTransactionPin("");
    setWithdrawalReference("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAmountSubmit = () => {
    if (!amount || withdrawAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount < 1000) {
      toast({
        title: "Minimum Amount",
        description: "Minimum withdrawal amount is ₦1,000",
        variant: "destructive",
      });
      return;
    }

    if (totalDeduction > balance) {
      toast({
        title: "Insufficient Balance",
        description: `Your balance (₦${balance.toLocaleString()}) is insufficient to cover the withdrawal amount and fee (₦${totalDeduction.toLocaleString()})`,
        variant: "destructive",
      });
      return;
    }

    setCurrentStep("details");
  };

  const verifyAccount = async () => {
    if (!bankDetails.accountNumber || !bankDetails.bankCode) {
      toast({
        title: "Missing Information",
        description: "Please provide account number and select a bank",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingAccount(true);
    
    // Simulate account verification (in real app, this would call bank API)
    setTimeout(() => {
      setBankDetails(prev => ({
        ...prev,
        accountName: "John Doe" // This would come from bank API
      }));
      setAccountVerified(true);
      setIsVerifyingAccount(false);
      
      toast({
        title: "Account Verified",
        description: "Bank account details verified successfully",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    }, 2000);
  };

  const handleDetailsSubmit = () => {
    if (!accountVerified) {
      toast({
        title: "Account Not Verified",
        description: "Please verify your bank account details first",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep("confirm");
  };

  const handleConfirmWithdraw = () => {
    if (!transactionPin || transactionPin.length !== 4) {
      toast({
        title: "Transaction PIN Required",
        description: "Please enter your 4-digit transaction PIN",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep("processing");
    
    withdrawMutation.mutate({
      amount: withdrawAmount,
      bankName: bankDetails.bankName,
      accountNumber: bankDetails.accountNumber,
      accountName: bankDetails.accountName,
      fee: fee,
      transactionPin: transactionPin
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Reference number copied to clipboard",
    });
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "amount": return 25;
      case "details": return 50;
      case "confirm": return 75;
      case "processing": return 90;
      case "complete": return 100;
      default: return 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto max-h-[95vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Banknote className="h-6 w-6 text-blue-600" />
            Withdraw Funds
          </DialogTitle>
          <div className="mt-4">
            <Progress value={getStepProgress()} className="h-2" />
            <p className="text-sm text-gray-500 mt-2">Step {currentStep === "amount" ? 1 : currentStep === "details" ? 2 : currentStep === "confirm" ? 3 : 4} of 4</p>
          </div>
        </DialogHeader>

        {/* Step 1: Amount Selection */}
        {currentStep === "amount" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Available Balance</CardTitle>
                <CardDescription className="text-2xl font-bold text-green-600">
                  ₦{balance.toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              <Label htmlFor="amount" className="text-base font-medium">
                Enter withdrawal amount
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg h-12"
              />
              
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount.toString())}
                    disabled={quickAmount > balance}
                    className="text-xs"
                  >
                    ₦{quickAmount.toLocaleString()}
                  </Button>
                ))}
              </div>

              {withdrawAmount > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Withdrawal Amount:</span>
                        <span className="font-medium">₦{withdrawAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Fee (1.5%):</span>
                        <span className="font-medium">₦{fee.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total Deduction:</span>
                        <span>₦{totalDeduction.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Remaining Balance:</span>
                        <span>₦{(balance - totalDeduction).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Minimum withdrawal: ₦1,000. Processing fee: 1.5% of withdrawal amount.
                </AlertDescription>
              </Alert>
            </div>

            <Button 
              onClick={handleAmountSubmit} 
              className="w-full h-12"
              disabled={!amount || withdrawAmount <= 0}
            >
              Continue to Bank Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Bank Details */}
        {currentStep === "details" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Withdrawal Summary</CardTitle>
                <CardDescription>
                  Amount: ₦{withdrawAmount.toLocaleString()} + ₦{fee.toLocaleString()} fee
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Select Bank</Label>
                <select
                  id="bankName"
                  value={bankDetails.bankName}
                  onChange={(e) => {
                    const selectedBank = POPULAR_BANKS.find(bank => bank.name === e.target.value);
                    setBankDetails(prev => ({
                      ...prev,
                      bankName: e.target.value,
                      bankCode: selectedBank?.code || ""
                    }));
                    setAccountVerified(false);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose your bank</option>
                  {POPULAR_BANKS.map((bank) => (
                    <option key={bank.code} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <div className="relative">
                  <Input
                    id="accountNumber"
                    type={showAccountNumber ? "text" : "password"}
                    placeholder="Enter 10-digit account number"
                    value={bankDetails.accountNumber}
                    onChange={(e) => {
                      setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }));
                      setAccountVerified(false);
                    }}
                    className="pr-10"
                    maxLength={10}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                  >
                    {showAccountNumber ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {bankDetails.accountNumber && bankDetails.bankName && (
                <Button
                  onClick={verifyAccount}
                  disabled={isVerifyingAccount || accountVerified}
                  variant="outline"
                  className="w-full"
                >
                  {isVerifyingAccount ? (
                    "Verifying Account..."
                  ) : accountVerified ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Account Verified
                    </>
                  ) : (
                    "Verify Account Details"
                  )}
                </Button>
              )}

              {accountVerified && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{bankDetails.accountName}</p>
                        <p className="text-sm">{bankDetails.bankName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  We verify your account details with your bank to ensure secure transactions.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep("amount")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleDetailsSubmit} className="flex-1" disabled={!accountVerified}>
                Continue to Confirmation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === "confirm" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Confirm Withdrawal</CardTitle>
                <CardDescription>Review all details before confirming</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium">₦{withdrawAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Processing Fee</p>
                    <p className="font-medium">₦{fee.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bank</p>
                    <p className="font-medium">{bankDetails.bankName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Account</p>
                    <p className="font-medium">{bankDetails.accountName}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Deduction:</span>
                  <span>₦{totalDeduction.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="pin">Transaction PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter 4-digit PIN"
                value={transactionPin}
                onChange={(e) => setTransactionPin(e.target.value)}
                maxLength={4}
                className="text-center text-lg tracking-widest"
              />
            </div>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Funds will be transferred to your account within 5-10 minutes after confirmation.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep("details")} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleConfirmWithdraw} 
                className="flex-1"
                disabled={!transactionPin || transactionPin.length !== 4}
              >
                Confirm Withdrawal
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Processing */}
        {currentStep === "processing" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Processing Withdrawal</h3>
              <p className="text-gray-500">Please wait while we process your request...</p>
            </div>
            <Progress value={90} className="h-2" />
          </div>
        )}

        {/* Step 5: Complete */}
        {currentStep === "complete" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-green-800">Withdrawal Successful!</h3>
              <p className="text-gray-500">Your withdrawal request has been submitted</p>
            </div>

            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">₦{withdrawAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{withdrawalReference}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(withdrawalReference)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className="bg-orange-100 text-orange-800">Processing</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your funds will be transferred within 5-10 minutes. You'll receive an SMS confirmation.
              </AlertDescription>
            </Alert>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}