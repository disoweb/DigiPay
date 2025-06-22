import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send, CheckCheck, Clock, Wifi, WifiOff } from "lucide-react";

interface EnrichedMessage {
  id: number;
  tradeId: number;
  senderId: number;
  message: string;
  createdAt: string;
  sender?: {
    id: number;
    email: string;
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface RealTimeChatProps {
  tradeId: number;
}

export function RealTimeChat({ tradeId }: RealTimeChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<Map<string, EnrichedMessage>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<EnrichedMessage[]>({
    queryKey: ["/api/trades", tradeId, "messages"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/trades/${tradeId}/messages`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      // Add pending message immediately for instant feedback
      const tempId = `temp-${Date.now()}`;
      const pendingMessage: EnrichedMessage = {
        id: 0,
        tradeId,
        senderId: user?.id || 0,
        message: messageText,
        createdAt: new Date().toISOString(),
        status: 'sending'
      };
      
      setPendingMessages(prev => new Map(prev.set(tempId, pendingMessage)));
      
      try {
        const res = await apiRequest("POST", `/api/trades/${tradeId}/messages`, {
          message: messageText,
        });
        
        if (!res.ok) {
          throw new Error('Failed to send message');
        }
        
        // Update pending message to sent status
        setPendingMessages(prev => {
          const newMap = new Map(prev);
          const msg = newMap.get(tempId);
          if (msg) {
            newMap.set(tempId, { ...msg, status: 'sent' });
          }
          return newMap;
        });
        
        // Remove pending message after a delay to show sent status
        setTimeout(() => {
          setPendingMessages(prev => {
            const newMap = new Map(prev);
            newMap.delete(tempId);
            return newMap;
          });
        }, 1000);
        
        return res.json();
      } catch (error) {
        // Mark message as failed
        setPendingMessages(prev => {
          const newMap = new Map(prev);
          const msg = newMap.get(tempId);
          if (msg) {
            newMap.set(tempId, { ...msg, status: 'failed' });
          }
          return newMap;
        });
        
        // Remove failed message after delay
        setTimeout(() => {
          setPendingMessages(prev => {
            const newMap = new Map(prev);
            newMap.delete(tempId);
            return newMap;
          });
        }, 3000);
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades", tradeId, "messages"] });
      setMessage("");
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    }
  });

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
      
      // Notify server of user connection
      if (user?.id) {
        wsRef.current?.send(JSON.stringify({
          type: 'user_connect',
          userId: user.id
        }));
      }
      
      // Join trade room
      wsRef.current?.send(JSON.stringify({
        type: 'join_trade',
        tradeId
      }));
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message" && data.tradeId === tradeId) {
          queryClient.invalidateQueries({ queryKey: ["/api/trades", tradeId, "messages"] });
          
          // Show notification if page is not focused
          if (document.hidden && 'Notification' in window) {
            new Notification('New message in trade chat', {
              body: 'You have received a new message',
              icon: '/favicon.ico'
            });
          }
        } else if (data.type === "notification") {
          // Handle other notifications
          if ('Notification' in window) {
            new Notification('DigiPay Notification', {
              body: data.data.message,
              icon: '/favicon.ico'
            });
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [tradeId]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trade Chat</h3>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trade Chat</h3>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-500 font-medium">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-500 font-medium">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && pendingMessages.size === 0 ? (
          <div className="text-center py-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mx-auto max-w-xs shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {[...messages]
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .concat([...Array.from(pendingMessages.values())])
              .map((msg, index) => {
                const isOwnMessage = msg.senderId === user?.id;
                const isPending = msg.status === 'sending';
                const isFailed = msg.status === 'failed';
                const messageKey = msg.id > 0 ? `msg-${msg.id}` : `pending-${index}`;
                
                return (
                  <div
                    key={messageKey}
                    className={`flex items-end space-x-2 ${
                      isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
                    } ${isPending ? "opacity-70" : ""} ${isFailed ? "opacity-50" : ""}`}
                  >
                    {!isOwnMessage && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {msg.sender?.email?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    
                    <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[80%] sm:max-w-xs`}>
                      <div className={`relative rounded-2xl px-4 py-2 shadow-sm ${
                        isOwnMessage 
                          ? isFailed 
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white rounded-br-md"
                            : "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md"
                      }`}>
                        <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                        
                        {/* Message tail */}
                        <div className={`absolute bottom-0 w-3 h-3 ${
                          isOwnMessage 
                            ? isFailed
                              ? "right-0 bg-red-600 transform rotate-45 translate-x-1 translate-y-1"
                              : "right-0 bg-blue-600 transform rotate-45 translate-x-1 translate-y-1"
                            : "left-0 bg-white dark:bg-gray-800 border-l border-b border-gray-200 dark:border-gray-700 transform rotate-45 -translate-x-1 translate-y-1"
                        }`} />
                      </div>
                      
                      <div className={`flex items-center space-x-1 mt-1 px-1 ${isOwnMessage ? "flex-row-reverse space-x-reverse" : ""}`}>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(msg.createdAt)}
                        </span>
                        {isOwnMessage && (
                          <div className="flex items-center" title={isPending ? "Sending..." : isFailed ? "Failed to send" : "Delivered"}>
                            {isPending ? (
                              <Clock className="h-3 w-3 text-yellow-500 animate-pulse" />
                            ) : isFailed ? (
                              <div className="h-3 w-3 rounded-full bg-red-500" />
                            ) : (
                              <CheckCheck className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {isOwnMessage && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {user?.email?.charAt(0).toUpperCase() || "Y"}
                      </div>
                    )}
                  </div>
                );
              })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sendMessageMutation.isPending || !isConnected}
              className="w-full rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-3 pr-12"
            />
            {sendMessageMutation.isPending && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Clock className="h-4 w-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending || !isConnected}
            className="rounded-full w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
        
        {!isConnected && (
          <div className="mt-3 flex items-center justify-center space-x-2 text-red-500">
            <WifiOff className="h-4 w-4" />
            <span className="text-xs">Connection lost. Trying to reconnect...</span>
          </div>
        )}
      </div>
    </div>
  );
}