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
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper to sanitize AI JSON responses
  const sanitizeJSON = (text: string) => {
    return text.replace(/```json/g, "").replace(/```/g, "").trim();
  };

  // Unified Process Audio Endpoint (Transcription + Triage + Save)
  app.post("/api/process-audio", async (req, res) => {
    const { audioBase64, mimeType, language, nearestClinic, location, phoneNumber } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
    
    console.log(`[ProcessAudio] Received voice request (${language})`);

    try {
      // 1. Transcribe
      const cleanMimeType = (mimeType || "audio/webm").split(';')[0];
      const transResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `Transcribe this ${language} speech accurately. Return ONLY text.` },
                { inlineData: { data: audioBase64, mimeType: cleanMimeType } }
              ]
            }]
          })
        }
      );
      const transData: any = await transResponse.json();
      const transcription = transData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      if (!transcription || transcription.length < 2) {
        throw new Error("Could not understand the audio.");
      }

      console.log(`[ProcessAudio] Transcribed: "${transcription}"`);

      // 2. Triage
      const triagePrompt = `Issue/Symptoms: ${transcription}
Language: ${language}
Clinic: ${nearestClinic}

Respond ONLY with JSON:
{
  "urgencyLevel": "Low" | "Medium" | "High",
  "issueType": "Medical" | "Rescue" | "Shelter" | "Food" | "Other",
  "explanation": "One sentence in ${language} explaining urgency",
  "firstSteps": ["Step 1", "Step 2", "Go to ${nearestClinic}"],
  "translatedSummary": "English summary",
  "language": "code"
}`;

      const triageResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: triagePrompt }] }],
            systemInstruction: { parts: [{ text: "You are a disaster response triage assistant. Respond ONLY with valid JSON." }] },
            generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
          })
        }
      );

      const triageJsonData: any = await triageResponse.json();
      const triageRawText = triageJsonData.candidates?.[0]?.content?.parts?.[0]?.text;
      const triageData = JSON.parse(sanitizeJSON(triageRawText));

      // 3. Save
      const newReport = {
        id: Math.random().toString(36).substring(2, 15),
        symptoms: transcription,
        ...triageData,
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        phoneNumber: phoneNumber || null,
        createdAt: new Date()
      };
      
      reports.unshift(newReport);
      console.log(`[ProcessAudio] Success! Report saved and sent to mobile.`);
      
      res.json({ success: true, data: triageData, transcription });
    } catch (error: any) {
      console.error("[ProcessAudio] Error:", error.message);
      res.status(500).json({ success: false, error: error.message || "Processing failed" });
    }
  });

  // Keep Text-only Triage Endpoint
  app.post("/api/triage", async (req, res) => {
    const { text, language, nearestClinic, location, phoneNumber } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
    
    try {
      const triagePrompt = `Symptoms: ${text}
Language: ${language}
Clinic: ${nearestClinic}
Respond ONLY with JSON.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: triagePrompt }] }],
            systemInstruction: { parts: [{ text: "You are a disaster response triage assistant. Respond ONLY with valid JSON." }] },
            generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
          })
        }
      );

      const data: any = await response.json();
      const triageRawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const triageData = JSON.parse(sanitizeJSON(triageRawText));
      
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
      res.json({ success: true, data: triageData });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
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


