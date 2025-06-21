
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, Menu, X, Home, Store, ArrowLeftRight, Wallet, Shield } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Marketplace", href: "/marketplace", icon: Store },
    { name: "Create Offer", href: "/create-offer", icon: Store },
    { name: "My Trades", href: "/trades", icon: ArrowLeftRight },
    { name: "Wallet", href: "/wallet", icon: Wallet },
  ];

  if (user?.isAdmin) {
    navigation.push({ name: "Admin", href: "/admin", icon: Shield });
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleNavigation = (href: string) => {
    setLocation(href);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 cursor-pointer flex items-center"
              onClick={() => handleNavigation("/dashboard")}
            >
              <h1 className="text-xl sm:text-2xl font-bold text-primary">DigiPay</h1>
              <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-800 text-xs hidden sm:inline-flex">
                Trusted
              </Badge>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:block ml-8">
              <div className="flex items-baseline space-x-1">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location === item.href
                        ? "text-primary bg-blue-50 shadow-sm"
                        : "text-gray-600 hover:text-primary hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right side - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-medium text-primary">{user?.email.split('@')[0]}</span>
            </div>
            
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
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
              variant="outline"
              size="sm"
              className="border-gray-200 hover:bg-gray-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Mobile - Right side */}
          <div className="flex lg:hidden items-center space-x-2">
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-4 w-4 text-gray-600" />
              </Button>
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="px-3 pt-3 pb-4 space-y-2">
            {/* User Info */}
            <div className="px-3 py-2 bg-gray-50 rounded-lg mb-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.email.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>

            {/* Navigation Items */}
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`flex items-center w-full px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                  location === item.href
                    ? "text-primary bg-blue-50 shadow-sm"
                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </button>
            ))}
            
            {/* Logout Button */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <Button 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                variant="ghost"
                className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50 py-3"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
