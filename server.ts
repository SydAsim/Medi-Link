import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import fs from "fs";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf8"));
const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

const MOCK_CLINICS = [
  {
    name: "Lady Reading Hospital",
    city: "Peshawar",
    latitude: 34.0151,
    longitude: 71.5249,
  },
  {
    name: "Mardan Medical Complex",
    city: "Mardan",
    latitude: 34.1986,
    longitude: 72.0404,
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post("/api/reports", async (req, res) => {
    console.log("Received report request. Body size approximates:", JSON.stringify(req.body).length);
    const { 
      symptoms, 
      translatedSummary, 
      urgencyLevel, 
      issueType,
      firstSteps, 
      language, 
      latitude, 
      longitude, 
      locationName,
      phoneNumber,
      imageUrl
    } = req.body;

    try {
      console.log("Attempting to save to Firestore...");
      const docRef = await addDoc(collection(db, "reports"), {
        symptoms,
        translatedSummary: translatedSummary || symptoms,
        urgencyLevel: urgencyLevel || "Medium",
        issueType: issueType || "Medical",
        firstSteps: firstSteps || [],
        language: language || "unknown",
        latitude: latitude || null,
        longitude: longitude || null,
        locationName: locationName || null,
        phoneNumber: phoneNumber || null,
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp()
      });
      console.log("Report saved successfully with ID:", docRef.id);
      res.json({ success: true, id: docRef.id });
    } catch (error) {
      console.error("Firestore persistence error details:", error);
      res.status(500).json({ success: false, error: "Failed to save report: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      res.json({ success: true, data: reports });
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  app.post("/api/seed", async (req, res) => {
    try {
      const reportsCollection = collection(db, "reports");
      const snapshot = await getDocs(query(reportsCollection, limit(10)));
      
      if (snapshot.size < 10) {
        const sampleReports = [
          {
            symptoms: "Severe chest pain and difficulty breathing",
            translatedSummary: "Severe chest pain and difficulty breathing",
            urgencyLevel: "High",
            firstSteps: ["Lie down and rest immediately", "Call emergency services", "Go to Lady Reading Hospital"],
            language: "en",
            latitude: 34.0151, longitude: 71.5249, locationName: "Peshawar",
            createdAt: serverTimestamp()
          },
          {
            symptoms: "سینے میں شدید درد اور سانس لینے میں تکلیف",
            translatedSummary: "Severe chest pain and respiratory distress in Urdu",
            urgencyLevel: "High",
            firstSteps: ["فوری طور پر لیٹ جائیں", "ایمرجنسی سروسز کو کال کریں", "لیڈی ریڈنگ ہسپتال جائیں"],
            language: "ur",
            latitude: 34.0500, longitude: 71.5800, locationName: "Peshawar South",
            createdAt: serverTimestamp()
          },
          {
            symptoms: "Mild fever and cough for two days",
            translatedSummary: "Mild fever and cough for two days",
            urgencyLevel: "Low",
            firstSteps: ["Drink plenty of fluids", "Rest at home", "Monitor temperature"],
            language: "en",
            latitude: 34.1986, longitude: 72.0404, locationName: "Mardan",
            createdAt: serverTimestamp()
          },
          {
            symptoms: "Persistent dizziness and nausea for 24 hours",
            translatedSummary: "Persistent dizziness and nausea for 24 hours",
            urgencyLevel: "Medium",
            firstSteps: ["Stay hydrated", "Avoid sudden movements", "Visit a general practitioner"],
            language: "en",
            latitude: 34.1500, longitude: 72.0000, locationName: "Mardan Suburbs",
            createdAt: serverTimestamp()
          },
          {
            symptoms: "Severe abdominal pain and vomiting",
            translatedSummary: "Severe abdominal pain and vomiting",
            urgencyLevel: "High",
            firstSteps: ["Do not eat or drink anything", "Seek urgent medical attention", "Go to Mardan Medical Complex"],
            language: "en",
            latitude: 34.2000, longitude: 72.0500, locationName: "Central Mardan",
            createdAt: serverTimestamp()
          },
          {
            symptoms: "سر میں شدید درد اور دھندلا پن",
            translatedSummary: "Severe headache and blurred vision in Urdu",
            urgencyLevel: "High",
            firstSteps: ["آرام کریں اور تیز روشنی سے پرہیز کریں", "اپنا بلڈ پریشر چیک کریں", "فوری ہسپتال جائیں"],
            language: "ur",
            latitude: 33.9500, longitude: 71.5000, locationName: "Jamrud",
            createdAt: serverTimestamp()
          },
          {
            symptoms: "Minor scrape on the knee that is red",
            translatedSummary: "Minor infected scrape on the knee",
            urgencyLevel: "Low",
            firstSteps: ["Clean with clean water", "Apply antiseptic if available", "Keep it covered and dry"],
            language: "en",
            latitude: 34.0000, longitude: 71.4500, locationName: "Peshawar West",
            createdAt: serverTimestamp()
          },
          {
            symptoms: "Back pain after lifting heavy weight",
            translatedSummary: "Acute back pain after lifting load",
            urgencyLevel: "Medium",
            firstSteps: ["Apply cold compress for 15 mins", "Rest on a firm surface", "Avoid further heavy lifting"],
            language: "en",
            latitude: 34.1000, longitude: 71.6000, locationName: "Nowshera",
            createdAt: serverTimestamp()
          },
          {
            symptoms: "کمر میں درد",
            translatedSummary: "Back pain in Urdu",
            urgencyLevel: "Low",
            firstSteps: ["آرام کریں", "گرم پٹی کا استعمال کریں", "درد کش دوا لیں"],
            language: "ur",
            latitude: 34.1200, longitude: 71.6500, locationName: "Nowshera City",
            createdAt: serverTimestamp()
          },
          {
            symptoms: "Child has high fever and skin rash",
            translatedSummary: "Pediatric high fever with rash",
            urgencyLevel: "High",
            firstSteps: ["Try to lower fever with lukewarm washcloth", "Do not give Aspirin", "Seek a pediatrician immediately"],
            language: "en",
            latitude: 34.2500, longitude: 71.8000, locationName: "Charsadda",
            createdAt: serverTimestamp()
          }
        ];

        for (const report of sampleReports) {
          await addDoc(reportsCollection, report);
        }
        res.json({ success: true, message: `Seeded ${sampleReports.length} reports` });
      } else {
        res.json({ success: true, message: "Collection already has sufficient data, skipping seed" });
      }
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ success: false, error: "Internal server error during seeding" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Auto-seed if needed
    try {
      const reportsCollection = collection(db, "reports");
      const snapshot = await getDocs(query(reportsCollection, limit(10)));
      if (snapshot.size < 10) {
        console.log("Seeding initial data...");
        // This is a bit redundant with the /api/seed endpoint but safe
        await fetch(`http://localhost:${PORT}/api/seed`, { method: "POST" });
      }
    } catch (e) {
      console.error("Auto-seed check failed:", e);
    }
  });
}

startServer();
