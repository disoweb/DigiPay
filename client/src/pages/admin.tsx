import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Handshake, AlertTriangle, Shield, Star, TrendingUp, Award, Crown, RefreshCw, AlertCircle, Search, Filter, ChevronRight, Mail, Phone, CheckCircle, XCircle, MoreVertical, Eye, Edit, UserX, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { UserDetailModal } from "@/components/user-detail-modal";
import type { Trade } from "@shared/schema";

type EnrichedTrade = Trade & {
  buyer: { id: number; email: string } | null;
  seller: { id: number; email: string } | null;
  offer: any;
};

export default function Admin() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!user?.isAdmin) {
    console.log("Non-admin user attempting to access admin:", user);
    setLocation("/dashboard");
    return null;
  }

  const { data: trades = [] } = useQuery<EnrichedTrade[]>({
    queryKey: ["/api/admin/trades"],
    enabled: !!user?.isAdmin,
  });

  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    enabled: !!user?.isAdmin,
    retry: 3,
    retryDelay: 1000,
  });



  const { data: featuredUsers = [], isLoading: featuredLoading, error: featuredError } = useQuery({
    queryKey: ["/api/admin/featured-users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/featured-users");
      if (!response.ok) {
        throw new Error("Failed to fetch featured users");
      }
      return response.json();
    },
    enabled: !!user?.isAdmin,
    refetchInterval: 300000, // Refresh every 5 minutes
    retry: 3,
    retryDelay: 1000,
  });

  // Debug featured users
  console.log("Featured Users Debug:", {
    featuredUsers,
    featuredLoading,
    featuredError: featuredError?.message,
    length: featuredUsers.length
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

  // Calculate escrow volume from active trades
  const escrowVolume = activeTrades.reduce((sum, trade) => {
    return sum + parseFloat(trade.amount || "0");
  }, 0);

  // Filter users based on search and status
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = searchTerm === "" || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "verified" && user.kycVerified) ||
      (statusFilter === "unverified" && !user.kycVerified) ||
      (statusFilter === "admin" && user.isAdmin) ||
      (statusFilter === "active" && parseFloat(user.nairaBalance || "0") > 0);
    
    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      title: "Total Users",
      value: usersLoading ? "Loading..." : users.length.toLocaleString(),
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
      value: `₦${escrowVolume.toLocaleString()}`,
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

          {/* Admin Stats - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`p-2 sm:p-3 ${stat.bgColor} rounded-xl flex-shrink-0`}>
                      <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                      <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Featured Users - Top Sellers */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Crown className="h-6 w-6 text-yellow-600" />
                Featured Users - Top Sellers (This Week)
              </CardTitle>
              <p className="text-sm text-gray-600">Admin-selected users, top traders by volume, or users with highest portfolios</p>
            </CardHeader>
            <CardContent>
              {featuredLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="text-gray-600">Loading featured users...</p>
                </div>
              ) : featuredError ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-red-600 mb-2">Error loading featured users</p>
                  <p className="text-sm text-gray-500">{featuredError.message}</p>
                </div>
              ) : featuredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">No featured users found</p>
                  <p className="text-sm text-gray-400">Users will appear based on trading volume or portfolio value</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredUsers.map((seller: any, index: number) => (
                    <Card 
                      key={seller.sellerId} 
                      className="relative overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300"
                      onClick={() => {
                        setSelectedUserId(seller.sellerId);
                        setSelectedUserName(
                          seller.user.firstName && seller.user.lastName 
                            ? `${seller.user.firstName} ${seller.user.lastName}`
                            : seller.user.username || seller.user.email
                        );
                        setShowUserModal(true);
                      }}
                    >
                      <CardContent className="p-4">
                        {/* Rank Badge */}
                        <div className="absolute top-2 right-2">
                          <Badge className={`text-xs font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            #{index + 1}
                          </Badge>
                        </div>

                        {/* User Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-full ${
                              index === 0 ? 'bg-yellow-100' :
                              index === 1 ? 'bg-gray-100' :
                              index === 2 ? 'bg-orange-100' :
                              'bg-blue-100'
                            }`}>
                              <Users className={`h-4 w-4 ${
                                index === 0 ? 'text-yellow-600' :
                                index === 1 ? 'text-gray-600' :
                                index === 2 ? 'text-orange-600' :
                                'text-blue-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {seller.user.firstName && seller.user.lastName 
                                  ? `${seller.user.firstName} ${seller.user.lastName}`
                                  : seller.user.username || seller.user.email
                                }
                              </p>
                              <p className="text-xs text-gray-500 truncate">{seller.user.email}</p>
                            </div>
                          </div>

                          {/* KYC Status */}
                          {seller.user.kycVerified && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              KYC Verified
                            </Badge>
                          )}

                          {/* Featured Badge */}
                          {seller.isManuallyFeatured && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs mb-2">
                              Admin Featured
                            </Badge>
                          )}
                          {seller.isPortfolioBased && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs mb-2">
                              High Portfolio
                            </Badge>
                          )}

                          {/* Stats */}
                          <div className="space-y-1">
                            {seller.isManuallyFeatured ? (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Status</span>
                                <span className="text-sm font-bold text-purple-600">
                                  Admin Selected
                                </span>
                              </div>
                            ) : seller.isPortfolioBased ? (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Portfolio</span>
                                <span className="text-sm font-bold text-blue-600">
                                  ₦{seller.portfolioValue?.toLocaleString() || "0"}
                                </span>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Volume</span>
                                <span className="text-sm font-bold text-green-600">
                                  ₦{seller.totalVolume.toLocaleString()}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Trades</span>
                              <span className="text-sm font-medium">{seller.tradeCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Rating</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">
                                  {parseFloat(seller.user.averageRating).toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({seller.user.ratingCount})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Award Icon for Top 3 */}
                          {index < 3 && (
                            <div className="flex justify-center pt-2">
                              <Award className={`h-5 w-5 ${
                                index === 0 ? 'text-yellow-500' :
                                index === 1 ? 'text-gray-500' :
                                'text-orange-500'
                              }`} />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Users Section - Modern Mobile-Optimized */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                    All Users
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredUsers.length} of {users.length} users shown
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9 sm:w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-full sm:w-32">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
                  <p className="text-gray-600">Loading users...</p>
                </div>
              ) : usersError ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-500" />
                  <p className="text-red-600 mb-2">Error loading users</p>
                  <p className="text-sm text-gray-500">{usersError.message}</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">No users found</p>
                  <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredUsers.slice(0, 20).map((user: any) => (
                    <div
                      key={user.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setSelectedUserName(
                          user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.username || user.email
                        );
                        setShowUserModal(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            user.isAdmin ? 'bg-red-100' : 
                            user.kycVerified ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Users className={`w-5 h-5 ${
                              user.isAdmin ? 'text-red-600' : 
                              user.kycVerified ? 'text-green-600' : 'text-gray-600'
                            }`} />
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.username || 'No Name'
                                }
                              </p>
                              {user.isAdmin && (
                                <Badge className="bg-red-100 text-red-700 text-xs px-2 py-0.5">
                                  Admin
                                </Badge>
                              )}
                              {user.kycVerified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            
                            {user.phone && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <Phone className="w-3 h-3" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Balances & Actions */}
                        <div className="flex items-center space-x-3">
                          {/* Balance Info - Hidden on mobile */}
                          <div className="hidden sm:block text-right">
                            <div className="text-sm font-medium text-gray-900">
                              ₦{parseFloat(user.nairaBalance || "0").toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              ${parseFloat(user.usdtBalance || "0").toFixed(2)} USDT
                            </div>
                          </div>

                          {/* Mobile: Show total balance */}
                          <div className="sm:hidden text-right">
                            <div className="text-sm font-medium text-gray-900">
                              ₦{parseFloat(user.nairaBalance || "0").toLocaleString()}
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserId(user.id);
                              setSelectedUserName(
                                user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.username || user.email
                              );
                              setShowUserModal(true);
                            }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Mobile: Additional Info */}
                      <div className="sm:hidden mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            USDT: ${parseFloat(user.usdtBalance || "0").toFixed(2)}
                          </div>
                          <div className="flex items-center gap-2">
                            {user.kycVerified ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700 text-xs">
                                Unverified
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              ID: {user.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredUsers.length > 20 && (
                    <div className="p-4 text-center border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        Showing first 20 of {filteredUsers.length} users
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        userId={selectedUserId}
        userName={selectedUserName}
      />
    </div>
  );
}
