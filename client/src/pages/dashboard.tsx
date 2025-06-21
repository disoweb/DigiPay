
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateOfferModal } from "@/components/create-offer-modal";
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Wallet, 
  Coins, 
  TrendingUp, 
  Star, 
  Store, 
  PlusCircle, 
  CreditCard, 
  ArrowLeftRight,
  CheckCircle,
  Plus,
  Clock,
  ArrowUpRight,
  Activity,
  Eye,
  Users,
  Target
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateOffer, setShowCreateOffer] = useState(false);

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });

  if (!user) return null;

  const stats = [
    {
      title: "USDT Balance",
      value: parseFloat(user.usdtBalance).toFixed(2),
      subtitle: `≈ ₦${(parseFloat(user.usdtBalance) * 1485).toLocaleString()}`,
      icon: Wallet,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      change: "+5.2%",
      isPositive: true
    },
    {
      title: "Naira Balance",
      value: `₦${parseFloat(user.nairaBalance).toLocaleString()}`,
      subtitle: "Available for trading",
      icon: Coins,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      change: "+2.1%",
      isPositive: true
    },
    {
      title: "Active Trades",
      value: "3",
      subtitle: "In progress",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      change: "2 new",
      isPositive: true
    },
    {
      title: "Rating",
      value: `${user.averageRating}/5`,
      subtitle: `${user.ratingCount} reviews`,
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      change: "+0.1",
      isPositive: true
    },
  ];

  const quickActions = [
    {
      title: "Browse Market",
      description: "Find the best deals",
      icon: Store,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      action: () => setLocation("/marketplace"),
    },
    {
      title: "Create Offer",
      description: "Start selling/buying",
      icon: PlusCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      action: () => setShowCreateOffer(true),
    },
    {
      title: "Add Funds",
      description: "Deposit money",
      icon: CreditCard,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      action: () => setLocation("/wallet"),
    },
    {
      title: "Trade History",
      description: "View all trades",
      icon: ArrowLeftRight,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      action: () => setLocation("/trades"),
    },
  ];

  const recentActivities = [
    {
      type: "completed",
      title: "Trade Completed",
      description: "Sold 500 USDT to @trader123",
      time: "2 hours ago",
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      amount: "+₦742,500"
    },
    {
      type: "deposit",
      title: "Deposit Confirmed",
      description: "Bank transfer processed",
      time: "1 day ago",
      icon: Plus,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      amount: "+₦50,000"
    },
    {
      type: "pending",
      title: "Trade Initiated",
      description: "Buying 200 USDT from @seller456",
      time: "2 days ago",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      amount: "₦297,000"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Welcome Header - Mobile Optimized */}
          <div className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.1%22%3E%3Ccircle%20cx=%227%22%20cy=%227%22%20r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                    Welcome back, {user.email.split('@')[0]}! 👋
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-base">
                    Manage your trades and monitor your portfolio
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                  <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <Activity className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview - Mobile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className={`border-0 shadow-sm hover:shadow-md transition-all duration-200 ${stat.borderColor} border-l-4`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className={`p-2 ${stat.bgColor} rounded-lg mr-3`}>
                          <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions - Mobile First */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl text-gray-900 flex items-center">
                <Target className="h-5 w-5 mr-2 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="flex flex-col items-start p-4 sm:p-6 h-auto bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-primary/20 transition-all duration-200 group"
                    onClick={action.action}
                  >
                    <div className={`p-3 ${action.bgColor} rounded-xl mb-3 group-hover:scale-110 transition-transform duration-200`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <div className="text-left">
                      <span className="text-sm sm:text-base font-semibold text-gray-900 block">{action.title}</span>
                      <span className="text-xs sm:text-sm text-gray-600">{action.description}</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto mt-2 group-hover:text-primary transition-colors" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity - Enhanced Design */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Recent Activity
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/trades")}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center flex-1">
                      <div className={`p-3 ${activity.bgColor} rounded-xl mr-4`}>
                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">{activity.title}</p>
                          <span className="text-sm font-semibold text-gray-900 ml-4">{activity.amount}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{activity.description}</p>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trading Insights - New Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-emerald-600" />
                  Market Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">USDT/NGN Rate</span>
                    <span className="font-semibold text-emerald-600">₦1,485.00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Active Offers</span>
                    <span className="font-semibold">847</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Online Traders</span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
                      <span className="font-semibold">1,234</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Your Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Trades</span>
                    <span className="font-semibold">127</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-semibold text-emerald-600">98.4%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Avg. Response</span>
                    <span className="font-semibold">2.3 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <CreateOfferModal 
        open={showCreateOffer} 
        onOpenChange={setShowCreateOffer} 
      />
    </div>
  );
}
