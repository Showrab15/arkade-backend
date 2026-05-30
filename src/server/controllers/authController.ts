import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getCollection, toObjectId } from "../db.js";
import { generateToken, AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError, sendValidationError } from "../utils/response.js";
import { firebaseAdminAuth } from "../lib/firebaseAdmin.js";

const usersCollection = getCollection("users");

/**
 * Register user with email and password (default verified: false, default role: user)
 */
export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  // Basic Validations
  const errors: Record<string, string> = {};
  if (!email || !email.includes("@")) {
    errors.email = "Please supply a valid email address.";
  }
  if (!password || password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }
  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, "Registration validation failed", errors);
  }

  try {
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, "A user account with this email already exists.", null, 400);
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save User
    const newUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split("@")[0],
      isVerified: false, // Must verify email before basic login
      role: "user" as const,
      createdAt: new Date().toISOString()
    };

    const result = await usersCollection.insertOne(newUser);

    return sendSuccess(res, "User registered successfully! Please verify your email using Firebase (simulated) before logging in.", {
      userId: result.insertedId,
      email: newUser.email,
      role: newUser.role,
      isVerified: newUser.isVerified
    }, 201);
  } catch (error) {
    return sendError(res, "Failed to register user.", error, 500);
  }
};

/**
 * Login user (only if verified)
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendValidationError(res, "Missing credentials", {
      email: !email ? "Email is required." : "",
      password: !password ? "Password is required." : ""
    });
  }

  try {
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, "Invalid email or password.", null, 401);
    }

    // Verify Password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return sendError(res, "Invalid email or password.", null, 401);
    }

    // Check Verification Status
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Your email is registered but not verified yet. Please complete Firebase Email Verification.",
        details: {
          isVerified: false,
          suggestion: "For offline/Postman testing, call POST /api/auth/verify-email with the email parameter to toggle verification."
        }
      });
    }

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    });

    return sendSuccess(res, "Login successful", {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    return sendError(res, "An error occurred during login.", error, 500);
  }
};

/**
 * Handle Google Login (accept Google user data directly, bypass verification)
 */
export const googleLogin = async (req: Request, res: Response) => {
  const { email, name, image, googleUid } = req.body;

  if (!email) {
    return sendValidationError(res, "Google User email is required", { email: "Email must be provided by Google Authenticator" });
  }

  try {
    let user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create user directly, Google accounts are pre-verified
      const newUser = {
        email: email.toLowerCase(),
        password: "GOOGLE_OAUTH_PASSTHROUGH", // Standard placeholder for social users
        name: name || email.split("@")[0],
        image: image || "",
        googleUid: googleUid || "",
        isVerified: true, // Google login implies email is verified
        role: "user" as const,
        createdAt: new Date().toISOString()
      };

      const result = await usersCollection.insertOne(newUser);
      user = { _id: result.insertedId, ...newUser };
    } else {
      // Handle scenario where user registered via standard password previously
      // and now logging in through Google: we auto-authenticate and ensure they are verified
      if (!user.isVerified) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { isVerified: true, name: name || user.name, image: image || user.image } }
        );
        user.isVerified = true;
      }
    }

    // Sign Access Token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    });

    return sendSuccess(res, "Google Sign-in successful", {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        image: user.image
      }
    });
  } catch (error) {
    return sendError(res, "An error occurred during Google Sign-in.", error, 500);
  }
};

/**
 * Helper: Manually verify email (for Postman testing convenience)
 */
export const verifyEmailSimulation = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return sendValidationError(res, "Email is required to simulate verification.", { email: "Email is mandatory." });
  }

  try {
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, "No user found with the provided email.", null, 404);
    }

    await usersCollection.updateOne(
      { email: email.toLowerCase() },
      { $set: { isVerified: true } }
    );

    return sendSuccess(res, `Simulated check successfully! Email [${email.toLowerCase()}] is now marked as VERIFIED. You can now login.`, {
      email,
      isVerified: true
    });
  } catch (error) {
    return sendError(res, "Error during simulated verification toggle.", error, 500);
  }
};

/**
 * Admin: Get all registered users (profile details included)
 */
export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await usersCollection.find().toArray();
    // Exclude sensitive passwords from return payloads
    const sanitizedUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    return sendSuccess(res, "Retrieved all registered users successfully.", sanitizedUsers);
  } catch (error) {
    return sendError(res, "Failed to retrieve registered users.", error, 500);
  }
};

/**
 * Admin: Update user role (admin, user, moderator)
 */
export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ["admin", "user", "moderator"];
  if (!role || !validRoles.includes(role)) {
    return sendValidationError(res, "Invalid role assignment.", {
      role: `Role must be one of: ${validRoles.join(", ")}`
    });
  }

  try {
    const user = await usersCollection.findOne({ _id: id });
    if (!user) {
      return sendError(res, "User not found.", null, 404);
    }

    await usersCollection.updateOne(
      { _id: id },
      { $set: { role } }
    );

    return sendSuccess(res, `User role updated to [${role}] successfully.`, {
      userId: id,
      email: user.email,
      role
    });
  } catch (error) {
    return sendError(res, "Failed to update user role.", error, 500);
  }
};

