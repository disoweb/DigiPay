
import { useState } from "react";
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
import { useLocation } from "wouter";
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    rate: "",
    status: "active",
    minAmount: "",
    maxAmount: "",
    terms: ""
  });

  const { data: offers = [], isLoading, error } = useQuery<Offer[]>({
    queryKey: [`/api/users/${user?.id}/offers`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/offers`);
      if (!response.ok) {
        throw new Error(`Failed to fetch offers: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  const updateOfferMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/offers/${id}`, updates);
      if (!response.ok) {
        throw new Error("Failed to update offer");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/offers`] });
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      toast({ title: "Success", description: "Offer updated successfully" });
      setEditingOffer(null);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update offer",
        variant: "destructive"
      });
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/offers/${id}`);
      if (!response.ok) {
        throw new Error("Failed to delete offer");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/offers`] });
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      toast({ title: "Success", description: "Offer deleted successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete offer",
        variant: "destructive"
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
      updates: editForm
    });
  };

  const handleDeleteOffer = (id: number) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      deleteOfferMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-600';
      case 'paused': return 'bg-yellow-100 text-yellow-600';
      case 'inactive': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'buy' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setLocation("/dashboard")} 
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage My Offers</h1>
              <p className="text-gray-600">View, edit, and manage your trading offers</p>
            </div>
          </div>
          <Button onClick={() => setLocation("/marketplace")}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Offer
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Offers</p>
                  <p className="font-bold text-xl">{offers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Offers</p>
                  <p className="font-bold text-xl">
                    {offers.filter(o => o.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Buy Offers</p>
                  <p className="font-bold text-xl">
                    {offers.filter(o => o.type === 'buy').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Sell Offers</p>
                  <p className="font-bold text-xl">
                    {offers.filter(o => o.type === 'sell').length}
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
            {offers.map((offer) => (
              <Card key={offer.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getTypeIcon(offer.type)}
                      <div>
                        <h3 className="font-medium text-lg">
                          {offer.type === 'buy' ? 'Buy' : 'Sell'} ${parseFloat(offer.amount).toFixed(2)} USDT
                        </h3>
                        <p className="text-gray-600 mb-2">
                          Rate: ₦{parseFloat(offer.rate).toLocaleString()}/USDT
                        </p>
                        {(offer.minAmount || offer.maxAmount) && (
                          <p className="text-sm text-gray-500 mb-2">
                            Limits: ${parseFloat(offer.minAmount || "0").toFixed(2)} - ${parseFloat(offer.maxAmount || offer.amount).toFixed(2)}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mb-2">
                          Payment: {offer.paymentMethod?.replace('_', ' ').toUpperCase() || 'Bank Transfer'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          Created {new Date(offer.createdAt).toLocaleDateString()}
                        </div>
                        {offer.terms && (
                          <p className="text-sm text-gray-600 mt-2 max-w-md">
                            Terms: {offer.terms}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(offer.status)}>
                        {offer.status.toUpperCase()}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditOffer(offer)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Offer</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Amount (USDT)</Label>
                                <Input
                                  type="number"
                                  value={editForm.amount}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>Rate (₦/USDT)</Label>
                                <Input
                                  type="number"
                                  value={editForm.rate}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, rate: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Min Amount (USDT)</Label>
                                <Input
                                  type="number"
                                  value={editForm.minAmount}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, minAmount: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>Max Amount (USDT)</Label>
                                <Input
                                  type="number"
                                  value={editForm.maxAmount}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, maxAmount: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                                <SelectTrigger>
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
                              <Label>Terms</Label>
                              <Textarea
                                value={editForm.terms}
                                onChange={(e) => setEditForm(prev => ({ ...prev, terms: e.target.value }))}
                                placeholder="Special requirements or terms..."
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={handleUpdateOffer}
                                disabled={updateOfferMutation.isPending}
                                className="flex-1"
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
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingOffer && (
        <Dialog open={!!editingOffer} onOpenChange={() => setEditingOffer(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Offer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount (USDT)</Label>
                  <Input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Rate (₦/USDT)</Label>
                  <Input
                    type="number"
                    value={editForm.rate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, rate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleUpdateOffer}
                  disabled={updateOfferMutation.isPending}
                  className="flex-1"
                >
                  {updateOfferMutation.isPending ? "Updating..." : "Update Offer"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingOffer(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
