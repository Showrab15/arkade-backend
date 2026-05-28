// import { Request, Response } from "express";
// import { getCollection, toObjectId } from "../db.js";
// import { sendSuccess, sendError, sendValidationError } from "../utils/response.js";

// const ordersCollection = getCollection("orders");
// const productsCollection = getCollection("products");
// const cartsCollection = getCollection("carts");
// const wishlistsCollection = getCollection("wishlists");

// // Static dataset of Bangladesh Districts grouped by administrative division
// export const BANGLADESH_DISTRICTS = [
//   {
//     division: "Dhaka",
//     districts: ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Faridpur", "Manikganj", "Munshiganj", "Narsingdi", "Gopalganj", "Madaripur", "Rajbari", "Shariatpur", "Kishoreganj"]
//   },
//   {
//     division: "Chattogram",
//     districts: ["Chattogram", "Cox's Bazar", "Comilla", "Feni", "Brahmanbaria", "Rangamati", "Khagrachhari", "Bandarban", "Noakhali", "Lakshmipur", "Chandpur"]
//   },
//   {
//     division: "Sylhet",
//     districts: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"]
//   },
//   {
//     division: "Rajshahi",
//     districts: ["Rajshahi", "Bogura", "Pabna", "Naogaon", "Sirajganj", "Natore", "Joypurhat", "Chapainawabganj"]
//   },
//   {
//     division: "Khulna",
//     districts: ["Khulna", "Jashore", "Kushtia", "Satkhira", "Bagerhat", "Jhenaidah", "Magura", "Chuadanga", "Meherpur", "Narail"]
//   },
//   {
//     division: "Barishal",
//     districts: ["Barishal", "Patuakhali", "Bhola", "Pirojpur", "Barguna", "Jhalokati"]
//   },
//   {
//     division: "Rangpur",
//     districts: ["Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon"]
//   },
//   {
//     division: "Mymensingh",
//     districts: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"]
//   }
// ];

// // Helper to flat list of all district strings for easy lookup validation
// const flatDistrictsList = BANGLADESH_DISTRICTS.reduce((acc, curr) => {
//   return acc.concat(curr.districts);
// }, [] as string[]);

// /**
//  * Public Info Endpoint: Get all divisions and districts of Bangladesh
//  */
// export const getDistricts = (req: Request, res: Response) => {
//   return sendSuccess(res, "Retrieved all 64 districts under 8 divisions of Bangladesh successfully.", {
//     divisions: BANGLADESH_DISTRICTS,
//     flatList: flatDistrictsList
//   });
// };

// /**
//  * Public: Place order (Buy Now, Cart Checkout, or Wishlist Checkout)
//  * No login required.
//  */
// export const checkoutOrder = async (req: Request, res: Response) => {
//   const {
//     checkoutInfo,
//     paymentMethod,
//     checkoutFrom, // "buynow" | "cart" | "wishlist"
//     productId,    // For "buynow"
//     quantity,     // For "buynow", default 1
//     cartIds,      // For "cart"
//     wishlistIds,  // For "wishlist"
//     cartSessionId // To track and delete cart/wishlist details
//   } = req.body;

//   const sessionId = cartSessionId || req.headers["x-cart-session-id"] as string || "session_anonymous_guest";

//   // Validate checkout info
//   if (!checkoutInfo) {
//     return sendValidationError(res, "Missing checkout information block", {
//       checkoutInfo: "checkoutInfo object is required."
//     });
//   }

//   const errors: Record<string, string> = {};
//   const { userName, email, phone, address, city } = checkoutInfo;

//   if (!userName || userName.trim() === "") errors.userName = "UserName field is mandatory.";
//   if (!phone || phone.trim() === "") errors.phone = "Phone number is mandatory.";
//   if (!address || address.trim() === "") errors.address = "Delivery address is mandatory.";
//   if (!city || city.trim() === "") {
//     errors.city = "City parameter is mandatory.";
//   } else {
//     // Validate city from Bangladesh districts list (case-insensitive check)
//     const normalizedCity = city.trim().toLowerCase();
//     const isValidDistrict = flatDistrictsList.some(d => d.toLowerCase() === normalizedCity);
//     if (!isValidDistrict && !["inside dhaka", "outside dhaka"].includes(normalizedCity)) {
//       errors.cityWarning = `Suggested City is not a recognized district of Bangladesh, but we accepted it for custom handling. Recognizable districts: ${flatDistrictsList.slice(0, 5).join(", ")}...`;
//     }
//   }

//   // Validate payment selection
//   const validPaymentMethods = ["COD", "bKash"];
//   if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
//     errors.paymentMethod = "Payment method selection is required ('COD' or 'bKash').";
//   }

//   const validCheckoutSources = ["buynow", "cart", "wishlist"];
//   if (!checkoutFrom || !validCheckoutSources.includes(checkoutFrom)) {
//     errors.checkoutFrom = "checkoutFrom parameter is required ('buynow', 'cart', or 'wishlist').";
//   }

//   if (Object.keys(errors).length > 0) {
//     return sendValidationError(res, "Checkout validation failed", errors);
//   }

//   try {
//     const purchasedItems: Array<{
//       productId: string;
//       name: string;
//       price: number;
//       quantity: number;
//       color: string;
//       images: string[];
//       subtotal: number;
//     }> = [];

//     let totalAmount = 0;

//     // --- CASE A: Buy Now ---
//     if (checkoutFrom === "buynow") {
//       if (!productId) {
//         return sendValidationError(res, "Missing details", { productId: "productId is required for Buy Now checkouts." });
//       }
//       const product = await productsCollection.findOne({ _id: productId });
//       if (!product) {
//         return sendError(res, "Product not found.", null, 404);
//       }
//       if (product.status === "stockout") {
//         return sendError(res, "Item stock is depleted. Cannot complete order.", null, 400);
//       }

