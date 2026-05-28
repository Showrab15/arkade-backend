import { Router } from "express";
import { 
  register, 
  login, 
  googleLogin, 
  getAllUsers, 
  updateUserRole, 
  deleteUser,
  verifyEmailSimulation
} from "../controllers/authController.js";
import { verifyJWT, verifyAdmin } from "../middleware/auth.js";

const router = Router();

// Public auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);

// Helper debug simulation route for Postman to easily toggle verified email
router.post("/verify-email", verifyEmailSimulation);

// Admin-only user management routes
router.get("/users", verifyJWT, verifyAdmin, getAllUsers);
router.patch("/users/role/:id", verifyJWT, verifyAdmin, updateUserRole);
router.delete("/users/:id", verifyJWT, verifyAdmin, deleteUser);

export default router;
