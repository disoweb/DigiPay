import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
  const { user } = useAuth();
  const [selectedTrade, setSelectedTrade] = useState<EnrichedTrade | null>(null);

  const { data: trades = [], isLoading } = useQuery<EnrichedTrade[]>({
    queryKey: ["/api/trades"],
  });

  const { data: myOffers = [], isLoading: offersLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/offers`],
    enabled: !!user?.id,
  });

  const activeTrades = trades.filter(trade => trade.status === "pending");
  const completedTrades = trades.filter(trade => trade.status === "completed");
  const cancelledTrades = trades.filter(trade => trade.status === "cancelled");
  const activeOffers = myOffers.filter((offer: any) => offer.status === "active");
  const inactiveOffers = myOffers.filter((offer: any) => offer.status !== "active");

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
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-sm hover:bg-white group" onClick={() => setSelectedTrade(trade)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
              trade.status === 'pending' ? 'bg-orange-50' :
              trade.status === 'completed' ? 'bg-green-50' :
              trade.status === 'cancelled' ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              {getStatusIcon(trade.status)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {trade.offer?.type === "sell" ? "Buy" : "Sell"} {parseFloat(trade.amount).toFixed(2)} USDT
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                Rate: ₦{parseFloat(trade.rate).toLocaleString()}/USDT
              </p>
              <p className="text-xs text-gray-500">
                {new Date(trade.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(trade.status)}
            <p className="text-lg font-bold text-gray-900 mt-2">
              ₦{(parseFloat(trade.amount) * parseFloat(trade.rate)).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium">
              <Clock className="w-4 h-4 mr-2" />
              {activeTrades.length} Active Trades
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Trade Management</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Monitor your ongoing trades and review completed transactions
            </p>
          </div>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <Tabs defaultValue="active" className="w-full">
              <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <TabsList className="h-14 p-2 bg-transparent w-full justify-start rounded-none border-b-0 gap-1">
                  <TabsTrigger 
                    value="active" 
                    className="rounded-lg border-b-0 data-[state=active]:bg-white data-[state=active]:shadow-md px-6 py-2 font-medium"
                  >
                    Active Trades ({activeTrades.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="my-offers"
                    className="rounded-lg border-b-0 data-[state=active]:bg-white data-[state=active]:shadow-md px-6 py-2 font-medium"
                  >
                    My Offers ({activeOffers.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="completed"
                    className="rounded-lg border-b-0 data-[state=active]:bg-white data-[state=active]:shadow-md px-6 py-2 font-medium"
                  >
                    Completed ({completedTrades.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="cancelled"
                    className="rounded-lg border-b-0 data-[state=active]:bg-white data-[state=active]:shadow-md px-6 py-2 font-medium"
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

              <TabsContent value="my-offers" className="p-6 mt-0">
                {offersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : activeOffers.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No active offers</p>
                    <p className="text-sm text-gray-400 mt-2">Your buy/sell orders will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOffers.map((offer: any) => (
                      <Card key={offer.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-xl ${
                                offer.type === 'buy' ? 'bg-green-50' : 'bg-red-50'
                              }`}>
                                <Shield className={`h-4 w-4 ${
                                  offer.type === 'buy' ? 'text-green-600' : 'text-red-600'
                                }`} />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 text-lg">
                                  {offer.type === "buy" ? "Buy" : "Sell"} {parseFloat(offer.amount).toFixed(2)} USDT
                                </h3>
                                <p className="text-sm text-gray-600 font-medium">
                                  Rate: ₦{parseFloat(offer.rate).toLocaleString()}/USDT
                                </p>
                                <p className="text-xs text-gray-500">
                                  Created: {new Date(offer.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Active Offer
                              </Badge>
                              <p className="text-lg font-bold text-gray-900 mt-2">
                                ₦{(parseFloat(offer.amount) * parseFloat(offer.rate)).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
