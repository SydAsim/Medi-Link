# MediLink AI - Disaster Response & NGO Network

MediLink AI is a production-ready emergency response platform designed for rapid deployment in crisis-affected regions, with a specific focus on the Khyber Pakhtunkhwa (KPK) and Punjab regions of Pakistan. It bridges the communication gap between rural villagers and relief NGOs using advanced AI-driven triage.

## 🚀 Key Features

- **Multi-Language AI Triage**: Supports **Pashto**, **Urdu**, and **English**.
- **Voice-to-Relief**: Specialized Pashto audio transcription for villagers who may not be literate or fluent in English.
- **NGO Command Center**: Real-time dashboard for NGOs to track, prioritize, and manage disaster reports.
- **Incident Mapping**: Interactive maps powered by Leaflet to visualize hotspots and prioritize deployments.
- **Contact & GPS Integration**: Optional contact number and location tracking for precise rescue missions.
- **Priority Scoring**: Automatic urgency detection (Low, Medium, High) to focus resources where they are needed most.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Motion (Animation), Leaflet (Mapping)
- **Backend**: Express.js (Node.js)
- **Core Engine**: Advanced Triage Analysis System
- **Database**: Firebase Firestore (Real-time NoSQL)
- **Auth**: Firebase Authentication

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js (v20 or higher recommended)
- npm or yarn
- A Google Cloud Project with the **Gemini API** enabled
- A Firebase Project

### 2. Installation
```bash
# Clone the repository
# cd into the project directory
npm install
```

### 3. Firebase Configuration
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Enable **Cloud Firestore** and **Authentication** (Google or Anonymous).
4. Create a file named `firebase-applet-config.json` in the root directory with the following structure:
```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT_ID.appspot.com",
  "messagingSenderId": "YOUR_SENDER_ID",
  "appId": "YOUR_APP_ID",
  "firestoreDatabaseId": "(default)"
}
```

### 4. Environment Variables
Create a `.env` file in the root directory and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Running the Application
```bash
# Start the development server
npm run dev
```
The application will be available at `http://localhost:3000`.

## 📂 Project Structure

- `/src/components`: UI components (Voice Terminal, NGO Dashboard, Mapping).
- `/src/hooks`: Custom React hooks (Speech recognition, real-time data).
- `/src/utils`: Helper functions for styling and urgency logic.
- `/server.ts`: Express server handling API routes and serving the client app.
- `/firebase-blueprint.json`: Data structure definition for Firestore.
- `/firestore.rules`: Security rules for database protection.

## 🛡 Security
The platform implements strict Firestore security rules to ensure that:
- Reporters can create but not modify general data.
- NGOs can manage status and assign responders.
- PII (Phone numbers) is handled with care within the triage workflows.

## 📄 License
MIT License - Created for Humanitarian Relief Efforts.
