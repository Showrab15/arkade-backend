// controllers/productController.js
import { Response } from "express";
import { getCollection } from "../db.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError, sendValidationError } from "../utils/response.js";

const productsCollection = getCollection("products");

const VALID_STATUSES = ["available", "stockout"];

const VALID_FITS = [
  "Regular Fit",
  "Slim Fit",
  "Relaxed Fit",
  "Oversized Fit",
  "Loose Fit",
  "Straight Fit",
];

const parseQuantity = (val: any): number => {
  if (val === undefined || val === null || val === "") return 50;
  if (typeof val === "number") return val;

  const parsed = parseInt(String(val).replace(/[^\d]/g, ""), 10);
  return isNaN(parsed) ? 50 : parsed;
};

const parseBoolean = (val: any): boolean => {
  if (val === true) return true;
  if (val === false) return false;
  if (typeof val === "string") return val.toLowerCase() === "true";
  if (typeof val === "number") return val === 1;
  return false;
};

const normalizeFit = (fit: any): string => {
  if (typeof fit !== "string") return "Regular Fit";

  const trimmedFit = fit.trim();
  return VALID_FITS.includes(trimmedFit) ? trimmedFit : "Regular Fit";
};

export const addProduct = async (req: AuthenticatedRequest, res: Response) => {
  const {
    productCode,
    name,
    size,
    description,
    price,
    images,
    category,
    careInstructions,
    color,
    status,
    fit,
    isBestSelling,
    bestSelling,
  } = req.body;

  const errors: Record<string, string> = {};

  if (!productCode?.trim()) errors.productCode = "Product code is mandatory.";
  if (!name?.trim()) errors.name = "Product name is mandatory.";
  if (price === undefined || typeof price !== "number" || price < 0) {
    errors.price = "Valid numeric price is required.";
  }
  if (!category?.trim()) errors.category = "Category is mandatory.";
  if (!color?.trim()) errors.color = "Color is mandatory.";

  if (!status || !VALID_STATUSES.includes(status)) {
    errors.status = "Status must be either 'available' or 'stockout'.";
  }

  if (fit !== undefined && typeof fit === "string" && fit.trim() && !VALID_FITS.includes(fit.trim())) {
    errors.fit = `Fit must be one of: ${VALID_FITS.join(", ")}.`;
  }

  if (size && !Array.isArray(size)) errors.size = "Size must be an array.";
  if (images && !Array.isArray(images)) errors.images = "Images must be an array.";
  if (careInstructions && !Array.isArray(careInstructions)) {
    errors.careInstructions = "Care instructions must be an array.";
  }

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, "Cannot add product: validation failed", errors);
  }

  try {
    const existingCode = await productsCollection.findOne({
      productCode: productCode.trim(),
    });

    if (existingCode) {
      return sendError(
        res,
        `A product with code [${productCode.trim()}] already exists.`,
        null,
        400
      );
    }

    const payload = {
      productCode: productCode.trim(),
      name: name.trim(),
      size: Array.isArray(size) ? size : [],
      description: description || "",
      price,
      quantity: parseQuantity(req.body.quantity),
      images: Array.isArray(images) ? images : [],
      category: category.trim(),
      careInstructions: Array.isArray(careInstructions) ? careInstructions : [],
      color: color.trim(),

      // New fields
      fit: normalizeFit(fit),
      isBestSelling: parseBoolean(
        isBestSelling !== undefined ? isBestSelling : bestSelling
      ),

      status: status || "available",
      uploaderAdmin: {
        id: req.user?.id || "fallback_id",
        email: req.user?.email || "fallback_email",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await productsCollection.insertOne(payload);

    return sendSuccess(
      res,
      "Product added to catalog successfully.",
      {
        _id: result.insertedId,
        ...payload,
      },
      201
    );
  } catch (error) {
    return sendError(res, "Failed to create product.", error, 500);
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = { ...req.body };

  delete updates.uploaderAdmin;
  delete updates.createdAt;
  delete updates._id;

  try {
    const product = await productsCollection.findOne({ _id: id });

    if (!product) {
      return sendError(res, "Product not found.", null, 404);
    }

    const setPayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
      lastEditorAdmin: {
        id: req.user?.id,
        email: req.user?.email,
      },
    };

    const stringFields = [
      "productCode",
      "name",
      "description",
      "category",
      "color",
      "status",
    ];

    const arrayFields = ["size", "images", "careInstructions"];

    stringFields.forEach((field) => {
      if (updates[field] !== undefined) {
        setPayload[field] =
          typeof updates[field] === "string" ? updates[field].trim() : updates[field];
      }
    });

    if (updates.fit !== undefined) {
      if (typeof updates.fit !== "string" || !VALID_FITS.includes(updates.fit.trim())) {
        return sendValidationError(res, "Invalid fit value.", {
          fit: `Fit must be one of: ${VALID_FITS.join(", ")}`,
        });
      }

      setPayload.fit = updates.fit.trim();
    }

    if (updates.isBestSelling !== undefined) {
      setPayload.isBestSelling = parseBoolean(updates.isBestSelling);
    }

    if (updates.bestSelling !== undefined) {
      setPayload.isBestSelling = parseBoolean(updates.bestSelling);
    }

    if (updates.price !== undefined) {
      if (typeof updates.price !== "number" || updates.price < 0) {
        return sendValidationError(res, "Invalid price value.", {
          price: "Must be a positive number.",
        });
      }

      setPayload.price = updates.price;
    }

    if (updates.quantity !== undefined) {
      setPayload.quantity = parseQuantity(updates.quantity);
    }

    for (const field of arrayFields) {
      if (updates[field] !== undefined) {
        if (!Array.isArray(updates[field])) {
          return sendValidationError(res, `Invalid ${field}.`, {
            [field]: "Must be an array.",
          });
        }

        setPayload[field] = updates[field];
      }
    }

    if (setPayload.status && !VALID_STATUSES.includes(setPayload.status)) {
      return sendValidationError(res, "Invalid status.", {
        status: "Must be 'available' or 'stockout'.",
      });
    }

    await productsCollection.updateOne({ _id: id }, { $set: setPayload });

    const updatedProduct = await productsCollection.findOne({ _id: id });

    return sendSuccess(res, "Product updated successfully.", updatedProduct);
  } catch (error) {
    return sendError(res, "Failed to update product.", error, 500);
  }
};

export const getProducts = async (req: any, res: Response) => {
  const { category, status, query, sort, bestSelling, limit } = req.query;

  try {
    const filterObj: Record<string, any> = {};

    if (category) filterObj.category = category;
    if (status) filterObj.status = status;
    if (bestSelling === "true") filterObj.isBestSelling = true;

    let products = await productsCollection.find(filterObj).toArray();

    if (query) {
      const regex = new RegExp(query, "i");
      products = products.filter(
        (p) =>
          regex.test(p.name || "") ||
          regex.test(p.description || "") ||
          regex.test(p.category || "")
      );
    }

    if (sort === "price-low-high") products.sort((a, b) => a.price - b.price);
    if (sort === "price-high-low") products.sort((a, b) => b.price - a.price);
    if (sort === "best-fit") products.sort(() => Math.random() - 0.5);

    if (limit) products = products.slice(0, Number(limit));

    return sendSuccess(res, "Retrieved products list successfully.", products);
  } catch (error) {
    return sendError(res, "Failed to retrieve products.", error, 500);
  }
};

export const getProductById = async (req: any, res: Response) => {
  try {
    const product = await productsCollection.findOne({ _id: req.params.id });

    if (!product) {
      return sendError(res, "Product not found.", null, 404);
    }

    return sendSuccess(res, "Single product details retrieved successfully.", product);
  } catch (error) {
    return sendError(res, "Failed to retrieve product.", error, 500);
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await productsCollection.findOne({ _id: req.params.id });

    if (!product) {
      return sendError(res, "Product not found.", null, 404);
    }

    await productsCollection.deleteOne({ _id: req.params.id });

    return sendSuccess(res, `Product [${product.name}] deleted successfully.`, {
      productId: req.params.id,
    });
  } catch (error) {
    return sendError(res, "Failed to delete product.", error, 500);
  }
};