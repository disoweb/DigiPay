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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  Ban, 
  Freeze, 
  Shield, 
  UserCheck, 
  UserX,
  Search,
  Eye
} from "lucide-react";

export default function AdminUsersFixed() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"ban" | "freeze" | "view">("view");
  const [actionReason, setActionReason] = useState("");

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["/api/admin/users"],
    onError: (err) => {
      console.error("Failed to fetch admin users:", err);
    },
    onSuccess: (data) => {
      console.log("Admin users data:", data);
    }
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

  const filteredUsers = users.filter((user: any) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = (user: any, action: "ban" | "freeze" | "view") => {
    setSelectedUser(user);
    setActionType(action);
    setShowActionModal(true);
  };

  const executeAction = () => {
    if (!selectedUser) return;

    if (actionType === "ban") {
      banUserMutation.mutate({
        userId: selectedUser.id,
        banned: true,
        reason: actionReason
      });
    } else if (actionType === "freeze") {
      freezeUserMutation.mutate({
        userId: selectedUser.id,
        frozen: true,
        reason: actionReason
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <p className="text-red-600">Error loading users</p>
            <p className="text-gray-500">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage platform users, permissions, and security</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          {/* Users Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">KYC Verified</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter((u: any) => u.kyc_verified).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Admins</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter((u: any) => u.is_admin).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <UserX className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Traders</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter((u: any) => u.total_trades > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Trades</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.email}</div>
                            <div className="text-sm text-gray-500">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {user.id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.kyc_verified ? "default" : "secondary"}>
                            {user.kyc_verified ? "Verified" : user.kyc_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>₦{parseFloat(user.naira_balance).toLocaleString()}</div>
                            <div className="text-gray-500">{parseFloat(user.usdt_balance).toFixed(2)} USDT</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{user.completed_trades}/{user.total_trades}</div>
                            <div className="text-gray-500">completed</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>⭐ {parseFloat(user.average_rating).toFixed(1)}</div>
                            <div className="text-gray-500">({user.rating_count} reviews)</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {user.is_admin && (
                              <Badge variant="outline" className="text-purple-600 border-purple-600">
                                Admin
                              </Badge>
                            )}
                            <Badge variant={user.is_online ? "default" : "secondary"}>
                              {user.is_online ? "Online" : "Offline"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(user, "view")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(user, "freeze")}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              ❄️
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(user, "ban")}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Ban className="h-4 w-4" />
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

        {/* Action Modal */}
        <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "ban" ? "Ban User" : 
                 actionType === "freeze" ? "Freeze User Funds" : "User Details"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser && `Action for: ${selectedUser.email}`}
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                {actionType === "view" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-gray-600">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <p className="text-sm text-gray-600">
                          {selectedUser.first_name} {selectedUser.last_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <p className="text-sm text-gray-600">{selectedUser.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">KYC Status</label>
                        <p className="text-sm text-gray-600">{selectedUser.kyc_status}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      placeholder={`Reason for ${actionType}...`}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button onClick={executeAction} variant="destructive">
                        Confirm {actionType === "ban" ? "Ban" : "Freeze"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowActionModal(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}