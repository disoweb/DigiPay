import React, { Suspense, lazy } from 'react';
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProtectedRoute } from "@/lib/protected-route";
import { GlobalLoader } from "@/components/global-loader";
// Pages
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Marketplace from "@/pages/marketplace";
import Trades from "@/pages/trades";
import TradeDetail from "@/pages/trade-detail";
import Wallet from "@/pages/wallet";
import Admin from "@/pages/admin";
import AdminApprovalsNew from "@/pages/admin-approvals-new";
import ProfileSetup from "@/pages/profile-setup";
import OfferCreation from "@/pages/offer-creation";
import Ratings from "@/pages/ratings";
import UserProfile from "@/pages/user-profile";
import UserSettings from "@/pages/user-settings";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";
import ChatPage from "@/pages/chat";
import AdminKYC from "@/pages/admin-kyc";
import ManageOffers from "@/pages/manage-offers";
import DirectTrade from "./pages/trade-direct";
import UserChatPage from "./pages/user-chat-new";
import PaymentCallback from "./pages/payment-callback";
import AdminUsersFixed from "./pages/admin-users-fixed";
import AdminDisputesNew from "./pages/admin-disputes-new";
import AdminWallet from "./pages/admin-wallet";
import AdminGuide from "./pages/admin-guide";
import AdminExchangeRates from "./pages/admin-exchange-rates";
import AdminSettings from "./pages/admin-settings";

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GlobalLoader>
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
            <ProtectedRoute path="/payment-callback" component={PaymentCallback} />
            <ProtectedRoute path="/ratings" component={Ratings} />
            <ProtectedRoute path="/admin" component={Admin} adminOnly />
            <ProtectedRoute path="/admin/approvals" component={AdminApprovalsNew} adminOnly />
            <ProtectedRoute path="/admin/kyc" component={AdminKYC} adminOnly />
            <ProtectedRoute path="/admin/users" component={AdminUsersFixed} adminOnly />
            <ProtectedRoute path="/admin/wallet" component={AdminWallet} adminOnly />
            <ProtectedRoute path="/admin/guide" component={AdminGuide} adminOnly />
            <ProtectedRoute path="/admin/disputes" component={AdminDisputesNew} adminOnly />
            <ProtectedRoute path="/admin/exchange-rates" component={AdminExchangeRates} adminOnly />
            <ProtectedRoute path="/admin/settings" component={AdminSettings} adminOnly />
            <ProtectedRoute path="/profile-setup" component={ProfileSetup} />
            <ProtectedRoute path="/create-offer" component={OfferCreation} />
            <Route path="/chat/:tradeId" component={({ params }) => (
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            )} />
            <Route path="/user-chat/:userId" component={({ params }) => (
              <ProtectedRoute>
                <UserChatPage />
              </ProtectedRoute>
            )} />
            <ProtectedRoute path="/admin-kyc" component={AdminKYC} />
            <ProtectedRoute path="/manage-offers" component={ManageOffers} />
            <ProtectedRoute path="/trade-direct/:offerId" component={DirectTrade} />
            <Route path="/payment/callback" component={PaymentCallback} />

            <Route path="/settings" component={UserSettings} />
            <ProtectedRoute path="/profile" component={ProfilePage} />
            <ProtectedRoute path="/manage-offers" component={ManageOffers} />
            <Route path="/admin-guide" component={AdminGuide} />
          <Route path="/admin" component={Admin} />
          <Route path="/admin/approvals" component={AdminApprovalsNew} />
          <Route path="/admin/users" component={AdminUsersFixed} />
          <Route path="*" component={NotFound} />
            </Switch>
            </div>
          </GlobalLoader>
        </AuthProvider>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;