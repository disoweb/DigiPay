import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, Menu, X } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "My Trades", href: "/trades" },
    { name: "Wallet", href: "/wallet" },
  ];

  if (user?.isAdmin) {
    navigation.push({ name: "Admin", href: "/admin" });
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => setLocation("/")}>
                DigiPay
              </h1>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setLocation(item.href)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location === item.href
                        ? "text-primary bg-blue-50"
                        : "text-gray-500 hover:text-primary hover:bg-gray-50"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{user?.email.split('@')[0]}</span>
              </span>
            </div>
            
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-4 w-4 text-gray-600" />
              </Button>
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </div>
            
            <Button 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="hidden md:inline-flex"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setLocation(item.href);
                  setMobileMenuOpen(false);
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                  location === item.href
                    ? "text-primary bg-blue-50"
                    : "text-gray-500 hover:text-primary hover:bg-gray-50"
                }`}
              >
                {item.name}
              </button>
            ))}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <Button 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                variant="ghost"
                className="w-full justify-start text-gray-500 hover:text-primary"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
