import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  Eye, 
  Flag, 
  CheckCircle,
  XCircle,
  FileText,
  Camera,
  Upload
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Trade {
  id: number;
  status: string;
  disputeReason?: string;
  disputeCategory?: string;
  disputeRaisedBy?: string;
  disputeEvidence?: string;
  disputeCreatedAt?: string;
  adminNotes?: string;
  buyerId: number;
  sellerId: number;
}

interface EnhancedDisputeSystemProps {
  trade: Trade;
  currentUserId: number;
  onDisputeUpdated: () => void;
}

export function EnhancedDisputeSystem({ trade, currentUserId, onDisputeUpdated }: EnhancedDisputeSystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeCategory, setDisputeCategory] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");

  const userRole = trade.buyerId === currentUserId ? 'buyer' : 'seller';

  const disputeCategories = [
    { value: "payment_not_received", label: "Payment Not Received", description: "Expected payment has not arrived" },
    { value: "payment_not_made", label: "Payment Not Made", description: "Other party claims non-payment" },
    { value: "wrong_payment_details", label: "Wrong Payment Details", description: "Incorrect bank details provided" },
    { value: "fake_payment_proof", label: "Fake Payment Proof", description: "Suspicious payment evidence" },
    { value: "communication_issues", label: "Communication Problems", description: "Unresponsive or hostile behavior" },
    { value: "account_issues", label: "Account Problems", description: "Bank account or technical issues" },
    { value: "other", label: "Other Issues", description: "Any other legitimate concern" }
  ];

  const submitDisputeMutation = useMutation({
    mutationFn: async (data: { reason: string; category: string; additionalInfo?: string }) => {
      const response = await apiRequest("POST", `/api/trades/${trade.id}/dispute`, {
        reason: data.reason,
        category: data.category,
        raisedBy: userRole,
        additionalInfo: data.additionalInfo
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Dispute Submitted", 
        description: "Your dispute has been submitted for admin review. Expected resolution: 24-48 hours." 
      });
      setShowDisputeModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${trade.id}`] });
      onDisputeUpdated();
    },
    onError: (error: any) => {
      toast({ 
        title: "Dispute Failed", 
        description: error.message || "Failed to submit dispute", 
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setDisputeReason("");
    setDisputeCategory("");
    setEvidenceFiles([]);
    setAdditionalInfo("");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + evidenceFiles.length > 5) {
      toast({
        title: "Too many files",
        description: "Maximum 5 evidence files allowed",
        variant: "destructive",
      });
      return;
    }
    setEvidenceFiles([...evidenceFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  const handleDisputeSubmit = () => {
    if (!disputeReason.trim() || !disputeCategory) {
      toast({ 
        title: "Missing Information", 
        description: "Please provide dispute reason and category", 
        variant: "destructive" 
      });
      return;
    }

    if (disputeReason.length < 50) {
      toast({ 
        title: "Insufficient Detail", 
        description: "Please provide a more detailed explanation (minimum 50 characters)", 
        variant: "destructive" 
      });
      return;
    }

    submitDisputeMutation.mutate({
      reason: disputeReason,
      category: disputeCategory,
      additionalInfo: additionalInfo
    });
  };

  // Show dispute status if trade is disputed
  if (trade.status === 'disputed') {
    const selectedCategory = disputeCategories.find(cat => cat.value === trade.disputeCategory);
    
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            Dispute Under Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-yellow-800">Category:</Label>
              <p className="text-sm text-yellow-700 mt-1 p-2 bg-yellow-100 rounded">
                {selectedCategory?.label || "General Issue"}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-yellow-800">Raised By:</Label>
              <p className="text-sm text-yellow-700 mt-1 p-2 bg-yellow-100 rounded capitalize">
                {trade.disputeRaisedBy === userRole ? "You" : "Trading Partner"}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-yellow-800">Dispute Reason:</Label>
            <p className="text-sm text-yellow-700 mt-1 p-3 bg-yellow-100 rounded">
              {trade.disputeReason || "No reason provided"}
            </p>
          </div>

          {trade.disputeEvidence && (
            <div>
              <Label className="text-sm font-medium text-yellow-800">Evidence Files:</Label>
              <div className="flex gap-2 mt-1">
                {JSON.parse(trade.disputeEvidence).map((file: string, index: number) => (
                  <Button key={index} variant="outline" size="sm" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Evidence {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  Expected resolution: 24-48 hours
                </span>
              </div>
              
              <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                Case ID: #{trade.id}-DISPUTE
              </Badge>
            </div>

            {trade.adminNotes && (
              <Alert className="border-blue-200 bg-blue-50">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  <strong>Admin Update:</strong> {trade.adminNotes}
                </AlertDescription>
              </Alert>
            )}

            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                <strong>Next Steps:</strong> Our admin team is reviewing your case. You'll receive an email notification once resolved. 
                Please ensure your contact information is up to date.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show raise dispute option for active trades
  if (['payment_pending', 'payment_made'].includes(trade.status)) {
    return (
      <>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-700 font-medium">
                  Experiencing issues with this trade?
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDisputeModal(true)}
                className="border-red-300 text-red-600 hover:bg-red-100"
              >
                <Flag className="h-4 w-4 mr-2" />
                Raise Dispute
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Dispute Modal */}
        <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Flag className="h-5 w-5" />
                Raise a Trade Dispute
              </DialogTitle>
              <DialogDescription>
                Describe the issue you're experiencing. Our admin team will review and resolve disputes within 24-48 hours.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Warning Alert */}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Important:</strong> Disputes should only be raised for legitimate issues. 
                  False or malicious disputes may result in account penalties. 
                  Please try to resolve issues through direct communication first.
                </AlertDescription>
              </Alert>

              {/* Dispute Category Selection */}
              <div>
                <Label htmlFor="dispute-category" className="text-base font-medium">
                  Issue Category *
                </Label>
                <select
                  id="dispute-category"
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value)}
                  className="w-full mt-2 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select the type of issue you're experiencing</option>
                  {disputeCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label} - {cat.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Detailed Description */}
              <div>
                <Label htmlFor="dispute-reason" className="text-base font-medium">
                  Detailed Description *
                </Label>
                <Textarea
                  id="dispute-reason"
                  placeholder="Provide a comprehensive explanation of the issue. Include:
• What exactly happened?
• When did the issue occur?
• What steps did you take to resolve it?
• Any communication with the other party?
• Specific amounts, times, or transaction details"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="mt-2 min-h-[120px]"
                  maxLength={2000}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Minimum 50 characters required</span>
                  <span>{disputeReason.length}/2000 characters</span>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <Label htmlFor="additional-info" className="text-base font-medium">
                  Additional Information (Optional)
                </Label>
                <Textarea
                  id="additional-info"
                  placeholder="Any other relevant details, timeline of events, or context that might help resolve this dispute..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  className="mt-2"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {additionalInfo.length}/1000 characters
                </p>
              </div>

              {/* Evidence Upload */}
              <div>
                <Label className="text-base font-medium">Evidence Files (Optional)</Label>
                <p className="text-sm text-gray-600 mt-1 mb-3">
                  Upload screenshots, receipts, or other evidence to support your dispute. Maximum 5 files.
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="evidence-upload"
                  />
                  <label htmlFor="evidence-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload files or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, PDF, DOC up to 10MB each
                    </p>
                  </label>
                </div>

                {evidenceFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {evidenceFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDisputeModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDisputeSubmit}
                  disabled={submitDisputeMutation.isPending || !disputeCategory || disputeReason.length < 50}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {submitDisputeMutation.isPending ? "Submitting..." : "Submit Dispute"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}