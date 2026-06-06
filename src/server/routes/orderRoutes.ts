


import { Router } from "express";
import {
  checkoutOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getDistricts,
  trackOrder,
  getDeliveryChargeEndpoint,  // ← NEW
  cancelOrderByCustomer,       // ← NEW
} from "../controllers/orderController.js";
import { verifyJWT, verifyAdmin } from "../middleware/auth.js";

const router = Router();

// ── Public ──────────────────────────────────────────────────────────────────

// Get all Bangladesh divisions + districts
router.get("/districts", getDistricts);

// Calculate delivery charge for a city   GET /orders/delivery-charge?city=Dhaka
router.get("/delivery-charge", getDeliveryChargeEndpoint);

// Place order from Buy Now / Cart / Wishlist
router.post("/checkout", checkoutOrder);

// Track order by orderId string (public)
router.get("/track/:orderId", trackOrder);

// Customer self-cancel (pending orders only)   POST /orders/cancel/:orderId
router.post("/cancel/:orderId", cancelOrderByCustomer);

// ── Admin ────────────────────────────────────────────────────────────────────

// All orders
router.get("/", verifyJWT, verifyAdmin, getOrders);

// Single order detail
router.get("/:id", getOrderById);

// Update order/payment status
router.patch("/status/:id", verifyJWT, verifyAdmin, updateOrderStatus);

export default router;