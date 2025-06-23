import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Banknote, CheckCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MobileWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: string;
}

const BANKS = [
  "Access Bank", "GTBank", "First Bank", "Zenith Bank", "UBA", 
  "Fidelity Bank", "Union Bank", "Sterling Bank", "Stanbic IBTC", "FCMB"
];

export default function MobileWithdrawModal({ isOpen, onClose, availableBalance }: MobileWithdrawModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [pin, setPin] = useState("");
  const [reference, setReference] = useState("");

  const balance = parseFloat(availableBalance || "0");
  const withdrawAmount = parseFloat(amount || "0");
  const fee = withdrawAmount * 0.015;
  const total = withdrawAmount + fee;

  const withdrawMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/withdraw", "POST", data),
    onSuccess: (data) => {
      setReference(data.reference || "WD" + Date.now());
      setStep(4);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "Withdrawal Successful",
        description: `₦${withdrawAmount.toLocaleString()} withdrawal initiated`,
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

  const quickAmounts = [5000, 10000, 25000, 50000].filter(amt => amt <= balance);

  const resetForm = () => {
    setStep(1);
    setAmount("");
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setPin("");
    setReference("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    if (step === 1) {
      if (!amount || withdrawAmount < 1000) {
        toast({
          title: "Invalid Amount",
          description: "Minimum withdrawal is ₦1,000",
          variant: "destructive",
        });
        return;
      }
      if (total > balance) {
        toast({
          title: "Insufficient Balance",
          description: "Amount exceeds available balance",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!bankName || !accountNumber || !accountName) {
        toast({
          title: "Missing Details",
          description: "Please fill all bank details",
          variant: "destructive",
        });
        return;
      }
      if (accountNumber.length !== 10) {
        toast({
          title: "Invalid Account",
          description: "Account number must be 10 digits",
          variant: "destructive",
        });
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!pin || pin.length !== 4) {
        toast({
          title: "Invalid PIN",
          description: "Please enter your 4-digit PIN",
          variant: "destructive",
        });
        return;
      }
      
      withdrawMutation.mutate({
        amount: withdrawAmount,
        bankName,
        accountNumber,
        accountName,
        fee,
        transactionPin: pin
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-sm mx-auto max-h-[85vh] overflow-y-auto p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Banknote className="h-5 w-5 text-blue-600" />
            Withdraw Funds
          </DialogTitle>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded ${step >= i ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3 text-center">
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-xl font-bold text-blue-700">₦{balance.toLocaleString()}</p>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Label>Amount to withdraw</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg h-12 text-center"
                />

                {quickAmounts.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {quickAmounts.map((amt) => (
                      <Button
                        key={amt}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(amt.toString())}
                        className="h-8 text-xs"
                      >
                        ₦{amt.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                )}

                {withdrawAmount > 0 && (
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>₦{withdrawAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fee (1.5%):</span>
                        <span>₦{fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-1">
                        <span>Total:</span>
                        <span>₦{total.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center text-sm text-gray-600 mb-4">
                Withdrawing ₦{withdrawAmount.toLocaleString()}
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Bank</Label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-3 border rounded-md mt-1 bg-white"
                  >
                    <option value="">Select bank</option>
                    {BANKS.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Account Number</Label>
                  <Input
                    type="text"
                    placeholder="10-digit account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength={10}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Account Name</Label>
                  <Input
                    type="text"
                    placeholder="Account holder name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Card className="border-blue-200">
                <CardContent className="p-3">
                  <div className="text-center space-y-2">
                    <h4 className="font-medium">Confirm Withdrawal</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      ₦{withdrawAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      To {accountName} • {bankName}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label>Transaction PIN</Label>
                <Input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className="text-center text-lg tracking-widest mt-1"
                />
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Funds will be transferred within 5-10 minutes
                </AlertDescription>
              </Alert>
            </>
          )}

          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-green-800">Success!</h3>
                <p className="text-sm text-gray-600">Withdrawal request submitted</p>
              </div>

              <Card>
                <CardContent className="p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>₦{withdrawAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span className="font-mono text-xs">{reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className="bg-orange-100 text-orange-800 text-xs">Processing</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {step > 1 && step < 4 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button 
                onClick={handleNext} 
                className="flex-1"
                disabled={withdrawMutation.isPending}
              >
                {step === 3 ? (
                  withdrawMutation.isPending ? "Processing..." : "Confirm"
                ) : (
                  <>Continue <ArrowRight className="ml-1 h-4 w-4" /></>
                )}
              </Button>
            ) : (
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}