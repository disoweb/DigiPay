import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { DepositModal } from "@/components/deposit-modal";
import { WithdrawModal } from "@/components/withdraw-modal";
import { TransactionDetailModal } from "@/components/transaction-detail-modal";
import { SendFundsModal } from "@/components/send-funds-modal";
import { SwapModal } from "@/components/swap-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  WalletIcon, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  Copy,
  AlertTriangle,
  Coins,
  Clock,
  Send,
  ArrowUpDown,
  DollarSign
} from "lucide-react";
import type { Transaction } from "@shared/schema";

// SendUSDTForm component for handling USDT transfers
function SendUSDTForm({ onClose, userBalance }: { onClose: () => void; userBalance: number }) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendUSDTMutation = useMutation({
    mutationFn: async (data: { amount: string; to: string }) => {
      const response = await apiRequest("POST", "/api/tron/send", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "USDT Sent Successfully",
        description: `${amount} USDT has been sent to ${recipientAddress}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send USDT",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sendAmount = parseFloat(amount);
    if (sendAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (sendAmount > userBalance) {
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
        <label className="text-sm font-medium">Recipient Address</label>
        <Input
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="T1234567890123456789012345678901234"
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Amount (USDT)</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="mt-1"
          max={userBalance}
          step="0.000001"
        />
        <p className="text-xs text-gray-500 mt-1">
          Available: {userBalance.toFixed(6)} USDT
        </p>
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={sendUSDTMutation.isPending || !amount || !recipientAddress}
          className="flex-1"
        >
          {sendUSDTMutation.isPending ? "Sending..." : `Send ${amount || "0"} USDT`}
        </Button>
      </div>
    </form>
  );
}

export default function Wallet() {
  const { user } = useAuth();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSendUSDT, setShowSendUSDT] = useState(false);
  const [showSendFunds, setShowSendFunds] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const { toast } = useToast();

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
            <p className="text-gray-600">Manage your funds, send money, and swap currencies</p>
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
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button 
                      onClick={() => setShowSendFunds(true)} 
                      size="sm" 
                      variant="outline" 
                      className="h-9"
                    >
                      <Send className="mr-1 h-3 w-3" />
                      Send
                    </Button>
                    <Button 
                      onClick={() => setShowSwap(true)} 
                      size="sm" 
                      variant="outline" 
                      className="h-9"
                    >
                      <ArrowUpDown className="mr-1 h-3 w-3" />
                      Swap
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

                  <div className="grid grid-cols-2 gap-2 mb-2">
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
                      className="h-9"
                    >
                      <Minus className="mr-1 h-3 w-3" />
                      Send
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button 
                      onClick={() => setShowSendFunds(true)} 
                      size="sm" 
                      variant="outline" 
                      className="h-9"
                    >
                      <Send className="mr-1 h-3 w-3" />
                      Transfer
                    </Button>
                    <Button 
                      onClick={() => setShowSwap(true)} 
                      size="sm" 
                      variant="outline" 
                      className="h-9"
                    >
                      <ArrowUpDown className="mr-1 h-3 w-3" />
                      Swap
                    </Button>
                  </div>

                  {/* TRON Address Display */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Your TRON Address:</p>
                    <div className="flex items-center justify-between">
                      <code className="text-xs text-gray-800 truncate flex-1">
                        {user.tronAddress || "Generating..."}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(user.tronAddress || "");
                          toast({ title: "Address copied to clipboard" });
                        }}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
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
                    <div 
                      key={transaction.id} 
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowTransactionModal(true);
                      }}
                    >
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => {
                          console.log('Show all transactions');
                        }}
                      >
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

      {/* Modals */}
      <DepositModal open={showDeposit} onOpenChange={setShowDeposit} />
      <WithdrawModal open={showWithdraw} onOpenChange={setShowWithdraw} balance={user.nairaBalance || "0"} />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedTransaction(null);
        }}
      />

      {/* Send Funds Modal */}
      <SendFundsModal
        open={showSendFunds}
        onOpenChange={setShowSendFunds}
        userBalance={user.nairaBalance || "0"}
      />

      {/* Currency Swap Modal */}
      <SwapModal
        open={showSwap}
        onOpenChange={setShowSwap}
        nairaBalance={user.nairaBalance || "0"}
        usdtBalance={user.usdtBalance || "0"}
      />

      {/* KYC Alert */}
      {!user.kycVerified && (
        <Alert className="mt-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Complete KYC verification to unlock full platform features.
          </AlertDescription>
        </Alert>
      )}

      {/* Receive Modal */}
      {showReceive && (
        <Dialog open={showReceive} onOpenChange={setShowReceive}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Receive USDT</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your TRON Wallet Address</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={user.tronAddress || "Loading..."}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(user.tronAddress || "");
                      toast({ title: "Address copied to clipboard" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Only send USDT (TRC-20) to this address. Other tokens will be lost permanently.
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Send USDT Modal */}
      {showSendUSDT && (
        <Dialog open={showSendUSDT} onOpenChange={setShowSendUSDT}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send USDT</DialogTitle>
            </DialogHeader>
            <SendUSDTForm 
              onClose={() => setShowSendUSDT(false)} 
              userBalance={parseFloat(user.usdtBalance || "0")} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}