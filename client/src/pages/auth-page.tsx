import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    phone: "",
    bvn: "",
  });
  const [registrationSuccess, setRegistrationSuccess] = useState(false); // New state

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  if (user) {
    return null; // Prevent rendering while redirecting
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerMutation.mutateAsync(registerForm);
      // On successful mutation (no error thrown by mutateAsync)
      setRegistrationSuccess(true);
    } catch (error) {
      // Error is already handled by useAuth's toast messages
      console.error("Registration failed:", error);
      setRegistrationSuccess(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardContent className="p-8">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-3">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for registering. A verification link has been sent to your email address: <strong>{registerForm.email}</strong>.
              Please check your inbox (and spam folder) and click the link to activate your account.
            </p>
            <Button asChild className="w-full">
              <a href={`mailto:${registerForm.email}`}>Open Email App</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent lg:hidden"></div>
        <div className="w-full max-w-md space-y-6 sm:space-y-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-xl">
              <span className="text-2xl font-bold text-white">D</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Welcome to DigiPay</h1>
            <p className="text-sm sm:text-base text-gray-600">Nigeria's Most Trusted P2P Trading Platform</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                <CardContent className="p-8">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email address</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Sign In
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                <CardContent className="p-8">
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={registerForm.email}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Enter your password"
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-phone">Phone Number</Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={registerForm.phone}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-bvn">BVN (Bank Verification Number)</Label>
                      <Input
                        id="register-bvn"
                        type="text"
                        placeholder="Enter your BVN"
                        value={registerForm.bvn}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, bvn: e.target.value })
                        }
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="flex-1 bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center p-4 sm:p-8 lg:min-h-screen">
        <div className="text-center text-white space-y-4 sm:space-y-6 max-w-lg">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Trade USDT with Confidence
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100">
            Secure peer-to-peer cryptocurrency trading platform with escrow protection
            and instant Naira settlements.
          </p>

          {/* Trust Indicators */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium">Platform Status: All Systems Operational</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">25K+</div>
                <div className="text-xs sm:text-sm text-blue-200">Verified Users</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">₦2.5B+</div>
                <div className="text-xs sm:text-sm text-blue-200">Monthly Volume</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">99.8%</div>
                <div className="text-xs sm:text-sm text-blue-200">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold">24/7</div>
                <div className="text-xs sm:text-sm text-blue-200">Support</div>
              </div>
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <div className="bg-white/20 px-3 py-1 rounded-full">🔒 Bank-Level Security</div>
            <div className="bg-white/20 px-3 py-1 rounded-full">✅ KYC Verified</div>
            <div className="bg-white/20 px-3 py-1 rounded-full">🛡️ Smart Contract Escrow</div>
          </div>
        </div>
      </div>
    </div>
  );
}