//       const orderQty = quantity ? Number(quantity) : 1;
//       const subtotal = product.price * orderQty;
//       totalAmount = subtotal;

//       purchasedItems.push({
//         productId: product._id.toString(),
//         name: product.name,
//         price: product.price,
//         quantity: orderQty,
//         color: product.color || "",
//         images: product.images || [],
//         subtotal
//       });
//     }

//     // --- CASE B: Cart Checkout ---
//     else if (checkoutFrom === "cart") {
//       if (!Array.isArray(cartIds) || cartIds.length === 0) {
//         return sendValidationError(res, "Missing details", { cartIds: "cartIds array is required and must not be empty." });
//       }

//       // Fetch specific cart entries
//       const sessionCart = await cartsCollection.find({ sessionId }).toArray();
//       const filteredCart = sessionCart.filter(item => cartIds.includes(item._id.toString()));

//       if (filteredCart.length === 0) {
//         return sendError(res, "No matching items found in cart for this checkout session.", null, 400);
//       }

//       for (const cartItem of filteredCart) {
//         const product = await productsCollection.findOne({ _id: cartItem.productId });
//         if (product) {
//           const subtotal = product.price * cartItem.quantity;
//           totalAmount += subtotal;
//           purchasedItems.push({
//             productId: product._id.toString(),
//             name: product.name,
//             price: product.price,
//             quantity: cartItem.quantity,
//             color: product.color || "",
//             images: product.images || [],
//             subtotal
//           });
//         }
//       }
//     }

//     // --- CASE C: Wishlist Checkout ---
//     else if (checkoutFrom === "wishlist") {
//       if (!Array.isArray(wishlistIds) || wishlistIds.length === 0) {
//         return sendValidationError(res, "Missing details", { wishlistIds: "wishlistIds array is required and must not be empty." });
//       }

//       const sessionWish = await wishlistsCollection.find({ sessionId }).toArray();
//       const filteredWish = sessionWish.filter(item => wishlistIds.includes(item._id.toString()));

//       if (filteredWish.length === 0) {
//         return sendError(res, "No matching items found in wishlist for this checkout session.", null, 400);
//       }

//       for (const wishItem of filteredWish) {
//         const product = await productsCollection.findOne({ _id: wishItem.productId });
//         if (product) {
//           const subtotal = product.price * 1; // Default quantity 1 for wishlist checkouts
//           totalAmount += subtotal;
//           purchasedItems.push({
//             productId: product._id.toString(),
//             name: product.name,
//             price: product.price,
//             quantity: 1,
//             color: product.color || "",
//             images: product.images || [],
//             subtotal
//           });
//         }
//       }
//     }

//     if (purchasedItems.length === 0) {
//       return sendError(res, "Cannot place empty order. Products could not be resolved from stock catalogue.", null, 400);
//     }

//     // Determine bKash Gateway structural status for client-side preparation
//     let paymentGatewayStatus = "not_applicable";
//     let bkashTransactionPayload = null;

//     if (paymentMethod === "bKash") {
//       paymentGatewayStatus = "initialized_pending";
//       bkashTransactionPayload = {
//         api_endpoints: {
//           create_payment: "/api/payment/bkash/create",
//           execute_payment: "/api/payment/bkash/execute",
//           query_payment: "/api/payment/bkash/query"
//         },
//         merchant_account: "+8801700000000",
//         amount: totalAmount,
//         currency: "BDT",
//         intent: "sale",
//         instructions: "Prepare frontend to direct checkout frame to bKash gateway. In the final payment script, pass merchant_account and token parameters to realize execute execution."
//       };
//     }

//     const orderId = `BK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

//     const newOrder = {
//       orderId,
//       checkoutInfo: {
//         userName: userName.trim(),
//         email: email ? email.toLowerCase().trim() : "",
//         phone: phone.trim(),
//         address: address.trim(),
//         city: city.trim()
//       },
//       paymentMethod,
//       paymentStatus: paymentMethod === "COD" ? "unpaid" : "pending",
//       paymentDetails: bkashTransactionPayload,
//       orderedItems: purchasedItems,
//       totalAmount,
//       orderStatus: "pending", // unseen / pending / processing / shipped
//       createdAt: new Date().toISOString()
//     };

//     const orderResult = await ordersCollection.insertOne(newOrder);

//     // --- POST ORDER HOUSEKEEPING ---
//     // If successful, scrub cart/wishlist entries to satisfy checkout rules
//     if (checkoutFrom === "cart") {
//       await cartsCollection.deleteMany({
//         sessionId,
//         _id: { $or: cartIds.map((id: string) => ({ _id: id })) } as any
//       });
//     } else if (checkoutFrom === "wishlist") {
//       await wishlistsCollection.deleteMany({
//         sessionId,
//         _id: { $or: wishlistIds.map((id: string) => ({ _id: id })) } as any
//       });
//     }

//     return sendSuccess(res, "Order placed successfully!", {
//       id: orderResult.insertedId,
//       orderId,
//       totalAmount,
//       purchasedItemsCount: purchasedItems.length,
//       paymentMethod,
//       paymentGatewayStatus,
//       paymentDetails: bkashTransactionPayload,
//       order: newOrder
//     }, 201);
//   } catch (error) {
//     return sendError(res, "Order checkout transaction failed.", error, 500);
//   }
// };

