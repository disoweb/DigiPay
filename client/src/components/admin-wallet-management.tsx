import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Wallet,
  Plus,
  Minus,
  Search,
  RefreshCw,
  CreditCard,
  DollarSign,
  User
} from "lucide-react";

interface User {
  id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  naira_balance: string;
  usdt_balance: string;
}

export function AdminWalletManagement() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  const walletMutation = useMutation({
    mutationFn: async ({ action, userId, amount, currency, description }: {
      action: "credit" | "debit";
      userId: number;
      amount: string;
      currency: string;
      description: string;
    }) => {
      const response = await apiRequest("POST", `/api/admin/wallet/${action}`, {
        userId,
        amount: parseFloat(amount),
        currency,
        description
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} account`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      refetch();
      toast({ 
        title: "Success", 
        description: data.message,
        variant: "default"
      });
      setShowModal(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const filteredUsers = users.filter((user: User) => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setCurrency("NGN");
    setSelectedUser(null);
  };

  const handleWalletAction = () => {
    if (!selectedUser || !amount || !description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive"
      });
      return;
    }

    walletMutation.mutate({
      action: actionType,
      userId: selectedUser.id,
      amount,
      currency,
      description
    });
  };

  const formatBalance = (balance: string) => {
    return parseFloat(balance || "0").toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Management
          </CardTitle>
          <p className="text-sm text-gray-600">Credit or debit user accounts instantly</p>
        </CardHeader>
        <CardContent>
          {/* Search Users */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by email, username, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Users List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                filteredUsers.map((user: User) => (
                  <Card key={user.id} className="p-4 hover:bg-gray-50 cursor-pointer border">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.username || user.email.split('@')[0]
                            }
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            NGN: ₦{formatBalance(user.naira_balance)}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            USDT: ${formatBalance(user.usdt_balance)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("credit");
                            setShowModal(true);
                          }}
                          className="text-green-600 border-green-300"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Credit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("debit");
                            setShowModal(true);
                          }}
                          className="text-red-600 border-red-300"
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          Debit
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Action Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "credit" ? (
                <Plus className="h-5 w-5 text-green-600" />
              ) : (
                <Minus className="h-5 w-5 text-red-600" />
              )}
              {actionType === "credit" ? "Credit Account" : "Debit Account"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  {actionType === "credit" ? "Add funds to" : "Remove funds from"} {selectedUser.email}'s wallet
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* Current Balances */}
              <Card className="p-3 bg-gray-50">
                <div className="text-sm">
                  <p className="font-medium mb-1">Current Balances:</p>
                  <div className="flex justify-between">
                    <span>NGN: ₦{formatBalance(selectedUser.naira_balance)}</span>
                    <span>USDT: ${formatBalance(selectedUser.usdt_balance)}</span>
                  </div>
                </div>
              </Card>

              {/* Currency Selection */}
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN (Nigerian Naira)</SelectItem>
                    <SelectItem value="USDT">USDT (Tether)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder={`Reason for ${actionType}ing this account...`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleWalletAction}
                  disabled={walletMutation.isPending || !amount || !description}
                  className={actionType === "credit" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                  size="sm"
                >
                  {walletMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : actionType === "credit" ? (
                    <Plus className="h-4 w-4 mr-2" />
                  ) : (
                    <Minus className="h-4 w-4 mr-2" />
                  )}
                  {actionType === "credit" ? "Credit Account" : "Debit Account"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={walletMutation.isPending}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}