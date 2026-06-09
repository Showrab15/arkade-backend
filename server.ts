
// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import path from "path";

// import { connectToDatabase } from "./src/server/db.js";
// import authRoutes from "./src/server/routes/authRoutes.js";
// import newsletterRoutes from "./src/server/routes/newsletterRoutes.js";
// import contactRoutes from "./src/server/routes/contactRoutes.js";
// import productRoutes from "./src/server/routes/productRoutes.js";
// import cartRoutes from "./src/server/routes/cartRoutes.js";
// import wishlistRoutes from "./src/server/routes/wishlistRoutes.js";
// import orderRoutes from "./src/server/routes/orderRoutes.js";
// import locationRoutes from "./src/server/routes/locationRoutes.js";

// export async function createExpressApp() {
//   const app = express();

//   // Initialize Database native driver (bypasses crashes gracefully with fallback)
//   await connectToDatabase();

//   // Standard middleware
//   app.use(cors());
//   app.use(express.json());

//   // API Health Indicator
//   app.get("/api/health", (req, res) => {
//     res.json({
//       status: "healthy",
//       timestamp: new Date().toISOString(),
//       service: "E-commerce Backend Service",
//       database: process.env.MONGODB_URI ? "MongoDB Live Cloud" : "In-Memory Simulation Layer (Postman Ready!)"
//     });
//   });

  

//   // Mount Modular Backend Routes
//   app.use("/api/auth", authRoutes);
//   app.use("/api/newsletter", newsletterRoutes);
//   app.use("/api/contacts", contactRoutes);
//   app.use("/api/products", productRoutes);
//   app.use("/api/cart", cartRoutes);
//   app.use("/api/wishlist", wishlistRoutes);
//   app.use("/api/orders", orderRoutes);
// app.use("/api", locationRoutes);   // covers /api/divisions, /api/districts, /api/districts/:divisionId

//   // Global Express 404 handler for unmatched /api routes
//   app.use("/api/*", (req, res) => {
//     res.status(404).json({
//       success: false,
//       message: `API endpoint [${req.method}] ${req.baseUrl} was not found.`
//     });
//   });

//   // Integrate Vite dev middleware (for React preview in AI Studio)
//   if (process.env.NODE_ENV !== "production") {
//     console.log("⚡ Launching in Development Mode: Spawning Vite Asset Server...");
//     const { createServer: createViteServer } = await import("vite");
//     const vite = await createViteServer({
//       server: { middlewareMode: true },
//       appType: "spa"
//     });
//     app.use(vite.middlewares);
//   } else {
//     console.log("📦 Launching in Production Mode: Serving static assets from /dist...");
//     const distPath = path.join(process.cwd(), "dist");
//     app.use(express.static(distPath));
//     app.get("*", (req, res) => {
//       res.sendFile(path.join(distPath, "index.html"));
//     });
//   }

//   return app;
// }

// // Standalone mode entry point (Skip if we are running in a Serverless Environment like Vercel)
// if (!process.env.VERCEL) {
//   const PORT = 3000;
//   createExpressApp()
//     .then((app) => {
//       app.listen(PORT, "0.0.0.0", () => {
//         console.log(`🚀 Brand Backend server running exclusively on http://localhost:${PORT}`);
//         console.log(`📮 Postman test-ready endpoint maps running on http://localhost:${PORT}/api/*`);
//       });
//     })
//     .catch((err) => {
//       console.error("💀 Severe bootstrapping failure inside server.ts:", err);
//     });
// }
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import { connectToDatabase } from "./src/server/db.js";
import authRoutes from "./src/server/routes/authRoutes.js";
import newsletterRoutes from "./src/server/routes/newsletterRoutes.js";
import contactRoutes from "./src/server/routes/contactRoutes.js";
import productRoutes from "./src/server/routes/productRoutes.js";
import cartRoutes from "./src/server/routes/cartRoutes.js";
import wishlistRoutes from "./src/server/routes/wishlistRoutes.js";
import orderRoutes from "./src/server/routes/orderRoutes.js";
import locationRoutes from "./src/server/routes/locationRoutes.js";
import { BANGLADESH_DISTRICTS } from "./src/server/controllers/orderController.js";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3000/",
  "http://localhost:3001",
  "http://localhost:3001/",
  "https://weararkade.com",
  "https://weararkade.com/",
  "https://www.weararkade.com",
  "https://www.weararkade.com/",
  "https://strong-sundae-df6ece.netlify.app/",
  "https://strong-sundae-df6ece.netlify.app",
  "https://stunning-biscochitos-71c058.netlify.app/",
  "https://stunning-biscochitos-71c058.netlify.app"
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, server-to-server calls)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-cart-session-id", "x-wish-session-id"],
};

export async function createExpressApp() {
  const app = express();

  // Initialize Database native driver in the background to avoid blocking serverless boots/cold starts
  connectToDatabase().catch((err) => {
    console.error("⚠️ Background DB connection startup error:", err);
  });

  // Handle preflight OPTIONS requests before anything else
  app.options("*", cors(corsOptions));

  // Apply CORS and JSON parsing
  app.use(cors(corsOptions));
  app.use(express.json());

  // API Health Indicator
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "E-commerce Backend Service",
      database: process.env.MONGODB_URI ? "MongoDB Live Cloud" : "In-Memory Simulation Layer (Postman Ready!)"
    });
  });

  // Mount Modular Backend Routes
  app.use("/api", locationRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/newsletter", newsletterRoutes);
  app.use("/api/contacts", contactRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/orders", orderRoutes);

  // Global Express 404 handler for unmatched /api routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint [${req.method}] ${req.baseUrl} was not found.`
    });
  });

  // Integrate Vite dev middleware (for React preview in AI Studio)
  if (process.env.NODE_ENV !== "production") {
    console.log("⚡ Launching in Development Mode: Spawning Vite Asset Server...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Launching in Production Mode: Serving static assets from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

// Standalone mode entry point (Skip if we are running in a Serverless Environment like Vercel)
if (!process.env.VERCEL) {
  const PORT = 3000;
  createExpressApp()
    .then((app) => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Brand Backend server running exclusively on http://localhost:${PORT}`);
        console.log(`📮 Postman test-ready endpoint maps running on http://localhost:${PORT}/api/*`);
      });
    })
    .catch((err) => {
      console.error("💀 Severe bootstrapping failure inside server.ts:", err);
    });
}
