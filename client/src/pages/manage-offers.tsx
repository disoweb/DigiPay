import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  AlertCircle
} from "lucide-react";

type Offer = {
  id: number;
  userId: number;
  amount: string;
  rate: string;
  type: string;
  status: string;
  paymentMethod: string;
  minAmount?: string;
  maxAmount?: string;
  terms?: string;
  createdAt: string;
  user: {
    id: number;
    email: string;
    averageRating: string;
    ratingCount: number;
  } | null;
};

export default function ManageOffers() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    rate: "",
    status: "",
    minAmount: "",
    maxAmount: "",
    terms: ""
  });
  const [authChecked, setAuthChecked] = useState(false);

  // Use effect to ensure auth is fully checked before proceeding
  useEffect(() => {
    if (!authLoading) {
      // Add a small delay to ensure auth state is settled
      const timer = setTimeout(() => {
        setAuthChecked(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  // Fetch user's offers with delay to prevent race condition
  const { data: offers = [], isLoading, error } = useQuery<Offer[]>({
    queryKey: [`/api/users/${user?.id}/offers`],
    enabled: !!user?.id && !authLoading,
    retry: 3,
    retryDelay: 1000,
    // Add a small delay to ensure auth is fully resolved
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const response = await fetch(`/api/users/${user.id}/offers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('digipay_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch offers: ${response.status}`);
      }
      
      return response.json();
    },
  });

  // Update offer mutation
  const updateOfferMutation = useMutation({
    mutationFn: async (data: { id: number; updates: any }) => {
      console.log("Updating offer:", data);
      const response = await apiRequest("PUT", `/api/offers/${data.id}`, data.updates);
      console.log("Update response:", response);
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      console.log("Update success:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/offers`] });
      setEditingOffer(null);
      toast({
        title: "Success",
        description: "Offer updated successfully",
      });
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: `Failed to update offer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete offer mutation
  const deleteOfferMutation = useMutation({
    mutationFn: async (offerId: number) => {
      console.log("Deleting offer:", offerId);
      const response = await apiRequest("DELETE", `/api/offers/${offerId}`);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/offers`] });
      toast({
        title: "Success",
        description: "Offer deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: `Failed to delete offer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setEditForm({
      amount: offer.amount,
      rate: offer.rate,
      status: offer.status,
      minAmount: offer.minAmount || "",
      maxAmount: offer.maxAmount || "",
      terms: offer.terms || ""
    });
  };

  const handleUpdateOffer = () => {
    if (!editingOffer) return;
    
    updateOfferMutation.mutate({
      id: editingOffer.id,
      updates: {
        amount: editForm.amount,
        rate: editForm.rate,
        status: editForm.status,
        minAmount: editForm.minAmount || null,
        maxAmount: editForm.maxAmount || null,
        terms: editForm.terms || null
      }
    });
  };

  const handleDeleteOffer = (offerId: number) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      deleteOfferMutation.mutate(offerId);
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'buy' ? (
      <div className="p-2 bg-red-100 rounded-lg">
        <TrendingUp className="h-5 w-5 text-red-600" />
      </div>
    ) : (
      <div className="p-2 bg-green-100 rounded-lg">
        <TrendingDown className="h-5 w-5 text-green-600" />
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-green-100 text-green-800";
      case 'paused':
        return "bg-yellow-100 text-yellow-800";
      case 'inactive':
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading || !authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {authLoading || !authChecked ? "Checking authentication..." : "Loading your offers..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated after loading
  if (authChecked && !user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              onClick={() => setLocation("/dashboard")} 
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Manage My Offers</h1>
              <p className="text-sm sm:text-base text-gray-600 hidden sm:block">View, edit, and manage your trading offers</p>
            </div>
          </div>
          <Button 
            onClick={() => setLocation("/marketplace")} 
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Offer
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Offers</p>
                  <p className="font-bold text-lg sm:text-xl">{offers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Active</p>
                  <p className="font-bold text-lg sm:text-xl">
                    {offers.filter((o: Offer) => o.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Buy Offers</p>
                  <p className="font-bold text-lg sm:text-xl">
                    {offers.filter((o: Offer) => o.type === 'buy').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Sell Offers</p>
                  <p className="font-bold text-lg sm:text-xl">
                    {offers.filter((o: Offer) => o.type === 'sell').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load offers. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}

        {/* Offers List */}
        {offers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No offers created yet</h3>
              <p className="text-gray-600 mb-4">Create your first offer to start trading</p>
              <Button onClick={() => setLocation("/marketplace")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Offer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {offers.map((offer: Offer) => (
              <Card key={offer.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="shrink-0">
                        {getTypeIcon(offer.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-base sm:text-lg truncate">
                          {offer.type === 'buy' ? 'Buy' : 'Sell'} ${parseFloat(offer.amount).toFixed(2)} USDT
                        </h3>
                        <p className="text-gray-600 mb-2 text-sm sm:text-base">
                          Rate: ₦{parseFloat(offer.rate).toLocaleString()}/USDT
                        </p>
                        {(offer.minAmount || offer.maxAmount) && (
                          <p className="text-xs sm:text-sm text-gray-500 mb-2">
                            Limits: ${parseFloat(offer.minAmount || "0").toFixed(2)} - ${parseFloat(offer.maxAmount || offer.amount).toFixed(2)}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-gray-500 mb-2">
                          Payment: {offer.paymentMethod?.replace('_', ' ').toUpperCase() || 'Bank Transfer'}
                        </p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="truncate">Created {new Date(offer.createdAt).toLocaleDateString()}</span>
                        </div>
                        {offer.terms && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">
                            Terms: {offer.terms}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <Badge className={getStatusColor(offer.status)}>
                        {offer.status.toUpperCase()}
                      </Badge>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditOffer(offer)}
                            >
                              <Edit className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Offer</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Amount (USDT)</Label>
                                  <Input
                                    type="number"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Rate (₦/USDT)</Label>
                                  <Input
                                    type="number"
                                    value={editForm.rate}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, rate: e.target.value }))}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Min Amount (USDT)</Label>
                                  <Input
                                    type="number"
                                    value={editForm.minAmount}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, minAmount: e.target.value }))}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Max Amount (USDT)</Label>
                                  <Input
                                    type="number"
                                    value={editForm.maxAmount}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, maxAmount: e.target.value }))}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="paused">Paused</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Terms</Label>
                                <Textarea
                                  value={editForm.terms}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, terms: e.target.value }))}
                                  placeholder="Special requirements or terms..."
                                  className="mt-1 min-h-[80px]"
                                />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button 
                                  onClick={handleUpdateOffer}
                                  disabled={updateOfferMutation.isPending}
                                  className="flex-1"
                                  size="sm"
                                >
                                  {updateOfferMutation.isPending ? "Updating..." : "Update Offer"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteOffer(offer.id)}
                          disabled={deleteOfferMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}