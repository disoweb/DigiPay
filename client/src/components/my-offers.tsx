import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Trash2, Plus, DollarSign, TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react";

type Offer = {
  id: number;
  userId: number;
  amount: string;
  rate: string;
  type: string;
  status: string;
  createdAt: string;
  user: {
    id: number;
    email: string;
    averageRating: string;
    ratingCount: number;
  } | null;
};

export function MyOffers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    rate: "",
    status: "active"
  });

  const { data: offers, isLoading } = useQuery<Offer[]>({
    queryKey: [`/api/users/${user?.id}/offers`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/offers`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const updateOfferMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/offers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/offers`] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      setEditingOffer(null);
      toast({
        title: "Offer updated",
        description: "Your offer has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update offer",
        variant: "destructive",
      });
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/offers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/offers`] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Offer deleted",
        description: "Your offer has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      });
    },
  });

  const toggleOfferStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/offers/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/offers`] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Offer status updated",
        description: "Your offer visibility has been updated",
      });
    },
  });

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setEditForm({
      amount: offer.amount,
      rate: offer.rate,
      status: offer.status
    });
  };

  const handleUpdate = () => {
    if (!editingOffer) return;
    
    updateOfferMutation.mutate({
      id: editingOffer.id,
      data: editForm
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "buy" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading your offers...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            My Offers
          </div>
          <Button size="sm" onClick={() => setLocation("/marketplace")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Offer
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!offers || offers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You haven't created any offers yet</p>
            <Button onClick={() => setLocation("/marketplace")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Offer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div key={offer.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(offer.type)}
                    <div>
                      <p className="font-medium">
                        {offer.type === "buy" ? "Buy" : "Sell"} {parseFloat(offer.amount).toFixed(2)} USDT
                      </p>
                      <p className="text-sm text-gray-600">
                        Rate: ₦{parseFloat(offer.rate).toLocaleString()}/USDT
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(offer.status)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Total Value: ₦{(parseFloat(offer.amount) * parseFloat(offer.rate)).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleOfferStatusMutation.mutate({
                        id: offer.id,
                        status: offer.status === "active" ? "inactive" : "active"
                      })}
                      disabled={toggleOfferStatusMutation.isPending}
                    >
                      {offer.status === "active" ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Show
                        </>
                      )}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(offer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Offer</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="amount">Amount (USDT)</Label>
                            <Input
                              id="amount"
                              type="number"
                              value={editForm.amount}
                              onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                              placeholder="Enter amount"
                            />
                          </div>
                          <div>
                            <Label htmlFor="rate">Rate (₦/USDT)</Label>
                            <Input
                              id="rate"
                              type="number"
                              value={editForm.rate}
                              onChange={(e) => setEditForm({...editForm, rate: e.target.value})}
                              placeholder="Enter rate"
                            />
                          </div>
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            onClick={handleUpdate}
                            disabled={updateOfferMutation.isPending}
                            className="w-full"
                          >
                            Update Offer
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Offer</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this offer? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteOfferMutation.mutate(offer.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}