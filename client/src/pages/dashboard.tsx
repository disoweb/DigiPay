import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
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
  Clock
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
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Naira Balance",
      value: `₦${parseFloat(user.nairaBalance).toLocaleString()}`,
      subtitle: "Available for trading",
      icon: Coins,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Trades",
      value: "3",
      subtitle: "In progress",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Rating",
      value: `${user.averageRating}/5`,
      subtitle: `${user.ratingCount} reviews`,
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  const quickActions = [
    {
      title: "Browse Offers",
      icon: Store,
      color: "text-blue-600",
      action: () => setLocation("/marketplace"),
    },
    {
      title: "Create Offer",
      icon: PlusCircle,
      color: "text-green-600",
      action: () => setShowCreateOffer(true),
    },
    {
      title: "Deposit Funds",
      icon: CreditCard,
      color: "text-orange-600",
      action: () => setLocation("/wallet"),
    },
    {
      title: "My Trades",
      icon: ArrowLeftRight,
      color: "text-red-600",
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
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      type: "deposit",
      title: "Deposit Confirmed",
      description: "₦50,000 added to your account",
      time: "1 day ago",
      icon: Plus,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      type: "pending",
      title: "Trade Initiated",
      description: "Buying 200 USDT from @seller456",
      time: "2 days ago",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold">Welcome back, {user.email.split('@')[0]}!</h1>
            <p className="text-blue-100 mt-2">Manage your trades and monitor your portfolio</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="flex flex-col items-center p-4 h-auto bg-gray-50 hover:bg-gray-100"
                    onClick={action.action}
                  >
                    <action.icon className={`h-8 w-8 ${action.color} mb-2`} />
                    <span className="text-sm font-medium">{action.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`p-2 ${activity.bgColor} rounded-lg`}>
                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
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
