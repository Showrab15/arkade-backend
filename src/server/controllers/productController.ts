// import { Response } from "express";
// import { getCollection, toObjectId } from "../db.js";
// import { AuthenticatedRequest } from "../middleware/auth.js";
// import { sendSuccess, sendError, sendValidationError } from "../utils/response.js";

// const productsCollection = getCollection("products");

// /**
//  * Admin Only: Upload a new product to inventory
//  */
// export const addProduct = async (req: AuthenticatedRequest, res: Response) => {
//   const {
//     productCode,
//     name,
//     size,
//     description,
//     price,
//     images,
//     category,
//     careInstructions,
//     color,
//     status
//   } = req.body;

//   // Manual validation checks
//   const errors: Record<string, string> = {};
//   if (!productCode || productCode.trim() === "") errors.productCode = "productCode code is mandatory.";
//   if (!name || name.trim() === "") errors.name = "product Name is mandatory.";
//   if (price === undefined || typeof price !== "number" || price < 0) errors.price = "Valid numeric price is required.";
//   if (!category || category.trim() === "") errors.category = "Category descriptor is mandatory.";
//   if (!color || color.trim() === "") errors.color = "Color parameter is mandatory.";
  
//   const validStatuses = ["available", "stockout"];
//   if (!status || !validStatuses.includes(status)) {
//     errors.status = `Status must be either 'available' or 'stockout'.`;
//   }

//   if (size && !Array.isArray(size)) errors.size = "Size must be an array of strings.";
//   if (images && !Array.isArray(images)) errors.images = "Images must be an array of media strings/URLs.";
//   if (careInstructions && !Array.isArray(careInstructions)) errors.careInstructions = "CareInstructions must be an array of strings.";

//   if (Object.keys(errors).length > 0) {
//     return sendValidationError(res, "Cannot add product: validation failed", errors);
//   }

//   try {
//     const existingCode = await productsCollection.findOne({ productCode: productCode.trim() });
//     if (existingCode) {
//       return sendError(res, `A product with code [${productCode.trim()}] is already registered.`, null, 400);
//     }

//     const payload = {
//       productCode: productCode.trim(),
//       name: name.trim(),
//       size: Array.isArray(size) ? size : [],
//       description: description || "",
//       price,
//       images: Array.isArray(images) ? images : [],
//       category: category.trim(),
//       careInstructions: Array.isArray(careInstructions) ? careInstructions : [],
//       color: color.trim(),
//       status: status || "available",
//       uploaderAdmin: {
//         id: req.user?.id || "fallback_id",
//         email: req.user?.email || "fallback_email"
//       },
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };

//     const result = await productsCollection.insertOne(payload);
//     return sendSuccess(res, "Product added to catalog successfully.", {
//       productId: result.insertedId,
//       ...payload
//     }, 201);
//   } catch (error) {
//     return sendError(res, "Failed to create product in database.", error, 500);
//   }
// };

// /**
//  * Admin Only: Edit an existing product's fields
//  */
// export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
//   const { id } = req.params;
//   const updates = req.body;

//   // Clean updates block to ignore admin injection attempts
//   delete updates.uploaderAdmin;
//   delete updates.createdAt;
//   delete updates._id;

//   try {
//     const product = await productsCollection.findOne({ _id: id });
//     if (!product) {
//       return sendError(res, "Product with the specified ID was not found.", null, 404);
//     }

//     const setPayload: Record<string, any> = {
//       updatedAt: new Date().toISOString(),
//       lastEditorAdmin: {
//         id: req.user?.id,
//         email: req.user?.email
//       }
//     };

//     const stringFields = ["productCode", "name", "description", "category", "color", "status"];
//     const arrayFields = ["size", "images", "careInstructions"];

//     stringFields.forEach(field => {
//       if (updates[field] !== undefined) {
//         setPayload[field] = typeof updates[field] === "string" ? updates[field].trim() : updates[field];
//       }
//     });

//     if (updates.price !== undefined) {
//       if (typeof updates.price !== "number" || updates.price < 0) {
//         return sendValidationError(res, "Invalid price value", { price: "Must be a positive number." });
//       }
//       setPayload.price = updates.price;
//     }

