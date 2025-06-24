import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, Settings, Mail, Phone, MapPin, CheckCircle, XCircle, Loader2, ArrowLeft, Star, TrendingUp, Shield, Flag } from "lucide-react";
import { useLocation } from "wouter";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [userLocation, setUserLocation] = useState(user?.location || "");
  const [phone, setPhone] = useState(user?.phone || "");

  // Fetch user's trading data
  const { data: userTrades = [] } = useQuery({
    queryKey: ["/api/trades"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/trades");
      if (!response.ok) throw new Error("Failed to fetch trades");
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch user's ratings received
  const { data: userRatings = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/ratings`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/ratings`);
      if (!response.ok) throw new Error("Failed to fetch ratings");
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch all ratings to show what user has given
  const { data: allRatings = [] } = useQuery({
    queryKey: ["/api/ratings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ratings");
      if (!response.ok) throw new Error("Failed to fetch all ratings");
      return response.json();
    },
    enabled: !!user,
  });
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
    suggestions: string[];
  }>({
    checking: false,
    available: null,
    message: "",
    suggestions: []
  });

  // Debounced username checking
  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: "Username must be at least 3 characters long",
        suggestions: []
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: "Username can only contain letters, numbers, and underscores",
        suggestions: []
      });
      return;
    }

    setUsernameStatus(prev => ({ ...prev, checking: true }));

    try {
      const response = await apiRequest("GET", `/api/user/check-username/${usernameToCheck}`);
      const data = await response.json();
      
      setUsernameStatus({
        checking: false,
        available: data.available,
        message: data.message,
        suggestions: data.suggestions || []
      });
    } catch (error) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: "Error checking username availability",
        suggestions: []
      });
    }
  }, []);

  // Debounce username checking
  useEffect(() => {
    if (username === user?.username) {
      setUsernameStatus({
        checking: false,
        available: true,
        message: "Current username",
        suggestions: []
      });
      return;
    }

    const timeoutId = setTimeout(() => {
      if (username.trim()) {
        checkUsernameAvailability(username.trim());
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, checkUsernameAvailability, user?.username]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in your first name, last name, and username.",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      location: userLocation.trim() || null,
      phone: phone.trim() || null
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-muted-foreground">You need to be logged in to access your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Settings className="w-6 h-6" />
        <h1 className="text-3xl font-bold">Profile Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              Update your personal details and profile information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="username">Username *</Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a unique username"
                    required
                    className={`pr-10 ${
                      usernameStatus.available === true ? 'border-green-500' :
                      usernameStatus.available === false ? 'border-red-500' : ''
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {usernameStatus.checking && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                    {!usernameStatus.checking && usernameStatus.available === true && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {!usernameStatus.checking && usernameStatus.available === false && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {usernameStatus.message && (
                  <p className={`text-sm mt-1 ${
                    usernameStatus.available === true ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {usernameStatus.message}
                  </p>
                )}
                {usernameStatus.suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Suggestions:</p>
                    <div className="flex flex-wrap gap-1">
                      {usernameStatus.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setUsername(suggestion)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="location" className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>Location</span>
                </Label>
                <Input
                  id="location"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  placeholder="Enter your city/state"
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number</span>
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  type="tel"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={
                  updateProfileMutation.isPending || 
                  usernameStatus.checking || 
                  usernameStatus.available === false ||
                  !firstName.trim() ||
                  !lastName.trim() ||
                  !username.trim()
                }
              >
                {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Enhanced Profile with Tabs */}
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
            <TabsTrigger value="disputes">History</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Account Information</span>
                </CardTitle>
                <CardDescription>
                  Your account details and verification status.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
                
                <div>
                  <Label>Account Balance</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={`₦${parseFloat(user.nairaBalance || "0").toLocaleString()}`}
                      disabled
                      className="bg-muted"
                    />
                    <Input
                      value={`${parseFloat(user.usdtBalance || "0").toFixed(2)} USDT`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>KYC Status</Label>
                  <Input
                    value={user.kycVerified ? "Verified" : "Not Verified"}
                    disabled
                    className={user.kycVerified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}
                  />
                </div>
                
                <div>
                  <Label>Member Since</Label>
                  <Input
                    value={new Date(user.createdAt || "").toLocaleDateString()}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trading Tab */}
          <TabsContent value="trading" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Trading Statistics</span>
                </CardTitle>
                <CardDescription>
                  Your trading performance and history.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{userTrades.length}</p>
                    <p className="text-sm text-blue-700">Total Trades</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {userTrades.filter((t: any) => t.status === 'completed').length}
                    </p>
                    <p className="text-sm text-green-700">Completed</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {userRatings.length > 0 ? (userRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / userRatings.length).toFixed(1) : "0"}
                    </p>
                    <p className="text-sm text-yellow-700">Avg Rating</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{userRatings.length}</p>
                    <p className="text-sm text-purple-700">Reviews</p>
                  </div>
                </div>

                {/* Recent Trades */}
                <div>
                  <h4 className="font-medium mb-3">Recent Trades</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {userTrades.slice(0, 5).map((trade: any) => (
                      <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Trade #{trade.id}</p>
                          <p className="text-sm text-gray-600">
                            {parseFloat(trade.amount).toFixed(2)} USDT @ ₦{parseFloat(trade.rate).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            trade.status === 'completed' ? 'bg-green-100 text-green-800' :
                            trade.status === 'disputed' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {trade.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(trade.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {userTrades.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No trades yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ratings Tab */}
          <TabsContent value="ratings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5" />
                  <span>Ratings & Reviews</span>
                </CardTitle>
                <CardDescription>
                  Ratings you've received and given to trading partners.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Ratings Received */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Ratings Received ({userRatings.length})
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {userRatings.map((rating: any) => (
                      <div key={rating.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < rating.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">({rating.rating}/5)</span>
                          </div>
                          <Badge variant="outline">Trade #{rating.tradeId}</Badge>
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-gray-600">{rating.comment}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {userRatings.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No ratings received yet</p>
                    )}
                  </div>
                </div>

                {/* Ratings Given */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Ratings Given ({allRatings.filter((r: any) => r.rater?.id === user.id).length})
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {allRatings.filter((r: any) => r.rater?.id === user.id).map((rating: any) => (
                      <div key={rating.id} className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < rating.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">({rating.rating}/5)</span>
                          </div>
                          <Badge variant="outline">Trade #{rating.tradeId}</Badge>
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-gray-600">{rating.comment}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Rated {rating.ratedUser?.email?.split('@')[0]} • {new Date(rating.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {allRatings.filter((r: any) => r.rater?.id === user.id).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No ratings given yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab (including disputes) */}
          <TabsContent value="disputes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flag className="w-5 h-5" />
                  <span>Trade History & Disputes</span>
                </CardTitle>
                <CardDescription>
                  Complete trading history including any disputes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userTrades.map((trade: any) => (
                    <div key={trade.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Trade #{trade.id}</Badge>
                          <Badge className={
                            trade.status === 'completed' ? 'bg-green-100 text-green-800' :
                            trade.status === 'disputed' ? 'bg-red-100 text-red-800' :
                            trade.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {trade.status}
                          </Badge>
                          {trade.status === 'disputed' && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <Flag className="w-3 h-3" />
                              Disputed
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-medium">{parseFloat(trade.amount).toFixed(2)} USDT</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Rate</p>
                          <p className="font-medium">₦{parseFloat(trade.rate).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total</p>
                          <p className="font-medium">₦{(parseFloat(trade.amount) * parseFloat(trade.rate)).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Role</p>
                          <p className="font-medium">{trade.buyerId === user.id ? 'Buyer' : 'Seller'}</p>
                        </div>
                      </div>

                      {trade.disputeReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm font-medium text-red-800 mb-1">Dispute Reason:</p>
                          <p className="text-sm text-red-700">{trade.disputeReason}</p>
                          {trade.disputeRaisedBy && (
                            <p className="text-xs text-red-600 mt-1">
                              Raised by: {trade.disputeRaisedBy}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {userTrades.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No trading history</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}