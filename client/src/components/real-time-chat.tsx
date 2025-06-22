import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send } from "lucide-react";

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
      <Card>
        <CardHeader>
          <CardTitle>Trade Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Trade Chat</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-2 ${
                      isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                      isOwnMessage ? "bg-blue-500" : "bg-gray-400"
                    }`}>
                      {msg.sender?.email.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className={`flex-1 ${isOwnMessage ? "text-right" : ""}`}>
                      <div className={`inline-block rounded-lg p-3 shadow-sm max-w-xs ${
                        isOwnMessage 
                          ? "bg-blue-500 text-white" 
                          : "bg-gray-100 text-gray-900"
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sendMessageMutation.isPending || !isConnected}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending || !isConnected}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {!isConnected && (
            <p className="text-xs text-red-500 mt-2">
              Connection lost. Messages will be sent when connection is restored.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}