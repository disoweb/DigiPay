import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Flag,
  Shield,
  User,
  DollarSign,
  Calendar,
  FileText,
  Eye,
  Scale,
  Filter,
  Search,
  Download,
  RefreshCw,
  MessageSquare,
  Camera,
  Gavel,
  TrendingUp,
  Users,
  AlertCircle
} from "lucide-react";

interface Dispute {
  id: number;
  amount: string;
  rate: string;
  status: string;
  disputeReason: string;
  disputeCategory: string;
  disputeRaisedBy: string;
  disputeCreatedAt: string;
  evidence: any[];
  buyer: { id: number; email: string; };
  seller: { id: number; email: string; };
  offer: { paymentMethod: string; };
  resolutionHistory: any[];
  adminNotes?: string;
  disputeResolution?: string;
  disputeWinner?: string;
  lastAdminUpdate?: string;
  resolvedBy?: number;
  resolvedAt?: string;
}

const PRIORITY_LEVELS = {
  high: { color: "bg-red-100 text-red-800", label: "High Priority" },
  medium: { color: "bg-yellow-100 text-yellow-800", label: "Medium Priority" },
  low: { color: "bg-blue-100 text-blue-800", label: "Low Priority" }
};

const RESOLUTION_ACTIONS = [
  { value: 'release_to_buyer', label: 'Release to Buyer', icon: User, description: 'Buyer receives USDT' },
  { value: 'return_to_seller', label: 'Return to Seller', icon: User, description: 'Seller keeps USDT' },
  { value: 'partial_settlement', label: 'Partial Settlement', icon: Scale, description: 'Split resolution' },
  { value: 'request_more_info', label: 'Request More Info', icon: MessageSquare, description: 'Need clarification' },
  { value: 'escalate_case', label: 'Escalate Case', icon: AlertTriangle, description: 'Senior review needed' }
];

