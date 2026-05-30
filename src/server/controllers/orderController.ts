


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
    checkoutFrom,
    productId,
    quantity,
    cartIds,
    wishlistIds,
    cartSessionId,
  } = req.body;

  const sessionId =
    cartSessionId ||
    (req.headers["x-cart-session-id"] as string) ||
    "session_anonymous_guest";

  if (!checkoutInfo) {
    return sendValidationError(res, "Missing checkout information block", {
      checkoutInfo: "checkoutInfo object is required.",
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
    const normalizedCity = city.trim().toLowerCase();
    const isValidDistrict = flatDistrictsList.some(
      (d) => d.toLowerCase() === normalizedCity
    );
    if (
      !isValidDistrict &&
      !["inside dhaka", "outside dhaka"].includes(normalizedCity)
    ) {
      errors.cityWarning = `City not a recognised BD district but accepted. Charge applied as outside Dhaka.`;
    }
  }

  const validPaymentMethods = ["COD", "bKash"];
  if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
    errors.paymentMethod = "Payment method must be 'COD' or 'bKash'.";
  }

  const validCheckoutSources = ["buynow", "cart", "wishlist"];
  if (!checkoutFrom || !validCheckoutSources.includes(checkoutFrom)) {
    errors.checkoutFrom = "checkoutFrom must be 'buynow', 'cart', or 'wishlist'.";
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

    let itemsTotal = 0;

    // ── CASE A: Buy Now ────────────────────────────────────────────────────
    if (checkoutFrom === "buynow") {
      if (!productId) {
        return sendValidationError(res, "Missing details", {
          productId: "productId is required for Buy Now.",
        });
      }
      const product = await productsCollection.findOne({ _id: productId });
      if (!product) return sendError(res, "Product not found.", null, 404);
      if (product.status === "stockout")
        return sendError(res, "Item is out of stock.", null, 400);

      const orderQty = quantity ? Number(quantity) : 1;
      const subtotal = product.price * orderQty;
      itemsTotal = subtotal;
      purchasedItems.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: orderQty,
        color: product.color || "",
        images: product.images || [],
        subtotal,
      });
    }

    // ── CASE B: Cart ───────────────────────────────────────────────────────
    else if (checkoutFrom === "cart") {
      if (!Array.isArray(cartIds) || cartIds.length === 0) {
        return sendValidationError(res, "Missing details", {
          cartIds: "cartIds array is required.",
        });
      }
      const sessionCart = await cartsCollection.find({ sessionId }).toArray();
      const filteredCart = sessionCart.filter((item) =>
        cartIds.includes(item._id.toString())
      );
      if (filteredCart.length === 0)
        return sendError(res, "No matching cart items found.", null, 400);

      for (const cartItem of filteredCart) {
        const product = await productsCollection.findOne({ _id: cartItem.productId });
        if (product) {
          const subtotal = product.price * cartItem.quantity;
          itemsTotal += subtotal;
          purchasedItems.push({
            productId: product._id.toString(),
            name: product.name,
            price: product.price,
            quantity: cartItem.quantity,
            color: product.color || "",
            images: product.images || [],
            subtotal,
          });
        }
      }
    }

    // ── CASE C: Wishlist ───────────────────────────────────────────────────
    else if (checkoutFrom === "wishlist") {
      if (!Array.isArray(wishlistIds) || wishlistIds.length === 0) {
        return sendValidationError(res, "Missing details", {
          wishlistIds: "wishlistIds array is required.",
        });
      }
      const sessionWish = await wishlistsCollection.find({ sessionId }).toArray();
      const filteredWish = sessionWish.filter((item) =>
        wishlistIds.includes(item._id.toString())
      );
      if (filteredWish.length === 0)
        return sendError(res, "No matching wishlist items found.", null, 400);

      for (const wishItem of filteredWish) {
        const product = await productsCollection.findOne({ _id: wishItem.productId });
        if (product) {
          const subtotal = product.price;
          itemsTotal += subtotal;
          purchasedItems.push({
            productId: product._id.toString(),
            name: product.name,
            price: product.price,
            quantity: 1,
            color: product.color || "",
            images: product.images || [],
            subtotal,
          });
        }
      }
    }

    if (purchasedItems.length === 0) {
      return sendError(res, "Cannot place empty order.", null, 400);
    }

    // ── DELIVERY CHARGE ────────────────────────────────────────────────────
    const deliveryCharge = getDeliveryCharge(city);
    const deliveryZone =
      deliveryCharge === DELIVERY_CHARGES.INSIDE_DHAKA
        ? "inside_dhaka"
        : "outside_dhaka";
    const totalAmount = itemsTotal + deliveryCharge;

    // ── BKASH PAYLOAD ──────────────────────────────────────────────────────
    let paymentGatewayStatus = "not_applicable";
    let bkashTransactionPayload = null;

    if (paymentMethod === "bKash") {
      paymentGatewayStatus = "initialized_pending";
      bkashTransactionPayload = {
        api_endpoints: {
          create_payment: "/api/payment/bkash/create",
          execute_payment: "/api/payment/bkash/execute",
          query_payment: "/api/payment/bkash/query",
        },
        merchant_account: "+8801700000000",
        amount: totalAmount,
        currency: "BDT",
        intent: "sale",
        instructions:
          "Prepare frontend to direct checkout frame to bKash gateway.",
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
        city: city.trim(),
      },
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "unpaid" : "pending",
      paymentDetails: bkashTransactionPayload,
      orderedItems: purchasedItems,
      itemsTotal,          // subtotal before delivery
      deliveryCharge,      // ← NEW
      deliveryZone,        // ← NEW  "inside_dhaka" | "outside_dhaka"
      totalAmount,         // itemsTotal + deliveryCharge
      orderStatus: "pending",
      createdAt: new Date().toISOString(),
    };

    const orderResult = await ordersCollection.insertOne(newOrder);

    // Decrement inventory
    try {
      for (const item of purchasedItems) {
        const product = await productsCollection.findOne({ _id: item.productId });
        if (product) {
          const currentQty =
            typeof product.quantity === "number" ? product.quantity : 50;
          const updatedQty = Math.max(0, currentQty - (item.quantity || 1));
          await productsCollection.updateOne(
            { _id: item.productId },
            {
              $set: {
                quantity: updatedQty,
                status: updatedQty === 0 ? "stockout" : product.status,
              },
            }
          );
        }
      }
    } catch (invError) {
      console.error("Failed to decrement inventory:", invError);
    }

    // Housekeeping
    if (checkoutFrom === "cart") {
      await cartsCollection.deleteMany({
        sessionId,
        _id: { $or: cartIds.map((id: string) => ({ _id: id })) } as any,
      });
    } else if (checkoutFrom === "wishlist") {
      await wishlistsCollection.deleteMany({
        sessionId,
        _id: { $or: wishlistIds.map((id: string) => ({ _id: id })) } as any,
      });
    }

    return sendSuccess(
      res,
      "Order placed successfully!",
      {
        id: orderResult.insertedId,
        orderId,
        itemsTotal,
        deliveryCharge,
        deliveryZone,
        totalAmount,
        purchasedItemsCount: purchasedItems.length,
        paymentMethod,
        paymentGatewayStatus,
        paymentDetails: bkashTransactionPayload,
        order: newOrder,
      },
      201
    );
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

  const validStatuses = ["confirmed", "pending", "processing", "shipped", "delivered", "cancelled", "returned"];
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

