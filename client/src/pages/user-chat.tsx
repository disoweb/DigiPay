import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Send, 
  User, 
  Star, 
  Shield,
  MessageCircle,
  Phone,
  Mail,
  AlertTriangle
} from "lucide-react";

export default function UserChat() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: chatUser, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
    enabled: !!userId,
  });

  const { data: userMessages } = useQuery({
    queryKey: [`/api/messages/user/${userId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/messages/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!userId && !!user,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (userMessages) {
      setMessages(userMessages);
    }
  }, [userMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !userId) return;

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/messages/direct", {
        recipientId: parseInt(userId),
        messageText: message.trim()
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
        setMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chatUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">User not found</p>
              <Button onClick={() => setLocation('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (parseInt(userId) === user?.id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">You cannot chat with yourself</p>
              <Button onClick={() => setLocation('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            onClick={() => setLocation("/dashboard")} 
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                Chat with {chatUser.email}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span>{parseFloat(chatUser.averageRating || "0").toFixed(1)}</span>
                <span>({chatUser.ratingCount || 0})</span>
                <span>•</span>
                <span>{chatUser.completedTrades || 0} trades</span>
                {chatUser.kycVerified && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                      <Shield className="h-2 w-2 mr-1" />
                      Verified
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <Card className="mb-4 h-96 sm:h-[500px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full pb-0">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg: any, index) => {
                    const isFromUser = msg.senderId === user?.id;
                    return (
                      <div
                        key={index}
                        className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
                            isFromUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            isFromUser ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2 pt-4 border-t">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || loading}
                  size="sm"
                  className="px-4"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={() => setLocation('/marketplace')}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            View Their Offers
          </Button>
          <Button
            onClick={() => setLocation(`/user/${userId}`)}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <User className="h-4 w-4" />
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
}