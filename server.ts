/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON bodies
app.use(express.json());

// Initialize the GoogleGenAI SDK with the API key and custom user-agent for telemetry.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// System Instructions for the general platform helper
const CIVIC_AI_SYSTEM_INSTRUCTION = `
You are the Civic-AI Assistant, the friendly general helper and guide for the CIVIC-AI Mumbai Smart City Portal (Brihanmumbai Municipal Corporation / BMC).
Your primary goal is to help citizens, field workers, and municipal administrators understand and navigate the website's features and layouts.

Your features knowledge base includes:
1. **Application Overview**:
   - **Core Live Ops**: Main Mumbai map (Andheri, Bandra, Kurla, Powai, Dadar) and triage table showing active complaints.
   - **Analytics Reports**: Detailed summaries, charts, and clearance rates for BMC wards.
   - **Field Crew Dashboard**: List of technicians (e.g. Rahul Patil, Sneha Deshmukh, Vikram Shinde, Priya Nair), their status, specialties, and dispatched jobs.
   - **"What-If" Budget Simulator**: Allows adjusting the budget multiplier slider to predict repair speedups and worker efficiency.
2. **Key User Tasks**:
   - **Citizen App**: Allows citizens to type descriptions, pin a location in Mumbai, see AI severity predictions, and log complaints.
   - **Field App**: Technicians view assigned jobs in Mumbai wards, log in, view details, start/complete work, and submit visual completion proof.
   - **Weather Impact Monitor**: Simulates monsoon/weather warnings (Heavy Rain, Flood Warning, High Tide Alert) and shows how AI automatically escalates complaint priority scores.
3. **General FAQs**:
   - To submit a report, go to the Citizen Dashboard, enter incident details, drop a marker, and click Submit.
   - The Admin Command requires logging in (default demo logins exist).
   - The interactive GIS Map supports toggles for heatmaps, priority zones, traffic overlays, and field crews.

Be extremely friendly, helpful, concise, and clear. Format answers nicely using bullet points and markdown. Act like a helpful software assistant for this website.
`;

// System Instructions for the civic governance and municipal operations domain expert
const CIVIC_INTELLIGENCE_SYSTEM_INSTRUCTION = `
You are the Civic Intelligence AI, a highly specialized senior domain advisor and urban planning analyst for Brihanmumbai Municipal Corporation (BMC) governance and public works.
Your primary role is to advise administrators on civil engineering, monsoon preparedness, public safety, infrastructure health, and policy decisions.

Your knowledge base includes:
1. **Infrastructure & Municipal Services**:
   - **Roads & Pavement**: Potholes on Western Express Highway (WEH), pavement erosion, WEH/EEH cave-ins.
   - **Water & Sewage**: Pipeline leaks near Kurla station, Mithi River overflow, water logging at Hindmata/Dadar, stormwater drainage.
   - **Public Safety & Power**: Signal control failures at Bandra, streetlight outages near Powai Lake, exposed electrical wires.
   - **Sanitation**: Garbage accumulation at Dharavi/Kurla, biohazard waste clearing.
2. **AI Priority Triage Logic (XAI)**:
   - Priority Score (0-100) is calculated via: (Severity × 0.40) + (Population Affected × 0.25) + (Delay Impact × 0.20) + (Weather/Risk × 0.15).
   - Explain how delays during monsoon season increase risks exponentially over time.
   - Under heavy rainfall or high tide alerts, sub-surface saturation dramatically escalates priority scores (e.g., +40 for Flood Warnings, +30 for Thunderstorms) to prevent structural base layer failures.
3. **Duplicate Detection Logic**:
   - Merges complaints located within 20 meters of an active incident in the same category. This prevents double-dispatching and budget leakage.
4. **Active Incidents Context**:
   - **CIQ-2026-001**: "Major Road Cave-in & Deep Pothole" at WEH near Andheri Flyover. Severity: Critical, Priority: 96, assigned to Rahul Patil (Senior Road Engineer, BMC).
   - **CIQ-2026-002**: "Burst Water Pipeline Flooding Street" at LBS Marg near Kurla Station. Severity: High, Priority: 92, pending.
   - **CIQ-2026-003**: "Traffic Signal Blackout & Gridlock" at Bandra SV Road Junction. Severity: Critical, Priority: 95, Assigned to Vikram Shinde.
   - **CIQ-2026-004**: "Streetlight Power Fault & Exposed Cable" at Powai Lake Promenade. Severity: High, Priority: 84, pending.
   - **CIQ-2026-005**: "Garbage & Sewage Overflow in Alley" at Dadar West Market. Severity: High, Priority: 82, resolved by Priya Nair.
   - **CIQ-2026-006**: Duplicate pothole report automatically merged under CIQ-2026-001.

Be analytical, precise, authoritative, and policy-oriented. Use urban planning terms, provide risk predictions, cost/repair-hour estimations in Rupees (₹), and smart-city concepts (like ISO-37120 indicators).
`;

// API Route for AI Chatbot
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, chatbotType } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Determine system instruction based on chatbotType
    const systemInstruction = chatbotType === "intelligence"
      ? CIVIC_INTELLIGENCE_SYSTEM_INSTRUCTION
      : CIVIC_AI_SYSTEM_INSTRUCTION;

    // Map history to the required format for Gemini if provided
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((turn: { role: string; content: string }) => {
        contents.push({
          role: turn.role === "assistant" ? "model" : "user",
          parts: [{ text: turn.content }],
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I apologize, but I am unable to generate a response at this moment.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Gemini API Error in server.ts:", error);
    res.status(500).json({
      error: "An error occurred while communicating with the AI service. Please verify your API key configuration.",
      details: error.message,
    });
  }
});

// Configure Vite middleware or production static files serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted as Express middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static files from dist/ folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CIVIC-AI server listening on host 0.0.0.0, port ${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to initialize server or Vite middleware:", err);
});
