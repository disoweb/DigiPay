
import { createContext, useContext, ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  // verified: boolean; // Replaced by emailVerified and kycVerified
  emailVerified: boolean;
  kycVerified: boolean; // Already present in server/auth-jwt.ts token
  isAdmin?: boolean; // Already present in server/auth-jwt.ts token
  nairaBalance: string;
  usdtBalance: string;
  averageRating: string;
  ratingCount: number;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  tronAddress?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null; // Add token to context
  isLoading: boolean;
  loginMutation: {
    mutate: (data: { email: string; password: string }) => void;
    isPending: boolean;
  };
  registerMutation: {
    mutate: (data: { email: string; password: string }) => void;
    isPending: boolean;
  };
  logout: () => void;
  verifyEmail: (token: string) => Promise<any>; // Add verifyEmail function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get token
const getToken = () => localStorage.getItem("digipay_token");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["/api/auth/user"], // Changed queryKey to match typical auth user endpoint
    queryFn: async () => {
      const currentToken = getToken();
      if (!currentToken) return null;

      const response = await fetch("/api/auth/user", { // Ensure this endpoint exists and returns user data
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("digipay_token");
          // queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }); // Trigger re-fetch which will return null
          // setLocation("/auth"); // Redirect to login
        }
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch user and parse error" }));
        throw new Error(errorData.message || "Failed to fetch user");
      }
      return response.json();
    },
    retry: (failureCount, error: any) => {
      if (error.message === "Unauthorized" || error.message?.includes("401") || error.message?.includes("403")) {
        return false; // Don't retry on auth errors
      }
      return failureCount < 2; // Retry twice for other errors
    },
    staleTime: 5 * 60 * 1000, // Cache user data for 5 minutes
    refetchOnWindowFocus: true,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Login failed and error data unparsable" }));
        throw new Error(errorData.error || errorData.message || "Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("digipay_token", data.token);
        queryClient.setQueryData(["/api/auth/user"], data.user || data); // Update user data in cache
        toast({ title: "Success", description: "Logged in successfully!" });
        setLocation(data.isAdmin ? "/admin" : "/dashboard");
      } else {
        throw new Error(data.error || "Login successful but no token received.");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Error",
        description: error.message || "An unknown error occurred during login.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string, phone?: string, bvn?: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Registration failed and error data unparsable" }));
        throw new Error(errorData.error || errorData.message || "Registration failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: data.message || "Please check your email to verify your account.",
      });
      // Don't log in automatically, user needs to verify email.
      // setLocation("/auth"); // Or a specific page telling them to check email
    },
    onError: (error: any) => {
      toast({
        title: "Registration Error",
        description: error.message || "An unknown error occurred during registration.",
        variant: "destructive",
      });
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (verificationToken: string) => {
      const response = await apiRequest("GET", `/api/auth/verify-email?token=${verificationToken}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Email verification failed" }));
        throw new Error(errorData.error || errorData.message || "Email verification failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.token && data.user) {
        localStorage.setItem("digipay_token", data.token);
        queryClient.setQueryData(["/api/auth/user"], data.user); // Update user data
        toast({ title: "Success", description: "Email verified successfully!" });
        // The VerifyEmailPage will handle navigation
      } else {
        toast({ title: "Verification Info", description: data.message || "Email verified." });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Email Verification Error",
        description: error.message || "Failed to verify email.",
        variant: "destructive",
      });
      throw error; // Re-throw to allow VerifyEmailPage to catch it
    },
  });


  const logout = async () => {
    const currentToken = getToken();
    if (currentToken) {
      try {
        await apiRequest("POST", "/api/auth/logout", {}, { Authorization: `Bearer ${currentToken}` });
      } catch (error) {
        console.error("Server logout error (token might be already invalid):", error);
      }
    }
    localStorage.removeItem("digipay_token");
    queryClient.setQueryData(["/api/auth/user"], null); // Clear user data
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"]}); // To ensure it's null
    setLocation("/auth");
    // window.location.href = "/auth"; // Hard redirect if needed
  };

  // Handle case where token exists but user fetch failed (e.g. expired token)
  useEffect(() => {
    if (getToken() && isError && !isLoading) {
      console.log("Auth: Token exists but user fetch failed. Logging out.");
      logout();
    }
  }, [isError, isLoading, getToken]);


  const value: AuthContextType = {
    user: user || null,
    token: getToken(),
    isLoading,
    loginMutation: {
      mutate: loginMutation.mutate,
      isPending: loginMutation.isPending,
    },
    registerMutation: {
      mutate: registerMutation.mutate,
      isPending: registerMutation.isPending,
    },
    verifyEmail: verifyEmailMutation.mutateAsync,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
