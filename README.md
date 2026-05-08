# MediLink AI - Disaster Response & NGO Network

MediLink AI is a production-ready emergency response platform designed for rapid deployment in crisis-affected regions, with a specific focus on the Khyber Pakhtunkhwa (KPK) and Punjab regions of Pakistan. It bridges the communication gap between rural villagers and relief NGOs using advanced AI-driven triage.

## 🚀 Key Features

- **Multi-Language AI Triage**: Supports **Pashto**, **Urdu**, and **English**.
- **Voice-to-Relief**: Specialized Pashto audio transcription for villagers who may not be literate or fluent in English.
- **NGO Command Center**: Real-time dashboard for NGOs to track, prioritize, and manage disaster reports.
- **Incident Mapping**: Interactive maps powered by Leaflet to visualize hotspots and prioritize deployments.
- **Priority Scoring**: Automatic urgency detection (Low, Medium, High) powered by Gemini 1.5 Flash.
- **In-Memory Stability**: High-performance backend designed for reliable demo environments without external database latency.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion (Animation), Leaflet (Mapping)
- **Backend**: Express.js (Node.js)
- **AI Engine**: Google Gemini 1.5 Flash (Transcription & Analysis)
- **Deployment**: Local Node.js / Vercel / Railway

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js (v20 or higher)
- npm or yarn
- A Google Cloud API Key for **Gemini AI**

### 2. Installation
```bash
# Navigate to the project directory
cd Medi-Link

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Running the Application
```bash
# Start the development server (Backend + Frontend via Vite)
npm run dev
```
The application will be available at `http://localhost:3000`.

## 📂 Project Structure

- `/src/components`: UI components (Voice Terminal, NGO Dashboard, Mapping).
- `/src/hooks`: Custom React hooks for speech and data management.
- `/src/utils`: Helper functions for styling and triage logic.
- `/server.ts`: Unified Express server handling AI routes and serving the frontend.
- `/public`: Static assets and icons.

## 🛡 Security & Reliability
- **Direct API Integration**: Uses official Google Generative AI endpoints for secure, low-latency processing.
- **Data Privacy**: No persistent personal data is stored beyond the session for maximum patient privacy during triage.
- **Responsive Design**: Fully optimized for mobile devices used in the field.

## 📄 License
MIT License - Created for Humanitarian Relief Efforts.
