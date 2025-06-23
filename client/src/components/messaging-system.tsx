import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageCircle, 
  Send, 
  Inbox, 
  User,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  offerId?: number;
  messageText: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    email: string;
    isOnline?: boolean;
  };
  offer?: {
    id: number;
    type: string;
    amount: string;
    rate: string;
  };
}

export function MessagingSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: messages = [], isLoading, error } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/messages");
        if (!response.ok) {
          console.error("Failed to fetch messages:", response.status);
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
    },
    refetchInterval: 3000,
    retry: 3,
    retryDelay: 1000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      try {
        const response = await apiRequest("PATCH", `/api/messages/${messageId}/read`);
        if (!response.ok) {
          console.error("Failed to mark message as read:", response.status);
          return null;
        }
        return response.json();
      } catch (error) {
        console.error("Error marking message as read:", error);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error) => {
      console.error("Mark as read error:", error);
    }
  });

  const replyMutation = useMutation({
    mutationFn: async ({ recipientId, messageText, offerId }: { recipientId: number, messageText: string, offerId?: number }) => {
      try {
        const response = await apiRequest("POST", "/api/messages", {
          recipientId,
          messageText,
          message: messageText, // Send both field names for compatibility
          offerId
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to send reply:", response.status, errorData);
          throw new Error(errorData.error || "Failed to send reply");
        }
        return response.json();
      } catch (error) {
        console.error("Error sending reply:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully.",
      });
      setReplyText('');
      setSelectedMessage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error) => {
      console.error("Reply mutation error:", error);
      toast({
        title: "Failed to Send",
        description: "Could not send your reply. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleReply = () => {
    if (!selectedMessage || !replyText.trim()) return;
    replyMutation.mutate({
      recipientId: selectedMessage.senderId,
      messageText: replyText.trim(),
      offerId: selectedMessage.offerId
    });
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 lg:relative lg:bottom-auto lg:right-auto">
        <Card className="w-80 lg:w-full">
          <CardContent className="p-4 text-center">
            <div className="animate-pulse flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-300 rounded w-20"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    console.error("Messages error:", error);
    return (
      <div className="fixed bottom-4 right-4 lg:relative lg:bottom-auto lg:right-auto z-50">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 shadow-lg relative lg:hidden"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 lg:relative lg:bottom-auto lg:right-auto z-50">
      {/* Mobile floating message widget */}
      <div className="lg:hidden">
        {!isExpanded ? (
          <Button
            onClick={() => setIsExpanded(true)}
            className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg relative"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center p-0">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        ) : (
          <Card className="w-80 max-h-96 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageCircle className="h-4 w-4" />
                  Messages
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 max-h-64 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-4">
                  <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.slice(0, 5).map((message) => (
                    <div
                      key={message.id}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        !message.isRead ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => handleMessageClick(message)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${message.sender && message.sender.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <span className="font-medium text-xs truncate">{message.sender.email}</span>
                        {!message.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{message.messageText}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop version */}
      <div className="hidden lg:block space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <Alert>
                <MessageCircle className="h-4 w-4" />
                <AlertDescription>
                  No messages yet. When other traders contact you about your offers, their messages will appear here.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.map((message) => (
                  <Card 
                    key={message.id} 
                    className={`cursor-pointer transition-colors ${
                      !message.isRead ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${message.sender && message.sender.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                            <span className="font-medium text-sm">{message.sender.email}</span>
                            {!message.isRead && (
                              <Badge variant="destructive" className="text-xs">New</Badge>
                            )}
                          </div>
                          {message.offer && (
                            <p className="text-xs text-gray-600 mb-2">
                              About: {message.offer.type === 'sell' ? 'Selling' : 'Buying'} {message.offer.amount} USDT at ₦{parseFloat(message.offer.rate).toLocaleString()}
                            </p>
                          )}
                          <p className="text-sm text-gray-700 line-clamp-2">{message.messageText}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {new Date(message.createdAt).toLocaleDateString()}
                          </div>
                          {message.isRead ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Message from {selectedMessage?.sender.email}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              {selectedMessage.offer && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Regarding: {selectedMessage.offer.type === 'sell' ? 'Selling' : 'Buying'} {selectedMessage.offer.amount} USDT at ₦{parseFloat(selectedMessage.offer.rate).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="p-3 border rounded-lg">
                <p className="text-sm">{selectedMessage.messageText}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reply:</label>
                <Textarea
                  placeholder="Type your reply here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setSelectedMessage(null)} variant="outline" className="flex-1">
                  Close
                </Button>
                <Button 
                  onClick={handleReply} 
                  className="flex-1"
                  disabled={!replyText.trim() || replyMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}