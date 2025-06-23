
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Activity, 
  DollarSign, 
  CreditCard, 
  Star, 
  Shield, 
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  Wallet,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface Trade {
  id: number;
  amount: string;
  rate: string;
  status: string;
  createdAt: string;
  buyer?: { email: string };
  seller?: { email: string };
}

interface UserDetails {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  kycVerified: boolean;
  nairaBalance?: string;
  usdtBalance?: string;
  averageRating: string;
  ratingCount: number;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export function UserDetailModal({ isOpen, onClose, userId, userName }: UserDetailModalProps) {
  const { data: userDetails, isLoading: userLoading } = useQuery<UserDetails>({
    queryKey: [`/api/users/${userId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user details");
      return response.json();
    },
    enabled: isOpen && userId > 0,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: [`/api/admin/users/${userId}/transactions`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/users/${userId}/transactions`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
    enabled: isOpen && userId > 0,
  });

  const { data: trades = [], isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: [`/api/admin/users/${userId}/trades`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/users/${userId}/trades`);
      if (!response.ok) throw new Error("Failed to fetch trades");
      return response.json();
    },
    enabled: isOpen && userId > 0,
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      disputed: "bg-orange-100 text-orange-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      failed: "bg-red-100 text-red-800"
    };
    return <Badge className={`text-xs ${colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </Badge>;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
      case "credit":
      case "transfer_in":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "withdrawal":
      case "debit":
      case "transfer_out":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatAmount = (amount: string, type?: string) => {
    const isNegative = type && ["withdrawal", "debit", "transfer_out"].includes(type);
    const numAmount = parseFloat(amount || "0");
    const formatted = numAmount.toLocaleString();
    return isNegative ? `-₦${formatted}` : `₦${formatted}`;
  };

  const formatUSDTAmount = (amount: string) => {
    const numAmount = parseFloat(amount || "0");
    return `$${numAmount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const completedTrades = trades.filter(t => t.status === 'completed').length;
  const totalVolume = trades
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (parseFloat(t.amount) * parseFloat(t.rate)), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] w-[95vw] sm:w-full overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 p-3 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogTitle className="flex items-center justify-between text-base sm:text-xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-sm sm:text-base">{userName}</span>
                <p className="text-xs sm:text-sm text-gray-600 font-normal">User Profile & Activity</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {userLoading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="text-center">
              <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mx-auto mb-2 sm:mb-3" />
              <p className="text-sm sm:text-base text-gray-600">Loading user details...</p>
            </div>
          </div>
        ) : userDetails ? (
          <div className="flex-1 overflow-hidden min-h-0">
            <Tabs defaultValue="overview" className="h-full flex flex-col">
              <TabsList className="flex-shrink-0 grid w-full grid-cols-4 mx-3 sm:mx-6 mt-2 sm:mt-4">
                <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4">Overview</TabsTrigger>
                <TabsTrigger value="wallet" className="text-xs sm:text-sm px-2 sm:px-4">Wallet</TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs sm:text-sm px-2 sm:px-4">Transactions</TabsTrigger>
                <TabsTrigger value="trades" className="text-xs sm:text-sm px-2 sm:px-4">Trades</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex-1 overflow-auto px-3 sm:px-6 pb-4 sm:pb-6 mt-2 sm:mt-4 min-h-0">
                <Card className="shadow-sm h-full">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px] sm:h-[400px]">
                      <div className="space-y-3 sm:space-y-4 p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-600">Email</p>
                                <p className="text-sm font-medium truncate">{userDetails.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-600">Full Name</p>
                                <p className="text-sm font-medium">
                                  {userDetails.firstName && userDetails.lastName 
                                    ? `${userDetails.firstName} ${userDetails.lastName}`
                                    : userDetails.username || "Not set"
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-600">Phone</p>
                                <p className="text-sm font-medium">{userDetails.phone && userDetails.phone !== "" ? userDetails.phone : "Not set"}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-600">Location</p>
                                <p className="text-sm font-medium">{userDetails.location && userDetails.location !== "" ? userDetails.location : "Not set"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-600">KYC Status</p>
                                {userDetails.kycVerified ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-600">Rating</p>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                  <span className="text-sm font-medium">
                                    {parseFloat(userDetails.averageRating).toFixed(1)} ({userDetails.ratingCount})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status and Join Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Status</p>
                            <Badge className={userDetails.isOnline ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {userDetails.isOnline ? "Online" : "Offline"}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Member Since</p>
                            <p className="text-sm font-medium">{formatDate(userDetails.createdAt)}</p>
                          </div>
                        </div>

                        {/* Trading Stats */}
                        <div className="pt-3 sm:pt-4 border-t">
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="h-4 w-4" />
                            <span className="text-sm font-medium">Trading Statistics</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="text-center p-2 sm:p-4 bg-blue-50 rounded-lg">
                              <p className="text-lg sm:text-2xl font-bold text-blue-600">{trades.length}</p>
                              <p className="text-xs sm:text-sm text-blue-700">Total Trades</p>
                            </div>
                            <div className="text-center p-2 sm:p-4 bg-green-50 rounded-lg">
                              <p className="text-lg sm:text-2xl font-bold text-green-600">{completedTrades}</p>
                              <p className="text-xs sm:text-sm text-green-700">Completed</p>
                            </div>
                            <div className="text-center p-2 sm:p-4 bg-purple-50 rounded-lg">
                              <p className="text-sm sm:text-2xl font-bold text-purple-600">₦{totalVolume.toLocaleString()}</p>
                              <p className="text-xs sm:text-sm text-purple-700">Total Volume</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="wallet" className="flex-1 overflow-auto px-3 sm:px-6 pb-4 sm:pb-6 mt-2 sm:mt-4 min-h-0">
                <Card className="shadow-sm h-full">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Wallet Balances
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px] sm:h-[400px]">
                      <div className="space-y-3 sm:space-y-4 p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Naira Balance */}
                          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-200 rounded-full">
                                  <DollarSign className="h-4 w-4 text-green-700" />
                                </div>
                                <span className="text-sm font-medium text-green-700">Naira Balance</span>
                              </div>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-green-800">
                              {formatAmount(userDetails.nairaBalance || "0")}
                            </p>
                            <p className="text-xs text-green-600 mt-1">Nigerian Naira</p>
                          </div>

                          {/* USDT Balance */}
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-200 rounded-full">
                                  <CreditCard className="h-4 w-4 text-blue-700" />
                                </div>
                                <span className="text-sm font-medium text-blue-700">USDT Balance</span>
                              </div>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-blue-800">
                              {formatUSDTAmount(userDetails.usdtBalance || "0")}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">Tether USD</p>
                          </div>
                        </div>

                        {/* Total Portfolio Value */}
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-purple-200 rounded-full">
                              <TrendingUp className="h-4 w-4 text-purple-700" />
                            </div>
                            <span className="text-sm font-medium text-purple-700">Total Portfolio Value</span>
                          </div>
                          <p className="text-xl sm:text-2xl font-bold text-purple-800">
                            {formatAmount((parseFloat(userDetails.nairaBalance || "0") + (parseFloat(userDetails.usdtBalance || "0") * 1600)).toString())}
                          </p>
                          <p className="text-xs text-purple-600">Estimated at ₦1,600/USDT</p>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="flex-1 overflow-auto px-3 sm:px-6 pb-4 sm:pb-6 mt-2 sm:mt-4 min-h-0">
                <Card className="shadow-sm h-full">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Recent Transactions ({transactions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px] sm:h-[400px]">
                      {transactionsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin" />
                        </div>
                      ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No transactions found</p>
                        </div>
                      ) : (
                        <div className="space-y-2 p-4">
                          {transactions.map((transaction) => (
                            <div key={transaction.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                              {getTransactionIcon(transaction.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium capitalize">
                                  {transaction.type.replace('_', ' ')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(transaction.created_at)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-medium ${
                                  ["withdrawal", "debit", "transfer_out"].includes(transaction.type)
                                    ? "text-red-600" 
                                    : "text-green-600"
                                }`}>
                                  {formatAmount(transaction.amount, transaction.type)}
                                </p>
                                {getStatusBadge(transaction.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trades" className="flex-1 overflow-auto px-3 sm:px-6 pb-4 sm:pb-6 mt-2 sm:mt-4 min-h-0">
                <Card className="shadow-sm h-full">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Trading History ({trades.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px] sm:h-[400px]">
                      {tradesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin" />
                        </div>
                      ) : trades.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No trades found</p>
                        </div>
                      ) : (
                        <div className="space-y-2 p-4">
                          {trades.map((trade) => (
                            <div key={trade.id} className="border rounded-lg p-3 hover:bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">
                                  T{trade.id.toString().padStart(3, '0')}
                                </span>
                                {getStatusBadge(trade.status)}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-600">Amount:</span>
                                  <p className="font-medium">{parseFloat(trade.amount).toFixed(2)} USDT</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Rate:</span>
                                  <p className="font-medium">₦{parseFloat(trade.rate).toLocaleString()}</p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                {formatDate(trade.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Failed to load user details</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
