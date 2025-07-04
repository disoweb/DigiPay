import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
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
      userId: user.id, 
      email: user.email,
      isAdmin: Boolean(user.isAdmin),
      kycVerified: Boolean(user.kycVerified)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  console.log("🔐 AUTHENTICATION DEBUG START");
  console.log("Path:", req.path);
  console.log("Method:", req.method);
  
  // Try to get token from cookie first, then Authorization header
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken || bearerToken;

  console.log("Auth header raw:", authHeader);
  console.log("Cookie token present:", !!cookieToken);
  console.log("Bearer token present:", !!bearerToken);
  console.log("Final token selected:", !!token);
  console.log("Token length:", token?.length || 0);

  if (!token) {
    console.log("❌ NO TOKEN - Returning 401");
    return res.status(401).json({ error: "Access token required" });
  }

  console.log("🔑 Verifying JWT token...");
  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      console.log("❌ JWT VERIFICATION FAILED for", req.path);
      console.log("Error:", err.message);
      console.log("Error name:", err.name);
      console.log("Token first 20 chars:", token.substring(0, 20) + "...");
      console.log("JWT_SECRET present:", !!JWT_SECRET);
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    console.log("✅ JWT verification successful");
    console.log("Decoded payload:", decoded);

    try {
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        console.log("❌ User not found for ID:", decoded.userId);
        return res.status(401).json({ error: "User not found" });
      }
      req.user = user;
      console.log("✅ Authentication complete - User", user.id, "accessing", req.path);
      console.log("🔐 AUTHENTICATION DEBUG END\n");
      next();
    } catch (error) {
      console.log("❌ Database error during user lookup:", error);
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

      const user = await storage.createUser({
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || null,
        bvn: bvn || null,
        tronAddress: wallet.address,
        kycVerified: false,
        nairaBalance: "0",
        usdtBalance: "0",
        averageRating: "0",
        ratingCount: 0,
        isAdmin: false,
      });

      try {
        await emailService.sendEmail(
          user.email,
          "Welcome to DigiPay - P2P USDT Trading Platform",
          `
          <h2>Welcome to DigiPay!</h2>
          <p>Your account has been created successfully.</p>
          <p><strong>TRON Wallet Address:</strong> ${wallet.address}</p>
          <p>To start trading, please complete your KYC verification in your dashboard.</p>
          <p>Thank you for choosing DigiPay for secure P2P cryptocurrency trading.</p>
          `
        );
      } catch (emailError) {
        console.error("Welcome email failed:", emailError);
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

      let user = await storage.getUserByEmail(email.toLowerCase());
      
      // For demo - auto-create admin user if logging in with admin email and user doesn't exist
      if (email.toLowerCase() === "admin@digipay.com" && !user) {
        console.log("Creating admin user for demo");
        const hashedPassword = await hashPassword(password);
        user = await storage.createUser({
          email: email.toLowerCase(),
          password: hashedPassword,
          phone: null,
          bvn: null,
          tronAddress: "demo-admin-address",
          kycVerified: true,
          nairaBalance: "0",
          usdtBalance: "0",
          averageRating: "0",
          ratingCount: 0,
          isAdmin: true,
        });
        console.log("Admin user created:", user.id);
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Ensure admin@digipay.com always has admin privileges
      if (email.toLowerCase() === "admin@digipay.com" && user && !user.isAdmin) {
        await storage.updateUser(user.id, { isAdmin: true });
        user.isAdmin = true;
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      console.log("Login successful for user:", user.email);

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

  app.get("/api/user", authenticateToken, (req: Request, res: Response) => {
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
}

export { hashPassword, comparePasswords, generateToken };