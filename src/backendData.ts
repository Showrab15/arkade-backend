import { ApiRoute } from "./types.js";

export const API_ROUTES: ApiRoute[] = [
  // --- AUTH SYSTEM ---
  {
    id: "auth-register",
    module: "Auth",
    method: "POST",
    path: "/api/auth/register",
    description: "Register a new customer using email and password. Generates a 'user' role with 'isVerified: false'.",
    authRequired: false,
    requestBody: {
      email: "buyer@brand.com",
      password: "securePassword123",
      name: "Khaled Mahmud"
    },
    responseBody: {
      success: true,
      message: "User registered successfully! Please verify your email using Firebase (simulated) before logging in.",
      data: {
        userId: "60c72b2f9b1d8e23456789a3",
        email: "buyer@brand.com",
        role: "user",
        isVerified: false
      }
    }
  },
  {
    id: "auth-verify-simulation",
    module: "Auth",
    method: "POST",
    path: "/api/auth/verify-email",
    description: "Convenience simulation route for Postman / local testing. Manually toggles isVerified to 'true' for a given email address without needing frontend Firebase SDK flows.",
    authRequired: false,
    requestBody: {
      email: "buyer@brand.com"
    },
    responseBody: {
      success: true,
      message: "Simulated check successfully! Email [buyer@brand.com] is now marked as VERIFIED. You can now login.",
      data: {
        email: "buyer@brand.com",
        isVerified: true
      }
    }
  },
  {
    id: "auth-login",
    module: "Auth",
    method: "POST",
    path: "/api/auth/login",
    description: "Authenticates users via email and password. Will fail with action instructions if 'isVerified' is false.",
    authRequired: false,
    requestBody: {
      email: "buyer@brand.com",
      password: "securePassword123"
    },
    responseBody: {
      success: true,
      message: "Login successful",
      data: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        user: {
          id: "60c72b2f9b1d8e23456789a3",
          email: "buyer@brand.com",
          role: "user",
          name: "Khaled Mahmud"
        }
      }
    }
  },
  {
    id: "auth-google-login",
    module: "Auth",
    method: "POST",
    path: "/api/auth/google-login",
    description: "Social OAuth login bridge. Receives profile details from frontend authentication, registers or logs in directly, and marks 'isVerified: true' (no link clicks needed).",
    authRequired: false,
    requestBody: {
      email: "buyer-google@gmail.com",
      name: "Khaled Mahmud Sujon",
      image: "https://lh3.googleusercontent.com/a/AGNmyxY...",
      googleUid: "google-uid-string-xyz"
    },
    responseBody: {
      success: true,
      message: "Google Sign-in successful",
      data: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        user: {
          id: "60c72b2f9b1d8e23456789a4",
          email: "buyer-google@gmail.com",
          role: "user",
          name: "Khaled Mahmud Sujon",
          image: "https://lh3.googleusercontent.com/a/AGNmyxY..."
        }
      }
    }
  },
  {
    id: "auth-get-profile",
    module: "Auth",
    method: "GET",
    path: "/api/auth/profile",
    description: "Retrieve standard logged-in user's profile detail card, including role, validation, address, phone text and district.",
    authRequired: true,
    responseBody: {
      success: true,
      message: "User profile retrieved successfully.",
      data: {
        id: "60c72b2f9b1d8e23456789a3",
        email: "supto50showrab@gmail.com",
        name: "Holmes Colon",
        isVerified: true,
        role: "user",
        createdAt: "2026-05-29T19:54:15.315Z",
        firebaseUid: "umQL81rhi7RML2OO8NVJqsTOWKu2",
        image: "",
        phone: "01700000000",
        address: "123 Main Street, Dhaka",
        district: "Dhaka"
      }
    }
  },
  {
    id: "auth-update-profile",
    module: "Auth",
    method: "PUT",
    path: "/api/auth/profile",
    description: "Update the authenticated user's profile parameters. All params are optional.",
    authRequired: true,
    requestBody: {
      name: "Holmes Colon Updated",
      phone: "01712345678",
      address: "House 4, Road 12, Banani",
      district: "Dhaka"
    },
    responseBody: {
      success: true,
      message: "Profile updated successfully.",
      data: {
        id: "60c72b2f9b1d8e23456789a3",
        email: "supto50showrab@gmail.com",
        name: "Holmes Colon Updated",
        isVerified: true,
        role: "user",
        createdAt: "2026-05-29T19:54:15.315Z",
        firebaseUid: "umQL81rhi7RML2OO8NVJqsTOWKu2",
        image: "",
        phone: "01712345678",
        address: "House 4, Road 12, Banani",
        district: "Dhaka"
      }
    }
  },
  {
    id: "auth-get-users",
    module: "Auth",
    method: "GET",
    path: "/api/auth/users",
    description: "Retrieve all registered user accounts with profile details.",
    authRequired: true,
    adminOnly: true,
    responseBody: {
      success: true,
      message: "Retrieved all registered users successfully.",
      data: [
        {
          _id: "60c72b2f9b1d8e23456789a1",
          email: "admin@brand.com",
          name: "Super Admin",
          isVerified: true,
          role: "admin",
          createdAt: "2026-05-27T19:15:34Z"
        },
        {
          _id: "60c72b2f9b1d8e23456789a3",
          email: "buyer@brand.com",
          name: "Khaled Mahmud",
          isVerified: true,
          role: "user",
          createdAt: "2026-05-27T19:20:00Z"
        }
      ]
    }
  },
  {
    id: "auth-update-role",
    module: "Auth",
    method: "PATCH",
    path: "/api/auth/users/role/:id",
    description: "Elevate or demote any user's role. Allowed values: 'admin', 'user', 'moderator'.",
    authRequired: true,
    adminOnly: true,
    requestBody: {
      role: "moderator"
    },
    responseBody: {
      success: true,
      message: "User role updated to [moderator] successfully.",
      data: {
        userId: "60c72b2f9b1d8e23456789a3",
        email: "buyer@brand.com",
        role: "moderator"
      }
    }
  },
  {
    id: "auth-delete-user",
    module: "Auth",
    method: "DELETE",
    path: "/api/auth/users/:id",
    description: "Completely delete a user profile. Prevents self-destruction.",
    authRequired: true,
    adminOnly: true,
    responseBody: {
      success: true,
      message: "User account [buyer@brand.com] deleted successfully.",
      data: {
        userId: "60c72b2f9b1d8e23456789a3"
      }
    }
  },

  // --- NEWSLETTERS ---
  {
    id: "newsletter-subscribe",
    module: "Newsletter",
    method: "POST",
    path: "/api/newsletter/subscribe",
    description: "Add an email to the newsletter subscribers list. Simple string format validation. Login not required.",
    authRequired: false,
    requestBody: {
      email: "reader@yahoo.com"
    },
    responseBody: {
      success: true,
      message: "Successfully subscribed to our newsletter!",
      data: {
        email: "reader@yahoo.com",
        subscribedAt: "2026-05-27T19:20:00Z"
      }
    }
  },
  {
    id: "newsletter-get",
    module: "Newsletter",
    method: "GET",
    path: "/api/newsletter/subscribers",
    description: "Extract list of all subscribed emails. Array of objects returned.",
    authRequired: true,
    adminOnly: true,
    responseBody: {
      success: true,
      message: "Retrieved newsletter subscribers successfully.",
      data: [
        {
          _id: "60d00f7e4f3c7eab12345678",
          email: "reader@yahoo.com",
          subscribedAt: "2026-05-27T19:20:00Z"
        }
      ]
    }
  },

  // --- CONTACTS ---
  {
    id: "contact-submit",
    module: "Contact",
    method: "POST",
    path: "/api/contacts",
    description: "Submit customer inquiries from the website form. Starts with status: 'unseen'.",
    authRequired: false,
    requestBody: {
      name: "Sujon Shakib",
      email: "shakib@gmail.com",
      phone: "+8801712345678",
      subject: "Wholesale Inquiry",
      message: "Do you offer tailored custom corporate hoodie prints?"
    },
    responseBody: {
      success: true,
      message: "Contact message submitted successfully! We will get in touch soon.",
      data: {
        messageId: "60d00f7e4f3c7eab12345680",
        name: "Sujon Shakib",
        email: "shakib@gmail.com",
        phone: "+8801712345678",
        subject: "Wholesale Inquiry",
        message: "Do you offer tailored custom corporate hoodie prints?",
        status: "unseen",
        createdAt: "2026-05-27T19:20:00Z"
      }
    }
  },
  {
    id: "contact-get",
    module: "Contact",
    method: "GET",
    path: "/api/contacts",
    description: "Extract all support requests submitted.",
    authRequired: true,
    adminOnly: true,
    responseBody: {
      success: true,
      message: "Retrieved all contact inquiries.",
      data: [
        {
          _id: "60d00f7e4f3c7eab12345680",
          name: "Sujon Shakib",
          email: "shakib@gmail.com",
          phone: "+8801712345678",
          subject: "Wholesale Inquiry",
          message: "Do you offer tailored custom corporate hoodie prints?",
          status: "unseen",
          createdAt: "2026-05-27T19:20:00Z"
        }
      ]
    }
  },
  {
    id: "contact-patch",
    module: "Contact",
    method: "PATCH",
    path: "/api/contacts/:id",
    description: "Update message state indicator. Acceptable parameters: 'unseen', 'read', 'replied'.",
    authRequired: true,
    adminOnly: true,
    requestBody: {
      status: "replied"
    },
    responseBody: {
      success: true,
      message: "Support message status marked as [replied] successfully.",
      data: {
        messageId: "60d00f7e4f3c7eab12345680",
        status: "replied"
      }
    }
  },

  // --- PRODUCTS ---
  {
    id: "products-add",
    module: "Products",
    method: "POST",
    path: "/api/products",
    description: "Add a new product to inventory. Binds uploading admin ID and time automatically.",
    authRequired: true,
    adminOnly: true,
    requestBody: {
      productCode: "PROD-HOODIE-NAVY-02",
      name: "Midweight Cozy Pullover Hoodie",
      size: ["S", "M", "L", "XL"],
      description: "Comfortable fleece interior, lined drawstring hood, spacious kangaroo pocket. Custom knit.",
      price: 1850,
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"
      ],
      category: "Apparel",
      careInstructions: ["Machine wash cold speed", "Hang dry inside out"],
      color: "Navy Blue",
      status: "available"
    },
    responseBody: {
      success: true,
      message: "Product added to catalog successfully.",
      data: {
        productId: "60c72b2f9b1d8e23456789a8",
        productCode: "PROD-HOODIE-NAVY-02",
        name: "Midweight Cozy Pullover Hoodie",
        size: ["S", "M", "L", "XL"],
        description: "Comfortable fleece interior, lined drawstring hood, spacious kangaroo pocket. Custom knit.",
        price: 1850,
        images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"],
        category: "Apparel",
        careInstructions: ["Machine wash cold speed", "Hang dry inside out"],
        color: "Navy Blue",
        status: "available",
        uploaderAdmin: {
          id: "60c72b2f9b1d8e23456789a1",
          email: "admin@brand.com"
        },
        createdAt: "2026-05-27T19:20:00Z",
        updatedAt: "2026-05-27T19:20:00Z"
      }
    }
  },
  {
    id: "products-update",
    module: "Products",
    method: "PUT",
    path: "/api/products/:id",
    description: "Update fields of an active inventory item.",
    authRequired: true,
    adminOnly: true,
    requestBody: {
      price: 1950,
      status: "available"
    },
    responseBody: {
      success: true,
      message: "Product catalog entry updated successfully.",
      data: {
        _id: "60c72b2f9b1d8e23456789a8",
        productCode: "PROD-HOODIE-NAVY-02",
        name: "Midweight Cozy Pullover Hoodie",
        price: 1950,
        status: "available",
        updatedAt: "2026-05-27T19:20:30Z",
        lastEditorAdmin: {
          id: "60c72b2f9b1d8e23456789a1",
          email: "admin@brand.com"
        }
      }
    }
  },
  {
    id: "products-get-all",
    module: "Products",
    method: "GET",
    path: "/api/products",
    description: "Retrieve all products in the database. Supports endpoint parameters such as `?category=Apparel` or text query regex string searches `?query=hoodie`.",
    authRequired: false,
    responseBody: {
      success: true,
      message: "Retrieved products list successfully.",
      data: [
        {
          _id: "60c72b2f9b1d8e23456789a2",
          productCode: "PROD-COTTON-TEE-01",
          name: "Premium Cotton Crewneck Tee",
          size: ["M", "L", "XL"],
          price: 1250,
          color: "Classic Black",
          status: "available"
        }
      ]
    }
  },
  {
    id: "products-get-one",
    module: "Products",
    method: "GET",
    path: "/api/products/:id",
    description: "Extract extensive single product coordinates, resolving original uploader data and creation history.",
    authRequired: false,
    responseBody: {
      success: true,
      message: "Single product details retrieved successfully.",
      data: {
        _id: "60c72b2f9b1d8e23456789a2",
        productCode: "PROD-COTTON-TEE-01",
        name: "Premium Cotton Crewneck Tee",
        size: ["M", "L", "XL"],
        description: "Made from 100% long-staple Egyptian cotton.",
        price: 1250,
        images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"],
        category: "Apparel",
        careInstructions: ["Machine wash cold"],
        color: "Classic Black",
        status: "available",
        uploaderAdmin: {
          id: "60c72b2f9b1d8e23456789a1",
          email: "admin@brand.com"
        },
        createdAt: "2026-05-27T19:15:34Z"
      }
    }
  },

  // --- CART ---
  {
    id: "cart-add",
    module: "Cart",
    method: "POST",
    path: "/api/cart",
    description: "Add an item to the shopping cart. Default quantity is 1 unless explicitly assigned. Uses custom header 'x-cart-session-id' or body payload 'cartSessionId' to isolate anonymous guest sessions.",
    authRequired: false,
    requestBody: {
      productId: "60c72b2f9b1d8e23456789a2",
      quantity: 2,
      cartSessionId: "session_user_token_12345"
    },
    responseBody: {
      success: true,
      message: "Cart updated successfully.",
      data: {
        sessionId: "session_user_token_12345",
        productId: "60c72b2f9b1d8e23456789a2",
        quantity: 2
      }
    }
  },
  {
    id: "cart-get",
    module: "Cart",
    method: "GET",
    path: "/api/cart",
    description: "View compiled guest shopping cart. Automatically executes a join against the active Products DB. Generates line sub-sums, total quantities, and the Grand Total.",
    authRequired: false,
    responseBody: {
      success: true,
      message: "Cart details retrieved for session: session_user_token_12345",
      data: {
        cartSessionId: "session_user_token_12345",
        items: [
          {
            cartItemId: "60d11f7e4f3c7eab12341234",
            productId: "60c72b2f9b1d8e23456789a2",
            name: "Premium Cotton Crewneck Tee",
            productCode: "PROD-COTTON-TEE-01",
            price: 1250,
            color: "Classic Black",
            quantity: 2,
            subtotal: 2500
          }
        ],
        totalItems: 2,
        grandTotal: 2500
      }
    }
  },
  {
    id: "cart-delete",
    module: "Cart",
    method: "DELETE",
    path: "/api/cart/:productId",
    description: "Remove product completely from current session's shopping cart.",
    authRequired: false,
    responseBody: {
      success: true,
      message: "Product removed from cart successfully.",
      data: {
        productId: "60c72b2f9b1d8e23456789a2",
        sessionId: "session_user_token_12345"
      }
    }
  },

  // --- WISHLIST ---
  {
    id: "wishlist-add",
    module: "Wishlist",
    method: "POST",
    path: "/api/wishlist",
    description: "Bookmark a product to personal wishlist. Session-isolated.",
    authRequired: false,
    requestBody: {
      productId: "60c72b2f9b1d8e23456789a2",
      cartSessionId: "session_user_token_12345"
    },
    responseBody: {
      success: true,
      message: "Product added to wishlist successfully.",
      data: {
        sessionId: "session_user_token_12345",
        productId: "60c72b2f9b1d8e23456789a2"
      }
    }
  },
  {
    id: "wishlist-get",
    module: "Wishlist",
    method: "GET",
    path: "/api/wishlist",
    description: "View current session wishlist bookmark list with full metadata.",
    authRequired: false,
    responseBody: {
      success: true,
      message: "Wishlist items retrieved successfully.",
      data: {
        wishSessionId: "session_user_token_12345",
        items: [
          {
            wishlistId: "60d00f7e4f3c7eab12349999",
            _id: "60c72b2f9b1d8e23456789a2",
            name: "Premium Cotton Crewneck Tee",
            price: 1250,
            color: "Classic Black"
          }
        ]
      }
    }
  },
  {
    id: "wishlist-delete",
    module: "Wishlist",
    method: "DELETE",
    path: "/api/wishlist/:productId",
    description: "Remove bookmarked item from personal wishlist.",
    authRequired: false,
    responseBody: {
      success: true,
      message: "Product removed from wishlist successfully.",
      data: {
        productId: "60c72b2f9b1d8e23456789a2",
        sessionId: "session_user_token_12345"
      }
    }
  },

  // --- ORDERS / CHECKOUT ---
  {
    id: "orders-checkout",
    module: "Orders",
    method: "POST",
    path: "/api/orders/checkout",
    description: "Master checkout placement. Supports 'buynow' (single item card), 'cart' (consolidated checkout with subsequent cart clearance), and 'wishlist' origins. Includes bKash initialization payload for frontend client bridge preparation. Requires active user session token.",
    authRequired: true,
    requestBody: {
      checkoutInfo: {
        userName: "Khaled Mahmud",
        email: "supto50showrab@gmail.com",
        phone: "+8801700112233",
        address: "House 24, Road 4, Sector 12",
        city: "Dhaka"
      },
      paymentMethod: "bKash",
      checkoutFrom: "cart",
      cartIds: ["60d11f7e4f3c7eab12341234"],
      cartSessionId: "session_user_token_12345"
    },
    responseBody: {
      success: true,
      message: "Order placed successfully!",
      data: {
        id: "60d22f7e4f3c7eab12345699",
        orderId: "BK-1716837292120-412",
        totalAmount: 2500,
        purchasedItemsCount: 1,
        paymentMethod: "bKash",
        paymentGatewayStatus: "initialized_pending",
        paymentDetails: {
          api_endpoints: {
            create_payment: "/api/payment/bkash/create",
            execute_payment: "/api/payment/bkash/execute"
          },
          merchant_account: "+8801700000000",
          amount: 2500,
          currency: "BDT"
        }
      }
    }
  },
  {
    id: "orders-my-orders",
    module: "Orders",
    method: "GET",
    path: "/api/orders/my-orders",
    description: "Retrieve a custom customer array of all historic orders placed by the currently logged-in user under their account details.",
    authRequired: true,
    responseBody: {
      success: true,
      message: "Successfully retrieved your personal orders list.",
      data: [
        {
          _id: "60d22f7e4f3c7eab12345699",
          orderId: "BK-1716837292120-412",
          userId: "60c72b2f9b1d8e23456789a3",
          checkoutInfo: {
            userName: "Khaled Mahmud",
            email: "supto50showrab@gmail.com",
            phone: "+8801700112233",
            address: "House 24, Road 4, Sector 12",
            city: "Dhaka"
          },
          paymentMethod: "bKash",
          paymentStatus: "pending",
          totalAmount: 2500,
          orderStatus: "pending",
          createdAt: "2026-06-06T19:30:15Z"
        }
      ]
    }
  },
  {
    id: "orders-get-all",
    module: "Orders",
    method: "GET",
    path: "/api/orders",
    description: "Retrieve list of all custom invoice orders placed in database (Admin check).",
    authRequired: true,
    adminOnly: true,
    responseBody: {
      success: true,
      message: "Retrieved all customer orders.",
      data: [
        {
          _id: "60d22f7e4f3c7eab12345699",
          orderId: "BK-1716837292120-412",
          checkoutInfo: {
            userName: "Khaled Mahmud",
            phone: "+8801700112233",
            city: "Dhaka"
          },
          paymentMethod: "bKash",
          totalAmount: 2500,
          orderStatus: "pending"
        }
      ]
    }
  },
  {
    id: "orders-get-one",
    module: "Orders",
    method: "GET",
    path: "/api/orders/:id",
    description: "Get detailed status, product snapshots, and delivery properties regarding a specific order.",
    authRequired: false,
    responseBody: {
      success: true,
      message: "Order details retrieved successfully.",
      data: {
        _id: "60d22f7e4f3c7eab12345699",
        orderId: "BK-1716837292120-412",
        checkoutInfo: {
          userName: "Khaled Mahmud",
          address: "House 24, Road 4, Sector 12",
          city: "Dhaka"
        },
        paymentMethod: "bKash",
        orderedItems: [
          {
            productId: "60c72b2f9b1d8e23456789a2",
            name: "Premium Cotton Crewneck Tee",
            price: 1250,
            quantity: 2,
            colors: "Classic Black",
            subtotal: 2500
          }
        ],
        totalAmount: 2500,
        orderStatus: "pending"
      }
    }
  },
  {
    id: "orders-track-public",
    module: "Orders",
    method: "GET",
    path: "/api/orders/track/:orderId",
    description: "Public order tracking lookup. Does not require admin auth. Returns complete order properties accompanied by a compiled 'timeline' milestone array indicating stages like Placed, Confirmed, Shipped, Delivered, or Returned.",
    authRequired: false,
    responseBody: {
      success: true,
      message: "Order tracking status retrieved successfully.",
      data: {
        _id: "60d22f7e4f3c7eab12345699",
        orderId: "BK-1716837292120-412",
        checkoutInfo: {
          userName: "Khaled Mahmud",
          address: "House 24, Road 4, Sector 12",
          city: "Dhaka"
        },
        paymentMethod: "bKash",
        orderedItems: [
          {
            productId: "60c72b2f9b1d8e23456789a2",
            name: "Premium Cotton Crewneck Tee",
            price: 1250,
            quantity: 2,
            colors: "Classic Black",
            subtotal: 2500
          }
        ],
        totalAmount: 2500,
        orderStatus: "processing",
        timeline: [
          {
            step: "placed",
            title: "Order Placed",
            description: "Your order has been received",
            isCompleted: true,
            timestamp: "2026-05-27T19:15:34Z"
          },
          {
            step: "confirmed",
            title: "Order Confirmed",
            description: "Your order has been confirmed and is being prepared",
            isCompleted: true,
            timestamp: "2026-05-27T19:20:00Z"
          },
          {
            step: "shipped",
            title: "Shipped",
            description: "Your order is on the way",
            isCompleted: false,
            timestamp: null
          },
          {
            step: "delivered",
            title: "Delivered",
            description: "Your order has been delivered",
            isCompleted: false,
            timestamp: null
          }
        ]
      }
    }
  },
  {
    id: "orders-delivery-charge",
    module: "Orders",
    method: "GET",
    path: "/api/orders/delivery-charge",
    description: "Calculate delivery charge dynamically based on districtId, or district Name field. Returns 130 BDT for inside Dhaka and 70 BDT for outside Dhaka.",
    authRequired: false,
    responseBody: {
      success: true,
      deliveryCharge: 130,
      districtId: "26",
      divisionId: "3",
      message: "Delivery charge calculated successfully for Dhaka."
    }
  },

  // --- LOCATIONS ---
  {
    id: "divisions-list",
    module: "Districts",
    method: "GET",
    path: "/api/divisions",
    description: "Query all administrative divisions of Bangladesh loaded directly from DB. Standardised output payload format.",
    authRequired: false,
    responseBody: {
      success: true,
      data: [
        {
          id: "3",
          name: "Dhaka",
          bn_name: "ঢাকা",
          url: "www.dhakadiv.gov.bd"
        }
      ],
      message: "Successfully retrieved all divisions.",
      total: 8,
      timestamp: "2026-06-06T19:30:15Z"
    }
  },
  {
    id: "districts-list",
    module: "Districts",
    method: "GET",
    path: "/api/districts",
    description: "Query all 64 districts under 8 divisions of Bangladesh flatly formatted directly from MongoDB.",
    authRequired: false,
    responseBody: {
      success: true,
      data: [
        {
          id: "1",
          division_id: "3",
          name: "Dhaka",
          bn_name: "ঢাকা",
          lat: "23.7115253",
          lon: "90.4111451",
          url: "www.dhaka.gov.bd"
        }
      ],
      message: "Successfully retrieved all districts.",
      total: 64,
      timestamp: "2026-06-06T19:30:15Z"
    }
  },
  {
    id: "districts-by-division",
    module: "Districts",
    method: "GET",
    path: "/api/districts/:divisionId",
    description: "Retrieve list of all districts belonging to a specific administrative division ID.",
    authRequired: false,
    responseBody: {
      success: true,
      data: [
        {
          id: "1",
          division_id: "3",
          name: "Dhaka",
          bn_name: "ঢাকা",
          lat: "23.7115253",
          lon: "90.4111451",
          url: "www.dhaka.gov.bd"
        }
      ],
      message: "Successfully retrieved districts for division.",
      total: 13,
      timestamp: "2026-06-06T19:30:15Z"
    }
  }
];