// ─────────────────────────────────────────────────────────────────────────────
// ADD THESE TO YOUR EXISTING orderController.ts
// ─────────────────────────────────────────────────────────────────────────────

// 1. DELIVERY CHARGE CONSTANTS  ─────────────────────────────────────────────
//    Add near the top of the file, alongside BANGLADESH_DISTRICTS

export const DELIVERY_CHARGES = {
  INSIDE_DHAKA: 70,
  OUTSIDE_DHAKA: 130,
} as const;

// Districts that count as "inside Dhaka" for delivery pricing
const DHAKA_DIVISION_DISTRICTS = [
  "dhaka", "gazipur", "narayanganj", "tangail", "faridpur",
  "manikganj", "munshiganj", "narsingdi", "gopalganj",
  "madaripur", "rajbari", "shariatpur", "kishoreganj",
];

/**
 * Returns the delivery charge for a given city string.
 * Exported so the frontend can call GET /orders/delivery-charge?city=Dhaka
 */
export function getDeliveryCharge(city: string): number {
  const normalized = city?.trim().toLowerCase() ?? "";
  // Explicit override strings
  if (normalized === "inside dhaka") return DELIVERY_CHARGES.INSIDE_DHAKA;
  if (normalized === "outside dhaka") return DELIVERY_CHARGES.OUTSIDE_DHAKA;
  return DHAKA_DIVISION_DISTRICTS.includes(normalized)
    ? DELIVERY_CHARGES.INSIDE_DHAKA
    : DELIVERY_CHARGES.OUTSIDE_DHAKA;
}


