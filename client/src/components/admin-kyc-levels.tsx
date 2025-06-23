import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Users,
  TrendingUp,
  FileText,
  Eye
} from "lucide-react";

interface PendingVerification {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  level: number;
  status: string;
  submittedAt: string;
  createdAt: string;
}

export function AdminKYCLevels() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch KYC statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/kyc/stats'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/kyc/stats");
      if (!response.ok) throw new Error("Failed to fetch KYC stats");
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Fetch pending verifications for each level
  const { data: level1Pending = [] } = useQuery({
    queryKey: ['/api/admin/kyc/pending/level/1'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/kyc/pending/level/1");
      if (!response.ok) throw new Error("Failed to fetch Level 1 pending");
      return response.json();
    },
    refetchInterval: 15000,
  });

  const { data: level2Pending = [] } = useQuery({
    queryKey: ['/api/admin/kyc/pending/level/2'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/kyc/pending/level/2");
      if (!response.ok) throw new Error("Failed to fetch Level 2 pending");
      return response.json();
    },
    refetchInterval: 15000,
  });

  const { data: level3Pending = [] } = useQuery({
    queryKey: ['/api/admin/kyc/pending/level/3'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/kyc/pending/level/3");
      if (!response.ok) throw new Error("Failed to fetch Level 3 pending");
      return response.json();
    },
    refetchInterval: 15000,
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ userId, level, action, rejectionReason, adminNotes }: {
      userId: number;
      level: number;
      action: 'approve' | 'reject';
      rejectionReason?: string;
      adminNotes?: string;
    }) => {
      const response = await apiRequest("POST", `/api/admin/kyc/${userId}/level/${level}/review`, {
        action,
        rejectionReason,
        adminNotes
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Review failed");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Review Completed",
        description: `Level ${variables.level} KYC ${variables.action}d successfully`,
      });
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kyc/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kyc/pending/level/1'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kyc/pending/level/2'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kyc/pending/level/3'] });
      
      // Close dialogs
      setSelectedVerification(null);
      setReviewAction(null);
      setRejectionReason('');
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast({
        title: "Review Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReview = () => {
    if (!selectedVerification || !reviewAction) return;

    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    reviewMutation.mutate({
      userId: selectedVerification.userId,
      level: selectedVerification.level,
      action: reviewAction,
      rejectionReason: rejectionReason.trim(),
      adminNotes: adminNotes.trim()
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderVerificationCard = (verification: PendingVerification) => (
    <Card key={verification.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium">
              {verification.firstName} {verification.lastName}
            </h4>
            <p className="text-sm text-gray-600">{verification.email}</p>
          </div>
          {getStatusBadge(verification.status)}
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          <p>Submitted: {formatDate(verification.submittedAt)}</p>
          <p>Level: {verification.level}</p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedVerification(verification)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Level 3 Users</p>
                  <p className="text-2xl font-bold text-green-600">{stats.usersByLevel.level3}</p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.totalPending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verification Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round((stats.usersByLevel.level1 + stats.usersByLevel.level2 + stats.usersByLevel.level3) / stats.totalUsers * 100)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Verifications by Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Verifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="level1" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="level1" className="relative">
                Level 1
                {level1Pending.length > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-800 text-xs">
                    {level1Pending.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="level2" className="relative">
                Level 2
                {level2Pending.length > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-800 text-xs">
                    {level2Pending.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="level3" className="relative">
                Level 3
                {level3Pending.length > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-800 text-xs">
                    {level3Pending.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="level1" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {level1Pending.length > 0 ? (
                  level1Pending.map(renderVerificationCard)
                ) : (
                  <p className="text-gray-500 col-span-full text-center py-8">
                    No pending Level 1 verifications
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="level2" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {level2Pending.length > 0 ? (
                  level2Pending.map(renderVerificationCard)
                ) : (
                  <p className="text-gray-500 col-span-full text-center py-8">
                    No pending Level 2 verifications
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="level3" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {level3Pending.length > 0 ? (
                  level3Pending.map(renderVerificationCard)
                ) : (
                  <p className="text-gray-500 col-span-full text-center py-8">
                    No pending Level 3 verifications
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Review Level {selectedVerification?.level} KYC - {selectedVerification?.firstName} {selectedVerification?.lastName}
            </DialogTitle>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Email:</strong> {selectedVerification.email}</p>
                  <p><strong>Level:</strong> {selectedVerification.level}</p>
                </div>
                <div>
                  <p><strong>Submitted:</strong> {formatDate(selectedVerification.submittedAt)}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedVerification.status)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Admin Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes about this verification..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              {reviewAction === 'reject' && (
                <div className="space-y-3">
                  <Label>Rejection Reason *</Label>
                  <Textarea
                    placeholder="Please provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="border-red-200 focus:border-red-500"
                  />
                </div>
              )}

              <div className="flex justify-between pt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setReviewAction('approve')}
                    className={reviewAction === 'approve' ? 'bg-green-50 border-green-500' : ''}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setReviewAction('reject')}
                    className={reviewAction === 'reject' ? 'bg-red-50 border-red-500' : ''}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedVerification(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReview}
                    disabled={!reviewAction || reviewMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {reviewMutation.isPending ? "Processing..." : "Submit Review"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}