// Helper to compile a legitimate Postman Collection v2.1.0 JSON representation
export const generatePostmanCollectionJson = (baseUrl: string): string => {
  const collection = {
    info: {
      name: "E-Commerce Brand Backend REST APIs",
      description: "Complete REST API workspace for a professional e-commerce brand backend supporting JWT auth, role management, cataloguing, carts, wishlists, and order execution.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    variable: [
      {
        key: "baseUrl",
        value: baseUrl || "http://localhost:3000",
        type: "string"
      },
      {
        key: "adminToken",
        value: "REPLACE_WITH_JWT_ADMIN_TOKEN_HERE",
        type: "string"
      },
      {
        key: "cartSessionId",
        value: "postman_automated_session_id_456",
        type: "string"
      }
    ],
    item: [
      {
        name: "0. Backend Setup & Info",
        item: [
          {
            name: "Get API Health",
            request: {
              method: "GET",
              header: [],
              url: {
                raw: "{{baseUrl}}/api/health",
                host: ["{{baseUrl}}"],
                path: ["api", "health"]
              },
              description: "Query service status and see whether MongoDB database connection is live or in-memory fallback is humming."
            }
          },
          {
            name: "Get Bangladesh Divisions List",
            request: {
              method: "GET",
              header: [],
              url: {
                raw: "{{baseUrl}}/api/divisions",
                host: ["{{baseUrl}}"],
                path: ["api", "divisions"]
              },
              description: "Retrieve list of all 8 administrative divisions of Bangladesh."
            }
          },
          {
            name: "Get Bangladesh Shipping Districts (All Flat)",
            request: {
              method: "GET",
              header: [],
              url: {
                raw: "{{baseUrl}}/api/districts",
                host: ["{{baseUrl}}"],
                path: ["api", "districts"]
              },
              description: "Retrieve a flat collection of all 64 districts in Bangladesh."
            }
          },
          {
            name: "Get Districts by Division ID",
            request: {
              method: "GET",
              header: [],
              url: {
                raw: "{{baseUrl}}/api/districts/:divisionId",
                host: ["{{baseUrl}}"],
                path: ["api", "districts", ":divisionId"],
                variable: [
                  {
                    key: "divisionId",
                    value: "3"
                  }
                ]
              },
              description: "Retrieve list of districts filtered under a specific division code (e.g. 3 for Dhaka)."
            }
          },
          {
            name: "Calculate Delivery Charge",
            request: {
              method: "GET",
              header: [],
              url: {
                raw: "{{baseUrl}}/api/orders/delivery-charge?district=Dhaka",
                host: ["{{baseUrl}}"],
                path: ["api", "orders", "delivery-charge"],
                query: [
                  {
                    key: "district",
                    value: "Dhaka"
                  }
                ]
              },
              description: "Query delivery cost calculated dynamically based on district or districtId parameter."
            }
          }
        ]
      },
      {
        name: "1. Authentication System",
        item: [
          {
            name: "Register User",
            request: {
              method: "POST",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "buyer@brand.com",
                  password: "securePassword123",
                  name: "Khaled Mahmud"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/auth/register",
                host: ["{{baseUrl}}"],
                path: ["api", "auth", "register"]
              }
            }
          },
          {
            name: "Automated Email Verify (Local Sandbox)",
            request: {
              method: "POST",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "buyer@brand.com"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/auth/verify-email",
                host: ["{{baseUrl}}"],
                path: ["api", "auth", "verify-email"]
              },
              description: "Postman convenience endpoint to manually bypass email confirmation loops and mark account as 'isVerified: true'."
            }
          },
          {
            name: "Login User",
            request: {
              method: "POST",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "buyer@brand.com",
                  password: "securePassword123"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/auth/login",
                host: ["{{baseUrl}}"],
                path: ["api", "auth", "login"]
              }
            }
          },
          {
            name: "Google Login Sync",
            request: {
              method: "POST",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "buyer-google@gmail.com",
                  name: "Khaled Google Sujon",
                  image: "https://lh3.googleusercontent.com/default",
                  googleUid: "auth-firebase-google-uid-0987"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/auth/google-login",
                host: ["{{baseUrl}}"],
                path: ["api", "auth", "google-login"]
              }
            }
          },
          {
            name: "[Admin] View All Users",
            request: {
              method: "GET",
              header: [
                {
                  key: "Authorization",
                  value: "Bearer {{adminToken}}"
                }
              ],
              url: {
                raw: "{{baseUrl}}/api/auth/users",
                host: ["{{baseUrl}}"],
                path: ["api", "auth", "users"]
              }
            }
          },
          {
            name: "[Admin] Update User Role",
            request: {
              method: "PATCH",
              header: [
                {
                  key: "Authorization",
                  value: "Bearer {{adminToken}}"
                },
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  role: "moderator"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/auth/users/role/:userId",
                host: ["{{baseUrl}}"],
                path: ["api", "auth", "users", "role", ":userId"],
                variable: [
                  {
                    key: "userId",
                    value: "REPLACE_WITH_USER_ID_HERE"
                  }
                ]
              }
            }
          },
          {
            name: "[Admin] Delete User",
            request: {
              method: "DELETE",
              header: [
                {
                  key: "Authorization",
                  value: "Bearer {{adminToken}}"
                }
              ],
              url: {
                raw: "{{baseUrl}}/api/auth/users/:userId",
                host: ["{{baseUrl}}"],
                path: ["api", "auth", "users", ":userId"],
                variable: [
                  {
                    key: "userId",
                    value: "REPLACE_WITH_USER_ID_HERE"
                  }
                ]
              }
            }
          }
        ]
      },
      {
        name: "2. Newsletter System",
        item: [
          {
            name: "Subscribe Newsletter",
            request: {
              method: "POST",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "reader@yahoo.com"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/newsletter/subscribe",
                host: ["{{baseUrl}}"],
                path: ["api", "newsletter", "subscribe"]
              }
            }
          },
          {
            name: "[Admin] Get Subscribers List",
            request: {
              method: "GET",
              header: [
                {
                  key: "Authorization",
                  value: "Bearer {{adminToken}}"
                }
              ],
              url: {
                raw: "{{baseUrl}}/api/newsletter/subscribers",
                host: ["{{baseUrl}}"],
                path: ["api", "newsletter", "subscribers"]
              }
            }
          }
        ]
      },
      {
        name: "3. Contact System",
        item: [
          {
            name: "Submit Support Forms",
            request: {
              method: "POST",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  name: "Sujon Shakib",
                  email: "shakib@gmail.com",
                  phone: "+8801712345678",
                  subject: "Wholesale Inquiry",
                  message: "Do you offer tailored custom corporate hoodie prints?"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/contacts",
                host: ["{{baseUrl}}"],
                path: ["api", "contacts"]
              }
            }
          },
          {
            name: "[Admin] Get Support Messages",
            request: {
              method: "GET",
              header: [
                {
                  key: "Authorization",
                  value: "Bearer {{adminToken}}"
                }
              ],
              url: {
                raw: "{{baseUrl}}/api/contacts",
                host: ["{{baseUrl}}"],
                path: ["api", "contacts"]
              }
            }
          },
          {
            name: "[Admin] Update Support Status",
            request: {
              method: "PATCH",
              header: [
                {
                  key: "Authorization",
                  value: "Bearer {{adminToken}}"
                },
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  status: "replied"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/contacts/:contactId",
                host: ["{{baseUrl}}"],
                path: ["api", "contacts", ":contactId"],
                variable: [
                  {
                    key: "contactId",
                    value: "REPLACE_WITH_CONTACT_MESSAGE_ID"
                  }
                ]
              }
            }
          }
        ]
      },
      {
        name: "4. Products Management System",
        item: [
          {
            name: "Get All Products",
            request: {
              method: "GET",
              header: [],
              url: {
                raw: "{{baseUrl}}/api/products?category=Apparel",
                host: ["{{baseUrl}}"],
                path: ["api", "products"],
                query: [
                  {
                    key: "category",
                    value: "Apparel"
                  }
                ]
              }
            }
          },
          {
            name: "Get Single Product By ID",
            request: {
              method: "GET",
              header: [],
              url: {
                raw: "{{baseUrl}}/api/products/:productId",
                host: ["{{baseUrl}}"],
                path: ["api", "products", ":productId"],
                variable: [
                  {
                    key: "productId",
                    value: "60c72b2f9b1d8e23456789a2"
                  }
                ]
              }
            }
          },
          {
            name: "[Admin] Add Product Card",
            request: {
              method: "POST",
              header: [
                {
                  key: "Authorization",
                  value: "Bearer {{adminToken}}"
                },
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  productCode: "PROD-HOODIE-NAVY-02",
                  name: "Midweight Cozy Pullover Hoodie",
                  size: ["S", "M", "L", "XL"],
                  description: "Comfortable fleece interior.",
                  price: 1850,
                  images: ["https://images.unsplash.com/photo-1556821840-03a63f95609a7?w=800"],
                  category: "Apparel",
                  careInstructions: ["Machine wash cold speed"],
                  color: "Navy Blue",
                  status: "available"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/products",
                host: ["{{baseUrl}}"],
                path: ["api", "products"]
              }
            }
          },
          {
            name: "[Admin] Update Product Details",
            request: {
              method: "PUT",
              header: [
                {
                  key: "Authorization",
                  value: "Bearer {{adminToken}}"
                },
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  price: 1950,
                  status: "available"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/products/:productId",
                host: ["{{baseUrl}}"],
                path: ["api", "products", ":productId"],
                variable: [
                  {
                    key: "productId",
                    value: "REPLACE_WITH_PRODUCT_ID_MAPPED"
                  }
                ]
              }
            }
          }
        ]
      },
      {
        name: "5. Cart System",
        item: [
          {
            name: "Add To Cart",
            request: {
              method: "POST",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                },
                {
                  key: "x-cart-session-id",
                  value: "{{cartSessionId}}"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  productId: "60c72b2f9b1d8e23456789a2",
                  quantity: 2
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/cart",
                host: ["{{baseUrl}}"],
                path: ["api", "cart"]
              }
            }
          },
          {
            name: "Get Cart State",
            request: {
              method: "GET",
              header: [
                {
                  key: "x-cart-session-id",
                  value: "{{cartSessionId}}"
                }
              ],
              url: {
                raw: "{{baseUrl}}/api/cart",
                host: ["{{baseUrl}}"],
                path: ["api", "cart"]
              }
            }
          },
          {
            name: "Remove Product From Cart",
            request: {
              method: "DELETE",
              header: [
                {
                  key: "x-cart-session-id",
                  value: "{{cartSessionId}}"
                }
              ],
              url: {
                raw: "{{baseUrl}}/api/cart/:productId",
                host: ["{{baseUrl}}"],
                path: ["api", "cart", ":productId"],
                variable: [
                  {
                    key: "productId",
                    value: "60c72b2f9b1d8e23456789a2"
                  }
                ]
              }
            }
          }
        ]
      },
      {
        name: "6. Wishlist System",
        item: [
          {
            name: "Add To Wishlist",
            request: {
              method: "POST",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                },
                {
                  key: "x-cart-session-id",
                  value: "{{cartSessionId}}"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  productId: "60c72b2f9b1d8e23456789a2"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/wishlist",
                host: ["{{baseUrl}}"],
                path: ["api", "wishlist"]
              }
            }
          },
          {
            name: "Get Wishlist Collection",
            request: {
              method: "GET",
              header: [
                {
                  key: "x-cart-session-id",
                  value: "{{cartSessionId}}"
                }
              ],
              url: {
                raw: "{{baseUrl}}/api/wishlist",
                host: ["{{baseUrl}}"],
                path: ["api", "wishlist"]
              }
            }
          },
          {
            name: "Remove Wishlist Item",
            request: {
              method: "DELETE",
              header: [
                {
                  key: "x-cart-session-id",
                  value: "{{cartSessionId}}"
                }
              ],
              url: {
                raw: "{{baseUrl}}/api/wishlist/:productId",
                host: ["{{baseUrl}}"],
                path: ["api", "wishlist", ":productId"],
                variable: [
                  {
                    key: "productId",
                    value: "60c72b2f9b1d8e23456789a2"
                  }
                ]
              }
            }
          }
        ]
      },
      {
        name: "7. Order System",
        item: [
          {
            name: "Checkout Cart items",
            request: {
              method: "POST",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                },
                {
                  key: "x-cart-session-id",
                  value: "{{cartSessionId}}"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  checkoutInfo: {
                    userName: "Khaled Mahmud Sujon",
                    email: "supto50showrab@gmail.com",
                    phone: "+8801700112233",
                    address: "Block B, Gulsan 2",
                    city: "Dhaka"
                  },
                  paymentMethod: "bKash",
                  checkoutFrom: "buynow",
                  productId: "60c72b2f9b1d8e23456789a2",
                  quantity: 1
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/orders/checkout",
                host: ["{{baseUrl}}"],
                path: ["api", "orders", "checkout"]
              }
            }
          },
          {
            name: "[Admin] View Customer Orders",
            request: {
              method: "GET",
              header: [
                {
                  key: "Authorization",
                  value: "Bearer {{adminToken}}"
                }
              ],
              url: {
                raw: "{{baseUrl}}/api/orders",
                host: ["{{baseUrl}}"],
                path: ["api", "orders"]
              }
            }
          },
          {
            name: "[Admin] Update Order Status",
            request: {
              method: "PATCH",
              header: [
                {
                  key: "Authorization",
                  value: "Bearer {{adminToken}}"
                },
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  orderStatus: "processing",
                  paymentStatus: "paid"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/api/orders/status/:orderId",
                host: ["{{baseUrl}}"],
                path: ["api", "orders", "status", ":orderId"],
                variable: [
                  {
                    key: "orderId",
                    value: "REPLACE_WITH_ORDER_OBJECT_ID_OR_NO"
                  }
                ]
              }
            }
          }
        ]
      }
    ]
  };

  return JSON.stringify(collection, null, 2);
};
