
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
  Activity,
  BarChart3,
  Zap,
  Shield
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
      value: parseFloat(user.usdtBalance || "0").toFixed(2),
      subtitle: `≈ ₦${(parseFloat(user.usdtBalance || "0") * 1485).toLocaleString()}`,
      icon: Wallet,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: "+12.5%",
      trend: "up"
    },
    {
      title: "Naira Balance",
      value: `₦${parseFloat(user.nairaBalance || "0").toLocaleString()}`,
      subtitle: "Available for trading",
      icon: Coins,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+8.2%",
      trend: "up"
    },
    {
      title: "Active Trades",
      value: "3",
      subtitle: "In progress",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "2 new",
      trend: "neutral"
    },
    {
      title: "Rating",
      value: `${parseFloat(user.averageRating || "0").toFixed(1)}/5`,
      subtitle: `${user.ratingCount || 0} reviews`,
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      change: "+0.3",
      trend: "up"
    },
  ];

  const quickActions = [
    {
      title: "Browse Offers",
      description: "Find the best deals",
      icon: Store,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      action: () => setLocation("/marketplace"),
    },
    {
      title: "Create Offer",
      description: "Start trading now",
      icon: PlusCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      action: () => setShowCreateOffer(true),
    },
    {
      title: "Deposit Funds",
      description: "Add money to wallet",
      icon: CreditCard,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      action: () => setLocation("/wallet"),
    },
    {
      title: "My Trades",
      description: "View trade history",
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
      amount: "+₦742,500",
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      type: "deposit",
      title: "Deposit Confirmed",
      description: "₦50,000 added to your account",
      time: "1 day ago",
      amount: "+₦50,000",
      icon: Plus,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      type: "pending",
      title: "Trade Initiated",
      description: "Buying 200 USDT from @seller456",
      time: "2 days ago",
      amount: "₦297,000",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const insights = [
    {
      title: "Weekly Volume",
      value: "₦2.4M",
      change: "+24%",
      icon: BarChart3,
      color: "text-blue-600"
    },
    {
      title: "Success Rate",
      value: "98.5%",
      change: "+2.1%",
      icon: Shield,
      color: "text-emerald-600"
    },
    {
      title: "Avg. Trade Time",
      value: "12 min",
      change: "-3 min",
      icon: Zap,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Welcome Header - Modernized */}
          <div className="relative overflow-hidden bg-gradient-to-r from-primary via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome back, {user.email.split('@')[0]}!</h1>
                <p className="text-blue-100 text-sm opacity-90">Ready to make some profitable trades today?</p>
              </div>
              <div className="hidden sm:flex items-center space-x-4">
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1">
                  <Activity className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview - Enhanced */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stat.trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 
                      stat.trend === 'down' ? 'text-red-600 bg-red-50' : 
                      'text-gray-600 bg-gray-50'
                    }`}>
                      {stat.change}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions - Redesigned */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="flex items-start p-6 h-auto bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-300 rounded-xl border border-gray-100"
                        onClick={action.action}
                      >
                        <div className={`p-3 ${action.bgColor} rounded-lg mr-4 flex-shrink-0`}>
                          <action.icon className={`h-6 w-6 ${action.color}`} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trading Insights */}
            <div>
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">Trading Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <insight.icon className={`h-5 w-5 ${insight.color} mr-3`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                          <p className="text-lg font-bold text-gray-900">{insight.value}</p>
                        </div>
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                        insight.change.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 
                        insight.change.startsWith('-') ? 'text-red-600 bg-red-50' : 
                        'text-gray-600 bg-gray-50'
                      }`}>
                        {insight.change}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity - Enhanced */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 border border-gray-100">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className={`p-3 ${activity.bgColor} rounded-lg flex-shrink-0`}>
                        <activity.icon className={`h-5 w-5 ${activity.color}`} />
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900 text-sm">{activity.title}</p>
                          <span className="text-sm font-medium text-gray-900">{activity.amount}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <CreateOfferModal 
        open={showCreateOffer} 
        onOpenChange={setShowCreateOffer} 
      />
    </div>
  );
}
