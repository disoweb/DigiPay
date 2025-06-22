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
}

interface RealTimeChatProps {
  tradeId: number;
}

export function RealTimeChat({ tradeId }: RealTimeChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
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
      const res = await apiRequest("POST", `/api/trades/${tradeId}/messages`, {
        message: messageText,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades", tradeId, "messages"] });
      setMessage("");
    },
  });

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
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
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mx-auto max-w-sm shadow-sm">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  No messages yet. Start the conversation!
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex items-end space-x-2 ${
                    isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      {msg.sender?.email.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  
                  <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[80%] sm:max-w-xs`}>
                    <div className={`relative rounded-2xl px-4 py-2 shadow-sm ${
                      isOwnMessage 
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md" 
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md"
                    }`}>
                      <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                      
                      {/* Message tail */}
                      <div className={`absolute bottom-0 w-3 h-3 ${
                        isOwnMessage 
                          ? "right-0 bg-blue-600 transform rotate-45 translate-x-1 translate-y-1" 
                          : "left-0 bg-white dark:bg-gray-800 border-l border-b border-gray-200 dark:border-gray-700 transform rotate-45 -translate-x-1 translate-y-1"
                      }`} />
                    </div>
                    
                    <div className={`flex items-center space-x-1 mt-1 px-1 ${isOwnMessage ? "flex-row-reverse space-x-reverse" : ""}`}>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(msg.createdAt)}
                      </span>
                      {isOwnMessage && (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                  </div>

                  {isOwnMessage && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      {user?.email.charAt(0).toUpperCase() || "Y"}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

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