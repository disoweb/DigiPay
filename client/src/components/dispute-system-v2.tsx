import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertTriangle,
  Flag,
  Shield,
  Clock,
  FileText,
  Camera,
  Upload,
  X,
  CheckCircle,
  MessageSquare,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";

interface DisputeSystemProps {
  trade: any;
  userRole: 'buyer' | 'seller' | 'admin';
  onDisputeUpdate?: () => void;
}

interface Evidence {
  id: string;
  type: 'image' | 'document' | 'screenshot';
  file: File;
  description: string;
  timestamp: Date;
}

const DISPUTE_CATEGORIES = [
  { value: 'payment_not_received', label: 'Payment Not Received', severity: 'high' },
  { value: 'payment_not_sent', label: 'Payment Not Sent', severity: 'high' },
  { value: 'wrong_amount', label: 'Wrong Payment Amount', severity: 'medium' },
  { value: 'delayed_payment', label: 'Delayed Payment', severity: 'medium' },
  { value: 'fake_payment_proof', label: 'Fake Payment Proof', severity: 'high' },
  { value: 'communication_issue', label: 'Communication Issue', severity: 'low' },
  { value: 'account_details_wrong', label: 'Wrong Account Details', severity: 'medium' },
  { value: 'other', label: 'Other Issue', severity: 'medium' }
];

const RESOLUTION_ACTIONS = [
  { value: 'release_to_buyer', label: 'Release USDT to Buyer', description: 'Buyer wins the dispute' },
  { value: 'release_to_seller', label: 'Return USDT to Seller', description: 'Seller wins the dispute' },
  { value: 'partial_refund', label: 'Partial Resolution', description: 'Split the amount' },
  { value: 'request_more_info', label: 'Request More Information', description: 'Need additional evidence' },
  { value: 'escalate', label: 'Escalate to Senior Admin', description: 'Complex case requiring review' }
];