/**
 * Admin: Delete registered user
 */
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const user = await usersCollection.findOne({ _id: id });
    if (!user) {
      return sendError(res, "User not found.", null, 404);
    }

    // Safety checks: Admin cannot delete themselves
    if (req.user?.id === id) {
      return sendError(res, "Self-destruction blocked: Admin cannot delete their own profile.", null, 400);
    }

    await usersCollection.deleteOne({ _id: id });
    return sendSuccess(res, `User account [${user.email}] deleted successfully.`, { userId: id });
  } catch (error) {
    return sendError(res, "Failed to delete user.", error, 500);
  }
};


export const firebaseLogin = async (req: Request, res: Response) => {
  const { idToken, name, photoURL } = req.body;

  if (!idToken) {
    return sendValidationError(res, "Firebase ID token is required.", {
      idToken: "ID token is mandatory."
    });
  }

  try {
    const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);

    const email = decodedToken.email?.toLowerCase();

    if (!email) {
      return sendError(res, "Firebase account does not contain an email.", null, 400);
    }

    if (!decodedToken.email_verified) {
      return res.status(403).json({
        success: false,
        message: "Your email is not verified yet. Please verify your email before logging in.",
        details: {
          isVerified: false
        }
      });
    }

    let user = await usersCollection.findOne({ email });

    if (!user) {
      const newUser = {
        email,
        password: "FIREBASE_AUTH_MANAGED",
        name: name || decodedToken.name || email.split("@")[0],
        image: photoURL || decodedToken.picture || "",
        firebaseUid: decodedToken.uid,
        isVerified: true,
        role: "user" as const,
        createdAt: new Date().toISOString()
      };

      const result = await usersCollection.insertOne(newUser);
      user = { _id: result.insertedId, ...newUser };
    } else {
      await usersCollection.updateOne(
        { email },
        {
          $set: {
            isVerified: true,
            firebaseUid: decodedToken.uid,
            name: name || decodedToken.name || user.name,
            image: photoURL || decodedToken.picture || user.image || ""
          }
        }
      );

      user = {
        ...user,
        isVerified: true,
        firebaseUid: decodedToken.uid,
        name: name || decodedToken.name || user.name,
        image: photoURL || decodedToken.picture || user.image || ""
      };
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role || "user",
      name: user.name
    });

    return sendSuccess(res, "Firebase login successful", {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role || "user",
        name: user.name,
        image: user.image || "",
        isVerified: true
      }
    });
  } catch (error) {
    return sendError(res, "Firebase authentication failed.", error, 401);
  }
};


export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return sendError(res, "Unauthorized: User context missing.", null, 401);
    }

    const user = await usersCollection.findOne({
      _id: toObjectId(req.user.id)
    });

    if (!user) {
      return sendError(res, "User profile not found.", null, 404);
    }

    const { password, ...safeUser } = user;

    return sendSuccess(res, "Profile retrieved successfully.", safeUser);
  } catch (error) {
    return sendError(res, "Failed to retrieve profile.", error, 500);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return sendError(res, "Unauthorized: User context missing.", null, 401);
    }

    const { name, phone, address, district } = req.body;

    const updates: Record<string, any> = {};

    if (typeof name === "string") updates.name = name.trim();
    if (typeof phone === "string") updates.phone = phone.trim();
    if (typeof address === "string") updates.address = address.trim();
    if (typeof district === "string") updates.district = district.trim();

    if (Object.keys(updates).length === 0) {
      return sendValidationError(res, "No valid profile fields provided.", {
        fields: "Allowed fields: name, phone, address, district."
      });
    }

    updates.updatedAt = new Date().toISOString();

    await usersCollection.updateOne(
      { _id: toObjectId(req.user.id) },
      { $set: updates }
    );

    const updatedUser = await usersCollection.findOne({
      _id: toObjectId(req.user.id)
    });

    if (!updatedUser) {
      return sendError(res, "User profile not found after update.", null, 404);
    }

    const { password, ...safeUser } = updatedUser;

    return sendSuccess(res, "Profile updated successfully.", safeUser);
  } catch (error) {
    return sendError(res, "Failed to update profile.", error, 500);
  }
};


export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const user = await usersCollection.findOne({ _id: toObjectId(id) });

    if (!user) {
      return sendError(res, "User not found.", null, 404);
    }

    const { password, ...safeUser } = user;

    return sendSuccess(res, "User retrieved successfully.", safeUser);
  } catch (error) {
    return sendError(res, "Failed to retrieve user.", error, 500);
  }
};