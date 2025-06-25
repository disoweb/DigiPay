import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

interface BalanceUpdate {
  userId: number;
  nairaBalance: string;
  usdtBalance: string;
  previousBalance: string;
  depositAmount: string;
  lastTransaction?: {
    id: number;
    type: string;
    amount: string;
    status: string;
  };
}

export function useRealtimeBalance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [wsConnected, setWsConnected] = useState(false);
  const [latestBalance, setLatestBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem('digipay_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let reconnectTimeout: NodeJS.Timeout;
    let heartbeatInterval: NodeJS.Timeout;
    
    const connect = () => {
      try {
        if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
          return;
        }

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected for real-time balance updates');
          setWsConnected(true);
          reconnectAttempts = 0;
          
          const connectMessage = {
            type: 'user_connect',
            userId: user.id,
            token: token
          };
          ws?.send(JSON.stringify(connectMessage));
          
          heartbeatInterval = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            if (data.type === 'balance_updated' && data.userId === user.id) {
              console.log('Real-time balance update received for user:', user.id);
              console.log('Balance data - NGN:', data.nairaBalance, 'USDT:', data.usdtBalance);
              console.log('Updating balance from', latestBalance, 'to', data.nairaBalance);
              
              // Update local state immediately
              setLatestBalance(data.nairaBalance);
              
              // Update React Query cache
              queryClient.setQueryData(["/api/user"], (oldData: any) => {
                if (oldData && oldData.id === user.id) {
                  const updatedData = {
                    ...oldData,
                    nairaBalance: data.nairaBalance,
                    usdtBalance: data.usdtBalance || oldData.usdtBalance
                  };
                  console.log('Updated user data in cache:', updatedData);
                  console.log('Old USDT:', oldData.usdtBalance, 'New USDT:', data.usdtBalance);
                  return updatedData;
                }
                return oldData;
              });
              
              // Force re-fetch to ensure consistency - this should trigger UI updates
              queryClient.invalidateQueries({ queryKey: ["/api/user"] });
              queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
              
              // Remove the problematic green toast - let the payment modal handle success notifications
              if (data.lastTransaction?.type === 'trade_completion') {
                const currency = data.lastTransaction.currency;
                const amount = parseFloat(data.lastTransaction.amount);
                toast({
                  title: "Trade Completed!",
                  description: `${currency === 'NGN' ? '₦' : ''}${amount.toLocaleString()}${currency === 'USDT' ? ' USDT' : ''} credited to your wallet`,
                  className: "border-green-200 bg-green-50 text-green-800",
                });
              } else if (data.lastTransaction?.type === 'test_update') {
                const amount = parseFloat(data.lastTransaction.amount);
                toast({
                  title: "Balance Updated!",
                  description: `Test update: ₦${amount.toLocaleString()} balance`,
                  className: "border-blue-200 bg-blue-50 text-blue-800",
                });
              }
            }
          } catch (error) {
            console.error('WebSocket message parsing error:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket closed, attempting reconnect');
          setWsConnected(false);
          
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
          
          const currentToken = localStorage.getItem('digipay_token');
          if (event.code !== 1000 && currentToken && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
            reconnectTimeout = setTimeout(connect, delay);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };

      } catch (error) {
        console.error('WebSocket setup failed:', error);
        setWsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      if (ws) {
        ws.close(1000, 'Component unmounted');
      }
    };
  }, [user?.id, queryClient, toast]);

  return {
    wsConnected,
    latestBalance: latestBalance || user?.nairaBalance
  };
}