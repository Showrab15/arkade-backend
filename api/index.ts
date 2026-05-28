import { createExpressApp } from "../server.js";

// Keep a single instance warm across multiple serverless execution invokes
let cachedAppPromise: any = null;

export default async function handler(req: any, res: any) {
  if (!cachedAppPromise) {
    cachedAppPromise = createExpressApp();
  }
  try {
    const app = await cachedAppPromise;
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Function failure:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred inside the database/backend bootstrap flow.",
      error: err?.message || String(err)
    });
  }
}
