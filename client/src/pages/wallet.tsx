import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { EnhancedDepositModal } from "@/components/enhanced-deposit-modal";
import { WithdrawModal } from "@/components/withdraw-modal";
import { TransactionDetailModal } from "@/components/transaction-detail-modal";
import { SendFundsModal } from "@/components/send-funds-modal";
import { SwapModal } from "@/components/swap-modal";
import { ProfileCompletionModal } from "@/components/profile-completion-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCurrencyPreference } from "@/hooks/use-currency-preference";
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
  DollarSign,
  RefreshCw
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
      try {
        const response = await apiRequest("POST", "/api/tron/send", data);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('USDT send error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "USDT Sent Successfully",
        description: `${amount} USDT has been sent to ${recipientAddress}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Send USDT mutation error:', error);
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
          step="0.01"
        />
        <p className="text-xs text-gray-500 mt-1">
          Available: {userBalance.toFixed(2)} USDT
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
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const { currency: portfolioCurrency, toggleCurrency } = useCurrencyPreference();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket connection for real-time balance updates
  useEffect(() => {
    if (!user?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('Attempting WebSocket connection to:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected successfully for real-time updates');
      setWsConnected(true);
      const connectMessage = {
        type: 'user_connect',
        userId: user.id
      };
      console.log('Sending user connect message:', connectMessage);
      ws.send(JSON.stringify(connectMessage));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'user_connected') {
          console.log('WebSocket user connection confirmed:', data);
        } else if (data.type === 'balance_updated' && data.userId === user.id) {
          console.log('Processing balance update for user:', user.id);
          
          // Force immediate query cache update
          queryClient.setQueryData(["/api/user"], (oldData: any) => {
            if (oldData) {
              console.log('Updating user data in cache:', {
                old: oldData.nairaBalance,
                new: data.nairaBalance
              });
              return {
                ...oldData,
                nairaBalance: data.nairaBalance,
                usdtBalance: data.usdtBalance
              };
            }
            return oldData;
          });
          
          // Force refetch to ensure UI updates
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          queryClient.refetchQueries({ queryKey: ["/api/user"] });
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
          
          if (data.lastTransaction?.type === 'deposit') {
            toast({
              title: "Balance Updated!",
              description: `₦${parseFloat(data.lastTransaction.amount).toLocaleString()} credited to your wallet`,
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [user?.id, queryClient, toast]);

  // Exchange rates
  const USDT_TO_NGN_RATE = 1485;
  const NGN_TO_USD_RATE = 0.00067; // Approximate USD rate

  // Check if profile is incomplete and show modal only once per session
  useEffect(() => {
    if (user && (!user.firstName || !user.lastName || !user.username)) {
      const hasShownModal = sessionStorage.getItem(`profile-modal-shown-${user.id}`);
      if (!hasShownModal) {
        const timer = setTimeout(() => {
          setShowProfileCompletion(true);
          sessionStorage.setItem(`profile-modal-shown-${user.id}`, 'true');
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id, user?.firstName, user?.lastName, user?.username]);

  const { data: transactions = [], error: transactionsError, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/transactions");
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Transaction fetch error:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
  });

  if (!user) return null;

  // Portfolio value calculations
  const calculatePortfolioValue = () => {
    const usdtBalance = parseFloat(user.usdtBalance || "0");
    const ngnBalance = parseFloat(user.nairaBalance || "0");
    
    if (portfolioCurrency === "USD") {
      const usdtInUsd = usdtBalance; // USDT is 1:1 with USD
      const ngnInUsd = ngnBalance * NGN_TO_USD_RATE;
      return usdtInUsd + ngnInUsd;
    } else {
      const usdtInNgn = usdtBalance * USDT_TO_NGN_RATE;
      return ngnBalance + usdtInNgn;
    }
  };

  const formatPortfolioValue = (value: number) => {
    if (portfolioCurrency === "USD") {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `₦${value.toLocaleString()}`;
    }
  };

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
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-blue-100 text-sm">Total Portfolio Value</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleCurrency}
                      className="h-6 w-auto px-2 bg-white/10 hover:bg-white/20 text-white text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {portfolioCurrency}
                    </Button>
                  </div>
                  <p className="text-4xl font-bold">
                    {formatPortfolioValue(calculatePortfolioValue())}
                  </p>
                  <div className="flex justify-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="text-blue-100">NGN</p>
                      <p className="font-semibold">₦{parseFloat(user.nairaBalance || "0").toLocaleString()}</p>
                      {portfolioCurrency === "USD" && (
                        <p className="text-xs text-blue-200">
                          ≈ ${(parseFloat(user.nairaBalance || "0") * NGN_TO_USD_RATE).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-blue-100">USDT (TRON)</p>
                      <p className="font-semibold">{parseFloat(user.usdtBalance || "0").toFixed(2)} USDT</p>
                      {portfolioCurrency === "NGN" && (
                        <p className="text-xs text-blue-200">
                          ≈ ₦{(parseFloat(user.usdtBalance || "0") * USDT_TO_NGN_RATE).toLocaleString()}
                        </p>
                      )}
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
                      {parseFloat(user.usdtBalance || "0").toFixed(2)} USDT
                    </p>
                    <p className="text-sm text-gray-600">
                      ≈ ₦{(parseFloat(user.usdtBalance || "0") * 1485).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        {(user as any).tronAddress || "Generating..."}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText((user as any).tronAddress || "");
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
                              {transaction.type === 'transfer_in' ? 'Transfer Received' : 
                               transaction.type === 'transfer_out' ? 'Transfer Sent' :
                               transaction.type === 'swap' ? 'Currency Swap' :
                               transaction.type}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-xs text-gray-500">
                                {transaction.type === "deposit" ? "Paystack" : 
                                 transaction.type === "swap" ? "Instant Exchange" :
                                 transaction.type.includes("transfer") ? "P2P Transfer" :
                                 "Bank Transfer"}
                              </p>
                              {getTransactionBadge(transaction.status || "completed")}
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
      <EnhancedDepositModal open={showDeposit} onOpenChange={setShowDeposit} user={user} />
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
        nairaBalance={user.nairaBalance || "0"}
        usdtBalance={user.usdtBalance || "0"}
      />

      {/* Currency Swap Modal */}
      <SwapModal
        open={showSwap}
        onOpenChange={setShowSwap}
        nairaBalance={user.nairaBalance || "0"}
        usdtBalance={user.usdtBalance || "0"}
      />

      {/* KYC Alert */}
      {!(user as any).kycVerified && (
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
                    value={(user as any).tronAddress || "Loading..."}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText((user as any).tronAddress || "");
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

      <ProfileCompletionModal
        open={showProfileCompletion}
        onClose={() => setShowProfileCompletion(false)}
        user={user}
      />
    </div>
  );
}