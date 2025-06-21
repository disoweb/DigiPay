import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MessageSquare, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Trade } from "@shared/schema";

interface DisputeResolutionProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  onDisputeRaised: () => void;
}

export function DisputeResolution({ trade, userRole, onDisputeRaised }: DisputeResolutionProps) {
  const [disputeReason, setDisputeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim()) {
      toast({
        title: "Dispute reason required",
        description: "Please provide a detailed reason for the dispute",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/trades/${trade.id}/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("digipay_token")}`,
        },
        body: JSON.stringify({
          reason: disputeReason,
          raisedBy: userRole,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to raise dispute");
      }

      toast({
        title: "Dispute raised",
        description: "An admin will review your case within 24 hours",
      });

      onDisputeRaised();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to raise dispute. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (trade.status === "disputed") {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Clock className="h-5 w-5" />
            Dispute Under Review
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Your dispute has been submitted and is being reviewed by our support team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-yellow-800">Dispute Reason:</Label>
              <p className="text-sm text-yellow-700 mt-1 p-2 bg-yellow-100 rounded">
                {trade.disputeReason || "No reason provided"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Expected resolution time: 24-48 hours
              </span>
            </div>

            <Badge variant="outline" className="text-yellow-700 border-yellow-300">
              Case ID: #{trade.id}-DISPUTE
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          Raise a Dispute
        </CardTitle>
        <CardDescription>
          If there's an issue with this trade, you can raise a dispute for admin review
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-2">Before raising a dispute:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Try communicating with the other party first</li>
                <li>Check if payment details were correct</li>
                <li>Allow sufficient time for payment processing</li>
                <li>Verify all transaction information</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dispute-reason">Dispute Reason *</Label>
          <Textarea
            id="dispute-reason"
            placeholder="Please provide a detailed explanation of the issue..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <Button 
          onClick={handleRaiseDispute}
          disabled={submitting || !disputeReason.trim()}
          variant="destructive"
          className="w-full"
        >
          {submitting ? "Submitting Dispute..." : "Raise Dispute"}
        </Button>

        <p className="text-xs text-gray-600 text-center">
          Disputes are reviewed by our support team within 24 hours
        </p>
      </CardContent>
    </Card>
  );
}