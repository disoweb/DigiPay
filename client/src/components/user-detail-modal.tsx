
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
  X
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
  kycVerified: boolean;
  nairaBalance: string;
  usdtBalance: string;
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

  const formatAmount = (amount: string, type: string) => {
    const isNegative = ["withdrawal", "debit", "transfer_out"].includes(type);
    const formatted = parseFloat(amount).toLocaleString();
    return isNegative ? `-₦${formatted}` : `+₦${formatted}`;
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {userName} - User Details
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {userLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : userDetails ? (
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="overview" className="h-full flex flex-col">
              <TabsList className="flex-shrink-0 grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="trades">Trades</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex-1 overflow-auto space-y-4 mt-4">
                {/* User Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="text-sm font-medium">{userDetails.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Username:</span>
                        <span className="text-sm font-medium">{userDetails.username || "Not set"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Full Name:</span>
                        <span className="text-sm font-medium">
                          {userDetails.firstName && userDetails.lastName 
                            ? `${userDetails.firstName} ${userDetails.lastName}`
                            : "Not set"
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="text-sm font-medium">{userDetails.phone || "Not set"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">KYC Status:</span>
                        {userDetails.kycVerified ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">
                            {parseFloat(userDetails.averageRating).toFixed(1)} ({userDetails.ratingCount})
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge className={userDetails.isOnline ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {userDetails.isOnline ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Joined:</span>
                        <span className="text-sm font-medium">{formatDate(userDetails.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Wallet Balance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-green-700">Naira Balance</span>
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-lg font-bold text-green-800">
                          ₦{parseFloat(userDetails.nairaBalance).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-blue-700">USDT Balance</span>
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-lg font-bold text-blue-800">
                          ${parseFloat(userDetails.usdtBalance).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Trading Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Trading Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{trades.length}</p>
                        <p className="text-sm text-blue-700">Total Trades</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{completedTrades}</p>
                        <p className="text-sm text-green-700">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">₦{totalVolume.toLocaleString()}</p>
                        <p className="text-sm text-purple-700">Total Volume</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="flex-1 overflow-auto mt-4">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Recent Transactions ({transactions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                      {transactionsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin" />
                        </div>
                      ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No transactions found
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getTransactionIcon(transaction.type)}
                                    <span className="capitalize text-sm">
                                      {transaction.type.replace('_', ' ')}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className={`font-medium ${
                                    ["withdrawal", "debit", "transfer_out"].includes(transaction.type)
                                      ? "text-red-600" 
                                      : "text-green-600"
                                  }`}>
                                    {formatAmount(transaction.amount, transaction.type)}
                                  </span>
                                </TableCell>
                                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(transaction.created_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trades" className="flex-1 overflow-auto mt-4">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Trading History ({trades.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                      {tradesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin" />
                        </div>
                      ) : trades.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No trades found
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Rate</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {trades.map((trade) => (
                              <TableRow key={trade.id}>
                                <TableCell className="font-medium">
                                  T{trade.id.toString().padStart(3, '0')}
                                </TableCell>
                                <TableCell>{parseFloat(trade.amount).toFixed(2)} USDT</TableCell>
                                <TableCell>₦{parseFloat(trade.rate).toLocaleString()}</TableCell>
                                <TableCell>{getStatusBadge(trade.status)}</TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(trade.createdAt)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="flex-1 overflow-auto mt-4">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((transaction, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          {getTransactionIcon(transaction.type)}
                          <div className="flex-1">
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load user details
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
