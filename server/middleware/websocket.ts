import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    perMessageDeflate: false 
  });

  // Store connections by trade ID and user ID
  const tradeConnections = new Map<number, Set<WebSocket>>();
  const userConnections = new Map<number, WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');
    let currentTradeId: number | null = null;
    let currentUserId: number | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'user_connect':
            const userId = message.userId;
            currentUserId = userId;
            userConnections.set(userId, ws);
            
            // Update user online status
            await db.update(users)
              .set({ isOnline: true })
              .where(eq(users.id, userId));
            
            console.log(`User ${userId} connected`);
            break;

          case 'join_trade':
            const tradeId = message.tradeId;
            currentTradeId = tradeId;
            
            if (!tradeConnections.has(tradeId)) {
              tradeConnections.set(tradeId, new Set());
            }
            tradeConnections.get(tradeId)?.add(ws);
            
            console.log(`Client joined trade ${tradeId}`);
            break;

          case 'chat_message':
            if (currentTradeId && tradeConnections.has(currentTradeId)) {
              const connections = tradeConnections.get(currentTradeId);
              connections?.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'new_message',
                    tradeId: currentTradeId,
                    data: message.data
                  }));
                }
              });
            }
            break;

          case 'send_notification':
            const targetUserId = message.targetUserId;
            const targetConnection = userConnections.get(targetUserId);
            
            if (targetConnection && targetConnection.readyState === WebSocket.OPEN) {
              targetConnection.send(JSON.stringify({
                type: 'notification',
                data: message.data
              }));
            }
            break;

          case 'direct_message':
            const { recipientId, messageText, offerId } = message;
            if (currentUserId && recipientId && messageText) {
              // Send notification to recipient
              const recipient = userConnections.get(recipientId);
              if (recipient && recipient.readyState === WebSocket.OPEN) {
                recipient.send(JSON.stringify({
                  type: 'direct_message_received',
                  data: {
                    senderId: currentUserId,
                    message: messageText,
                    offerId: offerId,
                    timestamp: new Date().toISOString()
                  }
                }));
              }
              
              // Confirm to sender
              ws.send(JSON.stringify({
                type: 'message_sent',
                data: { success: true }
              }));
            }
            break;

          case 'trade_update':
            if (currentTradeId && tradeConnections.has(currentTradeId)) {
              const connections = tradeConnections.get(currentTradeId);
              connections?.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'trade_status_update',
                    data: message.data
                  }));
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      console.log('WebSocket connection closed');
      
      // Update user offline status
      if (currentUserId) {
        await db.update(users)
          .set({ isOnline: false, lastSeen: new Date() })
          .where(eq(users.id, currentUserId));
        
        userConnections.delete(currentUserId);
      }
      
      // Remove from trade connections
      if (currentTradeId && tradeConnections.has(currentTradeId)) {
        const connections = tradeConnections.get(currentTradeId);
        connections?.delete(ws);
        
        if (connections?.size === 0) {
          tradeConnections.delete(currentTradeId);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection_established',
      data: { message: 'Connected to DigiPay WebSocket' }
    }));
  });

  console.log('WebSocket server initialized on /ws');
  return wss;
}