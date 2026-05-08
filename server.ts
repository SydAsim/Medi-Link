import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory storage for reports (replaces Firebase for demo stability)
let reports: any[] = [];

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
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

  app.use(express.json({ limit: '10mb' }));

  // AI Triage Endpoint
  app.post("/api/triage", async (req, res) => {
    const { text, language, nearestClinic, location, phoneNumber } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

    console.log(`[Triage] Processing request for language: ${language}`);

    try {
      const prompt = `Issue/Symptoms: ${text}
Language of response: ${language}
Nearest healthcare facility: ${nearestClinic}

Respond ONLY with a valid JSON object in this exact format:
{
  "urgencyLevel": "Low" | "Medium" | "High",
  "issueType": "Medical" | "Rescue" | "Shelter" | "Food" | "Other",
  "explanation": "One sentence in the user's language explaining the urgency level",
  "firstSteps": [
    "Step 1 in the user's language",
    "Step 2 in the user's language",
    "Go to ${nearestClinic} or nearest Sehat Card clinic"
  ],
  "translatedSummary": "Brief English summary of symptoms for dashboard",
  "language": "detected language code"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: "You are a disaster response triage assistant. Analyze the user's situation and categorize it. Respond ONLY with valid JSON." }] },
            generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
          })
        }
      );

      const data: any = await response.json();

      if (!response.ok) {
        console.error("[Triage] Google API Error:", JSON.stringify(data, null, 2));
        throw new Error(data.error?.message || "Google API Error");
      }

      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const triageData = JSON.parse(responseText);

      const newReport = {
        id: Math.random().toString(36).substring(2, 15),
        symptoms: text,
        ...triageData,
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        phoneNumber: phoneNumber || null,
        createdAt: new Date()
      };

      reports.unshift(newReport);
      res.json({ success: true, data: triageData, id: newReport.id });
    } catch (error: any) {
      console.error("[Triage] Error:", error.message);
      res.status(500).json({ success: false, error: error.message || "AI Triage failed" });
    }
  });

  // AI Transcription Endpoint
  app.post("/api/transcribe", async (req, res) => {
    const { audioBase64, mimeType, language } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

    console.log(`[Transcription] Received request. Type: ${mimeType}`);

    try {
      const cleanMimeType = (mimeType || "audio/webm").split(';')[0];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `Transcribe this ${language} speech into text accurately. Return ONLY the transcription, nothing else. If you hear nothing, return an empty string.` },
                { inlineData: { data: audioBase64, mimeType: cleanMimeType } }
              ]
            }]
          })
        }
      );

      const data: any = await response.json();

      if (!response.ok) {
        console.error("[Transcription] Google API Error:", JSON.stringify(data, null, 2));
        throw new Error(data.error?.message || "Google API Error");
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      console.log(`[Transcription] Success! Result: "${text}"`);
      res.json({ success: true, transcription: text });
    } catch (error: any) {
      console.error("[Transcription] Error:", error.message);
      res.status(500).json({ success: false, error: error.message || "Transcription failed" });
    }
  });

  // API Routes
  app.post("/api/reports", async (req, res) => {
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
      phoneNumber
    } = req.body;

    try {
      const newReport = {
        id: Math.random().toString(36).substring(2, 15),
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
        createdAt: new Date()
      };

      reports.unshift(newReport);
      res.json({ success: true, id: newReport.id });
    } catch (error) {
      console.error("In-memory persistence error:", error);
      res.status(500).json({ success: false, error: "Failed to save report" });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      res.json({ success: true, data: reports.slice(0, 50) });
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  app.post("/api/seed", async (req, res) => {
    try {
      if (reports.length < 5) {
        const sampleReports = [
          {
            id: "seed-1",
            symptoms: "Severe chest pain",
            translatedSummary: "Chest pain",
            urgencyLevel: "High",
            firstSteps: ["Rest", "Call 1122"],
            language: "en",
            latitude: 34.0151, longitude: 71.5249, locationName: "Peshawar",
            createdAt: new Date()
          }
        ];
        reports = [...sampleReports, ...reports];
        res.json({ success: true, message: `Seeded reports` });
      } else {
        res.json({ success: true, message: "Skipping seed" });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: "Seed failed" });
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
  });
}

startServer();


