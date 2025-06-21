import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Pages
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Marketplace from "@/pages/marketplace";
import Trades from "@/pages/trades";
import TradeDetail from "@/pages/trade-detail";
import Wallet from "@/pages/wallet";
import Admin from "@/pages/admin";
import Ratings from "@/pages/ratings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-white">
          <Switch>
            <Route path="/" component={LandingPage} />
            <Route path="/auth" component={AuthPage} />
            
            <ProtectedRoute path="/dashboard" component={Dashboard} />
            <ProtectedRoute path="/marketplace" component={Marketplace} />
            <ProtectedRoute path="/trades" component={Trades} />
            <ProtectedRoute path="/trades/:id" component={TradeDetail} />
            <ProtectedRoute path="/wallet" component={Wallet} />
            <ProtectedRoute path="/ratings" component={Ratings} />
            <ProtectedRoute path="/admin" component={Admin} adminOnly />
            
            <Route component={NotFound} />
          </Switch>
          
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;