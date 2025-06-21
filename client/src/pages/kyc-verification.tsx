
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Shield } from "lucide-react";
import Navbar from "@/components/navbar";

export default function KYCVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/verify-kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Verification Successful",
          description: "Your KYC verification has been completed successfully.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "Failed to verify your identity.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-3xl font-bold text-gray-900">KYC Verification</h1>
            <p className="mt-2 text-gray-600">
              Complete your identity verification to start trading
            </p>
          </div>

          {user.kycVerified ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">
                    Verification Complete
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Your identity has been successfully verified. You can now start trading!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-center">Verify Your Identity</CardTitle>
              </CardHeader>
              <CardContent>
                {!user.bvn ? (
                  <div className="text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-orange-500" />
                    <p className="mt-2 text-gray-600">
                      Please provide your BVN during registration to complete KYC verification.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Verifying..." : "Verify Identity"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
