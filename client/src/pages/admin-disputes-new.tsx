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
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  XCircle,
  Search,
  Clock
} from "lucide-react";

interface Dispute {
  id: number;
  amount: string;
  rate: string;
  status: string;
  dispute_reason: string;
  dispute_category: string;
  dispute_raised_by: string;
  dispute_evidence: string;
  dispute_created_at: string;
  buyer_email: string;
  seller_email: string;
  payment_method: string;
}

export default function AdminDisputes() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState<"release" | "refund">("release");
  const [adminNotes, setAdminNotes] = useState("");

  const { data: disputes = [], isLoading, error } = useQuery<Dispute[]>({
    queryKey: ["/api/admin/disputes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/disputes");
      if (!response.ok) throw new Error("Failed to fetch disputes");
      return response.json();
    },
    refetchInterval: 30000,
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ tradeId, action, adminNotes }: { tradeId: number; action: "release" | "refund"; adminNotes: string }) => {
      const response = await apiRequest("POST", `/api/admin/disputes/${tradeId}/resolve`, { action, adminNotes });
      if (!response.ok) throw new Error("Failed to resolve dispute");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes"] });
      toast({ title: "Success", description: "Dispute resolved successfully" });
      setShowResolveModal(false);
      setAdminNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resolve dispute", variant: "destructive" });
    },
  });

  const filteredDisputes = disputes.filter(dispute =>
    dispute.buyer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.seller_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.id.toString().includes(searchTerm)
  );

  const handleResolve = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowResolveModal(true);
  };

  const executeResolution = () => {
    if (!selectedDispute) return;

    resolveDisputeMutation.mutate({
      tradeId: selectedDispute.id,
      action: resolution,
      adminNotes: adminNotes
    });
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
            <p className="text-red-600">Error loading disputes</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Dispute Resolution</h1>
              <p className="text-gray-600">Manage and resolve trade disputes</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search disputes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          {/* Disputes Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Disputes</p>
                    <p className="text-2xl font-bold text-gray-900">{disputes.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {disputes.filter(d => d.status === "disputed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {disputes.filter(d => d.status === "completed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {disputes.filter(d => d.status === "cancelled").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Disputes Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Disputes ({filteredDisputes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trade ID</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell>
                          <div className="font-medium">#{dispute.id}</div>
                          <div className="text-sm text-gray-500">
                            {dispute.dispute_category}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div><strong>Buyer:</strong> {dispute.buyer_email}</div>
                            <div><strong>Seller:</strong> {dispute.seller_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{dispute.amount} USDT</div>
                            <div className="text-gray-500">₦{parseFloat(dispute.rate).toLocaleString()}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {dispute.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              dispute.status === "disputed" ? "destructive" :
                              dispute.status === "completed" ? "default" : "secondary"
                            }
                          >
                            {dispute.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(dispute.dispute_created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolve(dispute)}
                              disabled={dispute.status !== "disputed"}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Resolve
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

        {/* Resolve Dispute Modal */}
        <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Resolve Dispute</DialogTitle>
              <DialogDescription>
                {selectedDispute && `Dispute for Trade #${selectedDispute.id}`}
              </DialogDescription>
            </DialogHeader>
            
            {selectedDispute && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Trade Details</label>
                    <div className="text-sm text-gray-600">
                      <p>Amount: {selectedDispute.amount} USDT</p>
                      <p>Rate: ₦{selectedDispute.rate}</p>
                      <p>Category: {selectedDispute.dispute_category}</p>
                      <p>Raised by: {selectedDispute.dispute_raised_by}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dispute Info</label>
                    <div className="text-sm text-gray-600">
                      <p>Method: {selectedDispute.payment_method}</p>
                      <p>Reason: {selectedDispute.dispute_reason}</p>
                      <p>Evidence: {selectedDispute.dispute_evidence}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Resolution Action</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="release"
                          checked={resolution === "release"}
                          onChange={(e) => setResolution(e.target.value as "release" | "refund")}
                          className="mr-2"
                        />
                        Release funds to buyer
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="refund"
                          checked={resolution === "refund"}
                          onChange={(e) => setResolution(e.target.value as "release" | "refund")}
                          className="mr-2"
                        />
                        Refund to seller
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Admin Notes</label>
                    <Textarea
                      placeholder="Explain the resolution decision..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={executeResolution} 
                      disabled={!adminNotes.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Resolve Dispute
                    </Button>
                    <Button variant="outline" onClick={() => setShowResolveModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}