export default function AdminDisputesV2() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [resolutionAction, setResolutionAction] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: disputes = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/disputes/enhanced"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/disputes/enhanced");
      if (!response.ok) throw new Error("Failed to fetch disputes");
      return response.json();
    },
  });

  const resolutionMutation = useMutation({
    mutationFn: async ({ disputeId, action, notes }: { disputeId: number; action: string; notes: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/disputes/${disputeId}/resolve`, {
        action,
        notes,
        timestamp: new Date().toISOString()
      });
      if (!response.ok) throw new Error("Failed to resolve dispute");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes/enhanced"] });
      toast({ title: "Success", description: "Dispute resolved successfully" });
      setShowResolutionDialog(false);
      setAdminNotes("");
      setResolutionAction("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resolve dispute", variant: "destructive" });
    },
  });

  const getDisputePriority = (dispute: Dispute) => {
    const categoryPriority: { [key: string]: string } = {
      'payment_not_received': 'high',
      'payment_not_sent': 'high',
      'fake_payment_proof': 'high',
      'wrong_amount': 'medium',
      'delayed_payment': 'medium',
      'account_details_wrong': 'medium',
      'communication_issue': 'low',
      'other': 'medium'
    };
    return categoryPriority[dispute.disputeCategory] || 'medium';
  };

  const getTimeSinceCreated = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just created";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const filteredDisputes = disputes.filter((dispute: Dispute) => {
    const matchesSearch = 
      dispute.buyer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.seller?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.disputeReason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || getDisputePriority(dispute) === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const activeDisputes = disputes.filter((d: Dispute) => d.status === 'disputed').length;
  const resolvedDisputes = disputes.filter((d: Dispute) => d.status === 'resolved').length;
  const totalValue = disputes.reduce((sum: number, d: Dispute) => sum + (parseFloat(d.amount) * parseFloat(d.rate)), 0);

  const handleResolveDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowResolutionDialog(true);
  };

  const executeResolution = async () => {
    if (!selectedDispute || !resolutionAction) return;
    
    setIsProcessing(true);
    try {
      await resolutionMutation.mutateAsync({
        disputeId: selectedDispute.id,
        action: resolutionAction,
        notes: adminNotes
      });
    } finally {
      setIsProcessing(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dispute Management</h1>
              <p className="text-gray-600">Monitor and resolve trade disputes</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Disputes</p>
                  <p className="text-2xl font-bold text-gray-900">{disputes.length}</p>
                </div>
                <Flag className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Cases</p>
                  <p className="text-2xl font-bold text-red-600">{activeDisputes}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{resolvedDisputes}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-blue-600">₦{totalValue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search disputes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="disputed">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disputes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Disputes ({filteredDisputes.length})</CardTitle>
            <CardDescription>
              Monitor and resolve ongoing trade disputes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisputes.map((dispute: Dispute) => {
                    const priority = getDisputePriority(dispute);
                    const priorityConfig = PRIORITY_LEVELS[priority as keyof typeof PRIORITY_LEVELS];

                    return (
                      <TableRow key={dispute.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium">#{dispute.id}</div>
                            <div className="text-sm text-gray-500">
                              Trade #{dispute.id}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-green-600 font-medium">B:</span> {dispute.buyer?.email?.split('@')[0] || 'Unknown'}
                            </div>
                            <div className="text-sm">
                              <span className="text-red-600 font-medium">S:</span> {dispute.seller?.email?.split('@')[0] || 'Unknown'}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {dispute.disputeCategory?.replace('_', ' ') || 'Other'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge className={`${priorityConfig.color} text-xs`}>
                            {priorityConfig.label}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{dispute.amount} USDT</div>
                            <div className="text-gray-500">₦{parseFloat(dispute.rate).toLocaleString()}</div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {getTimeSinceCreated(dispute.disputeCreatedAt)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge 
                            className={
                              dispute.status === 'disputed' ? 'bg-red-100 text-red-800' :
                              dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {dispute.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedDispute(dispute)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {dispute.status === 'disputed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveDispute(dispute)}
                                className="h-8 w-8 p-0 text-blue-600"
                              >
                                <Gavel className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

        {/* Resolution Dialog */}
        <Dialog open={showResolutionDialog} onOpenChange={setShowResolutionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Resolve Dispute #{selectedDispute?.id}
              </DialogTitle>
              <DialogDescription>
                Choose a resolution action for this dispute case
              </DialogDescription>
            </DialogHeader>

            {selectedDispute && (
              <div className="space-y-6">
                {/* Case Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Case Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Amount:</span> {selectedDispute.amount} USDT
                    </div>
                    <div>
                      <span className="text-gray-600">Value:</span> ₦{(parseFloat(selectedDispute.amount) * parseFloat(selectedDispute.rate)).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-gray-600">Category:</span> {selectedDispute.disputeCategory?.replace('_', ' ')}
                    </div>
                    <div>
                      <span className="text-gray-600">Raised by:</span> {selectedDispute.disputeRaisedBy}
                    </div>
                  </div>
                  {selectedDispute.disputeReason && (
                    <div className="mt-3">
                      <span className="text-gray-600">Reason:</span>
                      <p className="text-sm mt-1 p-2 bg-white rounded border">
                        {selectedDispute.disputeReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Resolution Action */}
                <div>
                  <Label className="text-base font-medium">Resolution Action</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {RESOLUTION_ACTIONS.map((action) => (
                      <div
                        key={action.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          resolutionAction === action.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setResolutionAction(action.value)}
                      >
                        <div className="flex items-center gap-3">
                          <action.icon className="h-4 w-4 text-gray-600" />
                          <div>
                            <div className="font-medium text-sm">{action.label}</div>
                            <div className="text-xs text-gray-500">{action.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <Label className="text-base font-medium">Resolution Notes</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Provide detailed reasoning for this resolution decision..."
                    rows={4}
                    className="mt-2 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowResolutionDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={executeResolution}
                    disabled={!resolutionAction || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Gavel className="h-4 w-4 mr-2" />
                        Apply Resolution
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}