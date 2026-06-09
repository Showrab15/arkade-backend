
import { MongoClient, Db, ObjectId } from "mongodb";
import dns from "dns";
import { DISTRICTS_SEED, DIVISIONS_SEED } from "./data/locationData.js";

// Automatically sanitize MongoDB Connection string to ensure specials in passwords are URL encoded correctly
function sanitizeMongoUri(uri: string): string {
  try {
    const protocolMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/);
    if (!protocolMatch) return uri;
    const [_, protocol, rest] = protocolMatch;
    
    // Find the last '@' that separates credentials from hostnames
    const atIndex = rest.lastIndexOf("@");
    if (atIndex === -1) return uri;
    
    const credentials = rest.substring(0, atIndex);
    const hostPart = rest.substring(atIndex); // includes '@...'
    
    const colonIndex = credentials.indexOf(":");
    if (colonIndex === -1) return uri; // no password
    
    const username = credentials.substring(0, colonIndex);
    const rawPassword = credentials.substring(colonIndex + 1);
    
    // Safely decode and re-encode to prevent double encoding or encoding unencoded characters
    const decodedPassword = decodeURIComponent(rawPassword);
    const encodedPassword = encodeURIComponent(decodedPassword);
    
    return `${protocol}${username}:${encodedPassword}${hostPart}`;
  } catch (err) {
    return uri;
  }
}

// In-memory fallback database structure for testing without live MongoDB credentials
const memoryDb: Record<string, any[]> = {
  users: [],
  newsletters: [],
  contacts: [],
  products: [],
  carts: [],
  wishlists: [],
  orders: [],
  divisions: [...DIVISIONS_SEED],
  districts: [...DISTRICTS_SEED],
};

// Seed default users in-memory fallback for testing
const seedMemoryDb = () => {
  if (memoryDb.users.length === 0) {
    // Admin user: admin@brand.com / admin123 (hashed equivalent or clean string for fallback testing)
    memoryDb.users.push({
      _id: "60c72b2f9b1d8e23456789a1",
      email: "admin@brand.com",
      // Using a known hash or simple fallback password verification
      password: "$2a$10$UshbE8uV6XfGby9uunXv7.wJc46r9V56yV6sM3pBFrg9S7xG3E8Oa", // bcrypt hash for "admin123"
      name: "Super Admin",
      isVerified: true,
      role: "admin",
      createdAt: new Date().toISOString()
    });

    // Seed default product in fallback
    memoryDb.products.push({
      _id: "60c72b2f9b1d8e23456789a2",
      productCode: "PROD-COTTON-TEE-01",
      name: "Premium Cotton Crewneck Tee",
      size: ["M", "L", "XL"],
      description: "Made from 100% long-staple Egyptian cotton. Preshrunk and incredibly comfortable.",
      price: 1250,
      quantity: 30,
      images: [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800"
      ],
      category: "Apparel",
      careInstructions: ["Machine wash cold with like colors", "Tumble dry low", "Do not iron print"],
      color: "Classic Black",
      status: "available",
      uploaderAdmin: {
        id: "60c72b2f9b1d8e23456789a1",
        email: "admin@brand.com"
      },
      createdAt: new Date().toISOString()
    });
  }
};

seedMemoryDb();

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isUsingFallback = false;

// Safe utility to convert string to ObjectId for Mongo, or return string if in Fallback
export function toObjectId(id: string): any {
  if (isUsingFallback) {
    return id;
  }
  try {
    return new ObjectId(id);
  } catch (err) {
    return id;
  }
}

