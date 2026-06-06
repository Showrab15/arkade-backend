


// import { Router } from "express";
// import {
//   checkoutOrder,
//   getOrders,
//   getOrderById,
//   updateOrderStatus,
//   getDistricts,
//   trackOrder,
//   getDeliveryChargeEndpoint,  // ← NEW
//   cancelOrderByCustomer,       // ← NEW
// } from "../controllers/orderController.js";
// import { verifyJWT, verifyAdmin } from "../middleware/auth.js";

// const router = Router();

// // ── Public ──────────────────────────────────────────────────────────────────

// // Get all Bangladesh divisions + districts
// router.get("/districts", getDistricts);

// // Calculate delivery charge for a city   GET /orders/delivery-charge?city=Dhaka
// router.get("/delivery-charge", getDeliveryChargeEndpoint);

// // Place order from Buy Now / Cart / Wishlist
// router.post("/checkout", checkoutOrder);

// // Track order by orderId string (public)
// router.get("/track/:orderId", trackOrder);

// // Customer self-cancel (pending orders only)   POST /orders/cancel/:orderId
// router.post("/cancel/:orderId", cancelOrderByCustomer);

// // ── Admin ────────────────────────────────────────────────────────────────────

// // All orders
// router.get("/", verifyJWT, verifyAdmin, getOrders);

// // Single order detail
// router.get("/:id", getOrderById);

// // Update order/payment status
// router.patch("/status/:id", verifyJWT, verifyAdmin, updateOrderStatus);

// export default router;



import { Router } from "express";
import { 
  checkoutOrder, 
  getOrders, 
  getOrderById, 
  updateOrderStatus, 
  getDistricts,
  trackOrder,
  getDeliveryCharge,
  getMyOrders,
  submitTransaction
} from "../controllers/orderController.js";
import { verifyJWT, verifyAdmin } from "../middleware/auth.js";

const router = Router();

// Retrieve delivery charge based on district ID or district Name
router.get("/delivery-charge", getDeliveryCharge);

// Retrieve list of 64 districts of Bangladesh grouped by 8 Division states
router.get("/districts", getDistricts);

// Customer private: Retrieve all orders placed by the currently logged-in user
router.get("/my-orders", verifyJWT, getMyOrders);
router.patch("/:orderId/transaction", verifyJWT, submitTransaction);

// Checkout: place order from Buy Now, Cart, or Wishlist selection (requires active login)
router.post("/checkout", verifyJWT, checkoutOrder);

// Admin-only: Retrieve all customer orders in system
router.get("/", verifyJWT, verifyAdmin, getOrders);

// Public Order Tracking
router.get("/track/:orderId", trackOrder);

// Admin / Guest: Extract individual order details
router.get("/:id", getOrderById);

// Admin-only: Update shipping statuses or payment completions
router.patch("/status/:id", verifyJWT, verifyAdmin, updateOrderStatus);

export default router;
