import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  DollarSign,
  FileText
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
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState<"release" | "refund">("release");
  const [winner, setWinner] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const { data: disputes = [], isLoading } = useQuery<Dispute[]>({
    queryKey: ["/api/admin/disputes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/disputes");
      if (!response.ok) throw new Error("Failed to fetch disputes");
      return response.json();
    },
    refetchInterval: 30000,
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ tradeId, resolution, winner, notes }: { 
      tradeId: number; 
      resolution: string; 
      winner: string; 
      notes: string; 
    }) => {
      const response = await apiRequest("PATCH", `/api/admin/disputes/${tradeId}/resolve`, {
        resolution,
        winner,
        notes
      });
      if (!response.ok) throw new Error("Failed to resolve dispute");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes"] });
      toast({ title: "Success", description: "Dispute resolved successfully" });
      setShowResolveModal(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resolve dispute", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSelectedDispute(null);
    setResolution("release");
    setWinner("");
    setAdminNotes("");
  };

  const handleResolveDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowResolveModal(true);
  };

  const executeResolution = () => {
    if (!selectedDispute) return;

    resolveDisputeMutation.mutate({
      tradeId: selectedDispute.id,
      resolution,
      winner,
      notes: adminNotes
    });
  };

  const formatCurrency = (amount: string) => {
    return `₦${parseFloat(amount).toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
              <p className="text-gray-600">Resolve trade disputes and manage conflict resolution</p>
            </div>
          </div>

          {/* Dispute Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Disputes</p>
                    <p className="text-2xl font-bold text-gray-900">{disputes.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{disputes.reduce((sum, d) => sum + (parseFloat(d.amount) * parseFloat(d.rate)), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Payment Issues</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {disputes.filter(d => d.dispute_category?.includes('payment')).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg. Age</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {disputes.length > 0 ? 
                        Math.round(
                          disputes.reduce((sum, d) => 
                            sum + (Date.now() - new Date(d.dispute_created_at).getTime()), 0
                          ) / disputes.length / (1000 * 60 * 60 * 24)
                        ) : 0
                      }d
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Disputes Table */}
          <Card>
            <CardHeader>
              <CardTitle>Active Disputes ({disputes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {disputes.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Disputes</h3>
                  <p className="text-gray-600">All disputes have been resolved!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trade Details</TableHead>
                        <TableHead>Parties</TableHead>
                        <TableHead>Dispute Info</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disputes.map((dispute) => (
                        <TableRow key={dispute.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">Trade #{dispute.id}</div>
                              <div className="text-sm text-gray-500">
                                {dispute.payment_method}
                              </div>
                              <Badge variant="outline" className="mt-1">
                                {dispute.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="font-medium">Buyer:</span> {dispute.buyer_email}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Seller:</span> {dispute.seller_email}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Raised by: {dispute.dispute_raised_by}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{dispute.dispute_category}</div>
                              <div className="text-sm text-gray-600 max-w-xs truncate">
                                {dispute.dispute_reason}
                              </div>
                              {dispute.dispute_evidence && (
                                <Badge variant="outline" className="mt-1">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Evidence
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {parseFloat(dispute.amount).toFixed(2)} USDT
                              </div>
                              <div className="text-sm text-gray-500">
                                @ {formatCurrency(dispute.rate)}/USDT
                              </div>
                              <div className="font-medium text-green-600">
                                {formatCurrency((parseFloat(dispute.amount) * parseFloat(dispute.rate)).toString())}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(dispute.dispute_created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.floor((Date.now() - new Date(dispute.dispute_created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleResolveDispute(dispute)}
                              className="w-full"
                            >
                              Resolve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resolve Dispute Modal */}
        <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Resolve Dispute</DialogTitle>
              <DialogDescription>
                {selectedDispute && `Trade #${selectedDispute.id} - ${selectedDispute.buyer_email} vs ${selectedDispute.seller_email}`}
              </DialogDescription>
            </DialogHeader>
            
            {selectedDispute && (
              <div className="space-y-6">
                {/* Dispute Details */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <label className="text-sm font-medium">Dispute Reason</label>
                    <p className="text-sm text-gray-600">{selectedDispute.dispute_reason}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <p className="text-sm text-gray-600">{selectedDispute.dispute_category}</p>
                  </div>
                  {selectedDispute.dispute_evidence && (
                    <div>
                      <label className="text-sm font-medium">Evidence</label>
                      <p className="text-sm text-gray-600">{selectedDispute.dispute_evidence}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <p className="text-sm text-gray-600">{parseFloat(selectedDispute.amount).toFixed(2)} USDT</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Total Value</label>
                      <p className="text-sm text-gray-600">
                        {formatCurrency((parseFloat(selectedDispute.amount) * parseFloat(selectedDispute.rate)).toString())}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resolution Form */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Resolution</label>
                    <Select value={resolution} onValueChange={(value: "release" | "refund") => setResolution(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="release">Release funds to seller</SelectItem>
                        <SelectItem value="refund">Refund to buyer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Winner</label>
                    <Select value={winner} onValueChange={setWinner}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select winner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer ({selectedDispute.buyer_email})</SelectItem>
                        <SelectItem value="seller">Seller ({selectedDispute.seller_email})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Admin Notes</label>
                    <Textarea
                      placeholder="Add resolution notes for record keeping..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={executeResolution} 
                      disabled={!winner || !adminNotes.trim()}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve Dispute
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowResolveModal(false);
                        resetForm();
                      }}
                    >
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