import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dns from "dns";
import dotenv from "dotenv";
dotenv.config();

async function seed() {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);

  const uri = process.env.MONGODB_URI!;
  const dbName = process.env.DB_NAME || "arkade";

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(dbName);

  console.log(`✅ Connected to "${dbName}"`);

  // ── Users ──────────────────────────────────────────────
  const usersCol = db.collection("users");
  const existingAdmin = await usersCol.findOne({ email: "admin@brand.com" });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await usersCol.insertOne({
      email: "admin@brand.com",
      password: hashedPassword,
      name: "Super Admin",
      isVerified: true,
      role: "admin",
      createdAt: new Date()
    });
    console.log("👤 Admin user seeded: admin@brand.com / admin123");
  } else {
    console.log("⏭️  Admin user already exists, skipping.");
  }

  // ── Products ───────────────────────────────────────────
  const productsCol = db.collection("products");
  const existingProduct = await productsCol.findOne({ productCode: "PROD-COTTON-TEE-01" });

  if (!existingProduct) {
    await productsCol.insertOne({
      productCode: "PROD-COTTON-TEE-01",
      name: "Premium Cotton Crewneck Tee",
      size: ["M", "L", "XL"],
      description: "Made from 100% long-staple Egyptian cotton. Preshrunk and incredibly comfortable.",
      price: 1250,
      images: [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800"
      ],
      category: "Apparel",
      careInstructions: ["Machine wash cold with like colors", "Tumble dry low", "Do not iron print"],
      color: "Classic Black",
      status: "available",
      quantity: 30,
      createdAt: new Date()
    });
    console.log("📦 Default product seeded.");
  } else {
    console.log("⏭️  Default product already exists, skipping.");
  }

  await client.close();
  console.log("🌱 Seeding complete!");
}

seed().catch(err => {
  console.error("💀 Seed failed:", err);
  process.exit(1);
});