export function DisputeSystemV2({ trade, userRole, onDisputeUpdate }: DisputeSystemProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeCategory, setDisputeCategory] = useState("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [adminResolution, setAdminResolution] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [disputeHistory, setDisputeHistory] = useState<any[]>([]);

  useEffect(() => {
    if (trade?.status === 'disputed') {
      fetchDisputeHistory();
    }
  }, [trade?.id]);

  const fetchDisputeHistory = async () => {
    try {
      const response = await apiRequest("GET", `/api/disputes/${trade.id}/history`);
      if (response.ok) {
        const history = await response.json();
        setDisputeHistory(history);
      }
    } catch (error) {
      console.error("Failed to fetch dispute history:", error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload files smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      const newEvidence: Evidence = {
        id: crypto.randomUUID(),
        type: file.type.startsWith('image/') ? 'image' : 'document',
        file,
        description: '',
        timestamp: new Date()
      };
      setEvidence(prev => [...prev, newEvidence]);
    });
  };

  const removeEvidence = (id: string) => {
    setEvidence(prev => prev.filter(e => e.id !== id));
  };

  const updateEvidenceDescription = (id: string, description: string) => {
    setEvidence(prev => prev.map(e => e.id === id ? { ...e, description } : e));
  };

  const validateDisputeForm = () => {
    if (!disputeReason.trim()) {
      toast({
        title: "Dispute reason required",
        description: "Please provide a detailed explanation of the issue",
        variant: "destructive"
      });
      return false;
    }

    if (!disputeCategory) {
      toast({
        title: "Category required",
        description: "Please select a dispute category",
        variant: "destructive"
      });
      return false;
    }

    if (disputeReason.length < 50) {
      toast({
        title: "Insufficient detail",
        description: "Please provide at least 50 characters explaining the issue",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const submitDispute = async () => {
    if (!validateDisputeForm()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('reason', disputeReason);
      formData.append('category', disputeCategory);
      formData.append('raisedBy', userRole);
      
      evidence.forEach((ev, index) => {
        formData.append(`evidence_${index}`, ev.file);
        formData.append(`evidence_${index}_description`, ev.description);
        formData.append(`evidence_${index}_type`, ev.type);
      });

      const response = await fetch(`/api/trades/${trade.id}/dispute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('digipay_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to submit dispute');
      }

      toast({
        title: "Dispute submitted successfully",
        description: "Our team will review your case within 24 hours"
      });

      setShowDisputeForm(false);
      onDisputeUpdate?.();
    } catch (error) {
      toast({
        title: "Failed to submit dispute",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolveDispute = async () => {
    if (!adminResolution) return;

    setIsSubmitting(true);
    try {
      const response = await apiRequest("PATCH", `/api/admin/disputes/${trade.id}/resolve`, {
        action: adminResolution,
        notes: adminNotes,
        resolvedBy: userRole === 'admin' ? 'admin' : null
      });

      if (!response.ok) {
        throw new Error('Failed to resolve dispute');
      }

      toast({
        title: "Dispute resolved",
        description: "Resolution has been applied successfully"
      });

      onDisputeUpdate?.();
    } catch (error) {
      toast({
        title: "Failed to resolve dispute",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render dispute status for active disputes
  if (trade?.status === 'disputed') {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Flag className="h-5 w-5" />
            Dispute Active
          </CardTitle>
          <CardDescription>
            This trade is currently under dispute resolution
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Dispute Information */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Category</Label>
                <p className="font-medium capitalize">
                  {trade.disputeCategory?.replace('_', ' ') || 'Not specified'}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Raised By</Label>
                <Badge variant="outline" className="ml-2">
                  {trade.disputeRaisedBy || 'Unknown'}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-600">Date Raised</Label>
                <p className="font-medium">
                  {trade.disputeCreatedAt ? new Date(trade.disputeCreatedAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Case ID</Label>
                <p className="font-mono font-medium">#{trade.id}-DSP</p>
              </div>
            </div>
            
            {trade.disputeReason && (
              <div className="mt-4">
                <Label className="text-gray-600">Dispute Reason</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded text-sm">
                  {trade.disputeReason}
                </p>
              </div>
            )}
          </div>

          {/* Admin Resolution Section */}
          {userRole === 'admin' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Resolution
              </h4>
              
              <div className="space-y-3">
                <div>
                  <Label>Resolution Action</Label>
                  <Select value={adminResolution} onValueChange={setAdminResolution}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose resolution action" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOLUTION_ACTIONS.map(action => (
                        <SelectItem key={action.value} value={action.value}>
                          <div>
                            <div className="font-medium">{action.label}</div>
                            <div className="text-xs text-gray-500">{action.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Provide detailed reasoning for this resolution..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={resolveDispute}
                  disabled={!adminResolution || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Apply Resolution"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* User View of Dispute Status */}
          {userRole !== 'admin' && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your dispute is being reviewed by our support team. Expected resolution time: 24-48 hours.
                Case ID: #{trade.id}-DSP
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render dispute creation button for eligible trades
  if (['payment_pending', 'payment_made'].includes(trade?.status) && userRole !== 'admin') {
    return (
      <Dialog open={showDisputeForm} onOpenChange={setShowDisputeForm}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-full" size="lg">
            <Flag className="h-4 w-4 mr-2" />
            Raise Dispute
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Raise Trade Dispute
            </DialogTitle>
            <DialogDescription>
              Only raise a dispute if there's a genuine issue with this trade. False disputes may result in account penalties.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Warning Section */}
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Before raising a dispute:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Communicate with the other party first</li>
                  <li>Verify all payment details are correct</li>
                  <li>Allow sufficient time for payment processing</li>
                  <li>Check your bank/wallet for pending transactions</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Dispute Category */}
            <div>
              <Label className="text-base font-medium">Dispute Category *</Label>
              <Select value={disputeCategory} onValueChange={setDisputeCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select the type of issue" />
                </SelectTrigger>
                <SelectContent>
                  {DISPUTE_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{category.label}</span>
                        <Badge 
                          variant={category.severity === 'high' ? 'destructive' : 
                                 category.severity === 'medium' ? 'default' : 'secondary'}
                          className="ml-2 text-xs"
                        >
                          {category.severity}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Detailed Reason */}
            <div>
              <Label className="text-base font-medium">Detailed Explanation *</Label>
              <Textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Provide a comprehensive explanation of the issue. Include timestamps, amounts, reference numbers, and any other relevant details..."
                rows={5}
                className="mt-2 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 50 characters ({disputeReason.length}/50)
              </p>
            </div>

            {/* Evidence Upload */}
            <div>
              <Label className="text-base font-medium">Supporting Evidence</Label>
              <p className="text-sm text-gray-600 mb-3">
                Upload screenshots, bank statements, or other relevant documents (Max 10MB per file)
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
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Images, PDFs, and documents accepted
                  </p>
                </label>
              </div>

              {/* Evidence List */}
              {evidence.length > 0 && (
                <div className="mt-4 space-y-3">
                  {evidence.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {ev.type === 'image' ? (
                          <Camera className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ev.file.name}</p>
                        <Textarea
                          value={ev.description}
                          onChange={(e) => updateEvidenceDescription(ev.id, e.target.value)}
                          placeholder="Describe what this evidence shows..."
                          rows={2}
                          className="mt-2 text-xs resize-none"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEvidence(ev.id)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Submit Section */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDisputeForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitDispute}
                disabled={!validateDisputeForm() || isSubmitting}
                className="flex-1"
                variant="destructive"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4 mr-2" />
                    Submit Dispute
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}