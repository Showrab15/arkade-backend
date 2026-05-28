import { Router } from "express";
import { addToCart, getCartData, deleteCartItem } from "../controllers/cartController.js";

const router = Router();

// Public shopping cart controls (supported via x-cart-session-id headers or guest IDs)
router.post("/", addToCart);
router.get("/", getCartData);
router.delete("/:productId", deleteCartItem);

export default router;
