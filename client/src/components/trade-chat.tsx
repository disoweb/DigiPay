import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send } from "lucide-react";
import type { Message } from "@shared/schema";

type EnrichedMessage = Message & {
  sender: { id: number; email: string } | null;
};

interface TradeChatProps {
  tradeId: number;
}

export function TradeChat({ tradeId }: TradeChatProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");

  const { data: messages = [] } = useQuery<EnrichedMessage[]>({
    queryKey: ["/api/trades", tradeId, "messages"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      await apiRequest("POST", `/api/trades/${tradeId}/messages`, { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades", tradeId, "messages"] });
      setNewMessage("");
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h4 className="font-medium text-gray-900 mb-3">Trade Chat</h4>
      
      <ScrollArea className="flex-1 bg-gray-50 rounded-lg p-4 mb-3">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No messages yet</p>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex items-start space-x-2 ${
                    isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                    isOwnMessage ? "bg-primary" : "bg-gray-400"
                  }`}>
                    {message.sender?.email.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className={`flex-1 ${isOwnMessage ? "text-right" : ""}`}>
                    <div className={`inline-block rounded-lg p-2 shadow-sm max-w-xs ${
                      isOwnMessage 
                        ? "bg-primary text-white" 
                        : "bg-white text-gray-900"
                    }`}>
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {message.sender?.email} • {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSendMessage} className="flex space-x-2">
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sendMessageMutation.isPending}
        />
        <Button 
          type="submit" 
          size="sm"
          disabled={!newMessage.trim() || sendMessageMutation.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
