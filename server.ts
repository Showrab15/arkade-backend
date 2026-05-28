// import express from "express";
// import cors from "cors";
// import path from "path";
// import { createServer as createViteServer } from "vite";
// import dotenv from "dotenv";
// dotenv.config();
// import { connectToDatabase } from "./src/server/db.js";
// import authRoutes from "./src/server/routes/authRoutes.js";
// import newsletterRoutes from "./src/server/routes/newsletterRoutes.js";
// import contactRoutes from "./src/server/routes/contactRoutes.js";
// import productRoutes from "./src/server/routes/productRoutes.js";
// import cartRoutes from "./src/server/routes/cartRoutes.js";
// import wishlistRoutes from "./src/server/routes/wishlistRoutes.js";
// import orderRoutes from "./src/server/routes/orderRoutes.js";
// import { BANGLADESH_DISTRICTS } from "./src/server/controllers/orderController.js";

// console.log(process.env.MONGODB_URI)
// async function startServer() {
//   const app = express();
//   const PORT = 3000;

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

//   // Flat Bangladesh districts list alias for simple, global root api query
//   app.get("/api/districts", (req, res) => {
//     const flatList = BANGLADESH_DISTRICTS.reduce((acc, curr) => acc.concat(curr.districts), [] as string[]);
//     res.json({
//       success: true,
//       message: "Retrieved all 64 districts of Bangladesh categorized by Division.",
//       data: {
//         divisions: BANGLADESH_DISTRICTS,
//         flatList
//       }
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

//   // Bind to Port 3000 (host must be 0.0.0.0 for ingress routing)
//   app.listen(PORT, "0.0.0.0", () => {
//     console.log(`🚀 Brand Backend server running exclusively on http://localhost:${PORT}`);
//     console.log(`📮 Postman test-ready endpoint maps running on http://localhost:${PORT}/api/*`);
//   });
// }

// startServer().catch(err => {
//   console.error("💀 Severe bootstrapping failure inside server.ts:", err);
// });




// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import path from "path";
// import { createServer as createViteServer } from "vite";

// import { connectToDatabase } from "./src/server/db.js";
// import authRoutes from "./src/server/routes/authRoutes.js";
// import newsletterRoutes from "./src/server/routes/newsletterRoutes.js";
// import contactRoutes from "./src/server/routes/contactRoutes.js";
// import productRoutes from "./src/server/routes/productRoutes.js";
// import cartRoutes from "./src/server/routes/cartRoutes.js";
// import wishlistRoutes from "./src/server/routes/wishlistRoutes.js";
// import orderRoutes from "./src/server/routes/orderRoutes.js";
// import { BANGLADESH_DISTRICTS } from "./src/server/controllers/orderController.js";

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

//   // Flat Bangladesh districts list alias for simple, global root api query
//   app.get("/api/districts", (req, res) => {
//     const flatList = BANGLADESH_DISTRICTS.reduce((acc, curr) => acc.concat(curr.districts), [] as string[]);
//     res.json({
//       success: true,
//       message: "Retrieved all 64 districts of Bangladesh categorized by Division.",
//       data: {
//         divisions: BANGLADESH_DISTRICTS,
//         flatList
//       }
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
import { BANGLADESH_DISTRICTS } from "./src/server/controllers/orderController.js";

export async function createExpressApp() {
  const app = express();

  // Initialize Database native driver (bypasses crashes gracefully with fallback)
  await connectToDatabase();

  // Standard middleware
  app.use(cors());
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

  // Flat Bangladesh districts list alias for simple, global root api query
  app.get("/api/districts", (req, res) => {
    const flatList = BANGLADESH_DISTRICTS.reduce((acc, curr) => acc.concat(curr.districts), [] as string[]);
    res.json({
      success: true,
      message: "Retrieved all 64 districts of Bangladesh categorized by Division.",
      data: {
        divisions: BANGLADESH_DISTRICTS,
        flatList
      }
    });
  });

  // Mount Modular Backend Routes
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
