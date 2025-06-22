import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentProofUploadProps {
  tradeId: number;
  onProofSubmitted: () => void;
}

export function PaymentProofUpload({ tradeId, onProofSubmitted }: PaymentProofUploadProps) {
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleSubmitProof = async () => {
    if (!paymentReference.trim()) {
      toast({
        title: "Payment reference required",
        description: "Please provide a payment reference or transaction ID",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`/api/trades/${tradeId}/payment-proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("digipay_token")}`,
        },
        body: JSON.stringify({
          paymentReference,
          paymentNotes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit payment proof");
      }

      toast({
        title: "Payment proof submitted",
        description: "The seller will be notified to confirm your payment",
      });

      onProofSubmitted();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit payment proof. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Submit Payment Proof
        </CardTitle>
        <CardDescription>
          Provide proof of payment to the seller
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payment-reference">Payment Reference/Transaction ID *</Label>
          <Input
            id="payment-reference"
            placeholder="Enter transaction reference or ID"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment-notes">Additional Notes (Optional)</Label>
          <Textarea
            id="payment-notes"
            placeholder="Any additional information about the payment..."
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Payment Verification Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Double-check the payment reference is correct</li>
                <li>Ensure payment was sent to the correct account details</li>
                <li>Keep your payment receipt for records</li>
              </ul>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmitProof} 
          disabled={uploading || !paymentReference.trim()}
          className="w-full"
        >
          {uploading ? (
            "Submitting..."
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit Payment Proof
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentProofUploadProps {
  tradeId: number;
  onProofSubmitted: () => void;
}

export function PaymentProofUpload({ tradeId, onProofSubmitted }: PaymentProofUploadProps) {
  const [paymentReference, setPaymentReference] = useState("");
  const [proofDescription, setProofDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitProof = async () => {
    if (!paymentReference.trim()) {
      toast({
        title: "Missing Reference",
        description: "Please provide a payment reference",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/trades/${tradeId}/payment-proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("digipay_token")}`,
        },
        body: JSON.stringify({
          paymentReference,
          proofDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit payment proof");
      }

      toast({
        title: "Payment Proof Submitted",
        description: "The seller will be notified to confirm your payment",
      });

      onProofSubmitted();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit payment proof. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Submit Payment Proof
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reference">Payment Reference *</Label>
          <Input
            id="reference"
            placeholder="Enter transaction reference/ID"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="proof">Additional Details (Optional)</Label>
          <Textarea
            id="proof"
            placeholder="Any additional details about the payment..."
            value={proofDescription}
            onChange={(e) => setProofDescription(e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSubmitProof}
          disabled={isSubmitting || !paymentReference.trim()}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit Payment Proof
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
