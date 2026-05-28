// import { Router } from "express";
// import { 
//   checkoutOrder, 
//   getOrders, 
//   getOrderById, 
//   updateOrderStatus, 
//   getDistricts 
// } from "../controllers/orderController.js";
// import { verifyJWT, verifyAdmin } from "../middleware/auth.js";

// const router = Router();

// // Retrieve list of 64 districts of Bangladesh grouped by 8 Division states
// router.get("/districts", getDistricts);

// // Public Checkout: place order from Buy Now, Cart, or Wishlist selection
// router.post("/checkout", checkoutOrder);

// // Admin-only: Retrieve all customer orders in system
// router.get("/", verifyJWT, verifyAdmin, getOrders);

// // Admin / Guest: Extract individual order details
// router.get("/:id", getOrderById);

// // Admin-only: Update shipping statuses or payment completions
// router.patch("/status/:id", verifyJWT, verifyAdmin, updateOrderStatus);

// export default router;



import { Router } from "express";
import { 
  checkoutOrder, 
  getOrders, 
  getOrderById, 
  updateOrderStatus, 
  getDistricts,
  trackOrder
} from "../controllers/orderController.js";
import { verifyJWT, verifyAdmin } from "../middleware/auth.js";

const router = Router();

// Retrieve list of 64 districts of Bangladesh grouped by 8 Division states
router.get("/districts", getDistricts);

// Public Checkout: place order from Buy Now, Cart, or Wishlist selection
router.post("/checkout", checkoutOrder);

// Admin-only: Retrieve all customer orders in system
router.get("/", verifyJWT, verifyAdmin, getOrders);

// Public Order Tracking
router.get("/track/:orderId", trackOrder);

// Admin / Guest: Extract individual order details
router.get("/:id", getOrderById);

// Admin-only: Update shipping statuses or payment completions
router.patch("/status/:id", verifyJWT, verifyAdmin, updateOrderStatus);

export default router;
