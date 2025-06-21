
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { DepositModal } from "@/components/deposit-modal";
import { WithdrawModal } from "@/components/withdraw-modal";
import { KYCVerification } from "@/components/kyc-verification";
import { TronWallet } from "@/components/tron-wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Minus, 
  DollarSign, 
  Coins, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Shield,
  Zap,
  Eye,
  RefreshCw,
  Activity
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Transaction } from "@shared/schema";

export default function Wallet() {
  const { user } = useAuth();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const { data: transactions = [], refetch } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  if (!user) return null;

  const getTransactionIcon = (type: string) => {
    return type === "deposit" ? (
      <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Completed</Badge>;
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalBalance = parseFloat(user.usdtBalance) * 1485 + parseFloat(user.nairaBalance);
  const recentTransactions = transactions.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.1%22%3E%3Ccircle%20cx=%227%22%20cy=%227%22%20r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
            <div className="relative">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Your Wallet 💰</h1>
              <p className="text-blue-100 text-sm sm:text-base mb-4">
                Manage your deposits, withdrawals, and digital assets
              </p>
              
              {/* Total Portfolio Value */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-6">
                <p className="text-blue-100 text-sm mb-1">Total Portfolio Value</p>
                <p className="text-3xl font-bold">₦{totalBalance.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-emerald-300" />
                  <span className="text-emerald-300 text-sm">+5.2% this month</span>
                </div>
              </div>
            </div>
          </div>

          {!user.kycVerified ? (
            <div className="mb-8">
              <Alert className="mb-6 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Complete KYC verification to access full wallet features and start trading with higher limits.
                </AlertDescription>
              </Alert>
              <KYCVerification />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Balance Cards - Mobile First */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-emerald-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-900 flex items-center">
                        <div className="p-2 bg-emerald-50 rounded-lg mr-3">
                          <Coins className="h-5 w-5 text-emerald-600" />
                        </div>
                        USDT Balance
                      </CardTitle>
                      <Badge className="bg-emerald-100 text-emerald-800">
                        <Zap className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                          {parseFloat(user.usdtBalance).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          ≈ ₦{(parseFloat(user.usdtBalance) * 1485).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
                          <ArrowDownLeft className="mr-2 h-4 w-4" />
                          Receive
                        </Button>
                        <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 flex-1">
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Send
                        </Button>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Current Rate</span>
                          <span className="font-semibold text-emerald-600">₦1,485/USDT</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-900 flex items-center">
                        <div className="p-2 bg-blue-50 rounded-lg mr-3">
                          <WalletIcon className="h-5 w-5 text-primary" />
                        </div>
                        Naira Balance
                      </CardTitle>
                      <Badge className="bg-blue-100 text-blue-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Secured
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                          ₦{parseFloat(user.nairaBalance).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Available for trading</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          onClick={() => setShowDeposit(true)}
                          className="bg-primary hover:bg-primary/90 flex-1"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Deposit
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setShowWithdraw(true)}
                          className="border-primary text-primary hover:bg-primary/5 flex-1"
                        >
                          <Minus className="mr-2 h-4 w-4" />
                          Withdraw
                        </Button>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Daily Limit</span>
                          <span className="font-semibold">₦5,000,000</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 flex items-center">
                    <Smartphone className="h-5 w-5 mr-2 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button variant="outline" className="flex flex-col h-20 p-4" onClick={() => setShowDeposit(true)}>
                      <Plus className="h-5 w-5 mb-2 text-emerald-600" />
                      <span className="text-xs">Add Funds</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-20 p-4" onClick={() => setShowWithdraw(true)}>
                      <Minus className="h-5 w-5 mb-2 text-red-600" />
                      <span className="text-xs">Withdraw</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-20 p-4">
                      <ArrowLeftRight className="h-5 w-5 mb-2 text-blue-600" />
                      <span className="text-xs">Convert</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-20 p-4" onClick={() => refetch()}>
                      <RefreshCw className="h-5 w-5 mb-2 text-gray-600" />
                      <span className="text-xs">Refresh</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* TRON Wallet Section */}
              <TronWallet />

              {/* Transaction History - Enhanced */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-900 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-primary" />
                      Recent Transactions
                    </CardTitle>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <WalletIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                      <p className="text-gray-500 mb-6">Start trading to see your transaction history</p>
                      <Button onClick={() => setShowDeposit(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Make First Deposit
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                          <div className="flex items-center flex-1">
                            <div className={`p-3 rounded-xl mr-4 ${
                              transaction.type === "deposit" 
                                ? "bg-emerald-50" 
                                : "bg-red-50"
                            }`}>
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-gray-900 text-sm sm:text-base capitalize">
                                  {transaction.type}
                                </p>
                                <span className={`font-bold text-sm sm:text-base ${
                                  transaction.type === "deposit" ? "text-emerald-600" : "text-red-600"
                                }`}>
                                  {transaction.type === "deposit" ? "+" : "-"}₦{parseFloat(transaction.amount).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {transaction.type === "deposit" ? "Bank Transfer" : "Bank Withdrawal"}
                                </p>
                                {getTransactionBadge(transaction.status)}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {transactions.length > 3 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View {transactions.length - 3} More Transactions
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <DepositModal open={showDeposit} onOpenChange={setShowDeposit} />
      <WithdrawModal open={showWithdraw} onOpenChange={setShowWithdraw} />
    </div>
  );
}
