import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Settings, DollarSign, TrendingUp, AlertCircle, Save, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRates, setEditingRates] = useState<{ [key: string]: string }>({});
  const [savingRates, setSavingRates] = useState<{ [key: string]: boolean }>({});

  const { data: rates = [], isLoading: ratesLoading, error: ratesError } = useQuery({
    queryKey: ["/api/exchange-rates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/exchange-rates");
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
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
      setSavingRates(prev => {
        const newSaving = { ...prev };
        delete newSaving[variables.name];
        return newSaving;
      });
      toast({
        title: "Success",
        description: `Exchange rate ${variables.name.replace(/_/g, " ")} updated successfully`,
      });
    },
    onError: (error, variables) => {
      setSavingRates(prev => {
        const newSaving = { ...prev };
        delete newSaving[variables.name];
        return newSaving;
      });
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

    setSavingRates(prev => ({ ...prev, [name]: true }));
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

  const getRateIcon = (name: string) => {
    if (name === "USDT_TO_NGN") {
      return <DollarSign className="h-5 w-5 text-blue-600" />;
    } else if (name === "NGN_TO_USD") {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    }
    return <Settings className="h-5 w-5 text-gray-600" />;
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
              <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
              <p className="text-gray-600">Configure platform-wide settings and parameters</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          
          {/* Exchange Rates Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Exchange Rates Management
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure exchange rates used throughout the platform for calculations and trading
              </p>
            </CardHeader>
            <CardContent>
              {/* Warning Alert */}
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Changing exchange rates will affect all new trades, deposits, and calculations. 
                  Existing trades will continue using their original rates.
                </AlertDescription>
              </Alert>

              {/* Error State */}
              {ratesError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load exchange rates. Please try refreshing the page.
                  </AlertDescription>
                </Alert>
              )}

              {/* Exchange Rates List */}
              {ratesLoading ? (
                <div className="grid gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {rates.map((rate: any) => (
                    <div key={rate.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getRateIcon(rate.name)}
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">{rate.name.replace(/_/g, " ")}</h3>
                            <p className="text-sm text-gray-600">{rate.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
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
                                  placeholder="Enter new rate"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveRate(rate.name)}
                                  disabled={savingRates[rate.name]}
                                >
                                  {savingRates[rate.name] ? (
                                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4 mr-1" />
                                  )}
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelEdit(rate.name)}
                                  disabled={savingRates[rate.name]}
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
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>{getRateDescription(rate.name)}</p>
                          <p>Last updated: {new Date(rate.updatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {rates.length === 0 && !ratesLoading && (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No exchange rates found</h3>
                  <p className="text-gray-600">Exchange rates will be automatically created when the system starts.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Future Settings Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Platform Settings
              </CardTitle>
              <p className="text-sm text-gray-600">
                Additional platform configuration options
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Additional settings will be added here in future updates</p>
                <p className="text-sm">Such as: Platform fees, Trading limits, KYC requirements, etc.</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}