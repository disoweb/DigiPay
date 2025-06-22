import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ProfileCompletionModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
}

export function ProfileCompletionModal({ open, onClose, user }: ProfileCompletionModalProps) {
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [location, setLocation] = useState(user?.location || "");
  const [phone, setPhone] = useState(user?.phone || "");
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      toast({
        title: "Error",
        description: "Please enter your first name, last name, and username",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      location: location.trim() || null,
      phone: phone.trim() || null
    });
  };

  const canSkip = user?.firstName && user?.lastName && user?.username;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your city/state"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              type="tel"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
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
            
            {canSkip && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Skip
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}