// /**
//  * Admin Only: Viewing all orders placed
//  */
// export const getOrders = async (req: Request, res: Response) => {
//   try {
//     const orders = await ordersCollection.find().sort({ createdAt: -1 }).toArray();
//     return sendSuccess(res, "Retrieved all customer orders.", orders);
//   } catch (error) {
//     return sendError(res, "Failed to retrieve orders database.", error, 500);
//   }
// };

// /**
//  * Admin/User: View specific order details by ID
//  */
// export const getOrderById = async (req: Request, res: Response) => {
//   const { id } = req.params;

//   try {
//     const order = await ordersCollection.findOne({ _id: id });
//     if (!order) {
//       // Try search by orderNumber string likewise
//       const orderByNo = await ordersCollection.findOne({ orderId: id });
//       if (!orderByNo) {
//         return sendError(res, "Order with designated reference ID not found.", null, 404);
//       }
//       return sendSuccess(res, "Order details retrieved successfully.", orderByNo);
//     }
//     return sendSuccess(res, "Order details retrieved successfully.", order);
//   } catch (error) {
//     return sendError(res, "Failed to extract order definition.", error, 500);
//   }
// };

// /**
//  * Admin Only: Update Order workflow status
//  */
// export const updateOrderStatus = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const { orderStatus, paymentStatus } = req.body;

//   const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
//   const updatePayload: Record<string, any> = {};

//   if (orderStatus) {
//     if (!validStatuses.includes(orderStatus)) {
//       return sendValidationError(res, "Invalid order status value.", {
//         orderStatus: `Status must be one of: ${validStatuses.join(", ")}`
//       });
//     }
//     updatePayload.orderStatus = orderStatus;
//   }

//   if (paymentStatus) {
//     const validPaymentStatuses = ["unpaid", "pending", "paid", "refunded"];
//     if (!validPaymentStatuses.includes(paymentStatus)) {
//       return sendValidationError(res, "Invalid payment status value.", {
//         paymentStatus: `Status must be one of: ${validPaymentStatuses.join(", ")}`
//       });
//     }
//     updatePayload.paymentStatus = paymentStatus;
//   }

//   if (Object.keys(updatePayload).length === 0) {
//     return sendValidationError(res, "No valid update field assigned.", {
//       payloadStatus: "Please assign 'orderStatus' or 'paymentStatus' values."
//     });
//   }

//   try {
//     const order = await ordersCollection.findOne({ _id: id });
//     if (!order) {
//       return sendError(res, "Order not found in record log.", null, 404);
//     }

//     await ordersCollection.updateOne(
//       { _id: id },
//       { $set: { ...updatePayload, updatedAt: new Date().toISOString() } }
//     );

//     return sendSuccess(res, "Order delivery metrics updated successfully.", {
//       orderId: id,
//       ...updatePayload
//     });
//   } catch (error) {
//     return sendError(res, "Failed to update order details status.", error, 500);
//   }
// };





// import { Request, Response } from "express";
// import { getCollection, toObjectId } from "../db.js";
// import { sendSuccess, sendError, sendValidationError } from "../utils/response.js";

// const ordersCollection = getCollection("orders");
// const productsCollection = getCollection("products");
// const cartsCollection = getCollection("carts");
// const wishlistsCollection = getCollection("wishlists");

// // Static dataset of Bangladesh Districts grouped by administrative division
// export const BANGLADESH_DISTRICTS = [
//   {
//     division: "Dhaka",
//     districts: ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Faridpur", "Manikganj", "Munshiganj", "Narsingdi", "Gopalganj", "Madaripur", "Rajbari", "Shariatpur", "Kishoreganj"]
//   },
//   {
//     division: "Chattogram",
//     districts: ["Chattogram", "Cox's Bazar", "Comilla", "Feni", "Brahmanbaria", "Rangamati", "Khagrachhari", "Bandarban", "Noakhali", "Lakshmipur", "Chandpur"]
//   },
//   {
//     division: "Sylhet",
//     districts: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"]
//   },
//   {
//     division: "Rajshahi",
//     districts: ["Rajshahi", "Bogura", "Pabna", "Naogaon", "Sirajganj", "Natore", "Joypurhat", "Chapainawabganj"]
//   },
//   {
//     division: "Khulna",
//     districts: ["Khulna", "Jashore", "Kushtia", "Satkhira", "Bagerhat", "Jhenaidah", "Magura", "Chuadanga", "Meherpur", "Narail"]
//   },
//   {
//     division: "Barishal",
//     districts: ["Barishal", "Patuakhali", "Bhola", "Pirojpur", "Barguna", "Jhalokati"]
//   },
//   {
//     division: "Rangpur",
//     districts: ["Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon"]
//   },
//   {
//     division: "Mymensingh",
//     districts: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"]
//   }
// ];

// // Helper to flat list of all district strings for easy lookup validation
// const flatDistrictsList = BANGLADESH_DISTRICTS.reduce((acc, curr) => {
//   return acc.concat(curr.districts);
// }, [] as string[]);

// /**
//  * Public Info Endpoint: Get all divisions and districts of Bangladesh
//  */
// export const getDistricts = (req: Request, res: Response) => {
//   return sendSuccess(res, "Retrieved all 64 districts under 8 divisions of Bangladesh successfully.", {
//     divisions: BANGLADESH_DISTRICTS,
//     flatList: flatDistrictsList
//   });
// };

