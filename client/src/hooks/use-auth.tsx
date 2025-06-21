import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "email" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await apiRequest("POST", "/api/auth/login", credentials);
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Login failed");
      }
    },
    onSuccess: (response: any) => {
      try {
        const { token, ...user } = response;
        if (token) {
          localStorage.setItem('digipay_token', token);
        }
        queryClient.setQueryData(["/api/user"], user);
        // Redirect to dashboard after successful login
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 100);
      } catch (error) {
        console.error("Login success handler error:", error);
      }
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      try {
        const res = await apiRequest("POST", "/api/auth/register", credentials);
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Registration failed");
      }
    },
    onSuccess: (response: any) => {
      try {
        const { token, ...user } = response;
        if (token) {
          localStorage.setItem('digipay_token', token);
        }
        queryClient.setQueryData(["/api/user"], user);
        // Redirect to dashboard after successful registration
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 100);
      } catch (error) {
        console.error("Registration success handler error:", error);
      }
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/auth/logout");
      } catch (error) {
        // Logout should still clear local state even if API call fails
        console.warn("Logout API call failed, clearing local state anyway:", error);
      }
    },
    onSuccess: () => {
      try {
        localStorage.removeItem('digipay_token');
        queryClient.setQueryData(["/api/user"], null);
        // Redirect to auth page after logout
        window.location.href = "/auth";
      } catch (error) {
        console.error("Logout success handler error:", error);
      }
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      // Still clear local state on error
      localStorage.removeItem('digipay_token');
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
