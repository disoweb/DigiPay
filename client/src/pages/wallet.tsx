import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="recipient">Recipient Address</Label>
        <Input
          id="recipient"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="TRON address (starting with T...)"
          className="font-mono"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter the recipient's TRON address (TRC-20)
        </p>
      </div>

      <div>
        <Label htmlFor="amount">Amount (USDT)</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.000001"
          max={userBalance}
          required
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Available: {userBalance.toFixed(6)} USDT</span>
          <button
            type="button"
            onClick={() => setAmount(userBalance.toString())}
            className="text-blue-600 hover:text-blue-800"
          >
            Use Max
          </button>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Warning:</strong> TRON transactions are irreversible. 
          Please verify the recipient address carefully before sending.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={sendUSDTMutation.isPending || !amount || !recipientAddress}
          className="bg-red-600 hover:bg-red-700"
        >
          {sendUSDTMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send USDT
            </>
          )}
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
                    ₦{(parseFloat(user.nairaBalance || "0")).toLocaleString()}
                  </p>
                  <div className="flex justify-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="text-blue-100">NGN</p>
                      <p className="font-semibold">₦{parseFloat(user.nairaBalance || "0").toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-100">USDT (TRON)</p>
                      <p className="font-semibold">Available in TRON Wallet below</p>
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
                    {parseFloat(user.usdtBalance || "0").toFixed(2)} USDT
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Coins className="h-5 w-5 text-green-600" />
              </div>
              Receive USDT
            </DialogTitle>
            <DialogDescription>
              Share your TRON address to receive USDT payments
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <div className="text-xs text-gray-500 text-center">
                    QR Code<br />Placeholder
                  </div>
                </div>
                <p className="text-sm text-gray-600">Scan QR code to get address</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your TRON Address (TRC-20)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={user?.tronAddress || ""}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(user?.tronAddress || "");
                    alert("Address copied to clipboard!");
                  }}
                  className="px-3"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Only send USDT (TRC-20) to this address. Other tokens may be lost permanently.
              </p>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Important:</strong> This address only accepts USDT on the TRON network (TRC-20). 
                Sending other cryptocurrencies or tokens from other networks will result in permanent loss.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowReceive(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(user?.tronAddress || "");
                alert("Address copied to clipboard!");
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Address
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send USDT Modal */}
      <Dialog open={showSendUSDT} onOpenChange={setShowSendUSDT}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Minus className="h-5 w-5 text-red-600" />
              </div>
              Send USDT
            </DialogTitle>
            <DialogDescription>
              Send USDT to another TRON address
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