// /**
//  * Public: Place order (Buy Now, Cart Checkout, or Wishlist Checkout)
//  * No login required.
//  */
// export const checkoutOrder = async (req: Request, res: Response) => {
//   const {
//     checkoutInfo,
//     paymentMethod,
//     checkoutFrom, // "buynow" | "cart" | "wishlist"
//     productId,    // For "buynow"
//     quantity,     // For "buynow", default 1
//     cartIds,      // For "cart"
//     wishlistIds,  // For "wishlist"
//     cartSessionId // To track and delete cart/wishlist details
//   } = req.body;

//   const sessionId = cartSessionId || req.headers["x-cart-session-id"] as string || "session_anonymous_guest";

//   // Validate checkout info
//   if (!checkoutInfo) {
//     return sendValidationError(res, "Missing checkout information block", {
//       checkoutInfo: "checkoutInfo object is required."
//     });
//   }

//   const errors: Record<string, string> = {};
//   const { userName, email, phone, address, city } = checkoutInfo;

//   if (!userName || userName.trim() === "") errors.userName = "UserName field is mandatory.";
//   if (!phone || phone.trim() === "") errors.phone = "Phone number is mandatory.";
//   if (!address || address.trim() === "") errors.address = "Delivery address is mandatory.";
//   if (!city || city.trim() === "") {
//     errors.city = "City parameter is mandatory.";
//   } else {
//     // Validate city from Bangladesh districts list (case-insensitive check)
//     const normalizedCity = city.trim().toLowerCase();
//     const isValidDistrict = flatDistrictsList.some(d => d.toLowerCase() === normalizedCity);
//     if (!isValidDistrict && !["inside dhaka", "outside dhaka"].includes(normalizedCity)) {
//       errors.cityWarning = `Suggested City is not a recognized district of Bangladesh, but we accepted it for custom handling. Recognizable districts: ${flatDistrictsList.slice(0, 5).join(", ")}...`;
//     }
//   }

//   // Validate payment selection
//   const validPaymentMethods = ["COD", "bKash"];
//   if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
//     errors.paymentMethod = "Payment method selection is required ('COD' or 'bKash').";
//   }

//   const validCheckoutSources = ["buynow", "cart", "wishlist"];
//   if (!checkoutFrom || !validCheckoutSources.includes(checkoutFrom)) {
//     errors.checkoutFrom = "checkoutFrom parameter is required ('buynow', 'cart', or 'wishlist').";
//   }

//   if (Object.keys(errors).length > 0) {
//     return sendValidationError(res, "Checkout validation failed", errors);
//   }

//   try {
//     const purchasedItems: Array<{
//       productId: string;
//       name: string;
//       price: number;
//       quantity: number;
//       color: string;
//       images: string[];
//       subtotal: number;
//     }> = [];

//     let totalAmount = 0;

//     // --- CASE A: Buy Now ---
//     if (checkoutFrom === "buynow") {
//       if (!productId) {
//         return sendValidationError(res, "Missing details", { productId: "productId is required for Buy Now checkouts." });
//       }
//       const product = await productsCollection.findOne({ _id: productId });
//       if (!product) {
//         return sendError(res, "Product not found.", null, 404);
//       }
//       if (product.status === "stockout") {
//         return sendError(res, "Item stock is depleted. Cannot complete order.", null, 400);
//       }

//       const orderQty = quantity ? Number(quantity) : 1;
//       const subtotal = product.price * orderQty;
//       totalAmount = subtotal;

//       purchasedItems.push({
//         productId: product._id.toString(),
//         name: product.name,
//         price: product.price,
//         quantity: orderQty,
//         color: product.color || "",
//         images: product.images || [],
//         subtotal
//       });
//     }

//     // --- CASE B: Cart Checkout ---
//     else if (checkoutFrom === "cart") {
//       if (!Array.isArray(cartIds) || cartIds.length === 0) {
//         return sendValidationError(res, "Missing details", { cartIds: "cartIds array is required and must not be empty." });
//       }

//       // Fetch specific cart entries
//       const sessionCart = await cartsCollection.find({ sessionId }).toArray();
//       const filteredCart = sessionCart.filter(item => cartIds.includes(item._id.toString()));

//       if (filteredCart.length === 0) {
//         return sendError(res, "No matching items found in cart for this checkout session.", null, 400);
//       }

//       for (const cartItem of filteredCart) {
//         const product = await productsCollection.findOne({ _id: cartItem.productId });
//         if (product) {
//           const subtotal = product.price * cartItem.quantity;
//           totalAmount += subtotal;
//           purchasedItems.push({
//             productId: product._id.toString(),
//             name: product.name,
//             price: product.price,
//             quantity: cartItem.quantity,
//             color: product.color || "",
//             images: product.images || [],
//             subtotal
//           });
//         }
//       }
//     }

//     // --- CASE C: Wishlist Checkout ---
//     else if (checkoutFrom === "wishlist") {
//       if (!Array.isArray(wishlistIds) || wishlistIds.length === 0) {
//         return sendValidationError(res, "Missing details", { wishlistIds: "wishlistIds array is required and must not be empty." });
//       }

//       const sessionWish = await wishlistsCollection.find({ sessionId }).toArray();
//       const filteredWish = sessionWish.filter(item => wishlistIds.includes(item._id.toString()));

//       if (filteredWish.length === 0) {
//         return sendError(res, "No matching items found in wishlist for this checkout session.", null, 400);
//       }

//       for (const wishItem of filteredWish) {
//         const product = await productsCollection.findOne({ _id: wishItem.productId });
//         if (product) {
//           const subtotal = product.price * 1; // Default quantity 1 for wishlist checkouts
//           totalAmount += subtotal;
//           purchasedItems.push({
//             productId: product._id.toString(),
//             name: product.name,
//             price: product.price,
//             quantity: 1,
//             color: product.color || "",
//             images: product.images || [],
//             subtotal
//           });
//         }
//       }
//     }

