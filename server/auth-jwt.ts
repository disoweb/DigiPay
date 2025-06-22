import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { tronService } from "./services/tron";
import { emailService } from "./services/notifications";
import type { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: SelectUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "digipay-production-secret-key-2024";
const JWT_EXPIRES_IN = "1d";

// Production rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development', // Skip in development
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development', // Skip in development
});

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

function generateToken(user: SelectUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      isAdmin: user.isAdmin,
      kycVerified: user.kycVerified
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Try to get token from cookie first, then Authorization header
  const token = req.cookies?.token || (req.headers['authorization']?.split(' ')[1]);



  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    try {
      const user = await storage.getUser(decoded.id);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      req.user = user;
      next();
    } catch (error) {
      return res.status(500).json({ error: "Authentication error" });
    }
  });
}

export function requireKYC(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.kycVerified) {
    return res.status(403).json({ 
      error: "KYC verification required",
      requiresKyc: true 
    });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function setupJWTAuth(app: Express) {
  // Security middleware - disable CSP in development for Vite compatibility
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "ws:", "https:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    } : false, // Disable CSP in development
  }));

  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use('/api/auth/login', strictAuthLimiter);
  app.use('/api/auth', authLimiter);

  // Registration
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, phone, bvn } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      const wallet = tronService.generateWallet();
      const hashedPassword = await hashPassword(password);
      const emailVerificationToken = randomBytes(32).toString("hex");
      const emailVerificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const user = await storage.createUser({
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || null,
        bvn: bvn || null,
        tronAddress: wallet.address,
        kycVerified: false,
        emailVerified: false, // Explicitly false
        emailVerificationToken,
        emailVerificationTokenExpiresAt,
        nairaBalance: "0",
        usdtBalance: "0",
        averageRating: "0",
        ratingCount: 0,
        isAdmin: false,
      });

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`;
      try {
        await emailService.sendEmail(
          user.email,
          "Verify Your Email Address - DigiPay",
          `
          <h2>Welcome to DigiPay!</h2>
          <p>Your account has been created successfully. Please verify your email address to activate your account.</p>
          <p>Click this link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create this account, please ignore this email.</p>
          <p><strong>TRON Wallet Address (for your reference):</strong> ${wallet.address}</p>
          <p>Thank you for choosing DigiPay!</p>
          `
        );
      } catch (emailError) {
        console.error("Verification email failed:", emailError);
        // Potentially handle this error, e.g., by informing the user or logging critical failure
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({ 
        ...userWithoutPassword, 
        token 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;
      
      // Return token in response for client-side storage (development approach)
      res.json({ 
        ...userWithoutPassword, 
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.json({ message: "Logout successful" });
  });

  app.get("/api/auth/user", authenticateToken, (req: Request, res: Response) => {
    if (req.user) {
      const { password: _, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/refresh", authenticateToken, (req: Request, res: Response) => {
    if (req.user) {
      const token = generateToken(req.user);
      res.json({ token });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, (req: Request, res: Response) => {
    res.json({ message: "Logged out successfully" });
  });

  // Email Verification
  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.body; // Or req.query.token depending on frontend implementation

      if (!token) {
        return res.status(400).json({ error: "Verification token is required." });
      }

      const user = await storage.getUserByEmailVerificationToken(token);

      if (!user) {
        return res.status(400).json({ error: "Invalid or expired verification token." });
      }

      if (user.emailVerified) {
        return res.status(400).json({ error: "Email already verified." });
      }

      if (user.emailVerificationTokenExpiresAt && new Date(user.emailVerificationTokenExpiresAt) < new Date()) {
        // Optionally, allow resending verification email here
        return res.status(400).json({ error: "Verification token expired. Please request a new one." });
      }

      await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null, // Clear the token
        emailVerificationTokenExpiresAt: null,
      });

      // Optionally, log the user in or send a success email
      await emailService.sendEmail(
        user.email,
        "Email Verified Successfully - DigiPay",
        `<h2>Email Verified!</h2>
         <p>Your email address has been successfully verified.</p>
         <p>You can now log in and access all features of DigiPay.</p>
         <p>Thank you!</p>`
      );

      res.json({ success: true, message: "Email verified successfully." });

    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "Email verification failed." });
    }
  });

  // TODO: Add endpoint for resending verification email if needed
}

export { hashPassword, comparePasswords, generateToken };