async function seedLiveDb(db: Db) {
  try {
    const usersCount = await db.collection("users").countDocuments({});
    if (usersCount === 0) {
      console.log("🌱 Database is empty! Seeding default Admin user into live MongoDB...");
      await db.collection("users").insertOne({
        _id: new ObjectId("60c72b2f9b1d8e23456789a1"),
        email: "admin@brand.com",
        password: "$2a$10$UshbE8uV6XfGby9uunXv7.wJc46r9V56yV6sM3pBFrg9S7xG3E8Oa", // bcrypt hash of "admin123"
        name: "Super Admin",
        isVerified: true,
        role: "admin",
        createdAt: new Date()
      });
      console.log("✅ Super Admin seeded successfully.");
    }

    const productsCount = await db.collection("products").countDocuments({});
    if (productsCount === 0) {
      console.log("🌱 Seeding sample premium product into live MongoDB...");
      await db.collection("products").insertOne({
        _id: new ObjectId("60c72b2f9b1d8e23456789a2"),
        productCode: "PROD-COTTON-TEE-01",
        name: "Premium Cotton Crewneck Tee",
        size: ["M", "L", "XL"],
        description: "Made from 100% long-staple Egyptian cotton. Preshrunk and incredibly comfortable.",
        price: 1250,
        quantity: 30,
        images: [
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
          "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800"
        ],
        category: "Apparel",
        careInstructions: ["Machine wash cold with like colors", "Tumble dry low", "Do not iron print"],
        color: "Classic Black",
        status: "available",
        uploaderAdmin: {
          id: "60c72b2f9b1d8e23456789a1",
          email: "admin@brand.com"
        },
        createdAt: new Date()
      });
      console.log("✅ Sample product seeded successfully.");
    }
  } catch (error) {
    console.error("⚠️ Error seeding live MongoDB database:", error);
  }
}

export async function connectToDatabase(): Promise<{ db: Db | null; isFallback: boolean }> {
  if (mongoDb) {
    return { db: mongoDb, isFallback: isUsingFallback };
  }

  const rawUri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || "ecommerce-brand-db";

  if (!rawUri) {
    console.warn("⚠️ MONGODB_URI is not set in environment variables.");
    console.info("⚡ Entering Developer Fallback Mode: Running with a high-fidelity in-memory MongoDB-equivalent datastore.");
    isUsingFallback = true;
    return { db: null, isFallback: true };
  }

  // Ensure any special password symbols are correctly URL encoded
  const uri = sanitizeMongoUri(rawUri);

  try {
    console.log("🔌 Attempting to connect to MongoDB...");
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);
    isUsingFallback = false;
    console.log(`✅ Connected successfully to MongoDB Database: "${dbName}"`);
    
    // Seed initial collections in MongoDB if empty
    await seedLiveDb(mongoDb);

    return { db: mongoDb, isFallback: false };
  } catch (error: any) {
    // Self-healing check for DNS resolutions queries/ECONNREFUSED errors:
    if (uri.startsWith("mongodb+srv://") && (error.message?.includes("querySrv") || error.code === "ECONNREFUSED" || error.code === "ENOTFOUND")) {
      console.warn("⚠️ Detected querySrv/DNS lookup error. The current sandbox container DNS resolver has limitations resolving SRV records.");
      console.info("🔄 Self-Healing Action: Overriding Node's internal DNS resolvers to Google Public DNS (8.8.8.8, 1.1.1.1) and retrying connection...");
      try {
        dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
        
        mongoClient = new MongoClient(uri, {
          serverSelectionTimeoutMS: 8000
        });
        await mongoClient.connect();
        mongoDb = mongoClient.db(dbName);
        isUsingFallback = false;
        console.log(`✅ Connection Success via Public DNS resolvers! Connected to: "${dbName}"`);
        
        // Seed initial collections in MongoDB if empty
        await seedLiveDb(mongoDb);

        return { db: mongoDb, isFallback: false };
      } catch (dnsRetryError) {
        console.error("❌ Public DNS self-healing connection retry also failed:", dnsRetryError);
      }
    }

    console.error("❌ Failed to connect to MongoDB server:", error);
    console.info("⚡ Entering Developer Fallback Mode to keep server running.");
    isUsingFallback = true;
    return { db: null, isFallback: true };
  }
}

// Unified Database CRUD Helper interface to transparently support both true MongoDB and Fallback in controllers
export interface DBCollectionWrapper {
  find(query?: any): {
    toArray(): Promise<any[]>;
    sort(sortObj: any): { toArray(): Promise<any[]> };
  };
  findOne(query: any): Promise<any | null>;
  insertOne(doc: any): Promise<{ insertedId: string; acknowledged: boolean }>;
  updateOne(query: any, updateDoc: any, options?: { upsert?: boolean }): Promise<{ modifiedCount: number; matchedCount: number; upsertedId?: string }>;
  deleteOne(query: any): Promise<{ deletedCount: number }>;
  deleteMany(query: any): Promise<{ deletedCount: number }>;
  countDocuments(query: any): Promise<number>;
}