//     if (purchasedItems.length === 0) {
//       return sendError(res, "Cannot place empty order. Products could not be resolved from stock catalogue.", null, 400);
//     }

//     // Determine bKash Gateway structural status for client-side preparation
//     let paymentGatewayStatus = "not_applicable";
//     let bkashTransactionPayload = null;

//     if (paymentMethod === "bKash") {
//       paymentGatewayStatus = "initialized_pending";
//       bkashTransactionPayload = {
//         api_endpoints: {
//           create_payment: "/api/payment/bkash/create",
//           execute_payment: "/api/payment/bkash/execute",
//           query_payment: "/api/payment/bkash/query"
//         },
//         merchant_account: "+8801700000000",
//         amount: totalAmount,
//         currency: "BDT",
//         intent: "sale",
//         instructions: "Prepare frontend to direct checkout frame to bKash gateway. In the final payment script, pass merchant_account and token parameters to realize execute execution."
//       };
//     }

//     const orderId = `BK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

//     const newOrder = {
//       orderId,
//       checkoutInfo: {
//         userName: userName.trim(),
//         email: email ? email.toLowerCase().trim() : "",
//         phone: phone.trim(),
//         address: address.trim(),
//         city: city.trim()
//       },
//       paymentMethod,
//       paymentStatus: paymentMethod === "COD" ? "unpaid" : "pending",
//       paymentDetails: bkashTransactionPayload,
//       orderedItems: purchasedItems,
//       totalAmount,
//       orderStatus: "pending", // unseen / pending / processing / shipped
//       createdAt: new Date().toISOString()
//     };

//     const orderResult = await ordersCollection.insertOne(newOrder);

//     // --- DECREMENT PRODUCT INVENTORY QUANTITY ---
//     try {
//       for (const item of purchasedItems) {
//         const product = await productsCollection.findOne({ _id: item.productId });
//         if (product) {
//           const currentQty = typeof product.quantity === "number" ? product.quantity : 50;
//           const orderedQty = item.quantity || 1;
//           const updatedQty = Math.max(0, currentQty - orderedQty);
//           await productsCollection.updateOne(
//             { _id: item.productId },
//             { 
//               $set: { 
//                 quantity: updatedQty,
//                 status: updatedQty === 0 ? "stockout" : product.status 
//               } 
//             }
//           );
//         }
//       }
//     } catch (invError) {
//       console.error("⚠️ Failed to update product quantity inventory after order checkout:", invError);
//     }

//     // --- POST ORDER HOUSEKEEPING ---
//     // If successful, scrub cart/wishlist entries to satisfy checkout rules
//     if (checkoutFrom === "cart") {
//       await cartsCollection.deleteMany({
//         sessionId,
//         _id: { $or: cartIds.map((id: string) => ({ _id: id })) } as any
//       });
//     } else if (checkoutFrom === "wishlist") {
//       await wishlistsCollection.deleteMany({
//         sessionId,
//         _id: { $or: wishlistIds.map((id: string) => ({ _id: id })) } as any
//       });
//     }

//     return sendSuccess(res, "Order placed successfully!", {
//       id: orderResult.insertedId,
//       orderId,
//       totalAmount,
//       purchasedItemsCount: purchasedItems.length,
//       paymentMethod,
//       paymentGatewayStatus,
//       paymentDetails: bkashTransactionPayload,
//       order: newOrder
//     }, 201);
//   } catch (error) {
//     return sendError(res, "Order checkout transaction failed.", error, 500);
//   }
// };

// /**
//  * Admin Only: Viewing all orders placed
//  */
// export const getOrders = async (req: Request, res: Response) => {
//   try {
//     const orders = await ordersCollection.find().sort({ createdAt: -1 }).toArray();
//     return sendSuccess(res, "Retrieved all customer orders.", orders);
//   } catch (error) {
//     return sendError(res, "Failed to retrieve orders database.", error, 500);
//   }
// };

// /**
//  * Admin/User: View specific order details by ID
//  */
// export const getOrderById = async (req: Request, res: Response) => {
//   const { id } = req.params;

//   try {
//     const order = await ordersCollection.findOne({ _id: id });
//     if (!order) {
//       // Try search by orderNumber string likewise
//       const orderByNo = await ordersCollection.findOne({ orderId: id });
//       if (!orderByNo) {
//         return sendError(res, "Order with designated reference ID not found.", null, 404);
//       }
//       return sendSuccess(res, "Order details retrieved successfully.", orderByNo);
//     }
//     return sendSuccess(res, "Order details retrieved successfully.", order);
//   } catch (error) {
//     return sendError(res, "Failed to extract order definition.", error, 500);
//   }
// };

// /**
//  * Admin Only: Update Order workflow status
//  */
// export const updateOrderStatus = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const { orderStatus, paymentStatus } = req.body;

// const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled", "returned"];
//   const updatePayload: Record<string, any> = {};

//   if (orderStatus) {
//     if (!validStatuses.includes(orderStatus)) {
//       return sendValidationError(res, "Invalid order status value.", {
//         orderStatus: `Status must be one of: ${validStatuses.join(", ")}`
//       });
//     }
//     updatePayload.orderStatus = orderStatus;
//   }

//   if (paymentStatus) {
//     const validPaymentStatuses = ["unpaid", "pending", "paid", "refunded"];
//     if (!validPaymentStatuses.includes(paymentStatus)) {
//       return sendValidationError(res, "Invalid payment status value.", {
//         paymentStatus: `Status must be one of: ${validPaymentStatuses.join(", ")}`
//       });
//     }
//     updatePayload.paymentStatus = paymentStatus;
//   }

