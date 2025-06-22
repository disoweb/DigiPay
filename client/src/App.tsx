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
import AdminApprovals from "@/pages/admin-approvals";
import ProfileSetup from "@/pages/profile-setup";
import OfferCreation from "@/pages/offer-creation";
import Ratings from "@/pages/ratings";
import UserProfile from "@/pages/user-profile";
import UserSettings from "@/pages/user-settings";
import NotFound from "@/pages/not-found";
import ChatPage from "@/pages/chat";

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
            <Route path="/trades/:id" component={({ params }) => (
              <ProtectedRoute>
                <TradeDetail />
              </ProtectedRoute>
            )} />
            <ProtectedRoute path="/wallet" component={Wallet} />
            <ProtectedRoute path="/ratings" component={Ratings} />
            <ProtectedRoute path="/admin" component={Admin} adminOnly />
            <ProtectedRoute path="/admin/approvals" component={AdminApprovals} adminOnly />
            <ProtectedRoute path="/profile-setup" component={ProfileSetup} />
            <ProtectedRoute path="/create-offer" component={OfferCreation} />
            <Route path="/chat/:tradeId" component={({ params }) => (
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            )} />
            <Route path="/user/:id" component={UserProfile} />
            <Route path="/settings" component={UserSettings} />
            <Route component={NotFound} />
          </Switch>

          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;