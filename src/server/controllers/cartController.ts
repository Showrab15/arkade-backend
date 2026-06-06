import { Request, Response } from "express";
import { getCollection } from "../db.js";
import { sendSuccess, sendError, sendValidationError } from "../utils/response.js";

const cartsCollection = getCollection("carts");
const productsCollection = getCollection("products");

/**
 * Reads session ID from header or query only.
 * Deliberately excludes req.body to avoid early-parse conflicts on POST routes.
 */
const getCartSessionId = (req: Request): string => {
  return (
    (req.headers["x-cart-session-id"] as string) ||
    (req.query.cartSessionId as string) ||
    "session_anonymous_guest"
  );
};

/**
 * Public: Add Product to Cart
 * Payload: productId, quantity (default: 1), size (required)
 */
export const addToCart = async (req: Request, res: Response) => {
  console.log("req.body →", req.body); // remove after confirming

  const { productId, quantity, size } = req.body;
  const sessionId = getCartSessionId(req); // after body destructure

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

  if (!size || typeof size !== "string" || size.trim() === "") {
    return sendValidationError(res, "Size is required", {
      size: "Please select a size before adding to cart."
    });
  }

  const normalizedSize = size.trim().toUpperCase();

  try {
    const product = await productsCollection.findOne({ _id: productId });
    if (!product) {
      return sendError(res, "Item cannot be added to cart: product not found in catalog.", null, 404);
    }

    if (product.status === "stockout") {
      return sendError(res, "Cannot add item: this product is currently out of stock.", null, 400);
    }

    const existingCartItem = await cartsCollection.findOne({
      sessionId,
      productId,
      size: normalizedSize
    });

    if (existingCartItem) {
      await cartsCollection.updateOne(
        { _id: existingCartItem._id },
        { $set: { quantity: requestedQuantity } }
      );
    } else {
      await cartsCollection.insertOne({
        sessionId,
        productId,
        size: normalizedSize,
        quantity: requestedQuantity,
        createdAt: new Date().toISOString()
      });
    }

    return sendSuccess(res, "Cart updated successfully.", {
      sessionId,
      productId,
      size: normalizedSize,
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
          size: item.size,
          name: product.name,
          productCode: product.productCode,
          price: product.price,
          color: product.color,
          images: product.images,
          category: product.category,
          quantity: item.quantity,
          subtotal
        });
      } else {
        resolvedItems.push({
          cartItemId: item._id,
          productId: item.productId,
          size: item.size,
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
 * Public: Remove item by productId + size
 * Route: DELETE /:productId?size=M
 */
export const deleteCartItem = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { size } = req.query;
  const sessionId = getCartSessionId(req);

  if (!productId) {
    return sendValidationError(res, "Missing parameter", {
      productId: "Product ID is required."
    });
  }

  if (!size || typeof size !== "string" || size.trim() === "") {
    return sendValidationError(res, "Missing parameter", {
      size: "Size query param is required. e.g. DELETE /cart/:productId?size=M"
    });
  }

  const normalizedSize = size.trim().toUpperCase();

  try {
    const query = { sessionId, productId, size: normalizedSize };
    const cartItem = await cartsCollection.findOne(query);

    if (!cartItem) {
      return sendError(res, "Item was not found in your cart.", null, 404);
    }

    await cartsCollection.deleteOne(query);

    return sendSuccess(res, "Product removed from cart successfully.", {
      productId,
      size: normalizedSize,
      sessionId
    });
  } catch (error) {
    return sendError(res, "Failed to delete item from cart.", error, 500);
  }
};