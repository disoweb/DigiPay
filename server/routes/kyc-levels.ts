import { Request, Response } from 'express';
import { db } from '../db';
import { users, kycVerifications } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for KYC document uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'kyc');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}_${file.fieldname}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

// KYC Level limits configuration
const KYC_LIMITS = {
  0: { daily: "10000", monthly: "100000" },      // Unverified
  1: { daily: "50000", monthly: "500000" },      // Basic
  2: { daily: "500000", monthly: "5000000" },    // Standard  
  3: { daily: "5000000", monthly: "50000000" }   // Premium
};

export const kycLevelRoutes = {
  // Get current KYC status and level information
  async getKYCStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      const [kycData] = await db.select().from(kycVerifications).where(eq(kycVerifications.userId, userId));

      const currentLevel = user?.kycLevel || 0;
      const limits = KYC_LIMITS[currentLevel as keyof typeof KYC_LIMITS];

      res.json({
        user: {
          id: user.id,
          kycLevel: currentLevel,
          kycStatus: user.kycStatus,
          kycVerified: user.kycVerified,
          dailyLimit: limits.daily,
          monthlyLimit: limits.monthly
        },
        kycData: kycData || null,
        nextLevel: currentLevel < 3 ? currentLevel + 1 : null,
        canUpgrade: currentLevel < 3
      });
    } catch (error) {
      console.error('Get KYC status error:', error);
      res.status(500).json({ error: 'Failed to get KYC status' });
    }
  },

  // Submit Level 1 KYC (Basic Information)
  async submitLevel1(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { firstName, lastName, middleName, dateOfBirth, gender, phone } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !dateOfBirth || !phone) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check current level
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (user.kycLevel >= 1) {
        return res.status(400).json({ error: 'Level 1 KYC already completed' });
      }

      // Check if KYC record exists
      const [existingKyc] = await db.select().from(kycVerifications).where(eq(kycVerifications.userId, userId));

      const kycData = {
        userId,
        firstName,
        lastName,
        middleName,
        dateOfBirth,
        gender,
        phone,
        level1Status: 'pending',
        dailyLimit: KYC_LIMITS[1].daily,
        monthlyLimit: KYC_LIMITS[1].monthly,
        updatedAt: new Date()
      };

      if (existingKyc) {
        await db.update(kycVerifications)
          .set(kycData)
          .where(eq(kycVerifications.userId, userId));
      } else {
        await db.insert(kycVerifications).values({
          ...kycData,
          createdAt: new Date()
        });
      }

      // Update user status
      await db.update(users)
        .set({
          kycStatus: 'level_1_pending',
          kycSubmittedAt: new Date()
        })
        .where(eq(users.id, userId));

      res.json({
        success: true,
        message: 'Level 1 KYC submitted successfully',
        level: 1,
        status: 'pending'
      });
    } catch (error) {
      console.error('Submit Level 1 KYC error:', error);
      res.status(500).json({ error: 'Failed to submit Level 1 KYC' });
    }
  },

  // Submit Level 2 KYC (Identity Documents)
  submitLevel2: [
    upload.fields([
      { name: 'idFront', maxCount: 1 },
      { name: 'idBack', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
      { name: 'proofOfAddress', maxCount: 1 }
    ]),
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.id;
        const { street, city, state, country, postalCode, residentialType, idType, idNumber, nin, bvn } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Check current level
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user.kycLevel < 1) {
          return res.status(400).json({ error: 'Complete Level 1 KYC first' });
        }
        if (user.kycLevel >= 2) {
          return res.status(400).json({ error: 'Level 2 KYC already completed' });
        }

        // Validate required fields
        if (!street || !city || !state || !idType || !idNumber) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate required files
        if (!files.idFront || !files.selfie) {
          return res.status(400).json({ error: 'ID front and selfie are required' });
        }

        // Build document URLs
        const documentUrls: any = {};
        for (const [fieldName, fileArray] of Object.entries(files)) {
          if (fileArray && fileArray[0]) {
            documentUrls[`${fieldName}Url`] = `/uploads/kyc/${fileArray[0].filename}`;
          }
        }

        // Update KYC data
        await db.update(kycVerifications)
          .set({
            street,
            city,
            state,
            country: country || 'Nigeria',
            postalCode,
            residentialType,
            idType,
            idNumber,
            nin,
            bvn,
            ...documentUrls,
            level2Status: 'pending',
            dailyLimit: KYC_LIMITS[2].daily,
            monthlyLimit: KYC_LIMITS[2].monthly,
            updatedAt: new Date()
          })
          .where(eq(kycVerifications.userId, userId));

        // Update user status
        await db.update(users)
          .set({
            kycStatus: 'level_2_pending',
            kycSubmittedAt: new Date()
          })
          .where(eq(users.id, userId));

        res.json({
          success: true,
          message: 'Level 2 KYC submitted successfully',
          level: 2,
          status: 'pending',
          uploadedDocuments: Object.keys(files)
        });
      } catch (error) {
        console.error('Submit Level 2 KYC error:', error);
        res.status(500).json({ error: 'Failed to submit Level 2 KYC' });
      }
    }
  ],

  // Submit Level 3 KYC (Enhanced Due Diligence)
  submitLevel3: [
    upload.fields([
      { name: 'proofOfIncome', maxCount: 1 },
      { name: 'bankStatement', maxCount: 1 }
    ]),
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.id;
        const { 
          sourceOfFunds, 
          employmentStatus, 
          employerName, 
          monthlyIncome, 
          purposeOfAccount, 
          expectedTransactionVolume 
        } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Check current level
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (user.kycLevel < 2) {
          return res.status(400).json({ error: 'Complete Level 2 KYC first' });
        }
        if (user.kycLevel >= 3) {
          return res.status(400).json({ error: 'Level 3 KYC already completed' });
        }

        // Validate required fields
        if (!sourceOfFunds || !employmentStatus || !monthlyIncome || !purposeOfAccount) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate required files
        if (!files.proofOfIncome) {
          return res.status(400).json({ error: 'Proof of income is required' });
        }

        // Build document URLs
        const documentUrls: any = {};
        for (const [fieldName, fileArray] of Object.entries(files)) {
          if (fileArray && fileArray[0]) {
            documentUrls[`${fieldName}Url`] = `/uploads/kyc/${fileArray[0].filename}`;
          }
        }

        // Update KYC data
        await db.update(kycVerifications)
          .set({
            sourceOfFunds,
            employmentStatus,
            employerName,
            monthlyIncome,
            purposeOfAccount,
            expectedTransactionVolume,
            ...documentUrls,
            level3Status: 'pending',
            dailyLimit: KYC_LIMITS[3].daily,
            monthlyLimit: KYC_LIMITS[3].monthly,
            updatedAt: new Date()
          })
          .where(eq(kycVerifications.userId, userId));

        // Update user status
        await db.update(users)
          .set({
            kycStatus: 'level_3_pending',
            kycSubmittedAt: new Date()
          })
          .where(eq(users.id, userId));

        res.json({
          success: true,
          message: 'Level 3 KYC submitted successfully',
          level: 3,
          status: 'pending',
          uploadedDocuments: Object.keys(files)
        });
      } catch (error) {
        console.error('Submit Level 3 KYC error:', error);
        res.status(500).json({ error: 'Failed to submit Level 3 KYC' });
      }
    }
  ],

  // Admin: Review and approve/reject KYC levels
  async reviewKYCLevel(req: Request, res: Response) {
    try {
      const adminUser = (req as any).user;
      const { userId, level } = req.params;
      const { action, rejectionReason, adminNotes } = req.body;

      if (!adminUser?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
      }

      if (action === 'reject' && !rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason required' });
      }

      const levelNum = parseInt(level);
      if (![1, 2, 3].includes(levelNum)) {
        return res.status(400).json({ error: 'Invalid KYC level' });
      }

      const now = new Date();
      const userIdNum = parseInt(userId);

      if (action === 'approve') {
        // Approve specific level
        const updateData: any = {
          reviewedBy: adminUser.id,
          reviewedAt: now,
          adminNotes
        };

        updateData[`level${levelNum}Status`] = 'approved';
        updateData[`level${levelNum}ApprovedAt`] = now;

        await db.update(kycVerifications)
          .set(updateData)
          .where(eq(kycVerifications.userId, userIdNum));

        // Update user level and status
        await db.update(users)
          .set({
            kycLevel: levelNum,
            kycStatus: `level_${levelNum}_approved`,
            kycVerified: levelNum >= 1,
            kycApprovedAt: now
          })
          .where(eq(users.id, userIdNum));

      } else {
        // Reject specific level
        await db.update(kycVerifications)
          .set({
            [`level${levelNum}Status`]: 'rejected',
            reviewedBy: adminUser.id,
            reviewedAt: now,
            rejectionReason,
            adminNotes
          })
          .where(eq(kycVerifications.userId, userIdNum));

        await db.update(users)
          .set({
            kycStatus: `level_${levelNum}_rejected`,
            kycRejectionReason: rejectionReason
          })
          .where(eq(users.id, userIdNum));
      }

      res.json({
        success: true,
        message: `Level ${levelNum} KYC ${action}d successfully`
      });
    } catch (error) {
      console.error('Review KYC level error:', error);
      res.status(500).json({ error: 'Failed to review KYC level' });
    }
  },

  // Admin: Get pending KYC verifications by level
  async getPendingByLevel(req: Request, res: Response) {
    try {
      const adminUser = (req as any).user;
      const { level } = req.params;

      if (!adminUser?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const levelNum = parseInt(level);
      if (![1, 2, 3].includes(levelNum)) {
        return res.status(400).json({ error: 'Invalid KYC level' });
      }

      const statusField = `level${levelNum}Status` as keyof typeof kycVerifications;
      
      const pendingVerifications = await db
        .select({
          id: kycVerifications.id,
          userId: kycVerifications.userId,
          firstName: kycVerifications.firstName,
          lastName: kycVerifications.lastName,
          email: users.email,
          level: levelNum,
          status: kycVerifications[statusField],
          submittedAt: users.kycSubmittedAt,
          createdAt: kycVerifications.createdAt
        })
        .from(kycVerifications)
        .innerJoin(users, eq(users.id, kycVerifications.userId))
        .where(eq(kycVerifications[statusField], 'pending'));

      res.json(pendingVerifications);
    } catch (error) {
      console.error('Get pending by level error:', error);
      res.status(500).json({ error: 'Failed to fetch pending verifications' });
    }
  },

  // Get KYC level statistics for admin dashboard
  async getKYCStats(req: Request, res: Response) {
    try {
      const adminUser = (req as any).user;

      if (!adminUser?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Get user counts by KYC level
      const levelStats = await Promise.all([
        db.select().from(users).where(eq(users.kycLevel, 0)),
        db.select().from(users).where(eq(users.kycLevel, 1)),
        db.select().from(users).where(eq(users.kycLevel, 2)),
        db.select().from(users).where(eq(users.kycLevel, 3))
      ]);

      // Get pending verifications count by level
      const pendingStats = await Promise.all([
        db.select().from(kycVerifications).where(eq(kycVerifications.level1Status, 'pending')),
        db.select().from(kycVerifications).where(eq(kycVerifications.level2Status, 'pending')),
        db.select().from(kycVerifications).where(eq(kycVerifications.level3Status, 'pending'))
      ]);

      res.json({
        usersByLevel: {
          level0: levelStats[0].length,
          level1: levelStats[1].length,
          level2: levelStats[2].length,
          level3: levelStats[3].length
        },
        pendingByLevel: {
          level1: pendingStats[0].length,
          level2: pendingStats[1].length,
          level3: pendingStats[2].length
        },
        totalUsers: levelStats.reduce((sum, level) => sum + level.length, 0),
        totalPending: pendingStats.reduce((sum, level) => sum + level.length, 0)
      });
    } catch (error) {
      console.error('Get KYC stats error:', error);
      res.status(500).json({ error: 'Failed to fetch KYC statistics' });
    }
  }
};