// 2. DELIVERY CHARGE ENDPOINT  ──────────────────────────────────────────────
//    GET /api/orders/delivery-charge?city=Dhaka
//    Frontend calls this during checkout to show the charge before placing order.

export const getDeliveryChargeEndpoint = (req: Request, res: Response) => {
  const { city } = req.query as { city?: string };
  if (!city || city.trim() === "") {
    return sendValidationError(res, "City is required to calculate delivery charge.", {
      city: "Provide ?city=Dhaka in the query string.",
    });
  }
  const charge = getDeliveryCharge(city);
  return sendSuccess(res, "Delivery charge calculated.", {
    city: city.trim(),
    deliveryCharge: charge,
    currency: "BDT",
    zone: charge === DELIVERY_CHARGES.INSIDE_DHAKA ? "inside_dhaka" : "outside_dhaka",
  });
};


// 3. UPDATED checkoutOrder  ─────────────────────────────────────────────────
//    Replace your existing checkoutOrder with this version.
//    Key changes:
//      • Calculates deliveryCharge from city and adds it to totalAmount
//      • Stores deliveryCharge + deliveryZone on the order document
//      • Everything else is identical to your current implementation




// 4. CUSTOMER CANCEL ORDER  ─────────────────────────────────────────────────
//    POST /api/orders/cancel/:orderId  (public — no auth, uses orderId string)
//    Rules:
//      • Only "pending" orders can be cancelled by the customer
//      • "processing", "shipped", "delivered" cannot be self-cancelled
//      • Stores cancellationReason and cancelledBy: "customer"

export const cancelOrderByCustomer = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { reason } = req.body; // optional cancellation reason from customer

  if (!orderId || orderId.trim() === "") {
    return sendValidationError(res, "Order ID is required.", {
      orderId: "Provide the orderId in the URL.",
    });
  }

  try {
    // Find by orderId string (what customer has) or _id
    let order = await ordersCollection.findOne({ orderId: orderId.trim() });
    if (!order) {
      order = await ordersCollection.findOne({ _id: orderId });
    }

    if (!order) {
      return sendError(res, "Order not found.", null, 404);
    }

    // Guard: only pending orders can be customer-cancelled
    if (order.orderStatus !== "pending") {
      const friendlyStatus =
        order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1);
      return sendError(
        res,
        `Cannot cancel this order. Current status is "${friendlyStatus}". Only pending orders can be cancelled.`,
        { currentStatus: order.orderStatus },
        400
      );
    }

    const now = new Date().toISOString();

    await ordersCollection.updateOne(
      { _id: order._id },
      {
        $set: {
          orderStatus: "cancelled",
          cancelledBy: "customer",
          cancellationReason: reason?.trim() || "Cancelled by customer",
          cancelledAt: now,
          updatedAt: now,
        },
      }
    );

    // Restore inventory quantities
    try {
      for (const item of order.orderedItems || []) {
        const product = await productsCollection.findOne({ _id: item.productId });
        if (product) {
          const restoredQty = (product.quantity || 0) + (item.quantity || 1);
          await productsCollection.updateOne(
            { _id: item.productId },
            {
              $set: {
                quantity: restoredQty,
                // Re-mark available if it was stockout due to this order
                status: restoredQty > 0 ? "available" : product.status,
              },
            }
          );
        }
      }
    } catch (invError) {
      console.error("Failed to restore inventory after cancel:", invError);
    }

    return sendSuccess(res, "Order cancelled successfully.", {
      orderId: order.orderId,
      _id: order._id,
      orderStatus: "cancelled",
      cancelledBy: "customer",
      cancellationReason: reason?.trim() || "Cancelled by customer",
      cancelledAt: now,
    });
  } catch (error) {
    return sendError(res, "Failed to cancel order.", error, 500);
  }
};