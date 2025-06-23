
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  MessageSquare, 
  Clock, 
  Shield, 
  FileText,
  CheckCircle,
  XCircle,
  Upload,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DisputeSystemProps {
  trade: any;
  userRole: 'buyer' | 'seller';
  onDisputeUpdated: () => void;
}

export function DisputeSystem({ trade, userRole, onDisputeUpdated }: DisputeSystemProps) {
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeCategory, setDisputeCategory] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const { toast } = useToast();

  const disputeCategories = [
    { value: "payment_not_received", label: "Payment Not Received" },
    { value: "payment_not_made", label: "Payment Not Made by Buyer" },
    { value: "wrong_payment_details", label: "Wrong Payment Details" },
    { value: "fake_payment_proof", label: "Fake Payment Proof" },
    { value: "account_issues", label: "Bank Account Issues" },
    { value: "communication_issues", label: "Communication Problems" },
    { value: "other", label: "Other Issues" }
  ];

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

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim() || !disputeCategory) {
      toast({
        title: "Missing information",
        description: "Please provide dispute category and detailed reason",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('reason', disputeReason);
      formData.append('category', disputeCategory);
      formData.append('raisedBy', userRole);
      
      evidenceFiles.forEach((file, index) => {
        formData.append(`evidence_${index}`, file);
      });

      const response = await fetch(`/api/trades/${trade.id}/dispute`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("digipay_token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to raise dispute");
      }

      toast({
        title: "Dispute submitted",
        description: "Your dispute has been submitted and will be reviewed within 24 hours",
      });

      onDisputeUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit dispute. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminResponse = async (action: 'approve_buyer' | 'approve_seller' | 'require_more_info') => {
    try {
      const response = await fetch(`/api/admin/disputes/${trade.id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("digipay_token")}`,
        },
        body: JSON.stringify({
          action,
          adminNotes: adminResponse
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to resolve dispute");
      }

      toast({
        title: "Dispute resolved",
        description: "The dispute has been resolved successfully",
      });

      onDisputeUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
        variant: "destructive",
      });
    }
  };

  // Display active dispute
  if (trade.status === "disputed") {
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
              <Label className="text-sm font-medium text-yellow-800">Dispute Category:</Label>
              <p className="text-sm text-yellow-700 mt-1 p-2 bg-yellow-100 rounded capitalize">
                {trade.disputeCategory?.replace('_', ' ') || "General Issue"}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-yellow-800">Raised By:</Label>
              <p className="text-sm text-yellow-700 mt-1 p-2 bg-yellow-100 rounded capitalize">
                {trade.disputeRaisedBy || "Unknown"}
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
        </CardContent>
      </Card>
    );
  }

  // Display dispute form for eligible trades
  if (['payment_pending', 'payment_made', 'payment_confirmed'].includes(trade.status)) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Raise a Dispute
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <MessageSquare className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800">
              <strong>Before raising a dispute:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Try communicating with the other party first</li>
                <li>Check if payment details were correct</li>
                <li>Allow sufficient time for payment processing</li>
                <li>Verify all transaction information</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="dispute-category">Dispute Category *</Label>
              <Select value={disputeCategory} onValueChange={setDisputeCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dispute category" />
                </SelectTrigger>
                <SelectContent>
                  {disputeCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dispute-reason">Detailed Explanation *</Label>
              <Textarea
                id="dispute-reason"
                placeholder="Provide a detailed explanation of the issue. Include timeline, what went wrong, and any attempts to resolve it..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Evidence Files (Optional - Max 5 files)</Label>
              <div className="mt-2">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="evidence-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('evidence-upload')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Evidence (Screenshots, Documents)
                </Button>
              </div>
              
              {evidenceFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <span className="truncate flex-1">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleRaiseDispute}
              disabled={!disputeReason.trim() || !disputeCategory || submitting}
              variant="destructive"
              className="flex-1"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting Dispute...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Dispute
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
