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
      
      // Debug: Let's see what columns are available in the users table
      console.log('Available columns in users table:', Object.keys(users));
      
      // First, let's get the raw user data to see what's actually in the database
      const [rawUser] = await db.select().from(users).where(eq(users.id, parseInt(id)));
      
      if (!rawUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('Raw user data from database:', {
        id: rawUser.id,
        email: rawUser.email,
        nairaBalance: rawUser.nairaBalance,
        usdtBalance: rawUser.usdtBalance,
        nairaBalanceType: typeof rawUser.nairaBalance,
        usdtBalanceType: typeof rawUser.usdtBalance
      });
      
      // Now select specific fields and ensure proper mapping
      // Check all possible field name variations
      const nairaBalance = rawUser.nairaBalance || (rawUser as any).naira_balance || "0";
      const usdtBalance = rawUser.usdtBalance || (rawUser as any).usdt_balance || "0";
      
      console.log('Field mapping check:', {
        'rawUser.nairaBalance': rawUser.nairaBalance,
        'rawUser.naira_balance': (rawUser as any).naira_balance,
        'rawUser.usdtBalance': rawUser.usdtBalance,
        'rawUser.usdt_balance': (rawUser as any).usdt_balance,
        'final nairaBalance': nairaBalance,
        'final usdtBalance': usdtBalance
      });
      
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
      
      console.log('Processed user profile:', {
        id: userProfile.id,
        email: userProfile.email,
        nairaBalance: userProfile.nairaBalance,
        usdtBalance: userProfile.usdtBalance
      });
      
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