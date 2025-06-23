import React, { useState, useEffect } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
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
  Building,
  Edit,
  Trash2,
  Save,
  Plus,
  Minus,
  AlertCircle
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

export default function AdminApprovalsNew() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionNotes, setActionNotes] = useState("");
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    amount: "",
    status: "",
    adminNotes: "",
    type: "",
    bankName: "",
    accountNumber: "",
    accountName: ""
  });

  // Authentication guard - early return
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (!user.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return <AdminApprovalsContent />;
}

// Separate content component to ensure clean auth flow
function AdminApprovalsContent() {
  const { toast } = useToast();
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionNotes, setActionNotes] = useState("");
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    amount: "",
    status: "",
    adminNotes: "",
    type: "",
    bankName: "",
    accountNumber: "",
    accountName: ""
  });

  // Fetch transactions
  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/transactions"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/transactions");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Transaction fetch error:", error);
        throw error;
      }
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: 1000,
  });

  // Mutations
  const approveTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, notes }: { transactionId: number; notes?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/transactions/${transactionId}/approve`, { notes: notes || "" });
      if (!response.ok) throw new Error("Failed to approve transaction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      refetch();
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
      refetch();
      toast({ title: "Success", description: "Transaction rejected successfully" });
      setShowActionModal(false);
      setActionNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject transaction", variant: "destructive" });
    },
  });

  const editTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, data }: { transactionId: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/transactions/${transactionId}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update transaction");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      refetch();
      toast({ title: "Success", description: "Transaction updated successfully" });
      setShowEditModal(false);
      resetEditForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/transactions/${transactionId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete transaction");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      refetch();
      toast({ title: "Success", description: "Transaction deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Helper functions
  const resetEditForm = () => {
    setEditForm({
      amount: "",
      status: "",
      adminNotes: "",
      type: "",
      bankName: "",
      accountNumber: "",
      accountName: ""
    });
  };

  const handleAction = (transaction: Transaction, action: "approve" | "reject") => {
    setSelectedTransaction(transaction);
    setActionType(action);
    setShowActionModal(true);
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailSheet(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditForm({
      amount: transaction.amount || "",
      status: transaction.status || "",
      adminNotes: transaction.admin_notes || "",
      type: transaction.type || "",
      bankName: transaction.bank_name || "",
      accountNumber: transaction.account_number || "",
      accountName: transaction.account_name || ""
    });
    setShowEditModal(true);
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    if (window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
      deleteTransactionMutation.mutate(transactionId);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedTransaction) return;
    
    const updateData = {
      amount: parseFloat(editForm.amount),
      status: editForm.status,
      type: editForm.type,
      admin_notes: editForm.adminNotes,
      bank_name: editForm.bankName,
      account_number: editForm.accountNumber,
      account_name: editForm.accountName
    };

    editTransactionMutation.mutate({
      transactionId: selectedTransaction.id,
      data: updateData
    });
  };

  const handleModalAction = () => {
    if (!selectedTransaction) return;

    if (actionType === "approve") {
      approveTransactionMutation.mutate({
        transactionId: selectedTransaction.id,
        notes: actionNotes
      });
    } else {
      if (!actionNotes.trim()) {
        toast({
          title: "Error",
          description: "Please provide a reason for rejection",
          variant: "destructive"
        });
        return;
      }
      rejectTransactionMutation.mutate({
        transactionId: selectedTransaction.id,
        notes: actionNotes
      });
    }
  };

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "approved": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "failed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit": return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case "credit": return <Plus className="h-4 w-4 text-green-600" />;
      case "debit": return <Minus className="h-4 w-4 text-red-600" />;
      case "withdrawal": return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case "transfer_in": return <ArrowDownCircle className="h-4 w-4 text-blue-600" />;
      case "transfer_out": return <ArrowUpCircle className="h-4 w-4 text-orange-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Invalid Date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateShort = (dateString: string) => {
    try {
      if (!dateString) return 'Invalid';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid';
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      if (!dateString) return 'Invalid Date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction: Transaction) => {
    const matchesSearch = transaction.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toString().includes(searchTerm) ||
                         transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.amount.includes(searchTerm);

    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-2">Error loading transactions</p>
            <p className="text-sm text-gray-500 mb-4">{error?.message || "Unknown error"}</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
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
            
            {/* Search and Filters */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              
              <div className="flex gap-2 sm:gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32 h-9 text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32 h-9 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Banknote className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Total</p>
                  <p className="text-sm sm:text-lg font-bold">{transactions.length}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Pending</p>
                  <p className="text-sm sm:text-lg font-bold">
                    {transactions.filter(t => t.status === 'pending').length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Approved</p>
                  <p className="text-sm sm:text-lg font-bold">
                    {transactions.filter(t => ['approved', 'completed'].includes(t.status)).length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Rejected</p>
                  <p className="text-sm sm:text-lg font-bold">
                    {transactions.filter(t => t.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Transactions ({filteredTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-16 text-xs font-medium">ID</TableHead>
                      <TableHead className="text-xs font-medium">User</TableHead>
                      <TableHead className="text-xs font-medium">Type</TableHead>
                      <TableHead className="text-xs font-medium">Amount</TableHead>
                      <TableHead className="hidden md:table-cell text-xs font-medium">Bank Details</TableHead>
                      <TableHead className="hidden lg:table-cell text-xs font-medium">Date</TableHead>
                      <TableHead className="text-xs font-medium">Status</TableHead>
                      <TableHead className="text-xs font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-gray-500">
                            <Banknote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="font-medium">No transactions found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-xs py-2 sm:py-3">
                            #{transaction.id}
                          </TableCell>
                          <TableCell className="py-2 sm:py-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 mb-1">
                                <User className="h-3 w-3 text-gray-400 shrink-0" />
                                <span className="text-xs sm:text-sm font-medium truncate">
                                  {transaction.user?.email || 'Unknown'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 lg:hidden">
                                {formatDateShort(transaction.created_at)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 sm:py-3">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(transaction.type)}
                              <span className="text-xs sm:text-sm font-medium capitalize">
                                {transaction.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 sm:py-3">
                            <div className="font-mono text-xs sm:text-sm font-bold">
                              ₦{parseFloat(transaction.amount).toLocaleString()}
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
                                title="View Details"
                              >
                                <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTransaction(transaction)}
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-blue-600 hover:text-blue-700"
                                title="Edit Transaction"
                              >
                                <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700"
                                title="Delete Transaction"
                              >
                                <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                              {transaction.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(transaction, "approve")}
                                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-green-600 hover:text-green-700"
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(transaction, "reject")}
                                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700"
                                    title="Reject"
                                  >
                                    <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

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
                {actionType === "approve" ? "Approve Transaction" : "Reject Transaction"}
              </DialogTitle>
              <DialogDescription>
                {selectedTransaction && (
                  <>
                    Transaction #{selectedTransaction.id} - ₦{parseFloat(selectedTransaction.amount).toLocaleString()}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="action-notes">
                  {actionType === "approve" ? "Admin Notes (Optional)" : "Rejection Reason (Required)"}
                </Label>
                <Textarea
                  id="action-notes"
                  placeholder={actionType === "approve" 
                    ? "Add any notes about this approval..." 
                    : "Please provide a reason for rejection..."
                  }
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleModalAction}
                  disabled={approveTransactionMutation.isPending || rejectTransactionMutation.isPending}
                  className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                >
                  {(approveTransactionMutation.isPending || rejectTransactionMutation.isPending) ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : actionType === "approve" ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {actionType === "approve" ? "Approve" : "Reject"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowActionModal(false)}
                  disabled={approveTransactionMutation.isPending || rejectTransactionMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transaction Details Sheet */}
        <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Transaction Details
              </SheetTitle>
              <SheetDescription>
                Complete information for transaction #{selectedTransaction?.id}
              </SheetDescription>
            </SheetHeader>
            
            {selectedTransaction && (
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Amount</span>
                      <span className="text-lg font-bold">₦{parseFloat(selectedTransaction.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Type</span>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(selectedTransaction.type)}
                        <span className="capitalize">{selectedTransaction.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Status</span>
                      <Badge className={getStatusColor(selectedTransaction.status)}>
                        {selectedTransaction.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">User ID:</span>
                        <span>#{selectedTransaction.userId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span>{selectedTransaction.user?.email}</span>
                      </div>
                      {selectedTransaction.user?.first_name && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span>{selectedTransaction.user.first_name} {selectedTransaction.user.last_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedTransaction.type === 'withdrawal' && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Bank Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bank Name:</span>
                          <span>{selectedTransaction.bank_name || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Number:</span>
                          <span className="font-mono">{selectedTransaction.account_number || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Name:</span>
                          <span>{selectedTransaction.account_name || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Transaction Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span>{formatDateTime(selectedTransaction.created_at)}</span>
                      </div>
                      {selectedTransaction.paystack_ref && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Paystack Ref:</span>
                          <span className="font-mono text-xs">{selectedTransaction.paystack_ref}</span>
                        </div>
                      )}
                      {selectedTransaction.admin_notes && (
                        <div>
                          <span className="text-gray-600">Admin Notes:</span>
                          <p className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            {selectedTransaction.admin_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Edit Transaction Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="w-[95vw] sm:max-w-lg mx-auto max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="shrink-0 pb-2 sm:pb-4">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                Edit Transaction
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                <div className="flex items-center gap-2 mt-1 sm:mt-2">
                  <Badge variant="outline" className="text-xs">
                    ID: {selectedTransaction?.id}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    ₦{selectedTransaction?.amount && parseFloat(selectedTransaction.amount).toLocaleString()}
                  </Badge>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-3 sm:space-y-4 pb-2 sm:pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <Label htmlFor="edit-amount" className="text-xs sm:text-sm font-medium flex items-center gap-1">
                      <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      Amount
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="edit-amount"
                        type="number"
                        step="0.01"
                        value={editForm.amount}
                        onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="pl-6 sm:pl-7 h-8 sm:h-10 text-sm"
                        placeholder="0.00"
                      />
                      <span className="absolute left-2 sm:left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs sm:text-sm">₦</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-status" className="text-xs sm:text-sm font-medium flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      Status
                    </Label>
                    <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-yellow-600" />
                            Pending
                          </div>
                        </SelectItem>
                        <SelectItem value="completed">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            Completed
                          </div>
                        </SelectItem>
                        <SelectItem value="approved">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-blue-600" />
                            Approved
                          </div>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-3 w-3 text-red-600" />
                            Rejected
                          </div>
                        </SelectItem>
                        <SelectItem value="failed">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-3 w-3 text-gray-600" />
                            Failed
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-type" className="text-xs sm:text-sm font-medium flex items-center gap-1">
                    <ArrowUpCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    Transaction Type
                  </Label>
                  <Select value={editForm.type} onValueChange={(value) => setEditForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="mt-1 h-8 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">
                        <div className="flex items-center gap-2">
                          <ArrowDownCircle className="h-3 w-3 text-green-600" />
                          Deposit
                        </div>
                      </SelectItem>
                      <SelectItem value="withdrawal">
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="h-3 w-3 text-red-600" />
                          Withdrawal
                        </div>
                      </SelectItem>
                      <SelectItem value="credit">
                        <div className="flex items-center gap-2">
                          <Plus className="h-3 w-3 text-blue-600" />
                          Credit
                        </div>
                      </SelectItem>
                      <SelectItem value="debit">
                        <div className="flex items-center gap-2">
                          <Minus className="h-3 w-3 text-orange-600" />
                          Debit
                        </div>
                      </SelectItem>
                      <SelectItem value="transfer_in">Transfer In</SelectItem>
                      <SelectItem value="transfer_out">Transfer Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editForm.type === "withdrawal" && (
                  <Card className="p-2 sm:p-3 bg-yellow-50 border-yellow-200">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                        <span className="text-xs sm:text-sm font-medium text-yellow-800">Bank Details</span>
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-bank-name" className="text-xs font-medium text-yellow-700">Bank Name</Label>
                        <Input
                          id="edit-bank-name"
                          value={editForm.bankName}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bankName: e.target.value }))}
                          className="mt-1 h-8 sm:h-9 text-xs sm:text-sm bg-white/80"
                          placeholder="Enter bank name"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div>
                          <Label htmlFor="edit-account-number" className="text-xs font-medium text-yellow-700">Account Number</Label>
                          <Input
                            id="edit-account-number"
                            value={editForm.accountNumber}
                            onChange={(e) => setEditForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                            className="mt-1 h-8 sm:h-9 text-xs sm:text-sm bg-white/80"
                            placeholder="0000000000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-account-name" className="text-xs font-medium text-yellow-700">Account Name</Label>
                          <Input
                            id="edit-account-name"
                            value={editForm.accountName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, accountName: e.target.value }))}
                            className="mt-1 h-8 sm:h-9 text-xs sm:text-sm bg-white/80"
                            placeholder="Account holder name"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                <div>
                  <Label htmlFor="edit-admin-notes" className="text-xs sm:text-sm font-medium flex items-center gap-1">
                    <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    Admin Notes
                  </Label>
                  <Textarea
                    id="edit-admin-notes"
                    value={editForm.adminNotes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                    rows={3}
                    className="mt-1 text-xs sm:text-sm resize-none"
                    placeholder="Add admin notes or comments..."
                  />
                </div>

                {(editForm.amount !== selectedTransaction?.amount || 
                  editForm.status !== selectedTransaction?.status) && (
                  <Card className="p-2 sm:p-3 bg-blue-50 border-blue-200">
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-xs sm:text-sm">
                        <p className="font-medium text-blue-800 mb-1">Changes Preview</p>
                        <div className="space-y-1 text-blue-700">
                          {editForm.amount !== selectedTransaction?.amount && (
                            <p>Amount: ₦{selectedTransaction?.amount} → ₦{editForm.amount}</p>
                          )}
                          {editForm.status !== selectedTransaction?.status && (
                            <p>Status: {selectedTransaction?.status} → {editForm.status}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            <div className="shrink-0 flex gap-2 pt-3 sm:pt-4 border-t">
              <Button 
                onClick={handleSaveEdit}
                disabled={editTransactionMutation.isPending}
                className="flex-1 h-8 sm:h-10 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
              >
                {editTransactionMutation.isPending ? (
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                ) : (
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)} 
                className="px-3 sm:px-6 h-8 sm:h-10 text-xs sm:text-sm"
                disabled={editTransactionMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}