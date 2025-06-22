import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { DepositModal } from "@/components/deposit-modal";
import { WithdrawModal } from "@/components/withdraw-modal";
import { KYCVerification } from "@/components/kyc-verification";

// SendUSDTForm component for handling USDT transfers
function SendUSDTForm({ onClose, userBalance }: { onClose: () => void; userBalance: number }) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendUSDTMutation = useMutation({
    mutationFn: async (data: { amount: string; to: string }) => {
      const response = await fetch("/api/tron/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send USDT");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "USDT Sent Successfully",
        description: "Your transaction has been broadcast to the TRON network.",
      });
      setAmount("");
      setRecipientAddress("");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to send USDT",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientAddress || !amount) {
      toast({
        title: "Invalid Input",
        description: "Please enter both recipient address and amount",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (amountNum > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough USDT to send this amount",
        variant: "destructive",
      });
      return;
    }

    if (!recipientAddress.startsWith("T") || recipientAddress.length !== 34) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid TRON address (starts with T and 34 characters long)",
        variant: "destructive",
      });
      return;
    }

    sendUSDTMutation.mutate({ amount, to: recipientAddress });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-2">
      {/* Available Balance */}
      <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
        <CardContent className="p-4">
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-600">Available Balance</p>
            <p className="text-2xl font-bold text-red-700">{userBalance.toFixed(6)} USDT</p>
          </div>
        </CardContent>
      </Card>

      {/* Recipient Address */}
      <div className="space-y-3">
        <Label htmlFor="recipient" className="text-sm font-medium text-gray-700">
          Recipient Address
        </Label>
        <Input
          id="recipient"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="TRON address (starting with T...)"
          className="h-12 font-mono text-sm"
          required
        />
        <p className="text-xs text-gray-500">
          Enter the recipient's TRON address (TRC-20)
        </p>
      </div>

      {/* Amount */}
      <div className="space-y-3">
        <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
          Amount (USDT)
        </Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.000001"
          max={userBalance}
          className="h-12 text-lg text-center"
          inputMode="numeric"
          required
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Available: {userBalance.toFixed(6)} USDT</span>
          <button
            type="button"
            onClick={() => setAmount(userBalance.toString())}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Use Max
          </button>
        </div>
      </div>

      {/* Preview */}
      {amount && parseFloat(amount) > 0 && (
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">You're sending</p>
              <p className="text-2xl font-bold text-gray-700">{parseFloat(amount).toFixed(6)} USDT</p>
              <p className="text-xs text-gray-500">≈ ₦{(parseFloat(amount) * 1485).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-red-900 text-sm mb-1">Important Warning</h4>
              <p className="text-xs text-red-700 leading-relaxed">
                TRON transactions are irreversible. Please verify the recipient 
                address carefully before sending.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <Button
          type="submit"
          disabled={sendUSDTMutation.isPending || !amount || !recipientAddress}
          className="w-full h-12 text-base font-medium bg-red-600 hover:bg-red-700"
          size="lg"
        >
          {sendUSDTMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sending...
            </div>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send {amount ? `${parseFloat(amount).toFixed(6)} USDT` : "USDT"}
            </>
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          className="w-full h-11 text-base"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, DollarSign, Coins, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Wallet as WalletIcon, Copy, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@shared/schema";

export default function Wallet() {
  const { user } = useAuth();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSendUSDT, setShowSendUSDT] = useState(false);

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/transactions");
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  if (!user) return null;

  const getTransactionIcon = (type: string) => {
    return type === "deposit" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending</Badge>;
      case "failed":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <main className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <WalletIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
            </div>
            <p className="text-gray-600">Manage your funds and transactions</p>
          </div>

          {/* Balance Overview */}
          <div className="space-y-4">
            {/* Total Balance Summary */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <p className="text-blue-100 text-sm">Total Portfolio Value</p>
                  <p className="text-4xl font-bold">
                    ₦{(parseFloat(user.nairaBalance || "0") + (parseFloat(user.usdtBalance || "0") * 1485)).toLocaleString()}
                  </p>
                  <div className="flex justify-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="text-blue-100">NGN</p>
                      <p className="font-semibold">₦{parseFloat(user.nairaBalance || "0").toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-100">USDT (TRON)</p>
                      <p className="font-semibold">{parseFloat(user.usdtBalance || "0").toFixed(6)} USDT</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Naira Card */}
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">NGN</h3>
                        <p className="text-xs text-gray-500">Nigerian Naira</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      Active
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{parseFloat(user.nairaBalance || "0").toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Available for trading</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => setShowDeposit(true)} 
                      size="sm" 
                      className="h-9"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add
                    </Button>
                    <Button 
                      onClick={() => setShowWithdraw(true)} 
                      size="sm" 
                      variant="outline" 
                      className="h-9"
                    >
                      <Minus className="mr-1 h-3 w-3" />
                      Withdraw
                    </Button>
                  </div>
                </CardContent>
              </Card>

            {/* USDT Card */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Coins className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">USDT</h3>
                      <p className="text-xs text-gray-500">Tether (TRC-20)</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    TRC-20
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {parseFloat(user.usdtBalance || "0").toFixed(6)} USDT
                  </p>
                  <p className="text-sm text-gray-600">
                    ≈ ₦{(parseFloat(user.usdtBalance || "0") * 1485).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button 
                    onClick={() => setShowReceive(true)} 
                    size="sm" 
                    className="h-9 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Receive
                  </Button>
                  <Button 
                    onClick={() => setShowSendUSDT(true)} 
                    size="sm" 
                    variant="outline" 
                    className="h-9 border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Minus className="mr-1 h-3 w-3" />
                    Send
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs">
                    <p className="text-gray-500 mb-1">TRON Address:</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs bg-gray-100 p-2 rounded flex-1 truncate">
                        {user.tronAddress}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(user.tronAddress || "");
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

          {/* Transaction History */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-gray-600" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <WalletIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-500 text-sm">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            transaction.type === "deposit" 
                              ? "bg-green-100" 
                              : "bg-red-100"
                          }`}>
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 capitalize">
                              {transaction.type}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-xs text-gray-500">
                                {transaction.type === "deposit" ? "Paystack" : "Bank Transfer"}
                              </p>
                              {getTransactionBadge(transaction.status || "pending")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold text-lg ${
                            transaction.type === "deposit" ? "text-green-600" : "text-red-600"
                          }`}>
                            {transaction.type === "deposit" ? "+" : "-"}₦{parseFloat(transaction.amount || "0").toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('en-NG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.length > 5 && (
                    <div className="p-4 text-center border-t">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                        View All Transactions
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <DepositModal open={showDeposit} onOpenChange={setShowDeposit} />
      <WithdrawModal open={showWithdraw} onOpenChange={setShowWithdraw} balance={user.nairaBalance || "0"} />
      
      {/* Receive USDT Modal */}
      <Dialog open={showReceive} onOpenChange={setShowReceive}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <Coins className="h-5 w-5 text-green-600" />
              </div>
              Receive USDT (TRC-20)
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Share your TRON address to receive USDT payments
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {/* QR Code Section */}
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <div className="w-32 h-32 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-green-300">
                    <div className="text-xs text-green-600 text-center font-medium">
                      QR Code<br />Placeholder
                    </div>
                  </div>
                  <p className="text-sm text-green-700 font-medium">Scan QR code to get address</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Address Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Your TRON Address (TRC-20)
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={user?.tronAddress || ""}
                  readOnly
                  className="flex-1 h-12 font-mono text-sm bg-gray-50 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(user?.tronAddress || "");
                    alert("Address copied to clipboard!");
                  }}
                  className="h-12 w-12 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Only send USDT (TRC-20) to this address. Other tokens may be lost permanently.
              </p>
            </div>

            {/* Warning Info */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-amber-900 text-sm mb-1">Important Notice</h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      This address only accepts USDT on the TRON network (TRC-20). 
                      Sending other cryptocurrencies will result in permanent loss.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(user?.tronAddress || "");
                  alert("Address copied to clipboard!");
                }}
                className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Address
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReceive(false)}
                className="w-full h-11 text-base"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send USDT Modal */}
      <Dialog open={showSendUSDT} onOpenChange={setShowSendUSDT}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-red-100 rounded-lg">
                <Send className="h-5 w-5 text-red-600" />
              </div>
              Send USDT (TRC-20)
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Transfer USDT to another TRON wallet address
            </DialogDescription>
          </DialogHeader>
          
          <SendUSDTForm 
            onClose={() => setShowSendUSDT(false)} 
            userBalance={parseFloat(user?.usdtBalance || "0")} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}