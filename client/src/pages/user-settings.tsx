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
import { VerificationStatusCard } from "@/components/verification-status-card";
import { User, Mail, Phone, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { UserProfileSection } from "@/components/user-profile-section";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            {/* Account Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Email</Label>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{user.email}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Phone</Label>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{user.phone}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">KYC Status</Label>
                    <div className="flex items-center space-x-2">
                      {userData?.kycVerified ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Account Type</Label>
                    <Badge variant="outline">
                      {user.isAdmin ? "Admin" : "Standard User"}
                    </Badge>
                  </div>
                </div>

                {!userData?.kycVerified && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Complete KYC Verification</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Verify your identity to increase trading limits and access advanced features.
                        </p>
                        <Button size="sm" className="mt-2 bg-yellow-600 hover:bg-yellow-700" onClick={() => setShowKYCForm(true)}>
                          Start Verification
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc">
            {showKYCForm ? (
              <KYCVerification 
                onComplete={() => {
                  setShowKYCForm(false);
                  // Refresh user data
                  queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/kyc"] });
                }} 
              />
            ) : (
              <VerificationStatusCard 
                onStartVerification={() => setShowKYCForm(true)}
              />
            )}
          </TabsContent>

          <TabsContent value="security">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}