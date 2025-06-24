import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, DollarSign, TrendingUp, AlertCircle, Save } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminExchangeRates() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRates, setEditingRates] = useState<{ [key: string]: string }>({});

  const { data: rates = [], isLoading, error } = useQuery({
    queryKey: ["/api/exchange-rates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/exchange-rates");
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      return response.json();
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ name, rate }: { name: string; rate: string }) => {
      const response = await apiRequest("PUT", `/api/exchange-rates/${name}`, { rate });
      if (!response.ok) {
        throw new Error("Failed to update exchange rate");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates"] });
      setEditingRates(prev => {
        const newRates = { ...prev };
        delete newRates[variables.name];
        return newRates;
      });
      toast({
        title: "Success",
        description: `Exchange rate ${variables.name} updated successfully`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update exchange rate",
      });
    },
  });

  const handleEditRate = (name: string, currentRate: string) => {
    setEditingRates(prev => ({
      ...prev,
      [name]: currentRate
    }));
  };

  const handleSaveRate = (name: string) => {
    const newRate = editingRates[name];
    if (!newRate || isNaN(parseFloat(newRate))) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid rate",
      });
      return;
    }

    updateRateMutation.mutate({ name, rate: newRate });
  };

  const handleCancelEdit = (name: string) => {
    setEditingRates(prev => {
      const newRates = { ...prev };
      delete newRates[name];
      return newRates;
    });
  };

  const getRateDisplay = (name: string, rate: string) => {
    const numRate = parseFloat(rate);
    if (name === "USDT_TO_NGN") {
      return `₦${numRate.toLocaleString()}`;
    } else if (name === "NGN_TO_USD") {
      return `$${numRate.toFixed(5)}`;
    }
    return rate;
  };

  const getRateDescription = (name: string) => {
    if (name === "USDT_TO_NGN") {
      return "How many Nigerian Naira for 1 USDT";
    } else if (name === "NGN_TO_USD") {
      return "How many USD for 1 Nigerian Naira";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              onClick={() => setLocation("/admin")} 
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exchange Rate Management</h1>
              <p className="text-gray-600">Configure exchange rates used throughout the platform</p>
            </div>
          </div>
        </div>

        {/* Warning Alert */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Changing exchange rates will affect all new trades, deposits, and calculations across the platform. 
            Existing trades will continue using their original rates.
          </AlertDescription>
        </Alert>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load exchange rates. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}

        {/* Exchange Rates List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {rates.map((rate: any) => (
              <Card key={rate.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {rate.name === "USDT_TO_NGN" ? (
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rate.name.replace(/_/g, " ")}</CardTitle>
                        <p className="text-sm text-gray-600">{rate.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Current Rate</Label>
                        {editingRates[rate.name] !== undefined ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              step="any"
                              value={editingRates[rate.name]}
                              onChange={(e) => setEditingRates(prev => ({
                                ...prev,
                                [rate.name]: e.target.value
                              }))}
                              className="w-40"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveRate(rate.name)}
                              disabled={updateRateMutation.isPending}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelEdit(rate.name)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-2xl font-bold text-gray-900">
                              {getRateDisplay(rate.name, rate.rate)}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRate(rate.name, rate.rate)}
                            >
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <p>{getRateDescription(rate.name)}</p>
                      <p>Last updated: {new Date(rate.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {rates.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exchange rates found</h3>
              <p className="text-gray-600">Exchange rates will be automatically created when the system starts.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}