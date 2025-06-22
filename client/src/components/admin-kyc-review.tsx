import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  User, 
  FileText,
  Calendar,
  MapPin,
  CreditCard
} from "lucide-react";

interface PendingVerification {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  submittedAt: string;
  status: string;
  idType: string;
  createdAt: string;
}

interface KYCDetails {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  residentialType?: string;
  idType: string;
  idNumber: string;
  nin?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  selfieUrl?: string;
  proofOfAddressUrl?: string;
  status: string;
  createdAt: string;
}

export function AdminKYCReview() {
  const { toast } = useToast();
  const [selectedVerification, setSelectedVerification] = useState<number | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data: pendingVerifications = [], isLoading } = useQuery({
    queryKey: ['/api/admin/kyc/pending'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/kyc/pending");
      if (!response.ok) {
        throw new Error('Failed to fetch pending verifications');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: kycDetails } = useQuery({
    queryKey: [`/api/kyc`, selectedVerification],
    queryFn: async () => {
      if (!selectedVerification) return null;
      const response = await apiRequest("GET", `/api/kyc`);
      if (!response.ok) {
        throw new Error('Failed to fetch KYC details');
      }
      return response.json();
    },
    enabled: !!selectedVerification,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ userId, action, rejectionReason, adminNotes }: {
      userId: number;
      action: 'approve' | 'reject';
      rejectionReason?: string;
      adminNotes?: string;
    }) => {
      const response = await apiRequest("POST", `/api/admin/kyc/${userId}/review`, {
        action,
        rejectionReason,
        adminNotes
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to review KYC');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "KYC Review Complete",
        description: `Verification ${variables.action}d successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kyc/pending'] });
      setSelectedVerification(null);
      setReviewAction(null);
      setRejectionReason('');
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast({
        title: "Review Failed",
        description: error.message || "Failed to review KYC",
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
      userId: selectedVerification,
      action: reviewAction,
      rejectionReason: rejectionReason.trim() || undefined,
      adminNotes: adminNotes.trim() || undefined,
    });
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending verifications...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending KYC Verifications ({pendingVerifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingVerifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p>No pending verifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVerifications.map((verification: PendingVerification) => (
                <div
                  key={verification.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {verification.firstName} {verification.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{verification.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{verification.idType}</Badge>
                        <span className="text-xs text-gray-500">
                          Submitted {formatDate(verification.submittedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVerification(verification.userId)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          KYC Verification Review - {verification.firstName} {verification.lastName}
                        </DialogTitle>
                        <DialogDescription>
                          Review the submitted verification documents and information
                        </DialogDescription>
                      </DialogHeader>
                      
                      {kycDetails && (
                        <div className="space-y-6">
                          {/* Personal Information */}
                          <div>
                            <h3 className="font-medium flex items-center gap-2 mb-3">
                              <User className="h-4 w-4" />
                              Personal Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-gray-600">Full Name</Label>
                                <p className="font-medium">
                                  {kycDetails.data?.firstName} {kycDetails.data?.middleName} {kycDetails.data?.lastName}
                                </p>
                              </div>
                              <div>
                                <Label className="text-gray-600">Date of Birth</Label>
                                <p className="font-medium">{kycDetails.data?.dateOfBirth}</p>
                              </div>
                              <div>
                                <Label className="text-gray-600">Gender</Label>
                                <p className="font-medium capitalize">{kycDetails.data?.gender}</p>
                              </div>
                            </div>
                          </div>

                          {/* Address Information */}
                          <div>
                            <h3 className="font-medium flex items-center gap-2 mb-3">
                              <MapPin className="h-4 w-4" />
                              Address Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-gray-600">Street Address</Label>
                                <p className="font-medium">{kycDetails.data?.street}</p>
                              </div>
                              <div>
                                <Label className="text-gray-600">City</Label>
                                <p className="font-medium">{kycDetails.data?.city}</p>
                              </div>
                              <div>
                                <Label className="text-gray-600">State</Label>
                                <p className="font-medium capitalize">{kycDetails.data?.state}</p>
                              </div>
                              <div>
                                <Label className="text-gray-600">Country</Label>
                                <p className="font-medium">{kycDetails.data?.country}</p>
                              </div>
                            </div>
                          </div>

                          {/* Identity Information */}
                          <div>
                            <h3 className="font-medium flex items-center gap-2 mb-3">
                              <CreditCard className="h-4 w-4" />
                              Identity Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-gray-600">ID Type</Label>
                                <p className="font-medium">{kycDetails.data?.idType}</p>
                              </div>
                              <div>
                                <Label className="text-gray-600">ID Number</Label>
                                <p className="font-medium">{kycDetails.data?.idNumber}</p>
                              </div>
                              {kycDetails.data?.nin && (
                                <div>
                                  <Label className="text-gray-600">NIN</Label>
                                  <p className="font-medium">{kycDetails.data.nin}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Documents */}
                          <div>
                            <h3 className="font-medium flex items-center gap-2 mb-3">
                              <FileText className="h-4 w-4" />
                              Uploaded Documents
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              {kycDetails.data?.idFrontUrl && (
                                <div>
                                  <Label className="text-gray-600">ID Front</Label>
                                  <img
                                    src={kycDetails.data.idFrontUrl}
                                    alt="ID Front"
                                    className="w-full h-32 object-cover rounded border mt-1"
                                  />
                                </div>
                              )}
                              {kycDetails.data?.idBackUrl && (
                                <div>
                                  <Label className="text-gray-600">ID Back</Label>
                                  <img
                                    src={kycDetails.data.idBackUrl}
                                    alt="ID Back"
                                    className="w-full h-32 object-cover rounded border mt-1"
                                  />
                                </div>
                              )}
                              {kycDetails.data?.selfieUrl && (
                                <div>
                                  <Label className="text-gray-600">Selfie</Label>
                                  <img
                                    src={kycDetails.data.selfieUrl}
                                    alt="Selfie"
                                    className="w-full h-32 object-cover rounded border mt-1"
                                  />
                                </div>
                              )}
                              {kycDetails.data?.proofOfAddressUrl && (
                                <div>
                                  <Label className="text-gray-600">Proof of Address</Label>
                                  <img
                                    src={kycDetails.data.proofOfAddressUrl}
                                    alt="Proof of Address"
                                    className="w-full h-32 object-cover rounded border mt-1"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Review Actions */}
                          <div className="space-y-4 pt-4 border-t">
                            <div>
                              <Label>Admin Notes (Optional)</Label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add any notes about this verification..."
                                className="mt-1"
                              />
                            </div>

                            {reviewAction === 'reject' && (
                              <div>
                                <Label>Rejection Reason *</Label>
                                <Textarea
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Explain why this verification is being rejected..."
                                  className="mt-1"
                                  required
                                />
                              </div>
                            )}

                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setReviewAction('reject');
                                  if (reviewAction === 'reject') handleReview();
                                }}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                disabled={reviewMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {reviewAction === 'reject' ? 'Confirm Reject' : 'Reject'}
                              </Button>
                              <Button
                                onClick={() => {
                                  setReviewAction('approve');
                                  handleReview();
                                }}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={reviewMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {reviewMutation.isPending ? 'Processing...' : 'Approve'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}