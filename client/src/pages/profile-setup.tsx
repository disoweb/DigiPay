import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, MapPin, Clock, CreditCard, Globe } from "lucide-react";

const paymentMethodOptions = [
  "Bank Transfer",
  "Mobile Money (MTN)",
  "Mobile Money (Airtel)",
  "Mobile Money (Glo)",
  "Opay",
  "PalmPay",
  "Kuda",
  "Moniepoint",
  "Cash Pickup"
];

const locationOptions = [
  "Lagos, Nigeria",
  "Abuja, Nigeria", 
  "Port Harcourt, Nigeria",
  "Kano, Nigeria",
  "Ibadan, Nigeria",
  "Kaduna, Nigeria",
  "Benin City, Nigeria",
  "Enugu, Nigeria",
  "Calabar, Nigeria",
  "Other"
];

export default function ProfileSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: "",
    location: "",
    bio: "",
    preferredPaymentMethods: [] as string[],
    tradingHours: {
      start: "09:00",
      end: "18:00",
      timezone: "WAT"
    }
  });

  const setupMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/user/profile-setup", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Setup Complete",
        description: "Your trading profile has been configured successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/marketplace");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to setup profile",
        variant: "destructive",
      });
    },
  });

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferredPaymentMethods: checked
        ? [...prev.preferredPaymentMethods, method]
        : prev.preferredPaymentMethods.filter(m => m !== method)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.location || formData.preferredPaymentMethods.length === 0) {
      toast({
        title: "Incomplete Profile",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    setupMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-3xl mx-auto p-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Trading Profile</h1>
          <p className="text-gray-600">Set up your profile to start trading with confidence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full legal name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell other traders about yourself..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Preferred Payment Methods *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paymentMethodOptions.map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox
                      id={method}
                      checked={formData.preferredPaymentMethods.includes(method)}
                      onCheckedChange={(checked) => handlePaymentMethodChange(method, checked as boolean)}
                    />
                    <Label htmlFor={method} className="text-sm font-medium">
                      {method}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Select all payment methods you can accept for trades
              </p>
            </CardContent>
          </Card>

          {/* Trading Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Trading Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.tradingHours.start}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      tradingHours: { ...prev.tradingHours, start: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.tradingHours.end}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      tradingHours: { ...prev.tradingHours, end: e.target.value }
                    }))}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Set your preferred trading hours (WAT timezone)
              </p>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              disabled={setupMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {setupMutation.isPending ? "Setting up..." : "Complete Setup"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}