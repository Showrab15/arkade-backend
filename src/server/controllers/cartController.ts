import { Request, Response } from "express";
import { getCollection } from "../db.js";
import { sendSuccess, sendError, sendValidationError } from "../utils/response.js";

const cartsCollection = getCollection("carts");
const productsCollection = getCollection("products");

/**
 * Helper to retrieve or establish a cart identifier session
 */
const getCartSessionId = (req: Request): string => {
  // Try custom session header first, then query, then body, then default fallback
  return (
    (req.headers["x-cart-session-id"] as string) ||
    (req.query.cartSessionId as string) ||
    (req.body.cartSessionId as string) ||
    "session_anonymous_guest"
  );
};

/**
 * Public: Add Product to Cart (No login required)
 * Payload: productId, quantity (default: 1)
 */
export const addToCart = async (req: Request, res: Response) => {
  const { productId, quantity } = req.body;
  const sessionId = getCartSessionId(req);

  if (!productId) {
    return sendValidationError(res, "Cannot add to cart: missing argument", {
      productId: "ProductId is required."
    });
  }

  const requestedQuantity = quantity !== undefined ? Number(quantity) : 1;
  if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
    return sendValidationError(res, "Invalid quantity", {
      quantity: "Quantity must be a valid integer greater than 0."
    });
  }

  try {
    // Verify product exists first
    const product = await productsCollection.findOne({ _id: productId });
    if (!product) {
      return sendError(res, "Item cannot be added to cart: product not found in catalog.", null, 404);
    }

    if (product.status === "stockout") {
      return sendError(res, "Cannot add item: this product is currently out of stock.", null, 400);
    }

    // Check if item is already in this session's cart
    const existingCartItem = await cartsCollection.findOne({ sessionId, productId });

    if (existingCartItem) {
      // If user sends quantity directly, we overwrite or accumulate. The prompt says: "if user increases quantity, updated quantity will be sent."
      // This means we overwrite the quantity matching what frontend sends
      await cartsCollection.updateOne(
        { _id: existingCartItem._id },
        { $set: { quantity: requestedQuantity } }
      );
    } else {
      // Create new cart entry
      const newCartItem = {
        sessionId,
        productId,
        quantity: requestedQuantity,
        createdAt: new Date().toISOString()
      };
      await cartsCollection.insertOne(newCartItem);
    }

    // Return detailed Cart response to fulfill the user's specs
    return sendSuccess(res, "Cart updated successfully.", {
      sessionId,
      productId,
      quantity: requestedQuantity
    });
  } catch (error) {
    return sendError(res, "Failed to update item inside cart.", error, 500);
  }
};

/**
 * Public: Get Cart Details with joined Product definitions
 */
export const getCartData = async (req: Request, res: Response) => {
  const sessionId = getCartSessionId(req);

  try {
    const rawCartItems = await cartsCollection.find({ sessionId }).toArray();

    const resolvedItems = [];
    let grandTotal = 0;
    let totalItems = 0;

    for (const item of rawCartItems) {
      const product = await productsCollection.findOne({ _id: item.productId });
      if (product) {
        const subtotal = product.price * item.quantity;
        grandTotal += subtotal;
        totalItems += item.quantity;

        resolvedItems.push({
          cartItemId: item._id,
          productId: item.productId,
          name: product.name,
          productCode: product.productCode,
          price: product.price,
          color: product.color,
          images: product.images,
          size: product.size,
          category: product.category,
          quantity: item.quantity,
          subtotal
        });
      } else {
        // Handle dangling cart item gracefully by keeping its record but noting product is gone
        resolvedItems.push({
          cartItemId: item._id,
          productId: item.productId,
          name: "Unavailable Product",
          price: 0,
          quantity: item.quantity,
          subtotal: 0,
          isDangling: true
        });
      }
    }

    return sendSuccess(res, `Cart details retrieved for session: ${sessionId}`, {
      cartSessionId: sessionId,
      items: resolvedItems,
      totalItems,
      grandTotal
    });
  } catch (error) {
    return sendError(res, "Failed to retrieve cart details.", error, 500);
  }
};

/**
 * Public: Remove a specific item from Cart by productId
 */
export const deleteCartItem = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const sessionId = getCartSessionId(req);

  if (!productId) {
    return sendValidationError(res, "Missing parameter", { productId: "Product ID parameter is required." });
  }

  try {
    const query = { sessionId, productId };
    const cartItem = await cartsCollection.findOne(query);

    if (!cartItem) {
      return sendError(res, "Item was not found in your cart.", null, 404);
    }

    await cartsCollection.deleteOne(query);
    return sendSuccess(res, "Product removed from cart successfully.", { productId, sessionId });
  } catch (error) {
    return sendError(res, "Failed to delete item from cart.", error, 500);
  }
};
