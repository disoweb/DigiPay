import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface KYCVerificationProps {
  onVerificationComplete?: () => void;
}

export function KYCVerification({ onVerificationComplete }: KYCVerificationProps) {
  const [formData, setFormData] = useState({
    bvn: "",
    firstName: "",
    lastName: "",
  });
  const { toast } = useToast();

  const verifyKYCMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/kyc/verify", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "KYC Verification Successful",
        description: "Your identity has been verified successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onVerificationComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "KYC Verification Failed",
        description: error.message || "Please check your details and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bvn || !formData.firstName || !formData.lastName) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    verifyKYCMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle>KYC Verification</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Complete your KYC verification to start trading. Your information is secure and encrypted.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
            <Input
              id="bvn"
              name="bvn"
              value={formData.bvn}
              onChange={handleInputChange}
              placeholder="Enter your 11-digit BVN"
              maxLength={11}
              pattern="[0-9]{11}"
              required
            />
          </div>

          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter your first name"
              required
            />
          </div>

          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Enter your last name"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={verifyKYCMutation.isPending}
          >
            {verifyKYCMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Identity
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Why do we need KYC?</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Comply with Nigerian financial regulations</li>
            <li>• Protect against fraud and money laundering</li>
            <li>• Ensure secure trading environment</li>
            <li>• Enable higher transaction limits</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}