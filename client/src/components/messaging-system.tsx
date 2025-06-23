import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, User, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  tradeId?: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  senderUsername: string;
  receiverUsername: string;
  tradeAmount?: number;
}

export function MessagingSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Early return with loading state if user data isn't available
  if (!user?.email || !user?.id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 text-gray-500">
            Loading messages...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safe query with error boundaries
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/messages");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("Messages fetch error:", err);
        throw err;
      }
    },
    retry: (failureCount, error) => {
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ receiverId, content, tradeId }: { receiverId: number; content: string; tradeId?: number }) => {
      const res = await apiRequest("POST", "/api/messages", {
        receiverId,
        content,
        tradeId,
      });
      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      setReplyContent("");
      setSelectedMessage(null);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast({
        title: "Message Sent",
        description: "Your reply has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("PATCH", `/api/messages/${messageId}/read`);
      if (!res.ok) {
        throw new Error("Failed to mark message as read");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error: Error) => {
      console.error("Mark as read error:", error);
    },
  });

  const handleMessageClick = (message: Message) => {
    try {
      setSelectedMessage(message);
      if (!message.isRead && message.receiverId === user.id) {
        markAsReadMutation.mutate(message.id);
      }
    } catch (err) {
      console.error("Handle message click error:", err);
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedMessage || !user?.id) {
      return;
    }

    try {
      const receiverId = selectedMessage.senderId === user.id 
        ? selectedMessage.receiverId 
        : selectedMessage.senderId;

      await sendReplyMutation.mutateAsync({
        receiverId,
        content: replyContent.trim(),
        tradeId: selectedMessage.tradeId,
      });
    } catch (err) {
      console.error("Send reply error:", err);
    }
  };

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 text-red-500">
            Unable to load messages. Please refresh the page.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 text-gray-500">
            Loading messages...
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = messages.filter((m: Message) => !m.isRead && m.receiverId === user.id).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.slice(0, 5).map((message: Message) => (
              <div
                key={message.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  !message.isRead && message.receiverId === user.id
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      {message.senderId === user.id 
                        ? `To: ${message.receiverUsername}` 
                        : `From: ${message.senderUsername}`}
                    </span>
                    {!message.isRead && message.receiverId === user.id && (
                      <Badge variant="destructive" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {new Date(message.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {message.content}
                </p>
                {message.tradeAmount && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    Trade: ₦{message.tradeAmount?.toLocaleString()}
                  </Badge>
                )}
              </div>
            ))}

            {selectedMessage && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Reply to Message</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedMessage.content}</p>
                  </div>
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyContent.trim() || sendReplyMutation.isPending}
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {sendReplyMutation.isPending ? "Sending..." : "Send Reply"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedMessage(null);
                        setReplyContent("");
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}