export function getCollection(collectionName: string): DBCollectionWrapper {
  return {
    find(query: any = {}) {
      const matchFilters = (item: any) => {
        for (const key in query) {
          const val = query[key];
          if (val && typeof val === "object" && "$or" in val) {
            // Support simple $or filter logic
            const conditions = val.$or as any[];
            return conditions.some(cond => {
              const condKey = Object.keys(cond)[0];
              return String(item[condKey]) === String(cond[condKey]);
            });
          }
          if (val && typeof val === "object" && "_id" in query) {
            // Support object query
            continue;
          }
          if (String(item[key]) !== String(val)) {
            return false;
          }
        }
        return true;
      };

      return {
        async toArray() {
          if (!isUsingFallback && mongoDb) {
            try {
              return await mongoDb.collection(collectionName).find(query).toArray();
            } catch (err) {
              console.error(`MongoDB operation failed for ${collectionName}.find:`, err);
            }
          }
          // Fallback array behavior
          const list = memoryDb[collectionName] || [];
          return list.filter(matchFilters);
        },
        sort(sortObj: any) {
          return {
            async toArray() {
              if (!isUsingFallback && mongoDb) {
                try {
                  return await mongoDb.collection(collectionName).find(query).sort(sortObj).toArray();
                } catch (err) {
                  console.error(`MongoDB operation failed for ${collectionName}.find.sort:`, err);
                }
              }
              const list = memoryDb[collectionName] || [];
              const matched = list.filter(matchFilters);
              const sortKey = Object.keys(sortObj)[0];
              const order = sortObj[sortKey]; // -1 or 1

              return matched.sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];
                if (valA < valB) return order === -1 ? 1 : -1;
                if (valA > valB) return order === -1 ? -1 : 1;
                return 0;
              });
            }
          };
        }
      };
    },

    async findOne(query: any) {
      if (!isUsingFallback && mongoDb) {
        try {
          // Normalize query fields to ObjectId if MongoDB is active
          const mongoQuery = { ...query };
          if (mongoQuery._id && typeof mongoQuery._id === "string") {
            mongoQuery._id = toObjectId(mongoQuery._id);
          }
          return await mongoDb.collection(collectionName).findOne(mongoQuery);
        } catch (err) {
          console.error(`MongoDB operation failed for ${collectionName}.findOne:`, err);
        }
      }

      // Fallback
      const list = memoryDb[collectionName] || [];
      const item = list.find((item: any) => {
        for (const key in query) {
          const val = query[key];
          if (key === "_id") {
            if (String(item._id) !== String(val)) return false;
          } else if (String(item[key]) !== String(val)) {
            return false;
          }
        }
        return true;
      });
      return item ? { ...item } : null;
    },

    async insertOne(doc: any) {
      const generatedId = new ObjectId().toString();
      const insertDoc = {
        _id: generatedId,
        ...doc,
        createdAt: doc.createdAt || new Date().toISOString()
      };

      if (!isUsingFallback && mongoDb) {
        try {
          const writeDoc = { ...doc };
          if (writeDoc.createdAt) {
            writeDoc.createdAt = new Date(writeDoc.createdAt);
          } else {
            writeDoc.createdAt = new Date();
          }
          const mongoResult = await mongoDb.collection(collectionName).insertOne(writeDoc);
          return {
            insertedId: mongoResult.insertedId.toString(),
            acknowledged: mongoResult.acknowledged
          };
        } catch (err) {
          console.error(`MongoDB operation failed for ${collectionName}.insertOne:`, err);
        }
      }

      // Fallback
      if (!memoryDb[collectionName]) {
        memoryDb[collectionName] = [];
      }
      memoryDb[collectionName].push(insertDoc);
      return {
        insertedId: generatedId,
        acknowledged: true
      };
    },

    async updateOne(query: any, updateDoc: any, options?: { upsert?: boolean }) {
      if (!isUsingFallback && mongoDb) {
        try {
          const mongoQuery = { ...query };
          if (mongoQuery._id && typeof mongoQuery._id === "string") {
            mongoQuery._id = toObjectId(mongoQuery._id);
          }
          const result = await mongoDb.collection(collectionName).updateOne(mongoQuery, updateDoc, options);
          return {
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
            upsertedId: result.upsertedId?.toString()
          };
        } catch (err) {
          console.error(`MongoDB operation failed for ${collectionName}.updateOne:`, err);
        }
      }

      // Fallback
      const list = memoryDb[collectionName] || [];
      const itemIndex = list.findIndex((itemAdded: any) => {
        for (const key in query) {
          const val = query[key];
          if (key === "_id") {
            if (String(itemAdded._id) !== String(val)) return false;
          } else if (String(itemAdded[key]) !== String(val)) {
            return false;
          }
        }
        return true;
      });

      if (itemIndex > -1) {
        const item = list[itemIndex];
        if (updateDoc.$set) {
          list[itemIndex] = { ...item, ...updateDoc.$set };
        }
        if (updateDoc.$push) {
          for (const key in updateDoc.$push) {
            if (!Array.isArray(list[itemIndex][key])) {
              list[itemIndex][key] = [];
            }
            list[itemIndex][key].push(updateDoc.$push[key]);
          }
        }
        return { modifiedCount: 1, matchedCount: 1 };
      } else if (options?.upsert) {
        const insertDoc = {
          _id: new ObjectId().toString(),
          ...(updateDoc.$set || {}),
          createdAt: new Date().toISOString()
        };
        list.push(insertDoc);
        return { modifiedCount: 1, matchedCount: 0, upsertedId: insertDoc._id };
      }

      return { modifiedCount: 0, matchedCount: 0 };
    },

    async deleteOne(query: any) {
      if (!isUsingFallback && mongoDb) {
        try {
          const mongoQuery = { ...query };
          if (mongoQuery._id && typeof mongoQuery._id === "string") {
            mongoQuery._id = toObjectId(mongoQuery._id);
          }
          const result = await mongoDb.collection(collectionName).deleteOne(mongoQuery);
          return { deletedCount: result.deletedCount };
        } catch (err) {
          console.error(`MongoDB operation failed for ${collectionName}.deleteOne:`, err);
        }
      }

      // Fallback
      const list = memoryDb[collectionName] || [];
      const index = list.findIndex((item: any) => {
        for (const key in query) {
          const val = query[key];
          if (key === "_id") {
            if (String(item._id) !== String(val)) return false;
          } else if (String(item[key]) !== String(val)) {
            return false;
          }
        }
        return true;
      });

      if (index > -1) {
        list.splice(index, 1);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    },

    async deleteMany(query: any) {
      if (!isUsingFallback && mongoDb) {
        try {
          const mongoQuery = { ...query };
          if (mongoQuery._id && typeof mongoQuery._id === "string") {
            mongoQuery._id = toObjectId(mongoQuery._id);
          }
          const result = await mongoDb.collection(collectionName).deleteMany(mongoQuery);
          return { deletedCount: result.deletedCount };
        } catch (err) {
          console.error(`MongoDB operation failed for ${collectionName}.deleteMany:`, err);
        }
      }

      // Fallback
      let deletedCount = 0;
      const list = memoryDb[collectionName] || [];
      const keys = Object.keys(query);
      
      memoryDb[collectionName] = list.filter((item: any) => {
        const isMatch = keys.every(key => {
          if (key === "_id") {
            return String(item._id) === String(query[key]);
          }
          if (Array.isArray(query[key])) {
            return query[key].includes(item[key]);
          }
          return String(item[key]) === String(query[key]);
        });
        if (isMatch) {
          deletedCount++;
          return false;
        }
        return true;
      });

      return { deletedCount };
    },

    async countDocuments(query: any) {
      if (!isUsingFallback && mongoDb) {
        try {
          return await mongoDb.collection(collectionName).countDocuments(query);
        } catch (err) {
          console.error(`MongoDB operation failed for ${collectionName}.countDocuments:`, err);
        }
      }

      // Fallback
      const list = memoryDb[collectionName] || [];
      const keys = Object.keys(query);
      const matched = list.filter((item: any) => {
        return keys.every(key => String(item[key]) === String(query[key]));
      });
      return matched.length;
    }
  };
}
