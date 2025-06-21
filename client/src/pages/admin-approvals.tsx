import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, DollarSign, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import type { Transaction } from "@shared/schema";

type EnrichedTransaction = Transaction & {
  user: {
    id: number;
    email: string;
  } | null;
};

export default function AdminApprovals() {
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<EnrichedTransaction | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");

  const { data: transactions = [], isLoading } = useQuery<EnrichedTransaction[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/transactions", {
        credentials: 'include',
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to load transactions");
      }
      
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: number; action: "approve" | "reject"; notes: string }) => {
      await apiRequest("POST", `/api/admin/transactions/${id}/${action}`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({
        title: "Success",
        description: `Transaction ${approvalAction}d successfully`,
      });
      setShowApprovalModal(false);
      setSelectedTransaction(null);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process transaction",
        variant: "destructive",
      });
    },
  });

  const handleApproval = (transaction: EnrichedTransaction, action: "approve" | "reject") => {
    setSelectedTransaction(transaction);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const confirmApproval = () => {
    if (selectedTransaction) {
      approvalMutation.mutate({
        id: selectedTransaction.id,
        action: approvalAction,
        notes: adminNotes
      });
    }
  };

  const pendingWithdrawals = transactions.filter(t => t.type === "withdrawal" && t.status === "pending");
  const pendingDeposits = transactions.filter(t => t.type === "deposit" && t.status === "pending");
  const processedTransactions = transactions.filter(t => t.status !== "pending");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Transaction Approvals</h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span>{pendingWithdrawals.length + pendingDeposits.length} Pending</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="withdrawals" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="withdrawals" className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Withdrawals ({pendingWithdrawals.length})
            </TabsTrigger>
            <TabsTrigger value="deposits" className="flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              Deposits ({pendingDeposits.length})
            </TabsTrigger>
            <TabsTrigger value="processed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Processed ({processedTransactions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals" className="space-y-4">
            {pendingWithdrawals.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ArrowUpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending withdrawal requests</p>
                </CardContent>
              </Card>
            ) : (
              pendingWithdrawals.map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-red-600" />
                          <span className="font-semibold text-lg">₦{parseFloat(transaction.amount).toLocaleString()}</span>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          User: {transaction.user?.email || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Bank: {transaction.bankName} - {transaction.accountNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          Account: {transaction.accountName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Requested: {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproval(transaction, "approve")}
                          disabled={approvalMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleApproval(transaction, "reject")}
                          disabled={approvalMutation.isPending}
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          size="sm"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="deposits" className="space-y-4">
            {pendingDeposits.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ArrowDownCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending deposit requests</p>
                </CardContent>
              </Card>
            ) : (
              pendingDeposits.map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-lg">₦{parseFloat(transaction.amount).toLocaleString()}</span>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          User: {transaction.user?.email || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          Requested: {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproval(transaction, "approve")}
                          disabled={approvalMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleApproval(transaction, "reject")}
                          disabled={approvalMutation.isPending}
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          size="sm"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="processed" className="space-y-4">
            {processedTransactions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No processed transactions</p>
                </CardContent>
              </Card>
            ) : (
              processedTransactions.slice(0, 20).map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <DollarSign className={`h-4 w-4 ${transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`} />
                          <span className="font-medium">₦{parseFloat(transaction.amount).toLocaleString()}</span>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {transaction.user?.email || "Unknown"} • {transaction.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                        {transaction.adminNotes && (
                          <p className="text-xs text-gray-600 italic">
                            Note: {transaction.adminNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction === "approve" ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {approvalAction === "approve" ? "Approve" : "Reject"} Transaction
            </DialogTitle>
            <DialogDescription>
              {selectedTransaction && (
                <>
                  {approvalAction === "approve" ? "Approving" : "Rejecting"} ₦{parseFloat(selectedTransaction.amount).toLocaleString()} {selectedTransaction.type} for {selectedTransaction.user?.email}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Admin Notes {approvalAction === "reject" && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={approvalAction === "approve" ? "Optional notes..." : "Please provide reason for rejection..."}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={confirmApproval}
              disabled={approvalMutation.isPending || (approvalAction === "reject" && !adminNotes.trim())}
              className={approvalAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {approvalMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                `${approvalAction === "approve" ? "Approve" : "Reject"} Transaction`
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowApprovalModal(false)}
              disabled={approvalMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}