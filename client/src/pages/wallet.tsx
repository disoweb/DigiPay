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
import { Plus, Minus, DollarSign, Coins, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Wallet as WalletIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Transaction } from "@shared/schema";

export default function Wallet() {
  const { user } = useAuth();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

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
                    ₦{(parseFloat(user.nairaBalance || "0") + (parseFloat(user.usdtBalance || "0") * 1485)).toLocaleString()}
                  </p>
                  <div className="flex justify-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="text-blue-100">USDT</p>
                      <p className="font-semibold">{parseFloat(user.usdtBalance || "0").toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-100">NGN</p>
                      <p className="font-semibold">₦{parseFloat(user.nairaBalance || "0").toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <p className="text-xs text-gray-500">Tether USD</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      Active
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

                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 h-9">
                      Receive
                    </Button>
                    <Button size="sm" variant="outline" className="h-9">
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
            </div>
          </div>

          {/* TRON Wallet Section */}
          <div className="mt-8">
            <TronWallet />
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
    </div>
  );
}