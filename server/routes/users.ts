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
      
      const [user] = await db.select({
        id: users.id,
        email: users.email,
        averageRating: users.averageRating,
        ratingCount: users.ratingCount,
        kycVerified: users.kycVerified,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt
      }).from(users).where(eq(users.id, parseInt(id)));
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
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