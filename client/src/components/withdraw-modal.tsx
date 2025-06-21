import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, AlertCircle, Building, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: string;
}

export function WithdrawModal({ open, onOpenChange, balance }: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const availableBalance = parseFloat(balance);
  const withdrawAmount = parseFloat(amount || "0");
  const fee = withdrawAmount * 0.01; // 1% fee
  const finalAmount = withdrawAmount - fee;

  const resetForm = () => {
    setAmount("");
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setStep(1);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleNext = () => {
    if (step === 1 && withdrawAmount >= 100 && withdrawAmount <= availableBalance) {
      setStep(2);
    } else if (step === 2 && bankName && accountNumber.length === 10 && accountName) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleConfirmWithdraw = async () => {
    setIsLoading(true);
    try {
      // Here you would make the actual API call to process withdrawal
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: withdrawAmount,
          bankName,
          accountNumber,
          accountName
        })
      });

      if (response.ok) {
        setTimeout(() => {
          setIsLoading(false);
          handleClose();
        }, 2000);
      } else {
        setIsLoading(false);
        // Handle error
      }
    } catch (error) {
      setIsLoading(false);
      // Handle error
    }
  };

  const canProceedStep1 = withdrawAmount >= 100 && withdrawAmount <= availableBalance;
  const canProceedStep2 = bankName && accountNumber.length === 10 && accountName;

  const quickAmounts = [
    Math.floor(availableBalance * 0.25),
    Math.floor(availableBalance * 0.5),
    Math.floor(availableBalance * 0.75),
    availableBalance
  ].filter(amt => amt >= 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
{step === 1 ? "Enter Amount" : step === 2 ? "Account Details" : "Confirm Withdrawal"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
{step === 1 ? "Enter withdrawal amount" : step === 2 ? "Enter your bank account details" : "Review and confirm your withdrawal"}
          </DialogDescription>
        </DialogHeader>

        
        <div className="space-y-6 py-2">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 1 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
            }`}>
              1
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 2 ? 'bg-blue-600 text-white' : step > 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'
            }`}>
              2
            </div>
            <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              3
            </div>
          </div>

          {/* Available Balance */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-blue-700">₦{availableBalance.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {step === 1 && (
            // Step 1: Enter Amount
            <>
          {/* Quick Amount Selection */}
          {quickAmounts.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Quick Select</Label>
              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((quickAmount, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="h-12 text-sm font-medium hover:bg-blue-50 hover:border-blue-300"
                  >
                    {index === quickAmounts.length - 1 ? 'All' : `${((index + 1) * 25)}%`}
                    <br />
                    <span className="text-xs">₦{quickAmount.toLocaleString()}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Amount */}
          <div className="space-y-3">
            <Label htmlFor="withdraw-amount" className="text-sm font-medium text-gray-700">
              Withdrawal Amount (NGN)
            </Label>
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={availableBalance}
              min="100"
              className="h-12 text-lg text-center"
              inputMode="numeric"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Min: ₦100</span>
              <button
                type="button"
                onClick={() => setAmount(availableBalance.toString())}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Use Max
              </button>
            </div>
          </div>

          {/* Fee Breakdown */}
          {amount && withdrawAmount >= 100 && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Withdrawal Amount:</span>
                    <span className="font-medium">₦{withdrawAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Fee (1%):</span>
                    <span className="font-medium text-amber-700">-₦{fee.toFixed(2)}</span>
                  </div>
                  <hr className="border-amber-200" />
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900">You'll Receive:</span>
                    <span className="text-green-700">₦{finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleNext}
              disabled={!canProceedStep1}
              className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Next: Account Details
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="w-full h-11 text-base"
            >
              Cancel
            </Button>
          </div>
          </>
          )}

          {step === 2 && (
            // Step 2: Account Details
            <>
          {/* Bank Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="bank" className="text-sm font-medium text-gray-700">Bank</Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger className="h-12 mt-2">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gtbank">GTBank</SelectItem>
                  <SelectItem value="access">Access Bank</SelectItem>
                  <SelectItem value="zenith">Zenith Bank</SelectItem>
                  <SelectItem value="firstbank">First Bank</SelectItem>
                  <SelectItem value="uba">UBA</SelectItem>
                  <SelectItem value="fidelity">Fidelity Bank</SelectItem>
                  <SelectItem value="union">Union Bank</SelectItem>
                  <SelectItem value="sterling">Sterling Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="account-number" className="text-sm font-medium text-gray-700">
                Account Number
              </Label>
              <Input
                id="account-number"
                placeholder="Enter 10-digit account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                className="h-12 text-center tracking-wider mt-2"
                inputMode="numeric"
              />
            </div>

            <div>
              <Label htmlFor="account-name" className="text-sm font-medium text-gray-700">
                Account Holder Name
              </Label>
              <Input
                id="account-name"
                placeholder="Enter full account name as registered"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="h-12 mt-2"
              />
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Processing Time:</strong> Withdrawals are processed within 24 hours on business days. 
              Ensure account details are correct to avoid delays.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleNext}
              disabled={!canProceedStep2}
              className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Next: Review & Confirm
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="w-full h-11 text-base"
            >
              Back
            </Button>
          </div>
          </>
          )}

          {step === 3 && (
            // Step 3: Confirmation
            <>
            {/* Withdrawal Summary */}
            <Card className="border-blue-200">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium text-gray-900 mb-3">Withdrawal Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">₦{withdrawAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Fee (1%):</span>
                    <span className="font-medium">₦{fee.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-gray-900 font-medium">You'll receive:</span>
                    <span className="font-bold text-blue-600">₦{finalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details Summary */}
            <Card className="border-blue-200">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium text-gray-900 mb-3">Bank Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank:</span>
                    <span className="font-medium">{bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Number:</span>
                    <span className="font-medium">{accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Name:</span>
                    <span className="font-medium">{accountName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleConfirmWithdraw}
                disabled={isLoading}
                className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Withdrawal
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={isLoading}
                className="w-full h-11 text-base"
              >
                Back
              </Button>
            </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}