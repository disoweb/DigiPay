import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { KYCVerification } from "@/components/kyc-verification";
import { User, Mail, Phone, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { UserProfileSection } from "@/components/user-profile-section";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

// This is the complete and final code file with all required changes.
export default function UserSettings() {
  const { toast } = useToast();
  const [showKYCForm, setShowKYCForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
  });

  const { user, isLoading, userData } = useAuth();

  const { data: trades = [] } = useQuery({
    queryKey: ['/api/trades'],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Calculate user statistics
  const completedTrades = trades.filter((t: any) => t.status === 'completed');
  const disputedTrades = trades.filter((t: any) => t.status === 'disputed');
  const successRate = trades.length > 0 
    ? (completedTrades.length / trades.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Profile Settings
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage your trading profile and account settings
          </p>
        </div>

        <UserProfileSection 
          completedTrades={completedTrades.length}
          disputedTrades={disputedTrades.length}
          successRate={successRate}
        />

        {/* KYC Verification Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Identity Verification (KYC)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userData?.kycVerified ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="flex items-center justify-between">
                      <span>Your identity has been verified successfully!</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <div className="flex items-center justify-between">
                        <span>Complete KYC verification to unlock higher trading limits and enhanced security.</span>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Not Verified
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {showKYCForm ? (
                    <div className="mt-4">
                      <KYCVerification 
                        onVerificationComplete={() => {
                          setShowKYCForm(false);
                          // Refresh user data
                          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                        }} 
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => setShowKYCForm(false)}
                        className="mt-4 w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => setShowKYCForm(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Start KYC Verification
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                Security settings coming soon...
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}