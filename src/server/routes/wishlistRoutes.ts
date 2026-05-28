import { Router } from "express";
import { addToWishlist, getWishlist, removeWishlistItem } from "../controllers/wishlistController.js";

const router = Router();

// Public wishlist actions
router.post("/", addToWishlist);
router.get("/", getWishlist);
router.delete("/:productId", removeWishlistItem);

export default router;
