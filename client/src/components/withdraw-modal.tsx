import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, AlertCircle, Building } from "lucide-react";
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

  const availableBalance = parseFloat(balance);
  const withdrawAmount = parseFloat(amount || "0");
  const fee = withdrawAmount * 0.01; // 1% fee
  const finalAmount = withdrawAmount - fee;

  const handleWithdraw = async () => {
    setIsLoading(true);
    // Simulate withdrawal processing
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
    }, 2000);
  };

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
            Withdraw to Bank
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Transfer funds from your wallet to your bank account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Available Balance */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-blue-700">₦{availableBalance.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

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
              onClick={handleWithdraw} 
              disabled={!amount || !bankName || !accountNumber || !accountName || withdrawAmount > availableBalance || withdrawAmount < 100 || isLoading}
              className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                `Withdraw ₦${finalAmount.toFixed(2)}`
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full h-11 text-base"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}