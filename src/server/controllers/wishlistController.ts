import { Request, Response } from "express";
import { getCollection } from "../db.js";
import { sendSuccess, sendError, sendValidationError } from "../utils/response.js";

const wishlistsCollection = getCollection("wishlists");
const productsCollection = getCollection("products");

const getWishSessionId = (req: Request): string => {
  return (
    (req.headers["x-cart-session-id"] as string) ||
    (req.query.cartSessionId as string) ||
    (req.body.cartSessionId as string) ||
    "session_anonymous_guest"
  );
};

/**
 * Public: Add Product to Wishlist (No authentication mandatory)
 */
export const addToWishlist = async (req: Request, res: Response) => {
  const { productId } = req.body;
  const sessionId = getWishSessionId(req);

  if (!productId) {
    return sendValidationError(res, "Missing parameter", { productId: "ProductId is mandatory." });
  }

  try {
    const product = await productsCollection.findOne({ _id: productId });
    if (!product) {
      return sendError(res, "Product not found in catalog.", null, 404);
    }

    const existingWish = await wishlistsCollection.findOne({ sessionId, productId });
    if (existingWish) {
      return sendSuccess(res, "Product is already in your wishlist.", existingWish);
    }

    const wishItem = {
      sessionId,
      productId,
      createdAt: new Date().toISOString()
    };

    await wishlistsCollection.insertOne(wishItem);
    return sendSuccess(res, "Product added to wishlist successfully.", wishItem, 201);
  } catch (error) {
    return sendError(res, "Failed to update wishlist.", error, 500);
  }
};

/**
 * Public: Retrieve Wishlist items resolved with product attributes
 */
export const getWishlist = async (req: Request, res: Response) => {
  const sessionId = getWishSessionId(req);

  try {
    const wishes = await wishlistsCollection.find({ sessionId }).toArray();
    const resolvedProducts = [];

    for (const wish of wishes) {
      const product = await productsCollection.findOne({ _id: wish.productId });
      if (product) {
        resolvedProducts.push({
          wishlistId: wish._id,
          ...product
        });
      }
    }

    return sendSuccess(res, "Wishlist items retrieved successfully.", {
      wishSessionId: sessionId,
      items: resolvedProducts
    });
  } catch (error) {
    return sendError(res, "Failed to retrieve wishlist.", error, 500);
  }
};

/**
 * Public: Delete Wishlist Item by productId
 */
export const removeWishlistItem = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const sessionId = getWishSessionId(req);

  if (!productId) {
    return sendValidationError(res, "Missing parameter", { productId: "Product ID parameter is required." });
  }

  try {
    const query = { sessionId, productId };
    const wish = await wishlistsCollection.findOne(query);

    if (!wish) {
      return sendError(res, "Item was not found in your wishlist.", null, 404);
    }

    await wishlistsCollection.deleteOne(query);
    return sendSuccess(res, "Product removed from wishlist successfully.", { productId, sessionId });
  } catch (error) {
    return sendError(res, "Failed to remove item from wishlist.", error, 500);
  }
};
