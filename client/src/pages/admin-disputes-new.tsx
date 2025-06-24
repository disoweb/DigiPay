
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
  AlertTriangle,
  Scale,
  User,
  Clock,
  DollarSign,
  MessageSquare,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  Calendar
} from "lucide-react";

interface Dispute {
  id: number;
  amount: string;
  rate: string;
  status: string;
  dispute_reason: string;
  dispute_category: string;
  dispute_raised_by: string;
  dispute_evidence: string | null;
  dispute_created_at: string;
  buyer_email: string;
  seller_email: string;
  payment_method: string;
}

export default function AdminDisputesNew() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [resolutionAction, setResolutionAction] = useState<"approve_buyer" | "approve_seller" | "require_more_info">("approve_buyer");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: disputes = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/disputes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/disputes");
      if (!response.ok) {
        throw new Error("Failed to fetch disputes");
      }
      return response.json();
    },
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ tradeId, action, notes }: { tradeId: number; action: string; notes: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/disputes/${tradeId}/resolve`, { 
        resolution: action,
        winner: action === "approve_buyer" ? "buyer" : action === "approve_seller" ? "seller" : null,
        notes 
      });
      if (!response.ok) throw new Error("Failed to resolve dispute");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes"] });
      toast({ title: "Success", description: "Dispute resolved successfully" });
      setShowResolutionModal(false);
      setResolutionNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resolve dispute", variant: "destructive" });
    },
  });

  const filteredDisputes = disputes.filter((dispute: any) => {
    const buyerEmail = dispute.buyer?.email || dispute.buyer_email || "";
    const sellerEmail = dispute.seller?.email || dispute.seller_email || "";
    const disputeReason = dispute.disputeReason || dispute.dispute_reason || "";
    
    const matchesSearch = 
      buyerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sellerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      disputeReason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.id.toString().includes(searchTerm);
    
    const matchesFilter = filterStatus === "all" || dispute.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleViewDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowDetailSheet(true);
  };

  const handleResolveDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowResolutionModal(true);
  };

  const executeResolution = () => {
    if (!selectedDispute) return;
    resolveDisputeMutation.mutate({
      tradeId: selectedDispute.id,
      action: resolutionAction,
      notes: resolutionNotes
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disputed": return "bg-red-100 text-red-800 border-red-200";
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "expired": return "bg-red-100 text-red-800 border-red-200";
      case "cancelled": return "bg-gray-100 text-gray-800 border-gray-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "payment": return <DollarSign className="h-4 w-4" />;
      case "delivery": return <Clock className="h-4 w-4" />;
      case "communication": return <MessageSquare className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">Loading disputes...</p>
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
            <p className="text-red-600 mb-2">Error loading disputes</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Scale className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                Dispute Resolution
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage and resolve trading disputes</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search disputes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="disputed">Active Disputes</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                </SelectContent>
              </Select>
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
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Disputes</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{disputes.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {disputes.filter((d: Dispute) => d.status === 'disputed').length}
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
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Resolved</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {disputes.filter((d: Dispute) => d.status === 'resolved').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      ₦{disputes.reduce((sum, d) => sum + (parseFloat(d.amount) * parseFloat(d.rate)), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Disputes Table - Mobile Responsive */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                Disputes ({filteredDisputes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Trade ID</TableHead>
                      <TableHead className="min-w-[200px]">Participants</TableHead>
                      <TableHead className="hidden sm:table-cell">Category</TableHead>
                      <TableHead className="hidden lg:table-cell">Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Raised By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisputes.map((dispute: Dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell>
                          <div className="font-medium">#{dispute.id}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(dispute.createdAt || dispute.dispute_created_at || Date.now()).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-green-600">B:</span> {(dispute.buyer?.email || dispute.buyer_email || "Unknown").split('@')[0]}
                            </div>
                            <div className="text-sm">
                              <span className="text-red-600">S:</span> {(dispute.seller?.email || dispute.seller_email || "Unknown").split('@')[0]}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(dispute.dispute_category || "general")}
                            <span className="text-sm capitalize">{dispute.dispute_category || 'General'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">
                            <div className="font-medium">{dispute.amount || "0"} USDT</div>
                            <div className="text-gray-500">₦{dispute.rate || "0"}/USDT</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {dispute.dispute_raised_by || dispute.disputeRaisedBy || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs border ${getStatusColor(dispute.status)}`}>
                            {dispute.status === 'expired' ? 'Expired' :
                             dispute.status === 'disputed' ? 'Disputed' :
                             dispute.status === 'resolved' ? 'Resolved' :
                             dispute.status === 'cancelled' ? 'Cancelled' :
                             dispute.status === 'completed' ? 'Completed' :
                             dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDispute(dispute)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {dispute.status === 'disputed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveDispute(dispute)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                              >
                                <Scale className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredDisputes.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No disputes found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dispute Detail Sheet - Mobile Optimized */}
        <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dispute Details #{selectedDispute?.id}
              </SheetTitle>
              <SheetDescription>
                Complete dispute information and evidence
              </SheetDescription>
            </SheetHeader>
            
            {selectedDispute && (
              <div className="space-y-6 mt-6">
                {/* Trade Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Trade Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">Trade ID</label>
                        <p className="text-gray-600">#{selectedDispute.id}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Amount</label>
                        <p className="text-gray-600">{selectedDispute.amount || "0"} USDT</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Rate</label>
                        <p className="text-gray-600">₦{selectedDispute.rate || "0"}/USDT</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Payment Method</label>
                        <p className="text-gray-600 capitalize">{(selectedDispute.payment_method || selectedDispute.offer?.paymentMethod || "Unknown").replace('_', ' ')}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Total Value</label>
                        <p className="text-gray-600 font-bold">
                          ₦{(parseFloat(selectedDispute.amount || "0") * parseFloat(selectedDispute.rate || "0")).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Status</label>
                        <Badge className={`text-xs ${getStatusColor(selectedDispute.status)}`}>
                          {selectedDispute.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Participants */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Trade Participants
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600">Buyer</p>
                        <p className="font-medium text-green-700">{selectedDispute.buyer?.email || selectedDispute.buyer_email || "Unknown"}</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-gray-600">Seller</p>
                        <p className="font-medium text-red-700">{selectedDispute.seller?.email || selectedDispute.seller_email || "Unknown"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dispute Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Dispute Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="font-medium text-gray-700">Raised By</label>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {selectedDispute.dispute_raised_by || selectedDispute.disputeRaisedBy || "Unknown"}
                      </Badge>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Category</label>
                      <div className="flex items-center gap-2 mt-1">
                        {getCategoryIcon(selectedDispute.dispute_category || "general")}
                        <span className="text-sm capitalize">{selectedDispute.dispute_category || 'General'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Dispute Date</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{new Date(selectedDispute.dispute_created_at || selectedDispute.createdAt || Date.now()).toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Reason</label>
                      <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">
                        {selectedDispute.dispute_reason || selectedDispute.disputeReason || "No reason provided"}
                      </p>
                    </div>
                    {selectedDispute.dispute_evidence && (
                      <div>
                        <label className="font-medium text-gray-700">Evidence</label>
                        <p className="text-sm text-gray-600 mt-1">
                          Evidence files attached (Admin panel required to view)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                {selectedDispute.status === 'disputed' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Quick Resolution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => {
                            setResolutionAction("approve_buyer");
                            handleResolveDispute(selectedDispute);
                          }}
                          variant="outline" 
                          size="sm" 
                          className="text-green-600 border-green-300"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Favor Buyer
                        </Button>
                        <Button 
                          onClick={() => {
                            setResolutionAction("approve_seller");
                            handleResolveDispute(selectedDispute);
                          }}
                          variant="outline" 
                          size="sm" 
                          className="text-blue-600 border-blue-300"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Favor Seller
                        </Button>
                      </div>
                      <Button 
                        onClick={() => {
                          setResolutionAction("require_more_info");
                          handleResolveDispute(selectedDispute);
                        }}
                        variant="outline" 
                        size="sm" 
                        className="w-full text-yellow-600 border-yellow-300"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Request More Info
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Resolution Modal */}
        <Dialog open={showResolutionModal} onOpenChange={setShowResolutionModal}>
          <DialogContent className="max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Resolve Dispute #{selectedDispute?.id}
              </DialogTitle>
              <DialogDescription>
                Choose the resolution action and provide detailed notes
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Resolution Action</Label>
                <Select value={resolutionAction} onValueChange={(value: any) => setResolutionAction(value)}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve_buyer">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Favor Buyer - Release funds to buyer
                      </div>
                    </SelectItem>
                    <SelectItem value="approve_seller">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        Favor Seller - Return funds to seller
                      </div>
                    </SelectItem>
                    <SelectItem value="require_more_info">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-yellow-600" />
                        Request More Information
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-sm font-medium">Admin Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Provide detailed explanation for this resolution..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                  className="mt-1 text-sm"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={executeResolution} 
                  className="flex-1"
                  disabled={!resolutionNotes.trim()}
                >
                  {resolutionAction === "require_more_info" ? "Send Request" : "Resolve Dispute"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowResolutionModal(false)} 
                  className="flex-1"
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