//   if (Object.keys(updatePayload).length === 0) {
//     return sendValidationError(res, "No valid update field assigned.", {
//       payloadStatus: "Please assign 'orderStatus' or 'paymentStatus' values."
//     });
//   }

//   try {
//     const order = await ordersCollection.findOne({ _id: id });
//     if (!order) {
//       return sendError(res, "Order not found in record log.", null, 404);
//     }

//     await ordersCollection.updateOne(
//       { _id: id },
//       { $set: { ...updatePayload, updatedAt: new Date().toISOString() } }
//     );

//     return sendSuccess(res, "Order delivery metrics updated successfully.", {
//       orderId: id,
//       ...updatePayload
//     });
//   } catch (error) {
//     return sendError(res, "Failed to update order details status.", error, 500);
//   }
// };



// with track order
import { Request, Response } from "express";
import { getCollection, toObjectId } from "../db.js";
import { sendSuccess, sendError, sendValidationError } from "../utils/response.js";

const ordersCollection = getCollection("orders");
const productsCollection = getCollection("products");
const cartsCollection = getCollection("carts");
const wishlistsCollection = getCollection("wishlists");

// Static dataset of Bangladesh Districts grouped by administrative division
export const BANGLADESH_DISTRICTS = [
  {
    division: "Dhaka",
    districts: ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Faridpur", "Manikganj", "Munshiganj", "Narsingdi", "Gopalganj", "Madaripur", "Rajbari", "Shariatpur", "Kishoreganj"]
  },
  {
    division: "Chattogram",
    districts: ["Chattogram", "Cox's Bazar", "Comilla", "Feni", "Brahmanbaria", "Rangamati", "Khagrachhari", "Bandarban", "Noakhali", "Lakshmipur", "Chandpur"]
  },
  {
    division: "Sylhet",
    districts: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"]
  },
  {
    division: "Rajshahi",
    districts: ["Rajshahi", "Bogura", "Pabna", "Naogaon", "Sirajganj", "Natore", "Joypurhat", "Chapainawabganj"]
  },
  {
    division: "Khulna",
    districts: ["Khulna", "Jashore", "Kushtia", "Satkhira", "Bagerhat", "Jhenaidah", "Magura", "Chuadanga", "Meherpur", "Narail"]
  },
  {
    division: "Barishal",
    districts: ["Barishal", "Patuakhali", "Bhola", "Pirojpur", "Barguna", "Jhalokati"]
  },
  {
    division: "Rangpur",
    districts: ["Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon"]
  },
  {
    division: "Mymensingh",
    districts: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"]
  }
];

// Helper to flat list of all district strings for easy lookup validation
const flatDistrictsList = BANGLADESH_DISTRICTS.reduce((acc, curr) => {
  return acc.concat(curr.districts);
}, [] as string[]);

/**
 * Public Info Endpoint: Get all divisions and districts of Bangladesh
 */
export const getDistricts = (req: Request, res: Response) => {
  return sendSuccess(res, "Retrieved all 64 districts under 8 divisions of Bangladesh successfully.", {
    divisions: BANGLADESH_DISTRICTS,
    flatList: flatDistrictsList
  });
};

/**
 * Public: Place order (Buy Now, Cart Checkout, or Wishlist Checkout)
 * No login required.
 */
