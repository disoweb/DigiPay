import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export const userRoutes = {
  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  },

  async getUserProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const [rawUser] = await db.select().from(users).where(eq(users.id, parseInt(id)));

      if (!rawUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Add comprehensive database debugging and fix field mapping
      const directQuery = await db.execute(`SELECT * FROM users WHERE id = ${parseInt(id)}`);
      const schemaQuery = await db.execute(`PRAGMA table_info(users)`);
      console.log('Users table schema:', schemaQuery);

      // And let's see the raw row data
      if (directQuery.length > 0) {
        console.log('Raw row data:', directQuery[0]);
        console.log('Available fields in raw data:', Object.keys(directQuery[0]));

        // Let's also check what the balance fields actually contain
        const row = directQuery[0] as any;
        console.log('Balance field inspection:', {
          nairaBalance: row.nairaBalance,
          naira_balance: row.naira_balance,
          usdtBalance: row.usdtBalance,
          usdt_balance: row.usdt_balance,
          // Check all fields that might contain balance
          allFields: Object.keys(row).filter(key => key.toLowerCase().includes('balance'))
        });
      }

      // Simplify field access based on database schema
      // Based on schema analysis, extract balance fields properly
      let nairaBalance = "0";
      let usdtBalance = "0";

      // Use the direct query result as it gives us the raw database values
      if (directQuery.length > 0) {
        const row = directQuery[0] as any;

        // Check all possible field names
        nairaBalance = row.nairaBalance || row.naira_balance || row.nairBalance || 
                      row.naira_Balance || row.NairaBalance || rawUser.nairaBalance || "0";
        usdtBalance = row.usdtBalance || row.usdt_balance || row.usdBalance ||
                     row.usdt_Balance || row.UsdtBalance || rawUser.usdtBalance || "0";

        console.log('Final balance extraction:', {
          nairaBalance,
          usdtBalance,
          rawUserNaira: rawUser.nairaBalance,
          rawUserUsdt: rawUser.usdtBalance
        });
      } else {
        // Fallback to rawUser if direct query failed
        nairaBalance = rawUser.nairaBalance || (rawUser as any).naira_balance || "0";
        usdtBalance = rawUser.usdtBalance || (rawUser as any).usdt_balance || "0";
      }

      const userProfile = {
        id: rawUser.id,
        email: rawUser.email,
        username: rawUser.username,
        firstName: rawUser.firstName,
        lastName: rawUser.lastName,
        phone: rawUser.phone,
        location: rawUser.location,
        nairaBalance: nairaBalance.toString(),
        usdtBalance: usdtBalance.toString(),
        averageRating: rawUser.averageRating?.toString() || "0",
        ratingCount: rawUser.ratingCount || 0,
        kycVerified: rawUser.kycVerified,
        isOnline: rawUser.isOnline,
        lastSeen: rawUser.lastSeen,
        createdAt: rawUser.createdAt
      };

      // Set cache-control to prevent caching of this response
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json(userProfile);
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { phone, email } = req.body;

      const updateData: any = {};
      if (phone) updateData.phone = phone;
      if (email) updateData.email = email;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No update data provided' });
      }

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
};