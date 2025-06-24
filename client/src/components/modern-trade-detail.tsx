import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { RatingForm } from "@/components/rating-form";
import { DisputeResolution } from "@/components/dispute-resolution";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  DollarSign,
  Calendar,
  TrendingUp,
  MessageCircle,
  ArrowLeft,
  Copy,
  ExternalLink,
  Timer,
  Activity,
  Eye,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  RefreshCw,
  CheckCircle2,
  Star,
  Flag,
} from "lucide-react";

interface Trade {
  id: number;
  offerId: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  rate: string;
  fiatAmount: string;
  status: string;
  escrowAddress?: string;
  paymentDeadline?: string;
  paymentMadeAt?: string;
  sellerConfirmedAt?: string;
  disputeReason?: string;
  paymentReference?: string;
  paymentProof?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  createdAt: string;
  buyer?: { id: number; email: string; averageRating?: string };
  seller?: { id: number; email: string; averageRating?: string };
  offer?: { type: string; paymentMethod?: string };
}

export function ModernTradeDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Check if user has already rated this trade
  const { data: existingRating } = useQuery({
    queryKey: [`/api/trades/${id}/rating`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/trades/${id}/rating`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch rating");
      return response.json();
    },
    enabled: !!user && !!id,
  });

  const {
    data: trade,
    isLoading,
    error,
    refetch,
  } = useQuery<Trade>({
    queryKey: ["/api/trades", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/trades/${id}`);
      if (!response.ok) throw new Error("Failed to fetch trade");
      return response.json();
    },
    refetchInterval: 10000,
    enabled: !!user && !!id, // Only run query when user is authenticated and ID exists
    retry: (failureCount, error: any) => {
      if (
        error?.message?.includes("401") ||
        error?.message?.includes("Unauthorized")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
  });

  const markPaymentMadeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/trades/${id}/payment-made`,
      );
      if (!response.ok) throw new Error("Failed to mark payment as made");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades", id] });
      toast({ title: "Success", description: "Payment marked as made" });
    },
  });

  const completeTradeMultation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${id}/complete`);
      if (!response.ok) throw new Error("Failed to complete trade");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades", id] });
      toast({ title: "Success", description: "Trade completed successfully" });
      // Show rating form after successful completion
      setTimeout(() => setShowRatingForm(true), 1000);
    },
  });

  const cancelTradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/trades/${id}/cancel`);
      if (!response.ok) throw new Error("Failed to cancel trade");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades", id] });
      toast({ title: "Success", description: "Trade cancelled" });
    },
  });

  // Auto-expiration check mutation
  const checkExpirationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/trades/${id}/check-expiration`,
      );
      if (!response.ok) throw new Error("Failed to check expiration");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.expired) {
        queryClient.invalidateQueries({ queryKey: ["/api/trades", id] });
        toast({
          title: "Trade Expired",
          description: "This trade has expired due to payment deadline",
          variant: "destructive",
        });
      }
    },
  });

  // Track if expiration check has been performed to avoid duplicate calls
  const [expirationChecked, setExpirationChecked] = useState(false);

  // Always call useEffect hooks consistently
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (trade?.paymentDeadline && trade.status === "payment_pending") {
      const updateTimer = () => {
        const now = new Date().getTime();
        const deadline = new Date(trade.paymentDeadline!).getTime();
        const difference = deadline - now;

        if (difference <= 0) {
          setTimeLeft("Expired");
          setIsExpired(true);
          // Auto-check expiration on server only once
          if (!expirationChecked) {
            setExpirationChecked(true);
            checkExpirationMutation.mutate();
          }
          return;
        }

        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60),
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (hours > 0) {
          setTimeLeft(
            `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
          );
        } else {
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimeLeft("");
      setIsExpired(false);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [trade?.paymentDeadline, trade?.status]);

  // Define trade-related variables after all hooks
  const isBuyer = trade?.buyerId === user?.id;
  const isSeller = trade?.sellerId === user?.id;
  const isUserInTrade = isBuyer || isSeller;
  const partner = isBuyer ? trade?.seller : trade?.buyer;

  // Define action capabilities
  const canMarkPaymentMade =
    user && trade && isBuyer && trade.status === "payment_pending";
  const canComplete =
    user && trade && isSeller && trade.status === "payment_made";
  const canCancel =
    user &&
    trade &&
    isUserInTrade &&
    ["payment_pending", "payment_made"].includes(trade.status);

  // Show loading while authentication is being checked
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/trades")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">Trade Details</h1>
            <div className="w-8" />
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-3"></div>
              <h3 className="font-medium text-yellow-900 mb-2">
                Authenticating...
              </h3>
              <p className="text-yellow-700 text-sm">
                Please wait while we verify your session
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/trades")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">Trade Details</h1>
            <div className="w-8" />
          </div>
        </div>

        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/trades")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">Trade Details</h1>
            <div className="w-8" />
          </div>
        </div>

        <div className="p-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-medium text-red-900 mb-2">Trade not found</h3>
              <p className="text-red-700 text-sm mb-4">
                This trade may have been removed or you don't have access to it
              </p>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="border-red-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mock online status - in real app this would come from WebSocket or API
  const getOnlineStatus = () => {
    const lastSeen = Math.floor(Math.random() * 10); // Random minutes for demo
    if (lastSeen < 1)
      return {
        status: "online",
        text: "Online",
        color: "bg-green-500",
        textColor: "text-green-600",
      };
    if (lastSeen < 5)
      return {
        status: "recent",
        text: "Active",
        color: "bg-yellow-500",
        textColor: "text-yellow-600",
      };
    return {
      status: "offline",
      text: "Offline",
      color: "bg-gray-400",
      textColor: "text-gray-500",
    };
  };

  const onlineStatus = getOnlineStatus();

  // Mock completion rate - in real app this would come from user stats
  const getCompletionRate = () => {
    return Math.floor(Math.random() * 20) + 80; // 80-100% for demo
  };

  const completionRate = getCompletionRate();

  const getStatusColor = (status: string, isExpired: boolean = false) => {
    if (status === "payment_pending" && isExpired) {
      return "bg-red-100 text-red-800 border-red-200";
    }

    switch (status) {
      case "payment_pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "payment_made":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "disputed":
        return "bg-red-100 text-red-800 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "payment_pending":
        return <Timer className="h-3 w-3" />;
      case "payment_made":
        return <Clock className="h-3 w-3" />;
      case "completed":
        return <CheckCircle2 className="h-3 w-3" />;
      case "disputed":
        return <AlertCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      case "expired":
        return <XCircle className="h-3 w-3" />;
      case "disputed":
        return <AlertTriangle className="h-3 w-3" />;
      case "canceled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const getTradeProgress = () => {
    switch (trade.status) {
      case "payment_pending":
        return 25;
      case "payment_made":
        return 75;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/trades")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Trade #{trade.id}</h1>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-2 space-y-2 h-[calc(100vh-120px)] overflow-hidden">
        {/* Compact Header with Status and Progress */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Badge
                className={`${getStatusColor(trade.status)} flex items-center gap-1 text-xs`}
              >
                {getStatusIcon(trade.status)}
                {formatStatus(trade.status)}
              </Badge>
              <span className="text-xs text-gray-600">
                {new Date(trade.createdAt).toLocaleDateString()}
              </span>
            </div>
            <Progress value={getTradeProgress()} className="h-1.5" />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{getTradeProgress()}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Compact Trade Overview */}
        <Card className="flex-1">
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <p className="text-xs text-gray-600">Amount</p>
                <p className="font-bold text-sm">
                  ${parseFloat(trade.amount).toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">USDT</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Rate</p>
                <p className="font-bold text-sm">
                  ₦{parseFloat(trade.rate).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">per USDT</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Total</p>
                <div className="flex items-center justify-center gap-1">
                  <p className="font-bold text-sm text-green-600">
                    ₦
                    {(
                      parseFloat(trade.amount) * parseFloat(trade.rate)
                    ).toLocaleString()}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        (
                          parseFloat(trade.amount) * parseFloat(trade.rate)
                        ).toString(),
                        "Total amount",
                      )
                    }
                    className="h-4 w-4 p-0 text-green-600"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Badge variant="outline" className="text-xs mt-1 capitalize">
                  {isBuyer ? "Buyer" : "Seller"}
                </Badge>
              </div>
            </div>

            {/* Partner Info Inline */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                      {(partner?.email || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 ${onlineStatus.color} border border-white rounded-full`}
                  ></div>
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {partner?.email?.split("@")[0] || "Unknown"}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs ${onlineStatus.textColor}`}>
                      {onlineStatus.text}
                    </span>
                    {partner?.averageRating && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-yellow-600">
                          ★{parseFloat(partner.averageRating).toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/chat/${trade.id}`)}
                className="h-8 px-3 text-xs"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Chat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Compact Payment Details for Buyers */}
        {isBuyer && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm text-blue-900">
                  Payment Details
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-white p-2 rounded border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium">Bank</p>
                  <p className="text-xs font-mono truncate">
                    {trade.bankName || "First Bank"}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        trade.bankName || "First Bank",
                        "Bank name",
                      )
                    }
                    className="h-5 w-5 p-0 text-blue-600"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <div className="bg-white p-2 rounded border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium">Account</p>
                  <p className="text-xs font-mono truncate">
                    {trade.accountNumber || "1234567890"}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        trade.accountNumber || "1234567890",
                        "Account number",
                      )
                    }
                    className="h-5 w-5 p-0 text-blue-600"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <div className="bg-white p-2 rounded border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium">Name</p>
                  <p className="text-xs font-mono truncate">
                    {trade.accountName || "John Doe"}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        trade.accountName || "John Doe",
                        "Account name",
                      )
                    }
                    className="h-5 w-5 p-0 text-blue-600"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="bg-amber-50 p-2 rounded border border-amber-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-amber-800 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Send exactly:
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-amber-900">
                      ₦
                      {(
                        parseFloat(trade.amount) * parseFloat(trade.rate)
                      ).toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(
                          (
                            parseFloat(trade.amount) * parseFloat(trade.rate)
                          ).toString(),
                          "Payment amount",
                        )
                      }
                      className="h-4 w-4 p-0 text-amber-700"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-amber-700">
                  Save receipt & click "Payment Made" after sending
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Payment Details for Sellers */}
        {isSeller && (trade.bankName || trade.accountNumber) && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm text-green-900">
                  Your Payment Details
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-xs text-green-700">Bank</p>
                  <p className="text-xs font-mono">{trade.bankName}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-700">Account</p>
                  <p className="text-xs font-mono">{trade.accountNumber}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-700">Name</p>
                  <p className="text-xs font-mono">{trade.accountName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Countdown Timer */}
        {trade.paymentDeadline && trade.status === "payment_pending" && (
          <div
            className={`flex items-center justify-between p-2 rounded-lg border ${
              isExpired
                ? "bg-red-50 border-red-200"
                : timeLeft.includes(":") && !timeLeft.startsWith("0:")
                  ? "bg-orange-50 border-orange-200"
                  : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Timer
                className={`h-3 w-3 ${
                  isExpired
                    ? "text-red-600"
                    : timeLeft.includes(":") && !timeLeft.startsWith("0:")
                      ? "text-orange-600"
                      : "text-red-600"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  isExpired
                    ? "text-red-900"
                    : timeLeft.includes(":") && !timeLeft.startsWith("0:")
                      ? "text-orange-900"
                      : "text-red-900"
                }`}
              >
                {isExpired ? "Payment Expired" : "Time Remaining"}
              </span>
            </div>
            <p
              className={`text-xs font-mono font-bold ${
                isExpired
                  ? "text-red-800"
                  : timeLeft.includes(":") && !timeLeft.startsWith("0:")
                    ? "text-orange-800"
                    : "text-red-800"
              }`}
            >
              {timeLeft}
            </p>
          </div>
        )}

        {/* Compact Action Buttons */}
        {isUserInTrade && (
          <div className="space-y-2 mt-auto">
            {canMarkPaymentMade && (
              <Button
                onClick={() => markPaymentMadeMutation.mutate()}
                disabled={markPaymentMadeMutation.isPending}
                className="w-auto h-10 bg-blue-600 hover:bg-blue-700 text-sm"
              >
                {markPaymentMadeMutation.isPending ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-2" />I Have Made Payment
                  </>
                )}
              </Button>
            )}

            {canComplete && (
              <Button
                onClick={() => completeTradeMultation.mutate()}
                disabled={completeTradeMultation.isPending}
                className="w-auto h-10 bg-green-600 hover:bg-green-700 text-sm"
              >
                {completeTradeMultation.isPending ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-2" />
                    Payment Recieved
                  </>
                )}
              </Button>
            )}

            {/* Rating Button for Completed Trades */}
            {trade.status === "completed" && !existingRating && (
              <Button
                onClick={() => setShowRatingForm(true)}
                className="w-auto h-10 bg-yellow-600 hover:bg-yellow-700 text-sm "
              >
                <Star className="h-3 w-3 mr-2" />
                Rate this trade
              </Button>
            )}

            {/* Show rating if already rated */}
            {trade.status === "completed" && existingRating && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-800">
                      You rated this trade:
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < existingRating.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {existingRating.comment && (
                    <p className="text-xs text-yellow-700 mt-1">
                      {existingRating.comment}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              {/* Dispute Button for Active Trades */}
              {["payment_pending", "payment_made"].includes(trade.status) && (
                <Button
                  variant="outline"
                  onClick={() => setShowDisputeForm(true)}
                  className="flex-1 h-8 border-red-300 text-red-600 hover:bg-red-50 text-xs"
                >
                  <Flag className="h-3 w-3 mr-1" />
                  Dispute
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="outline"
                  onClick={() => cancelTradeMutation.mutate()}
                  disabled={cancelTradeMutation.isPending}
                  className="flex-1 h-8 border-red-300 text-red-600 hover:bg-red-50 text-xs"
                >
                  {cancelTradeMutation.isPending ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancel
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Rating Form Modal */}
        {showRatingForm && trade && (
          <RatingForm
            tradeId={trade.id}
            ratedUserId={isBuyer ? trade.seller?.id : trade.buyer?.id}
            ratedUserEmail={isBuyer ? trade.seller?.email : trade.buyer?.email}
            ratedUserUsername={isBuyer ? trade.seller?.username : trade.buyer?.username}
            open={showRatingForm}
            onOpenChange={setShowRatingForm}
            onSubmit={() => {
              queryClient.invalidateQueries({
                queryKey: [`/api/trades/${id}/rating`],
              });
              setShowRatingForm(false);
            }}
          />
        )}

        {/* Dispute Form Modal */}
        {showDisputeForm && trade && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Raise Dispute</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDisputeForm(false)}
                    className="h-8 w-8 p-0"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <DisputeResolution
                  trade={trade as any}
                  userRole={isBuyer ? "buyer" : "seller"}
                  onDisputeRaised={() => {
                    refetch();
                    setShowDisputeForm(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
