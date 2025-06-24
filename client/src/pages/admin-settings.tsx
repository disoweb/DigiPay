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
import { ArrowLeft, Settings, DollarSign, TrendingUp, AlertCircle, Save, RefreshCw, Smartphone } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRates, setEditingRates] = useState<{ [key: string]: string }>({});
  const [savingRates, setSavingRates] = useState<{ [key: string]: boolean }>({});

  const { data: rates = [], isLoading: ratesLoading, error: ratesError, refetch } = useQuery({
    queryKey: ["/api/exchange-rates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/exchange-rates");
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      return response.json();
    },
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 1000,
    staleTime: 10000,
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
      
      // Show success message with inverse calculation info
      const inverseMessage = data.inverse ? 
        ` and calculated inverse rate automatically` : '';
      
      toast({
        title: "Success",
        description: `Exchange rate ${variables.name.replace(/_/g, " ")} updated successfully${inverseMessage}`,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <Button 
              onClick={() => setLocation("/admin")} 
              variant="outline"
              size="sm"
              className="self-start"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Admin</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">General Settings</h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600">Configure platform-wide settings and parameters</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          
          {/* Exchange Rates Section */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">Exchange Rates Management</div>
                  <p className="text-sm font-normal text-gray-600 mt-1">
                    Configure rates used throughout the platform
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Warning Alert */}
              <Alert className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  <span className="font-medium">Auto-calculation:</span> When you update one rate, the inverse rate is automatically calculated. 
                  <span className="hidden sm:inline">Rate changes affect new trades only.</span>
                </AlertDescription>
              </Alert>

              {/* Error State */}
              {ratesError && (
                <Alert variant="destructive" className="mb-4 sm:mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm">
                      Failed to load exchange rates: {ratesError.message}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => refetch()}
                      className="self-start sm:self-auto"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Exchange Rates List */}
              {ratesLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-white/50">
                      <div className="animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {rates.map((rate: any) => (
                    <div key={rate.id} className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                            {getRateIcon(rate.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-base sm:text-lg truncate">{rate.name.replace(/_/g, " ")}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{rate.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 self-start">
                          <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                          Active
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Current Rate</Label>
                          {editingRates[rate.name] !== undefined ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Input
                                type="number"
                                step="any"
                                value={editingRates[rate.name]}
                                onChange={(e) => setEditingRates(prev => ({
                                  ...prev,
                                  [rate.name]: e.target.value
                                }))}
                                className="flex-1 sm:max-w-xs"
                                placeholder="Enter new rate"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveRate(rate.name)}
                                  disabled={savingRates[rate.name]}
                                  className="flex-1 sm:flex-none"
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
                                  className="flex-1 sm:flex-none"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {getRateDisplay(rate.name, rate.rate)}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRate(rate.name, rate.rate)}
                                className="self-start sm:self-auto"
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Edit Rate
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-100">
                          <p className="flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            {getRateDescription(rate.name)}
                          </p>
                          <p>Last updated: {new Date(rate.updatedAt).toLocaleString()}</p>
                          <p className="text-blue-600 font-medium">
                            ⚡ Auto-calculates inverse rate when updated
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {rates.length === 0 && !ratesLoading && !ratesError && (
                <div className="text-center py-8 sm:py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                    <DollarSign className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No exchange rates found</h3>
                  <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">Exchange rates will be automatically created when the system starts.</p>
                  <Button onClick={() => refetch()} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Rates
                  </Button>
                </div>
              )}

              {/* Debug Info */}
              <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
                Debug: Loading={ratesLoading.toString()}, Error={!!ratesError}, Rates Count={rates.length}
                {ratesError && <div className="text-red-600">Error: {ratesError.message}</div>}
                {rates.length > 0 && <div className="text-green-600">Rates loaded successfully</div>}
              </div>
            </CardContent>
          </Card>

          {/* Future Settings Sections */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Settings className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-semibold">Platform Settings</div>
                  <p className="text-sm font-normal text-gray-600 mt-1">
                    Additional platform configuration options
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                  <Settings className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300" />
                </div>
                <p className="font-medium mb-2">Coming Soon</p>
                <p className="text-sm sm:text-base mb-1">Additional settings will be added here in future updates</p>
                <p className="text-xs sm:text-sm">Such as: Platform fees, Trading limits, KYC requirements, etc.</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}