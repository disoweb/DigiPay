
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function QuickAdmin() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [loginForm, setLoginForm] = useState({
    email: "admin@digipay.com",
    password: "admin123"
  });

  const handleAdminLogin = async () => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email: loginForm.email,
        password: loginForm.password
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("auth_token", data.token);
        window.location.href = "/admin";
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid admin credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to login",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    window.location.href = "/auth";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Admin Access Debug</CardTitle>
            <CardDescription>Debug page for admin authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>User Authenticated:</strong> <Badge variant={user ? "default" : "destructive"}>{user ? "Yes" : "No"}</Badge>
            </div>
            
            {user && (
              <div className="bg-gray-100 p-3 rounded">
                <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
              </div>
            )}
            
            <div>
              <strong>Admin Status:</strong> <Badge variant={user?.isAdmin ? "default" : "destructive"}>{user?.isAdmin ? "Admin" : "Not Admin"}</Badge>
            </div>
            
            {!user?.isAdmin && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Admin Login</CardTitle>
                  <CardDescription>Login with admin credentials to access admin dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAdminLogin} className="w-full">
                    Login as Admin
                  </Button>
                </CardContent>
              </Card>
            )}
            
            <div className="flex gap-4">
              {user && (
                <>
                  <Button onClick={handleLogout} variant="outline">Logout</Button>
                  {user.isAdmin && (
                    <Button onClick={() => window.location.href = "/admin"}>Go to Admin Dashboard</Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