//     arrayFields.forEach(field => {
//       if (updates[field] !== undefined) {
//         if (!Array.isArray(updates[field])) {
//           return sendValidationError(res, `Invalid payload structure for field ${field}.`, { [field]: "Must be an array." });
//         }
//         setPayload[field] = updates[field];
//       }
//     });

//     if (setPayload.status && !["available", "stockout"].includes(setPayload.status)) {
//       return sendValidationError(res, "Invalid status property.", { status: "Must be 'available' or 'stockout'." });
//     }

//     await productsCollection.updateOne({ _id: id }, { $set: setPayload });

//     const updatedProduct = await productsCollection.findOne({ _id: id });
//     return sendSuccess(res, "Product catalog entry updated successfully.", updatedProduct);
//   } catch (error) {
//     return sendError(res, "Failed to update product details.", error, 500);
//   }
// };

// /**
//  * Public: List all products in catalog (supports optional filtering by Category or Status)
//  */
// export const getProducts = async (req: any, res: Response) => {
//   const { category, status, query } = req.query;

//   try {
//     const filterObj: Record<string, any> = {};
//     if (category) filterObj.category = category;
//     if (status) filterObj.status = status;

//     // Fetch all
//     let products = await productsCollection.find(filterObj).toArray();

//     // Query text search simulation if requested
//     if (query) {
//       const regex = new RegExp(query, "i");
//       products = products.filter(p => regex.test(p.name) || regex.test(p.description));
//     }

//     return sendSuccess(res, "Retrieved products list successfully.", products);
//   } catch (error) {
//     return sendError(res, "Error extracting store product guidelines.", error, 500);
//   }
// };

// /**
//  * Public: Extract details concerning a single product by Id
//  */
// export const getProductById = async (req: any, res: Response) => {
//   const { id } = req.params;

//   try {
//     const product = await productsCollection.findOne({ _id: id });
//     if (!product) {
//       return sendError(res, "Product not found.", null, 404);
//     }

//     return sendSuccess(res, "Single product details retrieved successfully.", product);
//   } catch (error) {
//     return sendError(res, "Error extracting single product guidelines.", error, 500);
//   }
// };

// /**
//  * Admin Only: Remove product from database catalog
//  */
// export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
//   const { id } = req.params;

//   try {
//     const product = await productsCollection.findOne({ _id: id });
//     if (!product) {
//       return sendError(res, "Product not found.", null, 404);
//     }

//     await productsCollection.deleteOne({ _id: id });
//     return sendSuccess(res, `Product [${product.name}] deleted from inventory successfully.`, { productId: id });
//   } catch (error) {
//     return sendError(res, "Failed to delete product.", error, 500);
//   }
// };



import { Response } from "express";
import { getCollection, toObjectId } from "../db.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendSuccess, sendError, sendValidationError } from "../utils/response.js";

const productsCollection = getCollection("products");

/**
 * Admin Only: Upload a new product to inventory
 */
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
    status
  } = req.body;

  // Manual validation checks
  const errors: Record<string, string> = {};
  if (!productCode || productCode.trim() === "") errors.productCode = "productCode code is mandatory.";
  if (!name || name.trim() === "") errors.name = "product Name is mandatory.";
  if (price === undefined || typeof price !== "number" || price < 0) errors.price = "Valid numeric price is required.";
  if (!category || category.trim() === "") errors.category = "Category descriptor is mandatory.";
  if (!color || color.trim() === "") errors.color = "Color parameter is mandatory.";
  
  const validStatuses = ["available", "stockout"];
  if (!status || !validStatuses.includes(status)) {
    errors.status = `Status must be either 'available' or 'stockout'.`;
  }

  if (size && !Array.isArray(size)) errors.size = "Size must be an array of strings.";
  if (images && !Array.isArray(images)) errors.images = "Images must be an array of media strings/URLs.";
  if (careInstructions && !Array.isArray(careInstructions)) errors.careInstructions = "CareInstructions must be an array of strings.";

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, "Cannot add product: validation failed", errors);
  }

  try {
    const existingCode = await productsCollection.findOne({ productCode: productCode.trim() });
    if (existingCode) {
      return sendError(res, `A product with code [${productCode.trim()}] is already registered.`, null, 400);
    }

    const parseQuantity = (val: any): number => {
      if (val === undefined || val === null) return 50;
      if (typeof val === "number") return val;
      const parsed = parseInt(String(val).replace(/[^\d]/g, ""), 10);
      return isNaN(parsed) ? 50 : parsed;
    };

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
      status: status || "available",
      uploaderAdmin: {
        id: req.user?.id || "fallback_id",
        email: req.user?.email || "fallback_email"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await productsCollection.insertOne(payload);
    return sendSuccess(res, "Product added to catalog successfully.", {
      productId: result.insertedId,
      ...payload
    }, 201);
  } catch (error) {
    return sendError(res, "Failed to create product in database.", error, 500);
  }
};

