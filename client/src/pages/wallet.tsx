import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { DepositModal } from "@/components/deposit-modal";
import { WithdrawModal } from "@/components/withdraw-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet as WalletIcon, Coins, ArrowDown, ArrowUp } from "lucide-react";
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
      <ArrowDown className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUp className="h-4 w-4 text-red-600" />
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
            <p className="text-gray-600 mt-1">Manage your deposits and withdrawals</p>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">USDT Balance</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {parseFloat(user.usdtBalance).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      ≈ ₦{(parseFloat(user.usdtBalance) * 1485).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Coins className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    Receive USDT
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    Send USDT
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Naira Balance</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      ₦{parseFloat(user.nairaBalance).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Available for trading</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <WalletIcon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button 
                    onClick={() => setShowDeposit(true)}
                    className="flex-1"
                  >
                    Deposit
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => setShowWithdraw(true)}
                    className="flex-1"
                  >
                    Withdraw
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card className="border-0 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            </div>
            <CardContent className="p-6">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <WalletIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-gray-900 capitalize">
                            {transaction.type}
                          </p>
                          <p className="text-sm text-gray-600">
                            {transaction.type === "deposit" ? "Paystack" : "Bank Transfer"} • {getTransactionBadge(transaction.status)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === "deposit" ? "text-green-600" : "text-red-600"
                        }`}>
                          {transaction.type === "deposit" ? "+" : "-"}₦{parseFloat(transaction.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <DepositModal open={showDeposit} onOpenChange={setShowDeposit} />
      <WithdrawModal open={showWithdraw} onOpenChange={setShowWithdraw} />
    </div>
  );
}
