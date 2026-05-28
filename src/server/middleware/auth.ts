import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getCollection } from "../db.js";

// Extend Express Request type to include user details
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "user" | "admin" | "moderator";
    name?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "ecommerce_jwt_secret_fallback_do_not_use_in_production";

export const generateToken = (payload: { id: string; email: string; role: string; name?: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// Middleware: Authenticate Request via JWT Bearer Token
export const verifyJWT = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Please provide a standard Bearer Authorization token."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Fetch user from DB to verify status and role are fresh
    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ email: decoded.email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User account not found."
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role || "user",
      name: user.name
    };

    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Authentication token is invalid or expired.",
      error: err.message
    });
  }
};

// Middleware: Restrict access to Admins only
export const verifyAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Authentic request context is required."
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin privileges are required to perform this action."
    });
  }

  next();
};

// Middleware: Restrict access to Admin or Moderator
export const verifyAdminOrModerator = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Authentic request context is required."
    });
  }

  const allowedRoles = ["admin", "moderator"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin or Moderator privileges are required to perform this action."
    });
  }

  next();
};
