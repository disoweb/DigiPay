import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Handshake, AlertTriangle, Shield } from "lucide-react";
import { useLocation } from "wouter";
import type { Trade } from "@shared/schema";

type EnrichedTrade = Trade & {
  buyer: { id: number; email: string } | null;
  seller: { id: number; email: string } | null;
  offer: any;
};

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if not admin
  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  const { data: trades = [] } = useQuery<EnrichedTrade[]>({
    queryKey: ["/api/admin/trades"],
  });

  const resolveTradeMutation = useMutation({
    mutationFn: async ({ tradeId, action }: { tradeId: number; action: "release" | "refund" }) => {
      await apiRequest("PATCH", `/api/admin/trades/${tradeId}/resolve`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trades"] });
      toast({
        title: "Success",
        description: "Trade resolved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve trade",
        variant: "destructive",
      });
    },
  });

  const disputedTrades = trades.filter(trade => trade.status === "disputed");
  const activeTrades = trades.filter(trade => trade.status === "pending");

  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Trades",
      value: activeTrades.length.toString(),
      icon: Handshake,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Disputes",
      value: disputedTrades.length.toString(),
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Escrow Volume",
      value: "15,678 USDT",
      icon: Shield,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Cancelled</Badge>;
      case "disputed":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Disputed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center bg-red-100 text-red-800 rounded-full px-3 py-1 text-sm font-medium">
              <Shield className="w-4 h-4 mr-2" />
              Admin Access
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Platform Management</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Monitor system health, resolve disputes, and oversee platform operations
            </p>
          </div>

          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Disputes Table */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                Pending Disputes
              </h3>
            </div>
            <CardContent className="p-0">
              {disputedTrades.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No pending disputes</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trade ID</TableHead>
                      <TableHead>Parties</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputedTrades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell className="font-medium">
                          T{trade.id.toString().padStart(3, '0')}
                        </TableCell>
                        <TableCell>
                          {trade.buyer?.email} vs {trade.seller?.email}
                        </TableCell>
                        <TableCell>{parseFloat(trade.amount).toFixed(2)} USDT</TableCell>
                        <TableCell>{getStatusBadge(trade.status)}</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => resolveTradeMutation.mutate({ 
                              tradeId: trade.id, 
                              action: "release" 
                            })}
                            disabled={resolveTradeMutation.isPending}
                          >
                            Release
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => resolveTradeMutation.mutate({ 
                              tradeId: trade.id, 
                              action: "refund" 
                            })}
                            disabled={resolveTradeMutation.isPending}
                          >
                            Refund
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* All Trades Table */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Handshake className="h-5 w-5 mr-2 text-blue-600" />
                All Trades
              </h3>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trade ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.slice(0, 10).map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">
                        T{trade.id.toString().padStart(3, '0')}
                      </TableCell>
                      <TableCell className="capitalize">
                        {trade.offer?.type || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Buyer: {trade.buyer?.email || "N/A"}</div>
                          <div>Seller: {trade.seller?.email || "N/A"}</div>
                        </div>
                      </TableCell>
                      <TableCell>{parseFloat(trade.amount).toFixed(2)} USDT</TableCell>
                      <TableCell>₦{parseFloat(trade.rate).toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(trade.status)}</TableCell>
                      <TableCell>
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
