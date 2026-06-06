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


  // ── Divisions ──────────────────────────────────────────
  const divisionsCol = db.collection("divisions");
  const divisionsCount = await divisionsCol.countDocuments({});

  if (divisionsCount === 0) {
    await divisionsCol.insertMany([
      { id: "1", name: "Chattagram",  bn_name: "চট্টগ্রাম",  url: "www.chittagongdiv.gov.bd" },
      { id: "2", name: "Rajshahi",    bn_name: "রাজশাহী",    url: "www.rajshahidiv.gov.bd"  },
      { id: "3", name: "Khulna",      bn_name: "খুলনা",      url: "www.khulnadiv.gov.bd"    },
      { id: "4", name: "Barishal",    bn_name: "বরিশাল",     url: "www.barisaldiv.gov.bd"   },
      { id: "5", name: "Sylhet",      bn_name: "সিলেট",      url: "www.sylhetdiv.gov.bd"    },
      { id: "6", name: "Dhaka",       bn_name: "ঢাকা",       url: "www.dhakadiv.gov.bd"     },
      { id: "7", name: "Rangpur",     bn_name: "রংপুর",      url: "www.rangpurdiv.gov.bd"   },
      { id: "8", name: "Mymensingh",  bn_name: "ময়মনসিংহ",  url: "www.mymensinghdiv.gov.bd"},
    ]);
    console.log("🗺️  8 divisions seeded.");
  } else {
    console.log("⏭️  Divisions already exist, skipping.");
  }

  // ── Districts ──────────────────────────────────────────
  const districtsCol = db.collection("districts");
  const districtsCount = await districtsCol.countDocuments({});

  if (districtsCount === 0) {
    await districtsCol.insertMany([
      // Chattagram — division_id: "1"
      { id: "1",  division_id: "1", name: "Comilla",        bn_name: "কুমিল্লা"       },
      { id: "2",  division_id: "1", name: "Feni",           bn_name: "ফেনী"           },
      { id: "3",  division_id: "1", name: "Brahmanbaria",   bn_name: "ব্রাহ্মণবাড়িয়া"},
      { id: "4",  division_id: "1", name: "Rangamati",      bn_name: "রাঙামাটি"       },
      { id: "5",  division_id: "1", name: "Noakhali",       bn_name: "নোয়াখালী"       },
      { id: "6",  division_id: "1", name: "Chandpur",       bn_name: "চাঁদপুর"        },
      { id: "7",  division_id: "1", name: "Lakshmipur",     bn_name: "লক্ষ্মীপুর"     },
      { id: "8",  division_id: "1", name: "Chattogram",     bn_name: "চট্টগ্রাম"      },
      { id: "9",  division_id: "1", name: "Khagrachhari",   bn_name: "খাগড়াছড়ি"     },
      { id: "10", division_id: "1", name: "Bandarban",      bn_name: "বান্দরবান"      },
      { id: "11", division_id: "1", name: "Cox's Bazar",    bn_name: "কক্সবাজার"      },
      // Rajshahi — division_id: "2"
      { id: "12", division_id: "2", name: "Bogura",         bn_name: "বগুড়া"          },
      { id: "13", division_id: "2", name: "Joypurhat",      bn_name: "জয়পুরহাট"      },
      { id: "14", division_id: "2", name: "Naogaon",        bn_name: "নওগাঁ"          },
      { id: "15", division_id: "2", name: "Natore",         bn_name: "নাটোর"          },
      { id: "16", division_id: "2", name: "Chapainawabganj",bn_name: "চাঁপাইনবাবগঞ্জ"},
      { id: "17", division_id: "2", name: "Pabna",          bn_name: "পাবনা"          },
      { id: "18", division_id: "2", name: "Rajshahi",       bn_name: "রাজশাহী"        },
      { id: "19", division_id: "2", name: "Sirajganj",      bn_name: "সিরাজগঞ্জ"      },
      // Khulna — division_id: "3"
      { id: "20", division_id: "3", name: "Bagerhat",       bn_name: "বাগেরহাট"       },
      { id: "21", division_id: "3", name: "Chuadanga",      bn_name: "চুয়াডাঙ্গা"     },
      { id: "22", division_id: "3", name: "Jashore",        bn_name: "যশোর"           },
      { id: "23", division_id: "3", name: "Jhenaidah",      bn_name: "ঝিনাইদহ"        },
      { id: "24", division_id: "3", name: "Khulna",         bn_name: "খুলনা"          },
      { id: "25", division_id: "3", name: "Kushtia",        bn_name: "কুষ্টিয়া"      },
      { id: "46", division_id: "3", name: "Magura",         bn_name: "মাগুরা"         },
      { id: "47", division_id: "3", name: "Meherpur",       bn_name: "মেহেরপুর"       },
      { id: "48", division_id: "3", name: "Narail",         bn_name: "নড়াইল"          },
      { id: "49", division_id: "3", name: "Satkhira",       bn_name: "সাতক্ষীরা"      },
      // Barishal — division_id: "4"
      { id: "26", division_id: "4", name: "Barguna",        bn_name: "বরগুনা"         },
      { id: "27", division_id: "4", name: "Barishal",       bn_name: "বরিশাল"         },
      { id: "28", division_id: "4", name: "Bhola",          bn_name: "ভোলা"           },
      { id: "29", division_id: "4", name: "Jhalokati",      bn_name: "ঝালকাঠি"        },
      { id: "30", division_id: "4", name: "Patuakhali",     bn_name: "পটুয়াখালী"     },
      { id: "31", division_id: "4", name: "Pirojpur",       bn_name: "পিরোজপুর"       },
      // Sylhet — division_id: "5"
      { id: "32", division_id: "5", name: "Habiganj",       bn_name: "হবিগঞ্জ"        },
      { id: "33", division_id: "5", name: "Moulvibazar",    bn_name: "মৌলভীবাজার"     },
      { id: "34", division_id: "5", name: "Sunamganj",      bn_name: "সুনামগঞ্জ"      },
      { id: "35", division_id: "5", name: "Sylhet",         bn_name: "সিলেট"          },
      // Dhaka — division_id: "6"
      { id: "36", division_id: "6", name: "Dhaka",          bn_name: "ঢাকা"           },
      { id: "37", division_id: "6", name: "Faridpur",       bn_name: "ফরিদপুর"        },
      { id: "38", division_id: "6", name: "Gazipur",        bn_name: "গাজীপুর"        },
      { id: "39", division_id: "6", name: "Gopalganj",      bn_name: "গোপালগঞ্জ"      },
      { id: "40", division_id: "6", name: "Kishoreganj",    bn_name: "কিশোরগঞ্জ"      },
      { id: "41", division_id: "6", name: "Madaripur",      bn_name: "মাদারীপুর"      },
      { id: "42", division_id: "6", name: "Manikganj",      bn_name: "মানিকগঞ্জ"      },
      { id: "43", division_id: "6", name: "Munshiganj",     bn_name: "মুন্সিগঞ্জ"     },
      { id: "44", division_id: "6", name: "Narayanganj",    bn_name: "নারায়ণগঞ্জ"    },
      { id: "45", division_id: "6", name: "Narsingdi",      bn_name: "নরসিংদী"        },
      { id: "50", division_id: "6", name: "Rajbari",        bn_name: "রাজবাড়ী"        },
      { id: "51", division_id: "6", name: "Shariatpur",     bn_name: "শরীয়তপুর"      },
      { id: "52", division_id: "6", name: "Tangail",        bn_name: "টাঙ্গাইল"       },
      // Rangpur — division_id: "7"
      { id: "53", division_id: "7", name: "Dinajpur",       bn_name: "দিনাজপুর"       },
      { id: "54", division_id: "7", name: "Gaibandha",      bn_name: "গাইবান্ধা"      },
      { id: "55", division_id: "7", name: "Kurigram",       bn_name: "কুড়িগ্রাম"     },
      { id: "56", division_id: "7", name: "Lalmonirhat",    bn_name: "লালমনিরহাট"     },
      { id: "57", division_id: "7", name: "Nilphamari",     bn_name: "নীলফামারী"      },
      { id: "58", division_id: "7", name: "Panchagarh",     bn_name: "পঞ্চগড়"         },
      { id: "59", division_id: "7", name: "Rangpur",        bn_name: "রংপুর"          },
      { id: "60", division_id: "7", name: "Thakurgaon",     bn_name: "ঠাকুরগাঁও"      },
      // Mymensingh — division_id: "8"
      { id: "61", division_id: "8", name: "Jamalpur",       bn_name: "জামালপুর"       },
      { id: "62", division_id: "8", name: "Mymensingh",     bn_name: "ময়মনসিংহ"       },
      { id: "63", division_id: "8", name: "Netrokona",      bn_name: "নেত্রকোনা"      },
      { id: "64", division_id: "8", name: "Sherpur",        bn_name: "শেরপুর"         },
    ]);
    console.log("📍 64 districts seeded.");
  } else {
    console.log("⏭️  Districts already exist, skipping.");
  }

  
  await client.close();
  console.log("🌱 Seeding complete!");
}

seed().catch(err => {
  console.error("💀 Seed failed:", err);
  process.exit(1);
});