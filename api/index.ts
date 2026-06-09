// @ts-ignore
import * as serverCjs from "../dist/server.cjs";

// Support both ESM named imports and CJS default/destructured exports seamlessly
const createExpressApp = (serverCjs as any).createExpressApp || (serverCjs as any).default?.createExpressApp || (serverCjs as any).default;

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
