import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, AuthenticatedRootRedirect } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Marketplace from "@/pages/marketplace";
import Trades from "@/pages/trades";
import Wallet from "@/pages/wallet";
import Admin from "@/pages/admin";
import LandingPage from "@/pages/landing-page";

function Router() {
  return (
    <Switch>
        <Route path="/">
          <AuthenticatedRootRedirect />
          <LandingPage />
        </Route>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/admin" component={Admin} />
        <ProtectedRoute path="/wallet" component={Wallet} />
        <ProtectedRoute path="/trades" component={Trades} />
        <ProtectedRoute path="/marketplace" component={Marketplace} />
        <Route component={NotFound} />
      </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;