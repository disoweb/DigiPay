import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  User,
  Filter,
  ArrowUpDown,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2
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
  const [sortBy, setSortBy] = useState<"name" | "balance" | "recent">("name");
  const [filterCurrency, setFilterCurrency] = useState<"all" | "NGN" | "USDT">("all");

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

  const filteredAndSortedUsers = users
    .filter((user: User) => {
      const searchMatch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!searchMatch) return false;
      
      if (filterCurrency === "all") return true;
      const balance = parseFloat(filterCurrency === "NGN" ? user.naira_balance : user.usdt_balance);
      return balance > 0;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          const aName = a.first_name && a.last_name ? `${a.first_name} ${a.last_name}` : a.username || a.email;
          const bName = b.first_name && b.last_name ? `${b.first_name} ${b.last_name}` : b.username || b.email;
          return aName.localeCompare(bName);
        case "balance":
          const aNgn = parseFloat(a.naira_balance || "0");
          const bNgn = parseFloat(b.naira_balance || "0");
          return bNgn - aNgn;
        case "recent":
          return b.id - a.id;
        default:
          return 0;
      }
    });

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
    <div className="space-y-4 md:space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm text-gray-600 truncate">Total Users</p>
              <p className="text-lg md:text-xl font-bold">{users.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm text-gray-600 truncate">Total NGN</p>
              <p className="text-lg md:text-xl font-bold">
                ₦{users.reduce((sum, user) => sum + parseFloat(user.naira_balance || "0"), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="h-4 w-4 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm text-gray-600 truncate">Total USDT</p>
              <p className="text-lg md:text-xl font-bold">
                ${users.reduce((sum, user) => sum + parseFloat(user.usdt_balance || "0"), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wallet className="h-4 w-4 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm text-gray-600 truncate">Active</p>
              <p className="text-lg md:text-xl font-bold">
                {filteredAndSortedUsers.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Wallet className="h-5 w-5" />
                Wallet Management
              </CardTitle>
              <p className="text-xs md:text-sm text-gray-600 mt-1">Credit or debit user accounts instantly</p>
            </div>
            <Badge variant="secondary" className="text-xs w-fit">
              {filteredAndSortedUsers.length} users
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-40 h-9">
                  <ArrowUpDown className="h-3 w-3 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="balance">Sort by Balance</SelectItem>
                  <SelectItem value="recent">Sort by Recent</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterCurrency} onValueChange={(value: any) => setFilterCurrency(value)}>
                <SelectTrigger className="w-full sm:w-32 h-9">
                  <Filter className="h-3 w-3 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="NGN">NGN Only</SelectItem>
                  <SelectItem value="USDT">USDT Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Users List */}
          <ScrollArea className="h-[400px] md:h-[500px] pr-4">
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 text-sm">Loading users...</p>
                </div>
              ) : filteredAndSortedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No users found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredAndSortedUsers.map((user: User) => (
                  <Card key={user.id} className="p-3 md:p-4 hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500">
                    <div className="space-y-3">
                      {/* User Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-gray-100 rounded-full">
                              <User className="h-3 w-3 text-gray-600" />
                            </div>
                            <span className="font-medium text-sm md:text-base truncate">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user.username || user.email.split('@')[0]
                              }
                            </span>
                            {user.id === 1 && (
                              <Badge variant="secondary" className="text-xs">Owner</Badge>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                      
                      {/* Balance Display */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              <span className="text-xs font-medium text-green-700">NGN</span>
                            </div>
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          </div>
                          <p className="text-sm md:text-base font-bold text-green-800 mt-1">
                            ₦{formatBalance(user.naira_balance)}
                          </p>
                        </div>
                        
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-blue-600" />
                              <span className="text-xs font-medium text-blue-700">USDT</span>
                            </div>
                            <TrendingDown className="h-3 w-3 text-blue-600" />
                          </div>
                          <p className="text-sm md:text-base font-bold text-blue-800 mt-1">
                            ${formatBalance(user.usdt_balance)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("credit");
                            setShowModal(true);
                          }}
                          className="flex-1 text-green-600 border-green-300 hover:bg-green-50 h-8 text-xs"
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
                          className="flex-1 text-red-600 border-red-300 hover:bg-red-50 h-8 text-xs"
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
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Wallet Action Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className={`p-2 rounded-full ${actionType === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                {actionType === "credit" ? (
                  <Plus className="h-4 w-4 text-green-600" />
                ) : (
                  <Minus className="h-4 w-4 text-red-600" />
                )}
              </div>
              {actionType === "credit" ? "Credit Account" : "Debit Account"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedUser && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="p-1 bg-gray-100 rounded-full">
                    <User className="h-3 w-3 text-gray-600" />
                  </div>
                  <span className="font-medium">
                    {selectedUser.first_name && selectedUser.last_name 
                      ? `${selectedUser.first_name} ${selectedUser.last_name}`
                      : selectedUser.username || selectedUser.email.split('@')[0]
                    }
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-4 pb-4">
                {/* Current Balances */}
                <Card className="p-3 bg-gradient-to-r from-blue-50 to-green-50 border-0">
                  <div className="text-sm">
                    <p className="font-semibold mb-3 text-gray-800">Current Balances</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-white/80 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-700">NGN</span>
                        </div>
                        <p className="font-bold text-green-800">₦{formatBalance(selectedUser.naira_balance)}</p>
                      </div>
                      <div className="p-2 bg-white/80 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                          <CreditCard className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">USDT</span>
                        </div>
                        <p className="font-bold text-blue-800">${formatBalance(selectedUser.usdt_balance)}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Currency Selection */}
                <div>
                  <Label htmlFor="currency" className="text-sm font-medium flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Currency
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="mt-1 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          NGN (Nigerian Naira)
                        </div>
                      </SelectItem>
                      <SelectItem value="USDT">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3 w-3 text-blue-600" />
                          USDT (Tether)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div>
                  <Label htmlFor="amount" className="text-sm font-medium flex items-center gap-1">
                    {actionType === "credit" ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    Amount *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      className="pl-8 h-10 text-base"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      {currency === "NGN" ? "₦" : "$"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={`Reason for ${actionType}ing this account...`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 text-sm resize-none"
                  />
                </div>

                {/* Preview */}
                {amount && description && (
                  <Card className="p-3 bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 mb-1">Transaction Preview</p>
                        <p className="text-yellow-700">
                          {actionType === "credit" ? "Add" : "Remove"} {currency === "NGN" ? "₦" : "$"}{amount} 
                          {actionType === "credit" ? " to" : " from"} {selectedUser.email}'s wallet
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Action Buttons */}
          <div className="shrink-0 flex gap-2 pt-4 border-t">
            <Button
              onClick={handleWalletAction}
              disabled={walletMutation.isPending || !amount || !description}
              className={`flex-1 h-10 ${actionType === "credit" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {walletMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {actionType === "credit" ? "Credit Account" : "Debit Account"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={walletMutation.isPending}
              className="px-6 h-10"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}