export const checkoutOrder = async (req: Request, res: Response) => {
  const {
    checkoutInfo,
    paymentMethod,
    checkoutFrom, // "buynow" | "cart" | "wishlist"
    productId,    // For "buynow"
    quantity,     // For "buynow", default 1
    cartIds,      // For "cart"
    wishlistIds,  // For "wishlist"
    cartSessionId // To track and delete cart/wishlist details
  } = req.body;

  const sessionId = cartSessionId || req.headers["x-cart-session-id"] as string || "session_anonymous_guest";

  // Validate checkout info
  if (!checkoutInfo) {
    return sendValidationError(res, "Missing checkout information block", {
      checkoutInfo: "checkoutInfo object is required."
    });
  }

  const errors: Record<string, string> = {};
  const { userName, email, phone, address, city } = checkoutInfo;

  if (!userName || userName.trim() === "") errors.userName = "UserName field is mandatory.";
  if (!phone || phone.trim() === "") errors.phone = "Phone number is mandatory.";
  if (!address || address.trim() === "") errors.address = "Delivery address is mandatory.";
  if (!city || city.trim() === "") {
    errors.city = "City parameter is mandatory.";
  } else {
    // Validate city from Bangladesh districts list (case-insensitive check)
    const normalizedCity = city.trim().toLowerCase();
    const isValidDistrict = flatDistrictsList.some(d => d.toLowerCase() === normalizedCity);
    if (!isValidDistrict && !["inside dhaka", "outside dhaka"].includes(normalizedCity)) {
      errors.cityWarning = `Suggested City is not a recognized district of Bangladesh, but we accepted it for custom handling. Recognizable districts: ${flatDistrictsList.slice(0, 5).join(", ")}...`;
    }
  }

  // Validate payment selection
  const validPaymentMethods = ["COD", "bKash"];
  if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
    errors.paymentMethod = "Payment method selection is required ('COD' or 'bKash').";
  }

  const validCheckoutSources = ["buynow", "cart", "wishlist"];
  if (!checkoutFrom || !validCheckoutSources.includes(checkoutFrom)) {
    errors.checkoutFrom = "checkoutFrom parameter is required ('buynow', 'cart', or 'wishlist').";
  }

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, "Checkout validation failed", errors);
  }

  try {
    const purchasedItems: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      color: string;
      images: string[];
      subtotal: number;
    }> = [];

    let totalAmount = 0;

    // --- CASE A: Buy Now ---
    if (checkoutFrom === "buynow") {
      if (!productId) {
        return sendValidationError(res, "Missing details", { productId: "productId is required for Buy Now checkouts." });
      }
      const product = await productsCollection.findOne({ _id: productId });
      if (!product) {
        return sendError(res, "Product not found.", null, 404);
      }
      if (product.status === "stockout") {
        return sendError(res, "Item stock is depleted. Cannot complete order.", null, 400);
      }

      const orderQty = quantity ? Number(quantity) : 1;
      const subtotal = product.price * orderQty;
      totalAmount = subtotal;

      purchasedItems.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: orderQty,
        color: product.color || "",
        images: product.images || [],
        subtotal
      });
    }

    // --- CASE B: Cart Checkout ---
    else if (checkoutFrom === "cart") {
      if (!Array.isArray(cartIds) || cartIds.length === 0) {
        return sendValidationError(res, "Missing details", { cartIds: "cartIds array is required and must not be empty." });
      }

      // Fetch specific cart entries
      const sessionCart = await cartsCollection.find({ sessionId }).toArray();
      const filteredCart = sessionCart.filter(item => cartIds.includes(item._id.toString()));

      if (filteredCart.length === 0) {
        return sendError(res, "No matching items found in cart for this checkout session.", null, 400);
      }

      for (const cartItem of filteredCart) {
        const product = await productsCollection.findOne({ _id: cartItem.productId });
        if (product) {
          const subtotal = product.price * cartItem.quantity;
          totalAmount += subtotal;
          purchasedItems.push({
            productId: product._id.toString(),
            name: product.name,
            price: product.price,
            quantity: cartItem.quantity,
            color: product.color || "",
            images: product.images || [],
            subtotal
          });
        }
      }
    }

    // --- CASE C: Wishlist Checkout ---
    else if (checkoutFrom === "wishlist") {
      if (!Array.isArray(wishlistIds) || wishlistIds.length === 0) {
        return sendValidationError(res, "Missing details", { wishlistIds: "wishlistIds array is required and must not be empty." });
      }

      const sessionWish = await wishlistsCollection.find({ sessionId }).toArray();
      const filteredWish = sessionWish.filter(item => wishlistIds.includes(item._id.toString()));

      if (filteredWish.length === 0) {
        return sendError(res, "No matching items found in wishlist for this checkout session.", null, 400);
      }

      for (const wishItem of filteredWish) {
        const product = await productsCollection.findOne({ _id: wishItem.productId });
        if (product) {
          const subtotal = product.price * 1; // Default quantity 1 for wishlist checkouts
          totalAmount += subtotal;
          purchasedItems.push({
            productId: product._id.toString(),
            name: product.name,
            price: product.price,
            quantity: 1,
            color: product.color || "",
            images: product.images || [],
            subtotal
          });
        }
      }
    }

    if (purchasedItems.length === 0) {
      return sendError(res, "Cannot place empty order. Products could not be resolved from stock catalogue.", null, 400);
    }

    // Determine bKash Gateway structural status for client-side preparation
    let paymentGatewayStatus = "not_applicable";
    let bkashTransactionPayload = null;

    if (paymentMethod === "bKash") {
      paymentGatewayStatus = "initialized_pending";
      bkashTransactionPayload = {
        api_endpoints: {
          create_payment: "/api/payment/bkash/create",
          execute_payment: "/api/payment/bkash/execute",
          query_payment: "/api/payment/bkash/query"
        },
        merchant_account: "+8801700000000",
        amount: totalAmount,
        currency: "BDT",
        intent: "sale",
        instructions: "Prepare frontend to direct checkout frame to bKash gateway. In the final payment script, pass merchant_account and token parameters to realize execute execution."
      };
    }

    const orderId = `BK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder = {
      orderId,
      checkoutInfo: {
        userName: userName.trim(),
        email: email ? email.toLowerCase().trim() : "",
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim()
      },
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "unpaid" : "pending",
      paymentDetails: bkashTransactionPayload,
      orderedItems: purchasedItems,
      totalAmount,
      orderStatus: "pending", // unseen / pending / processing / shipped
      createdAt: new Date().toISOString()
    };

    const orderResult = await ordersCollection.insertOne(newOrder);

    // --- DECREMENT PRODUCT INVENTORY QUANTITY ---
    try {
      for (const item of purchasedItems) {
        const product = await productsCollection.findOne({ _id: item.productId });
        if (product) {
          const currentQty = typeof product.quantity === "number" ? product.quantity : 50;
          const orderedQty = item.quantity || 1;
          const updatedQty = Math.max(0, currentQty - orderedQty);
          await productsCollection.updateOne(
            { _id: item.productId },
            { 
              $set: { 
                quantity: updatedQty,
                status: updatedQty === 0 ? "stockout" : product.status 
              } 
            }
          );
        }
      }
    } catch (invError) {
      console.error("⚠️ Failed to update product quantity inventory after order checkout:", invError);
    }

    // --- POST ORDER HOUSEKEEPING ---
    // If successful, scrub cart/wishlist entries to satisfy checkout rules
    if (checkoutFrom === "cart") {
      await cartsCollection.deleteMany({
        sessionId,
        _id: { $or: cartIds.map((id: string) => ({ _id: id })) } as any
      });
    } else if (checkoutFrom === "wishlist") {
      await wishlistsCollection.deleteMany({
        sessionId,
        _id: { $or: wishlistIds.map((id: string) => ({ _id: id })) } as any
      });
    }

    return sendSuccess(res, "Order placed successfully!", {
      id: orderResult.insertedId,
      orderId,
      totalAmount,
      purchasedItemsCount: purchasedItems.length,
      paymentMethod,
      paymentGatewayStatus,
      paymentDetails: bkashTransactionPayload,
      order: newOrder
    }, 201);
  } catch (error) {
    return sendError(res, "Order checkout transaction failed.", error, 500);
  }
};

/**
 * Admin Only: Viewing all orders placed
 */
export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await ordersCollection.find().sort({ createdAt: -1 }).toArray();
    return sendSuccess(res, "Retrieved all customer orders.", orders);
  } catch (error) {
    return sendError(res, "Failed to retrieve orders database.", error, 500);
  }
};

// Helper to compile ordered timeline milestones
export const buildOrderWithTimeline = (order: any) => {
  const currentStatus = order.orderStatus || "pending";
  const createdAt = order.createdAt;
  const updatedAt = order.updatedAt || createdAt;

  const timeline = [
    {
      step: "placed",
      title: "Order Placed",
      description: "Your order has been received",
      isCompleted: true,
      timestamp: createdAt
    },
    {
      step: "confirmed",
      title: "Order Confirmed",
      description: "Your order has been confirmed and is being prepared",
      isCompleted: ["processing", "shipped", "delivered", "returned"].includes(currentStatus),
      timestamp: ["processing", "shipped", "delivered", "returned"].includes(currentStatus) ? updatedAt : null
    },
    {
      step: "shipped",
      title: "Shipped",
      description: "Your order is on the way",
      isCompleted: ["shipped", "delivered"].includes(currentStatus),
      timestamp: ["shipped", "delivered"].includes(currentStatus) ? updatedAt : null
    },
    {
      step: "delivered",
      title: "Delivered",
      description: "Your order has been delivered",
      isCompleted: currentStatus === "delivered",
      timestamp: currentStatus === "delivered" ? updatedAt : null
    }
  ];

  if (currentStatus === "cancelled") {
    timeline.push({
      step: "cancelled",
      title: "Cancelled",
      description: "Your order has been cancelled",
      isCompleted: true,
      timestamp: updatedAt
    });
  }

  if (currentStatus === "returned") {
    timeline.push({
      step: "returned",
      title: "Returned",
      description: "Your order has been returned",
      isCompleted: true,
      timestamp: updatedAt
    });
  }

  return {
    ...order,
    timeline
  };
};

/**
 * Admin/User: View specific order details by ID
 */
export const getOrderById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const order = await ordersCollection.findOne({ _id: id });
    if (!order) {
      // Try search by orderNumber string likewise
      const orderByNo = await ordersCollection.findOne({ orderId: id });
      if (!orderByNo) {
        return sendError(res, "Order with designated reference ID not found.", null, 404);
      }
      return sendSuccess(res, "Order details retrieved successfully.", buildOrderWithTimeline(orderByNo));
    }
    return sendSuccess(res, "Order details retrieved successfully.", buildOrderWithTimeline(order));
  } catch (error) {
    return sendError(res, "Failed to extract order definition.", error, 500);
  }
};

/**
 * Public Info: Track an order by its orderId or database _id
 */
export const trackOrder = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    let order = await ordersCollection.findOne({ _id: orderId });
    if (!order) {
      // Find case-insensitive or direct match on orderId
      order = await ordersCollection.findOne({ orderId: { $regex: new RegExp(`^${orderId.trim()}$`, "i") } });
    }

    if (!order) {
      return sendError(res, "Order with designated reference ID not found.", null, 404);
    }

    return sendSuccess(res, "Order tracking status retrieved successfully.", buildOrderWithTimeline(order));
  } catch (error) {
    return sendError(res, "Failed to track order details.", error, 500);
  }
};

/**
 * Admin Only: Update Order workflow status
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { orderStatus, paymentStatus } = req.body;

  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled", "returned"];
  const updatePayload: Record<string, any> = {};

  if (orderStatus) {
    if (!validStatuses.includes(orderStatus)) {
      return sendValidationError(res, "Invalid order status value.", {
        orderStatus: `Status must be one of: ${validStatuses.join(", ")}`
      });
    }
    updatePayload.orderStatus = orderStatus;
  }

  if (paymentStatus) {
    const validPaymentStatuses = ["unpaid", "pending", "paid", "refunded"];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return sendValidationError(res, "Invalid payment status value.", {
        paymentStatus: `Status must be one of: ${validPaymentStatuses.join(", ")}`
      });
    }
    updatePayload.paymentStatus = paymentStatus;
  }

  if (Object.keys(updatePayload).length === 0) {
    return sendValidationError(res, "No valid update field assigned.", {
      payloadStatus: "Please assign 'orderStatus' or 'paymentStatus' values."
    });
  }

  try {
    let order = await ordersCollection.findOne({ _id: id });
    let queryField: any = { _id: id };

    if (!order) {
      order = await ordersCollection.findOne({ orderId: id });
      if (order) {
        queryField = { _id: order._id };
      }
    }

    if (!order) {
      return sendError(res, "Order not found in record log.", null, 404);
    }

    await ordersCollection.updateOne(
      queryField,
      { $set: { ...updatePayload, updatedAt: new Date().toISOString() } }
    );

    return sendSuccess(res, "Order delivery metrics updated successfully.", {
      orderId: order.orderId,
      _id: order._id,
      ...updatePayload
    });
  } catch (error) {
    return sendError(res, "Failed to update order details status.", error, 500);
  }
};