/**
 * Admin Only: Edit an existing product's fields
 */
export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // Clean updates block to ignore admin injection attempts
  delete updates.uploaderAdmin;
  delete updates.createdAt;
  delete updates._id;

  try {
    const product = await productsCollection.findOne({ _id: id });
    if (!product) {
      return sendError(res, "Product with the specified ID was not found.", null, 404);
    }

    const setPayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
      lastEditorAdmin: {
        id: req.user?.id,
        email: req.user?.email
      }
    };

    const stringFields = ["productCode", "name", "description", "category", "color", "status"];
    const arrayFields = ["size", "images", "careInstructions"];

    stringFields.forEach(field => {
      if (updates[field] !== undefined) {
        setPayload[field] = typeof updates[field] === "string" ? updates[field].trim() : updates[field];
      }
    });

    if (updates.price !== undefined) {
      if (typeof updates.price !== "number" || updates.price < 0) {
        return sendValidationError(res, "Invalid price value", { price: "Must be a positive number." });
      }
      setPayload.price = updates.price;
    }

    if (updates.quantity !== undefined) {
      if (typeof updates.quantity === "number") {
        setPayload.quantity = updates.quantity;
      } else {
        const parsed = parseInt(String(updates.quantity).replace(/[^\d]/g, ""), 10);
        setPayload.quantity = isNaN(parsed) ? 0 : parsed;
      }
    }

    arrayFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (!Array.isArray(updates[field])) {
          return sendValidationError(res, `Invalid payload structure for field ${field}.`, { [field]: "Must be an array." });
        }
        setPayload[field] = updates[field];
      }
    });

    if (setPayload.status && !["available", "stockout"].includes(setPayload.status)) {
      return sendValidationError(res, "Invalid status property.", { status: "Must be 'available' or 'stockout'." });
    }

    await productsCollection.updateOne({ _id: id }, { $set: setPayload });

    const updatedProduct = await productsCollection.findOne({ _id: id });
    return sendSuccess(res, "Product catalog entry updated successfully.", updatedProduct);
  } catch (error) {
    return sendError(res, "Failed to update product details.", error, 500);
  }
};

/**
 * Public: List all products in catalog (supports optional filtering by Category or Status)
 */
export const getProducts = async (req: any, res: Response) => {
  const { category, status, query } = req.query;

  try {
    const filterObj: Record<string, any> = {};
    if (category) filterObj.category = category;
    if (status) filterObj.status = status;

    // Fetch all
    let products = await productsCollection.find(filterObj).toArray();

    // Query text search simulation if requested
    if (query) {
      const regex = new RegExp(query, "i");
      products = products.filter(p => regex.test(p.name) || regex.test(p.description));
    }

    return sendSuccess(res, "Retrieved products list successfully.", products);
  } catch (error) {
    return sendError(res, "Error extracting store product guidelines.", error, 500);
  }
};

/**
 * Public: Extract details concerning a single product by Id
 */
export const getProductById = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    const product = await productsCollection.findOne({ _id: id });
    if (!product) {
      return sendError(res, "Product not found.", null, 404);
    }

    return sendSuccess(res, "Single product details retrieved successfully.", product);
  } catch (error) {
    return sendError(res, "Error extracting single product guidelines.", error, 500);
  }
};

/**
 * Admin Only: Remove product from database catalog
 */
export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const product = await productsCollection.findOne({ _id: id });
    if (!product) {
      return sendError(res, "Product not found.", null, 404);
    }

    await productsCollection.deleteOne({ _id: id });
    return sendSuccess(res, `Product [${product.name}] deleted from inventory successfully.`, { productId: id });
  } catch (error) {
    return sendError(res, "Failed to delete product.", error, 500);
  }
};
