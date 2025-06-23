import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function QuickAdmin() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("digipay_token");
    setToken(storedToken);
    
    if (storedToken) {
      fetch("/api/auth/user", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setUser(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching user:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "cyfer33@gmail.com",
          password: "password",
        }),
      });

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem("digipay_token", data.token);
        setToken(data.token);
        setUser(data);
        
        // Redirect to admin if user is admin
        if (data.isAdmin) {
          window.location.href = "/admin";
        }
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("digipay_token");
    setToken(null);
    setUser(null);
    window.location.href = "/auth";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
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
              <strong>Token Present:</strong> <Badge variant={token ? "default" : "destructive"}>{token ? "Yes" : "No"}</Badge>
            </div>
            
            {token && (
              <div className="bg-gray-100 p-3 rounded text-sm font-mono break-all">
                <strong>Token:</strong> {token.substring(0, 50)}...
              </div>
            )}
            
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
            
            <div className="flex gap-4">
              {!user ? (
                <Button onClick={handleLogin}>Login as Admin</Button>
              ) : (
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