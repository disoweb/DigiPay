
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Ban, 
  Freeze, 
  Shield, 
  UserCheck, 
  UserX,
  Search,
  Eye,
  Edit,
  Wallet,
  Activity,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  Plus,
  Trash2,
  RefreshCw
} from "lucide-react";

interface User {
  id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  kyc_verified: boolean;
  kyc_status: string;
  naira_balance: string;
  usdt_balance: string;
  average_rating: string;
  rating_count: number;
  is_admin: boolean;
  is_online: boolean;
  is_banned: boolean;
  funds_frozen: boolean;
  created_at: string;
  total_trades: number;
  completed_trades: number;
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
  created_at: string;
  buyer_id: number;
  seller_id: number;
}

export default function AdminUsersFixed() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionType, setActionType] = useState<"ban" | "freeze" | "view" | "edit">("view");
  const [actionReason, setActionReason] = useState("");
  const [editFormData, setEditFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    phone: "",
    nairaBalance: "",
    usdtBalance: "",
    isAdmin: false,
    kycVerified: false
  });

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch admin users");
      }
      return response.json();
    },
  });

  const { data: userTransactions = [] } = useQuery({
    queryKey: ["/api/admin/user-transactions", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return [];
      const response = await apiRequest("GET", `/api/admin/users/${selectedUser.id}/transactions`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedUser?.id,
  });

  const { data: userTrades = [] } = useQuery({
    queryKey: ["/api/admin/user-trades", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return [];
      const response = await apiRequest("GET", `/api/admin/users/${selectedUser.id}/trades`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedUser?.id,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}`, data);
      if (!response.ok) throw new Error("Failed to update user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User updated successfully" });
      setShowEditModal(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, banned, reason }: { userId: number; banned: boolean; reason: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/ban`, { banned, reason });
      if (!response.ok) throw new Error("Failed to update user status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User status updated successfully" });
      setShowActionModal(false);
      setActionReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
    },
  });

  const freezeUserMutation = useMutation({
    mutationFn: async ({ userId, frozen, reason }: { userId: number; frozen: boolean; reason: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/freeze`, { frozen, reason });
      if (!response.ok) throw new Error("Failed to update user funds");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User funds status updated successfully" });
      setShowActionModal(false);
      setActionReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user funds status", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!response.ok) throw new Error("Failed to delete user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User deleted successfully" });
      setShowActionModal(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    },
  });

  const filteredUsers = users.filter((user: User) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = (user: User, action: "ban" | "freeze" | "view" | "edit") => {
    setSelectedUser(user);
    setActionType(action);
    if (action === "view") {
      setShowUserDetail(true);
    } else if (action === "edit") {
      setEditFormData({
        email: user.email,
        username: user.username || "",
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        phone: user.phone || "",
        nairaBalance: user.naira_balance,
        usdtBalance: user.usdt_balance,
        isAdmin: user.is_admin,
        kycVerified: user.kyc_verified
      });
      setShowEditModal(true);
    } else {
      setShowActionModal(true);
    }
  };

  const executeAction = () => {
    if (!selectedUser) return;

    if (actionType === "ban") {
      banUserMutation.mutate({
        userId: selectedUser.id,
        banned: !selectedUser.is_banned,
        reason: actionReason
      });
    } else if (actionType === "freeze") {
      freezeUserMutation.mutate({
        userId: selectedUser.id,
        frozen: !selectedUser.funds_frozen,
        reason: actionReason
      });
    }
  };

  const handleEditSubmit = () => {
    if (!selectedUser) return;
    updateUserMutation.mutate({
      userId: selectedUser.id,
      data: editFormData
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "disputed": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading users</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage platform users, permissions, and security</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards - Mobile Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">KYC Verified</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {users.filter((u: User) => u.kyc_verified).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Admins</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {users.filter((u: User) => u.is_admin).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Active Traders</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {users.filter((u: User) => u.total_trades > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table - Mobile Responsive */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">All Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">User</TableHead>
                      <TableHead className="hidden sm:table-cell">KYC Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Balance</TableHead>
                      <TableHead className="hidden md:table-cell">Trades</TableHead>
                      <TableHead className="hidden lg:table-cell">Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{user.email}</div>
                            <div className="text-xs text-gray-500">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-xs text-gray-400">ID: {user.id}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={user.kyc_verified ? "default" : "secondary"} className="text-xs">
                            {user.kyc_verified ? "Verified" : user.kyc_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-xs">
                            <div>₦{parseFloat(user.naira_balance).toLocaleString()}</div>
                            <div className="text-gray-500">{parseFloat(user.usdt_balance).toFixed(2)} USDT</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-xs">
                            <div>{user.completed_trades}/{user.total_trades}</div>
                            <div className="text-gray-500">completed</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-xs">
                            <div>⭐ {parseFloat(user.average_rating).toFixed(1)}</div>
                            <div className="text-gray-500">({user.rating_count} reviews)</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {user.is_admin && (
                              <Badge variant="outline" className="text-purple-600 border-purple-600 text-xs">
                                Admin
                              </Badge>
                            )}
                            {user.is_banned && (
                              <Badge variant="destructive" className="text-xs">Banned</Badge>
                            )}
                            {user.funds_frozen && (
                              <Badge variant="secondary" className="text-orange-600 text-xs">Frozen</Badge>
                            )}
                            <Badge variant={user.is_online ? "default" : "secondary"} className="text-xs">
                              {user.is_online ? "Online" : "Offline"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(user, "view")}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(user, "edit")}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(user, "freeze")}
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                            >
                              <Freeze className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(user, "ban")}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Detail Sheet - Mobile Optimized */}
        <Sheet open={showUserDetail} onOpenChange={setShowUserDetail}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                User Details
              </SheetTitle>
              <SheetDescription>
                Complete profile and activity information
              </SheetDescription>
            </SheetHeader>
            
            {selectedUser && (
              <div className="space-y-6 mt-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">Email</label>
                        <p className="text-gray-600 break-all">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Name</label>
                        <p className="text-gray-600">{selectedUser.first_name} {selectedUser.last_name}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Phone</label>
                        <p className="text-gray-600">{selectedUser.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Username</label>
                        <p className="text-gray-600">{selectedUser.username || "Not set"}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">KYC Status</label>
                        <Badge variant={selectedUser.kyc_verified ? "default" : "secondary"} className="text-xs">
                          {selectedUser.kyc_verified ? "Verified" : selectedUser.kyc_status}
                        </Badge>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Joined</label>
                        <p className="text-gray-600 text-xs">
                          {new Date(selectedUser.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Wallet Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Wallet Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600">Naira Balance</p>
                        <p className="text-lg font-bold text-green-600">
                          ₦{parseFloat(selectedUser.naira_balance).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600">USDT Balance</p>
                        <p className="text-lg font-bold text-blue-600">
                          {parseFloat(selectedUser.usdt_balance).toFixed(2)} USDT
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trading Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Trading Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">Total Trades</label>
                        <p className="text-xl font-bold">{selectedUser.total_trades}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Completed</label>
                        <p className="text-xl font-bold text-green-600">{selectedUser.completed_trades}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Rating</label>
                        <p className="text-lg font-bold">⭐ {parseFloat(selectedUser.average_rating).toFixed(1)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Reviews</label>
                        <p className="text-lg font-bold">{selectedUser.rating_count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Recent Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {userTransactions.slice(0, 5).map((tx: Transaction) => (
                        <div key={tx.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                          <div>
                            <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₦{parseFloat(tx.amount).toLocaleString()}</p>
                            <Badge className={`text-xs ${getStatusColor(tx.status)}`}>
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {userTransactions.length === 0 && (
                        <p className="text-center text-gray-500 text-sm py-4">No transactions found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Trades */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Recent Trades
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {userTrades.slice(0, 5).map((trade: Trade) => (
                        <div key={trade.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                          <div>
                            <p className="font-medium">Trade #{trade.id}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(trade.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{trade.amount} USDT</p>
                            <p className="text-xs text-gray-500">₦{trade.rate}/USDT</p>
                            <Badge className={`text-xs ${getStatusColor(trade.status)}`}>
                              {trade.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {userTrades.length === 0 && (
                        <p className="text-center text-gray-500 text-sm py-4">No trades found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Edit User Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit User
              </DialogTitle>
              <DialogDescription>
                Update user information and settings
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName" className="text-sm">First Name</Label>
                  <Input
                    id="firstName"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="username" className="text-sm">Username</Label>
                <Input
                  id="username"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                  className="text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-sm">Phone</Label>
                <Input
                  id="phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  className="text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nairaBalance" className="text-sm">Naira Balance</Label>
                  <Input
                    id="nairaBalance"
                    type="number"
                    value={editFormData.nairaBalance}
                    onChange={(e) => setEditFormData({...editFormData, nairaBalance: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="usdtBalance" className="text-sm">USDT Balance</Label>
                  <Input
                    id="usdtBalance"
                    type="number"
                    step="0.00000001"
                    value={editFormData.usdtBalance}
                    onChange={(e) => setEditFormData({...editFormData, usdtBalance: e.target.value})}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editFormData.isAdmin}
                    onChange={(e) => setEditFormData({...editFormData, isAdmin: e.target.checked})}
                    className="rounded"
                  />
                  <span>Admin User</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editFormData.kycVerified}
                    onChange={(e) => setEditFormData({...editFormData, kycVerified: e.target.checked})}
                    className="rounded"
                  />
                  <span>KYC Verified</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditSubmit} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Action Modal */}
        <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
          <DialogContent className="max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>
                {actionType === "ban" ? (selectedUser?.is_banned ? "Unban User" : "Ban User") : 
                 actionType === "freeze" ? (selectedUser?.funds_frozen ? "Unfreeze Funds" : "Freeze User Funds") : "User Action"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser && `Action for: ${selectedUser.email}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Textarea
                placeholder={`Reason for ${actionType}...`}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={executeAction} variant="destructive" className="flex-1">
                  Confirm {actionType === "ban" ? (selectedUser?.is_banned ? "Unban" : "Ban") : 
                            actionType === "freeze" ? (selectedUser?.funds_frozen ? "Unfreeze" : "Freeze") : "Action"}
                </Button>
                <Button variant="outline" onClick={() => setShowActionModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
