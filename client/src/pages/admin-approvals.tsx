
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
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Banknote,
  Calendar,
  Building
} from "lucide-react";

interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: string;
  status: string;
  created_at: string;
  admin_notes?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  paystack_ref?: string;
  user?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export default function AdminApprovals() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionNotes, setActionNotes] = useState("");

  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/transactions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/transactions");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return response.json();
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
    refetchIntervalInBackground: true,
  });

  const approveTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, notes }: { transactionId: number; notes?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/transactions/${transactionId}/approve`, { notes: notes || "" });
      if (!response.ok) throw new Error("Failed to approve transaction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      refetch(); // Force immediate refetch for real-time update
      toast({ title: "Success", description: "Transaction approved successfully" });
      setShowActionModal(false);
      setActionNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve transaction", variant: "destructive" });
    },
  });

  const rejectTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, notes }: { transactionId: number; notes: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/transactions/${transactionId}/reject`, { notes });
      if (!response.ok) throw new Error("Failed to reject transaction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      refetch(); // Force immediate refetch for real-time update
      toast({ title: "Success", description: "Transaction rejected successfully" });
      setShowActionModal(false);
      setActionNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject transaction", variant: "destructive" });
    },
  });

  const filteredTransactions = transactions.filter((transaction: Transaction) => {
    const matchesSearch = 
      transaction.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toString().includes(searchTerm) ||
      transaction.amount.includes(searchTerm);
    
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailSheet(true);
  };

  const handleAction = (transaction: Transaction, action: "approve" | "reject") => {
    setSelectedTransaction(transaction);
    setActionType(action);
    setShowActionModal(true);
  };

  const executeAction = () => {
    if (!selectedTransaction) return;
    
    // For rejections, require a reason. For approvals, notes are optional
    if (actionType === "reject" && !actionNotes.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    if (actionType === "approve") {
      approveTransactionMutation.mutate({
        transactionId: selectedTransaction.id,
        notes: actionNotes.trim()
      });
    } else {
      rejectTransactionMutation.mutate({
        transactionId: selectedTransaction.id,
        notes: actionNotes.trim()
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "approved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit": return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
      case "withdrawal": return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
      case "transfer_in": return <ArrowUpCircle className="h-4 w-4 text-blue-600" />;
      case "transfer_out": return <ArrowDownCircle className="h-4 w-4 text-orange-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return 'Invalid Date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateShort = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return 'Invalid Date';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return 'Invalid Date';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };





  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">Loading transactions...</p>
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
            <p className="text-red-600 mb-2">Error loading transactions</p>
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
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600" />
                  Transaction Approvals
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm lg:text-base">Review and approve pending transactions</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => refetch()} variant="outline" size="sm" className="text-xs">
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
            
            {/* Search and Filters - Stack on Mobile */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="transfer_in">Transfer In</SelectItem>
                    <SelectItem value="transfer_out">Transfer Out</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Stats Cards - Mobile Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {transactions.filter((t: Transaction) => t.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {transactions.filter((t: Transaction) => t.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <ArrowUpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Deposits</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {transactions.filter((t: Transaction) => t.type === 'deposit').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <ArrowDownCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Withdrawals</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {transactions.filter((t: Transaction) => t.type === 'withdrawal').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table - Mobile Responsive */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                Transactions ({filteredTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table className="text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 sm:w-20">ID</TableHead>
                      <TableHead className="min-w-[120px] sm:min-w-[150px]">User Details</TableHead>
                      <TableHead className="hidden sm:table-cell w-24">Type</TableHead>
                      <TableHead className="w-20 sm:w-24">Amount</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[140px]">Bank Details</TableHead>
                      <TableHead className="hidden lg:table-cell w-24">Date</TableHead>
                      <TableHead className="w-20">Status</TableHead>
                      <TableHead className="text-right w-24 sm:w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction: Transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-gray-50/50">
                        <TableCell className="py-2 sm:py-3">
                          <div className="font-medium text-xs sm:text-sm">#{transaction.id}</div>
                        </TableCell>
                        <TableCell className="py-2 sm:py-3">
                          <div className="text-xs sm:text-sm">
                            <div className="font-medium text-gray-900">
                              {transaction.user?.first_name && transaction.user?.last_name 
                                ? `${transaction.user.first_name} ${transaction.user.last_name}`
                                : transaction.user?.email.split('@')[0]
                              }
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">
                              {transaction.user?.email}
                            </div>
                            <div className="text-xs text-gray-500 sm:hidden">
                              {getTypeIcon(transaction.type)}
                            </div>
                            <div className="text-xs text-gray-500 hidden sm:block">
                              ID: {transaction.userId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-2 sm:py-3">
                          <div className="flex items-center gap-1 sm:gap-2">
                            {getTypeIcon(transaction.type)}
                            <span className="text-xs sm:text-sm capitalize">{transaction.type.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 sm:py-3">
                          <div className="font-medium text-xs sm:text-sm">
                            ₦{parseFloat(transaction.amount).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 lg:hidden">
                            {formatDateShort(transaction.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-2 sm:py-3">
                          {transaction.type === 'withdrawal' ? (
                            <div className="text-xs">
                              <div className="font-medium text-gray-900 truncate max-w-[100px]">
                                {transaction.bank_name || 'Not provided'}
                              </div>
                              <div className="text-gray-500 font-mono">
                                {transaction.account_number || 'Not provided'}
                              </div>
                              <div className="text-gray-500 truncate max-w-[100px]">
                                {transaction.account_name || 'Not provided'}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">-</div>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell py-2 sm:py-3">
                          <div className="text-xs sm:text-sm text-gray-500">
                            {formatDate(transaction.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 sm:py-3">
                          <Badge className={`text-xs ${getStatusColor(transaction.status)} px-1 py-0.5`}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 sm:py-3">
                          <div className="flex gap-0.5 sm:gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTransaction(transaction)}
                              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                            >
                              <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                            {transaction.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction(transaction, "approve")}
                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction(transaction, "reject")}
                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No transactions found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Detail Sheet - Mobile Optimized */}
        <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transaction #{selectedTransaction?.id}
              </SheetTitle>
              <SheetDescription>
                Complete transaction details and information
              </SheetDescription>
            </SheetHeader>
            
            {selectedTransaction && (
              <div className="space-y-6 mt-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Transaction Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">Transaction ID</label>
                        <p className="text-gray-600">#{selectedTransaction.id}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Type</label>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(selectedTransaction.type)}
                          <span className="capitalize">{selectedTransaction.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Amount</label>
                        <p className="text-lg font-bold text-green-600">
                          ₦{parseFloat(selectedTransaction.amount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Status</label>
                        <Badge className={`text-xs ${getStatusColor(selectedTransaction.status)}`}>
                          {selectedTransaction.status}
                        </Badge>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Created</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-xs">{formatDateTime(selectedTransaction.created_at)}</span>
                        </div>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">User ID</label>
                        <p className="text-gray-600">{selectedTransaction.userId}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* User Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      User Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600">User Email</p>
                      <p className="font-medium text-blue-700">{selectedTransaction.user?.email}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Bank Details (for withdrawals) */}
                {selectedTransaction.type === 'withdrawal' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Bank Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <label className="font-medium text-gray-700">Bank Name</label>
                          <p className="text-gray-600">{selectedTransaction.bank_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Account Number</label>
                          <p className="text-gray-600 font-mono">{selectedTransaction.account_number || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Account Name</label>
                          <p className="text-gray-600">{selectedTransaction.account_name || 'Not provided'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Reference */}
                {selectedTransaction.paystack_ref && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Payment Reference
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {selectedTransaction.paystack_ref}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Admin Notes */}
                {selectedTransaction.admin_notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Admin Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                        {selectedTransaction.admin_notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                {selectedTransaction.status === 'pending' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => handleAction(selectedTransaction, "approve")}
                          variant="outline" 
                          size="sm" 
                          className="text-green-600 border-green-300"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          onClick={() => handleAction(selectedTransaction, "reject")}
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 border-red-300"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Action Modal */}
        <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
          <DialogContent className="max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionType === "approve" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {actionType === "approve" ? "Approve" : "Reject"} Transaction
              </DialogTitle>
              <DialogDescription>
                Transaction #{selectedTransaction?.id} - ₦{selectedTransaction?.amount && parseFloat(selectedTransaction.amount).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Admin Notes {actionType === "reject" && <span className="text-red-500">*</span>}
                  {actionType === "approve" && <span className="text-xs text-gray-500">(Optional)</span>}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={actionType === "approve" ? "Optional notes..." : "Required reason for rejection..."}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  className="mt-1 text-sm"
                />
                {actionType === "reject" && (
                  <p className="text-xs text-red-500 mt-1">
                    Please provide a reason for rejection
                  </p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button 
                  onClick={executeAction}
                  variant={actionType === "approve" ? "default" : "destructive"} 
                  className="flex-1 text-sm"
                  disabled={actionType === "reject" && !actionNotes.trim()}
                >
                  {actionType === "approve" ? "Approve Transaction" : "Reject Transaction"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowActionModal(false)} 
                  className="flex-1 text-sm"
                >
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
