import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { RealTimeChat } from "@/components/real-time-chat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Shield, CheckCircle, XCircle } from "lucide-react";
import type { Trade } from "@shared/schema";

type EnrichedTrade = Trade & {
  offer: any;
  buyer: { id: number; email: string } | null;
  seller: { id: number; email: string } | null;
};

export default function Trades() {
  const [selectedTrade, setSelectedTrade] = useState<EnrichedTrade | null>(null);

  const { data: trades = [], isLoading } = useQuery<EnrichedTrade[]>({
    queryKey: ["/api/trades"],
  });

  const activeTrades = trades.filter(trade => trade.status === "pending");
  const completedTrades = trades.filter(trade => trade.status === "completed");
  const cancelledTrades = trades.filter(trade => trade.status === "cancelled");

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "disputed":
        return <Shield className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const TradeCard = ({ trade }: { trade: EnrichedTrade }) => (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTrade(trade)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gray-50 rounded-lg">
              {getStatusIcon(trade.status)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {trade.offer?.type === "sell" ? "Buy" : "Sell"} {parseFloat(trade.amount).toFixed(2)} USDT
              </h3>
              <p className="text-sm text-gray-600">
                Rate: ₦{parseFloat(trade.rate).toLocaleString()}/USDT
              </p>
              <p className="text-sm text-gray-500">
                {new Date(trade.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(trade.status)}
            <p className="text-sm text-gray-600 mt-1">
              ₦{(parseFloat(trade.amount) * parseFloat(trade.rate)).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Trades</h1>
            <p className="text-gray-600 mt-1">Track your ongoing and completed trades</p>
          </div>

          <Card className="border-0 shadow-sm">
            <Tabs defaultValue="active" className="w-full">
              <div className="border-b border-gray-200">
                <TabsList className="h-12 p-0 bg-transparent w-full justify-start rounded-none border-b-0">
                  <TabsTrigger 
                    value="active" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Active Trades ({activeTrades.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="completed"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Completed ({completedTrades.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="cancelled"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Cancelled ({cancelledTrades.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="active" className="p-6 mt-0">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : activeTrades.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No active trades</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeTrades.map((trade) => (
                      <TradeCard key={trade.id} trade={trade} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="p-6 mt-0">
                {completedTrades.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No completed trades</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedTrades.map((trade) => (
                      <TradeCard key={trade.id} trade={trade} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="p-6 mt-0">
                {cancelledTrades.length === 0 ? (
                  <div className="text-center py-8">
                    <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No cancelled trades</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cancelledTrades.map((trade) => (
                      <TradeCard key={trade.id} trade={trade} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>

      {/* Trade Details Modal */}
      <Dialog open={!!selectedTrade} onOpenChange={(open) => !open && setSelectedTrade(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTrade && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Trade Details - T{selectedTrade.id.toString().padStart(3, '0')}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trade Information */}
                <div className="space-y-6">
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Trade Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">
                            {selectedTrade.offer?.type === "sell" ? "Buy" : "Sell"} USDT
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-medium">{parseFloat(selectedTrade.amount).toFixed(2)} USDT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rate:</span>
                          <span className="font-medium">₦{parseFloat(selectedTrade.rate).toLocaleString()}/USDT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium">
                            ₦{(parseFloat(selectedTrade.amount) * parseFloat(selectedTrade.rate)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          {getStatusBadge(selectedTrade.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedTrade.status === "pending" && (
                    <Card className="bg-blue-50">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Payment Instructions</h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">
                            Transfer ₦{(parseFloat(selectedTrade.amount) * parseFloat(selectedTrade.rate)).toLocaleString()} to:
                          </p>
                          <div className="bg-white rounded p-3 border">
                            <p><strong>Bank:</strong> GTBank</p>
                            <p><strong>Account:</strong> 0123456789</p>
                            <p><strong>Name:</strong> John Seller</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            After payment, click "Mark as Paid" and upload proof of payment.
                          </p>
                        </div>
                        <div className="mt-4 space-y-2">
                          <Button className="w-full bg-green-600 hover:bg-green-700">
                            Mark as Paid
                          </Button>
                          <Button variant="destructive" className="w-full">
                            Cancel Trade
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Chat Section */}
                <div className="h-96">
                  <RealTimeChat tradeId={selectedTrade.id} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
