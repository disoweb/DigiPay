import { Request, Response } from 'express';
import { db } from '../db';
import { users, kycVerifications } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken } from '../auth-jwt';
import { youVerifyService } from '../services/youverify';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for file uploads
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  }
});

export const kycRoutes = {
  // Get KYC status and data
  async getKYCData(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      const [kycData] = await db.select().from(kycVerifications).where(eq(kycVerifications.userId, userId));
      
      res.json({
        status: user?.kycStatus || 'not_started',
        verified: user?.kycVerified || false,
        submittedAt: user?.kycSubmittedAt,
        approvedAt: user?.kycApprovedAt,
        rejectionReason: user?.kycRejectionReason,
        data: kycData || null
      });
    } catch (error) {
      console.error('Get KYC data error:', error);
      res.status(500).json({ error: 'Failed to fetch KYC data' });
    }
  },

  // Submit KYC verification
  async submitKYC(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const {
        firstName,
        lastName,
        middleName,
        dateOfBirth,
        gender,
        street,
        city,
        state,
        country,
        postalCode,
        residentialType,
        idType,
        idNumber,
        nin,
        bvn
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !dateOfBirth || !gender || !bvn || !idType || !idNumber) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify BVN if YouVerify is configured
      if (process.env.YOUVERIFY_API_KEY) {
        try {
          const bvnVerification = await youVerifyService.verifyBVN(bvn, firstName, lastName);
          if (!bvnVerification.success) {
            return res.status(400).json({ 
              error: 'BVN verification failed',
              details: bvnVerification.message 
            });
          }
        } catch (error) {
          console.error('BVN verification error:', error);
          // Continue without BVN verification if service is unavailable
        }
      }

      // Check if KYC already exists
      const [existingKyc] = await db.select().from(kycVerifications).where(eq(kycVerifications.userId, userId));
      
      const kycData = {
        userId,
        firstName,
        lastName,
        middleName,
        dateOfBirth,
        gender,
        street,
        city,
        state,
        country: country || 'Nigeria',
        postalCode,
        residentialType,
        idType,
        idNumber,
        nin,
        updatedAt: new Date()
      };

      if (existingKyc) {
        // Update existing KYC data
        await db.update(kycVerifications)
          .set(kycData)
          .where(eq(kycVerifications.userId, userId));
      } else {
        // Create new KYC data
        await db.insert(kycVerifications).values({
          ...kycData,
          createdAt: new Date()
        });
      }

      // Update user's BVN and KYC status
      await db.update(users)
        .set({
          bvn,
          kycStatus: 'in_progress'
        })
        .where(eq(users.id, userId));

      res.json({ 
        success: true, 
        message: 'KYC data saved successfully',
        status: 'in_progress'
      });
    } catch (error) {
      console.error('Submit KYC error:', error);
      res.status(500).json({ error: 'Failed to submit KYC data' });
    }
  },

  // Upload KYC documents
  uploadDocuments: [
    upload.fields([
      { name: 'idFront', maxCount: 1 },
      { name: 'idBack', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
      { name: 'proofOfAddress', maxCount: 1 }
    ]),
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user?.id;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!files || Object.keys(files).length === 0) {
          return res.status(400).json({ error: 'No files uploaded' });
        }

        // Build document URLs
        const documentUrls: any = {};
        for (const [fieldName, fileArray] of Object.entries(files)) {
          if (fileArray && fileArray[0]) {
            documentUrls[`${fieldName}Url`] = `/uploads/kyc/${fileArray[0].filename}`;
          }
        }

        // Update KYC verification with document URLs
        await db.update(kycVerifications)
          .set({
            ...documentUrls,
            updatedAt: new Date()
          })
          .where(eq(kycVerifications.userId, userId));

        // Check if we have all required documents
        const [kycData] = await db.select().from(kycVerifications).where(eq(kycVerifications.userId, userId));
        
        if (kycData?.idFrontUrl && kycData?.selfieUrl) {
          // Mark as submitted for review
          await db.update(users)
            .set({
              kycStatus: 'submitted',
              kycSubmittedAt: new Date()
            })
            .where(eq(users.id, userId));
          
          await db.update(kycVerifications)
            .set({
              status: 'pending'
            })
            .where(eq(kycVerifications.userId, userId));
        }

        res.json({ 
          success: true, 
          message: 'Documents uploaded successfully',
          uploadedFiles: Object.keys(files)
        });
      } catch (error) {
        console.error('Upload documents error:', error);
        res.status(500).json({ error: 'Failed to upload documents' });
      }
    }
  ],

  // Admin: Get pending KYC verifications
  async getPendingVerifications(req: Request, res: Response) {
    try {
      const adminUser = (req as any).user;
      
      if (!adminUser?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const pendingVerifications = await db
        .select({
          id: kycVerifications.id,
          userId: kycVerifications.userId,
          firstName: kycVerifications.firstName,
          lastName: kycVerifications.lastName,
          email: users.email,
          submittedAt: users.kycSubmittedAt,
          status: kycVerifications.status,
          idType: kycVerifications.idType,
          createdAt: kycVerifications.createdAt
        })
        .from(kycVerifications)
        .innerJoin(users, eq(users.id, kycVerifications.userId))
        .where(eq(kycVerifications.status, 'pending'));

      res.json(pendingVerifications);
    } catch (error) {
      console.error('Get pending verifications error:', error);
      res.status(500).json({ error: 'Failed to fetch pending verifications' });
    }
  },

  // Admin: Approve/Reject KYC verification
  async reviewKYC(req: Request, res: Response) {
    try {
      const adminUser = (req as any).user;
      const { userId } = req.params;
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

      const now = new Date();

      if (action === 'approve') {
        // Approve KYC
        await db.update(users)
          .set({
            kycStatus: 'approved',
            kycVerified: true,
            kycApprovedAt: now
          })
          .where(eq(users.id, parseInt(userId)));

        await db.update(kycVerifications)
          .set({
            status: 'approved',
            reviewedBy: adminUser.id,
            reviewedAt: now,
            adminNotes
          })
          .where(eq(kycVerifications.userId, parseInt(userId)));
      } else {
        // Reject KYC
        await db.update(users)
          .set({
            kycStatus: 'rejected',
            kycRejectionReason: rejectionReason
          })
          .where(eq(users.id, parseInt(userId)));

        await db.update(kycVerifications)
          .set({
            status: 'rejected',
            reviewedBy: adminUser.id,
            reviewedAt: now,
            rejectionReason,
            adminNotes
          })
          .where(eq(kycVerifications.userId, parseInt(userId)));
      }

      res.json({ 
        success: true, 
        message: `KYC ${action}d successfully` 
      });
    } catch (error) {
      console.error('Review KYC error:', error);
      res.status(500).json({ error: 'Failed to review KYC' });
    }
  }
};