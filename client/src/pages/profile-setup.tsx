import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, MailCheck, MailWarning, CreditCard, Globe, Trash2, PlusCircle, Loader2 } from "lucide-react";
import type { UserPaymentMethod, InsertUserPaymentMethod } from "@shared/schema"; // Import types

// Example available regions - this could come from a config or API later
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

export default function ProfileSetup() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { toast } = useToast();

  // State for new payment method form
  const [newPaymentMethod, setNewPaymentMethod] = useState<{ type: string; name: string; accountNumber: string; bankCode: string; accountName: string }>({
    type: "bank_transfer",
    name: "",
    accountNumber: "",
    bankCode: "",
    accountName: "",
  });
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  // Fetch existing payment methods
  const { data: paymentMethods, isLoading: isLoadingPaymentMethods, refetch: refetchPaymentMethods } = useQuery<UserPaymentMethod[]>({
    queryKey: ["/api/users/profile/payment-methods"],
    queryFn: async () => apiRequest("GET", "/api/users/profile/payment-methods"),
    enabled: !!user, // Only fetch if user is loaded
  });

  // Initialize selectedRegions when user data is available
  useEffect(() => {
    if (user?.geographicRegions) {
      setSelectedRegions(user.geographicRegions);
    }
  }, [user?.geographicRegions]);

  // Mutation for adding a payment method
  const addPaymentMethodMutation = useMutation({
    mutationFn: async (data: Omit<InsertUserPaymentMethod, 'userId' | 'isVerified' | 'isActive'>) => {
      return apiRequest("POST", "/api/users/profile/payment-methods", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment method added." });
      refetchPaymentMethods();
      setNewPaymentMethod({ type: "bank_transfer", name: "", accountNumber: "", bankCode: "", accountName: "" }); // Reset form
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to add payment method." });
    },
  });

  // Mutation for deleting a payment method
  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (methodId: number) => {
      return apiRequest("DELETE", `/api/users/profile/payment-methods/${methodId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment method deleted." });
      refetchPaymentMethods();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete payment method." });
    },
  });

  // Mutation for updating geographic regions
  const updateRegionsMutation = useMutation({
    mutationFn: async (regions: string[]) => {
      return apiRequest("PUT", "/api/users/profile/regions", { regions });
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: "Geographic regions updated." });
      queryClient.setQueryData(['/api/user'], (oldData: User | null) => oldData ? ({ ...oldData, geographicRegions: data.geographicRegions }) : null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update regions." });
    },
  });


  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaymentMethod.name || !newPaymentMethod.type) {
      toast({ variant: "destructive", title: "Error", description: "Payment method type and name are required." });
      return;
    }
    let details: any = {};
    if (newPaymentMethod.type === 'bank_transfer') {
        if (!newPaymentMethod.accountNumber || !newPaymentMethod.bankCode || !newPaymentMethod.accountName) {
            toast({ variant: "destructive", title: "Error", description: "Account number, account name, and bank code are required for bank transfers."});
            return;
        }
        details = { account_number: newPaymentMethod.accountNumber, bank_code: newPaymentMethod.bankCode, account_name: newPaymentMethod.accountName };
    } else {
        // Handle other types if necessary, or expect generic details
        toast({ variant: "destructive", title: "Error", description: "Unsupported payment method type for detailed entry."});
        return;
    }
    addPaymentMethodMutation.mutate({
      type: newPaymentMethod.type,
      name: newPaymentMethod.name,
      details,
    });
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const handleSaveRegions = () => {
    updateRegionsMutation.mutate(selectedRegions);
  };

  if (isUserLoading || isLoadingPaymentMethods && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-3xl mx-auto p-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account details and preferences.</p>
        </div>

        {/* Email Verification Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {user?.emailVerified ? <MailCheck className="h-5 w-5 text-green-500" /> : <MailWarning className="h-5 w-5 text-yellow-500" />}
              Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user?.emailVerified ? (
              <p className="text-green-600">Your email address (<strong>{user.email}</strong>) is verified.</p>
            ) : (
              <p className="text-yellow-700">
                Your email address (<strong>{user?.email}</strong>) is not yet verified.
                Please check your inbox for a verification link.
                {/* TODO: Add a "Resend verification email" button here */}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Manage your preferred payment methods for trades.</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethods && paymentMethods.length > 0 && (
              <div className="space-y-3 mb-6">
                <Label>Your Saved Methods:</Label>
                {paymentMethods.map(method => (
                  <div key={method.id} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <div>
                      <p className="font-medium">{method.name} ({method.type})</p>
                      {method.type === 'bank_transfer' && typeof method.details === 'object' && method.details && 'account_number' in method.details && (
                        <p className="text-sm text-gray-500">
                          { (method.details as any).account_name} - Acct: ****{(method.details as any).account_number.slice(-4)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePaymentMethodMutation.mutate(method.id)}
                      disabled={deletePaymentMethodMutation.isPending && deletePaymentMethodMutation.variables === method.id}
                    >
                      {deletePaymentMethodMutation.isPending && deletePaymentMethodMutation.variables === method.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddPaymentMethod} className="space-y-4 border-t pt-6">
              <Label className="text-lg font-semibold">Add New Payment Method</Label>
              <div>
                <Label htmlFor="pm-type">Type</Label>
                <Select
                  value={newPaymentMethod.type}
                  onValueChange={(value) => setNewPaymentMethod(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="pm-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    {/* Add other types as needed */}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pm-name">Display Name</Label>
                <Input
                  id="pm-name"
                  placeholder="E.g., My GTB Savings"
                  value={newPaymentMethod.name}
                  onChange={e => setNewPaymentMethod(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              {newPaymentMethod.type === 'bank_transfer' && (
                <>
                  <div>
                    <Label htmlFor="pm-account-name">Account Name</Label>
                    <Input
                      id="pm-account-name"
                      placeholder="Full Account Name"
                      value={newPaymentMethod.accountName}
                      onChange={e => setNewPaymentMethod(prev => ({ ...prev, accountName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pm-account-number">Account Number</Label>
                    <Input
                      id="pm-account-number"
                      placeholder="Bank Account Number"
                      value={newPaymentMethod.accountNumber}
                      onChange={e => setNewPaymentMethod(prev => ({ ...prev, accountNumber: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pm-bank-code">Bank Code (Paystack)</Label>
                    <Input
                      id="pm-bank-code"
                      placeholder="E.g., 058 for GTBank"
                      value={newPaymentMethod.bankCode}
                      onChange={e => setNewPaymentMethod(prev => ({ ...prev, bankCode: e.target.value }))}
                      required
                    />
                     <p className="text-xs text-gray-500 mt-1">Find Paystack bank codes <a href="https://paystack.com/docs/payments/bank-codes/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">here</a>.</p>
                  </div>
                </>
              )}
              <Button type="submit" disabled={addPaymentMethodMutation.isPending} className="w-full sm:w-auto">
                {addPaymentMethodMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add Method
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Geographic Regions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Geographic Trading Regions
            </CardTitle>
            <CardDescription>Select the regions where you primarily trade or find offers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
              {NIGERIAN_STATES.map(region => (
                <div key={region} className="flex items-center space-x-2">
                  <Checkbox
                    id={`region-${region}`}
                    checked={selectedRegions.includes(region)}
                    onCheckedChange={() => handleRegionChange(region)}
                  />
                  <Label htmlFor={`region-${region}`} className="font-normal">{region}</Label>
                </div>
              ))}
            </div>
            <Button
              onClick={handleSaveRegions}
              disabled={updateRegionsMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateRegionsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Regions
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}