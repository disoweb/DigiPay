import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export function setupWebSocket(server: Server) {
  // Prevent duplicate WebSocket server setup
  if ((global as any).wsServer) {
    console.log('WebSocket server already exists, returning existing instance');
    return (global as any).wsServer;
  }
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
    let isAuthenticated = false;

    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'user_connect':
            // Verify user authentication if token provided
            if (data.token && data.userId) {
              try {
                // Basic token validation - verify JWT properly
                let tokenValid = false;
                if (data.token && data.token.length > 20) {
                  try {
                    const jwt = await import('jsonwebtoken');
                    const JWT_SECRET = process.env.JWT_SECRET || 'digipay-jwt-secret-key-change-in-production';
                    const decoded = jwt.default.verify(data.token, JWT_SECRET) as any;
                    tokenValid = decoded.userId === data.userId;
                    console.log(`JWT validation result for user ${data.userId}:`, tokenValid);
                  } catch (err) {
                    console.log('JWT validation failed:', err.message);
                    tokenValid = false;
                  }
                } else {
                  console.log('Token too short or missing');
                }
                if (tokenValid) {
                  currentUserId = data.userId;
                  (ws as any).userId = currentUserId;
                  userConnections.set(currentUserId, ws);
                  isAuthenticated = true;
                  console.log(`✅ User ${currentUserId} authenticated and connected via WebSocket`);
                  ws.send(JSON.stringify({ 
                    type: 'connected', 
                    userId: currentUserId,
                    authenticated: true
                  }));
                } else {
                  console.log('Invalid token provided for WebSocket connection');
                  // Still allow connection but mark as unauthenticated
                  currentUserId = data.userId;
                  (ws as any).userId = currentUserId;
                  userConnections.set(currentUserId, ws);
                  console.log(`User ${currentUserId} connected without valid token`);
                  ws.send(JSON.stringify({ 
                    type: 'connected', 
                    userId: currentUserId,
                    authenticated: false
                  }));
                }
              } catch (error) {
                console.error('❌ WebSocket authentication error:', error);
                ws.close(1008, 'Authentication failed');
              }
            } else {
              // Legacy connection without token (for backward compatibility)
              currentUserId = data.userId;
              (ws as any).userId = currentUserId;
              userConnections.set(currentUserId, ws);
              console.log(`⚠️ User ${currentUserId} connected without token (legacy mode)`);
              ws.send(JSON.stringify({ type: 'connected', userId: currentUserId }));
            }
            break;

          case 'ping':
            if (isAuthenticated || currentUserId) {
              ws.send(JSON.stringify({ type: 'pong' }));
            }
            break;

          case 'join_trade':
            const tradeId = data.tradeId;
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
                    data: data.data
                  }));
                }
              });
            }
            break;

          case 'send_notification':
            const targetUserId = data.targetUserId;
            const targetConnection = userConnections.get(targetUserId);

            if (targetConnection && targetConnection.readyState === WebSocket.OPEN) {
              targetConnection.send(JSON.stringify({
                type: 'notification',
                data: data.data
              }));
            }
            break;

          case 'direct_message':
            const { recipientId, messageText, offerId } = data;
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
                    data: data.data
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

  // Store globally and return WebSocket server
  (global as any).wsServer = wss;
  return wss;
}