import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Send, 
  Star, 
  Shield,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  Clock
} from "lucide-react";

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  isRead: boolean;
}

interface ChatUser {
  id: number;
  email: string;
  kycVerified: boolean;
  averageRating: string;
  ratingCount: number;
  isOnline: boolean;
  lastSeen: string;
}

interface ModernChatProps {
  chatUserId: string;
  onBack: () => void;
}

export function ModernChat({ chatUserId, onBack }: ModernChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sendingState, setSendingState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: chatUser, isLoading: userLoading } = useQuery({
    queryKey: [`/api/users/${chatUserId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${chatUserId}`);
      return response.json();
    },
    enabled: !!chatUserId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/messages/user/${chatUserId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/messages/user/${chatUserId}`);
      return response.json();
    },
    enabled: !!chatUserId && !!user,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      const response = await apiRequest("POST", "/api/messages/direct", {
        receiverId: parseInt(chatUserId),
        content: messageContent,
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/user/${chatUserId}`] });
      // Show success feedback
      setSendingState('sent');
      setTimeout(() => setSendingState('idle'), 2000);
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      setSendingState('failed');
      setTimeout(() => setSendingState('idle'), 3000);
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    setSendingState('sending');
    sendMessageMutation.mutate(message.trim());
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (userLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chatUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="p-6 text-center">
          <p className="text-gray-500">User not found</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Mobile-optimized header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {chatUser?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {chatUser?.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {chatUser?.email?.split('@')[0] || 'User'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {chatUser?.isOnline ? (
                    <span className="text-green-600">Online</span>
                  ) : (
                    <span>Last seen recently</span>
                  )}
                  {chatUser?.kycVerified && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      <Shield className="h-2 w-2 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="p-2">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Phone className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  Start a conversation with {chatUser?.email?.split('@')[0] || 'this user'}
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg: Message) => {
                  const isOwnMessage = msg.senderId === user?.id;
                  const messageTime = new Date(msg.createdAt);
                  const now = new Date();
                  const timeDiff = now.getTime() - messageTime.getTime();
                  const isRecent = timeDiff < 5000; // Less than 5 seconds
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border shadow-sm'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span>
                            {messageTime.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isOwnMessage && (
                            <>
                              {sendMessageMutation.isPending && isRecent ? (
                                <Clock className="h-3 w-3 animate-pulse" />
                              ) : msg.isRead ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      {sendingState !== 'idle' && (
        <div className="px-4 py-2 bg-gray-50 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {sendingState === 'sending' && (
              <>
                <Clock className="h-3 w-3 animate-spin" />
                <span>Sending message...</span>
              </>
            )}
            {sendingState === 'sent' && (
              <>
                <CheckCheck className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Message sent</span>
              </>
            )}
            {sendingState === 'failed' && (
              <>
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-red-600">Failed to send message</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            size="sm"
            className={`rounded-full h-10 w-10 p-0 transition-colors ${
              sendingState === 'sent' ? 'bg-green-600 hover:bg-green-700' : 
              sendingState === 'failed' ? 'bg-red-600 hover:bg-red-700' : ''
            }`}
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            {sendingState === 'sending' ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : sendingState === 'sent' ? (
              <CheckCheck className="h-4 w-4" />
            ) : sendingState === 'failed' ? (
              <div className="h-2 w-2 rounded-full bg-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}