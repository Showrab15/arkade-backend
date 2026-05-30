import { Router } from "express";
import { 
  register, 
  login, 
  googleLogin, 
  getAllUsers, 
  updateUserRole, 
  deleteUser,
  verifyEmailSimulation,
  firebaseLogin,
  getProfile,
  updateProfile,
  getUserById
} from "../controllers/authController.js";
import { verifyJWT, verifyAdmin } from "../middleware/auth.js";

const router = Router();

// Public auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/firebase-login", firebaseLogin);
// Helper debug simulation route for Postman to easily toggle verified email
router.post("/verify-email", verifyEmailSimulation);
router.get("/profile", verifyJWT, getProfile);
router.patch("/profile", verifyJWT, updateProfile);
// Admin-only user management routes
router.get("/users", verifyJWT, verifyAdmin, getAllUsers);
router.patch("/users/role/:id", verifyJWT, verifyAdmin, updateUserRole);
router.delete("/users/:id", verifyJWT, verifyAdmin, deleteUser);
router.get("/users/:id", verifyJWT, verifyAdmin, getUserById);
export default router;
