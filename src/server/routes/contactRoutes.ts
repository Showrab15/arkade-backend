import { Router } from "express";
import { submitContactForm, getContactMessages, updateMessageStatus } from "../controllers/contactController.js";
import { verifyJWT, verifyAdmin } from "../middleware/auth.js";

const router = Router();

// Public submissions
router.post("/", submitContactForm);

// Admin-only inquiries operations
router.get("/", verifyJWT, verifyAdmin, getContactMessages);
router.patch("/:id", verifyJWT, verifyAdmin, updateMessageStatus);

export default router;
