import { Router } from "express";
import { 
  addProduct, 
  updateProduct, 
  getProducts, 
  getProductById, 
  deleteProduct 
} from "../controllers/productController.js";
import { verifyJWT, verifyAdminOrModerator, verifyAdmin } from "../middleware/auth.js";

const router = Router();

// Public routes for customer exploration
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin / Moderator inventory control routes
router.post("/", verifyJWT, verifyAdminOrModerator, addProduct);
router.put("/:id", verifyJWT, verifyAdmin, updateProduct);
router.patch("/:id", verifyJWT, verifyAdmin, updateProduct);
router.delete("/:id", verifyJWT, verifyAdmin, deleteProduct);

export default router;
