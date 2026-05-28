import { Router } from "express";
import { subscribeNewsletter, getSubscribers } from "../controllers/newsletterController.js";
import { verifyJWT, verifyAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/subscribe", subscribeNewsletter);
router.get("/subscribers", verifyJWT, verifyAdmin, getSubscribers);

export default router;
