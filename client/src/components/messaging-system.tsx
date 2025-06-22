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

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/messages");
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    refetchInterval: 5000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("PATCH", `/api/messages/${messageId}/read`);
      if (!response.ok) throw new Error("Failed to mark message as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    }
  });

  const replyMutation = useMutation({
    mutationFn: async ({ recipientId, messageText, offerId }: { recipientId: number, messageText: string, offerId?: number }) => {
      const response = await apiRequest("POST", "/api/messages", {
        recipientId,
        messageText,
        offerId
      });
      if (!response.ok) throw new Error("Failed to send reply");
      return response.json();
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
    onError: () => {
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
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Loading messages...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
            <div className="space-y-3">
              {messages.map((message) => (
                <Card 
                  key={message.id} 
                  className={`cursor-pointer transition-colors ${
                    !message.isRead ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleMessageClick(message)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-sm">{message.sender.email}</span>
                          {message.sender.isOnline && (
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                          )}
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