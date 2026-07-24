/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Backend route for the CIVIC-AI chatbot, powered by Groq.
 *
 * Framework: Vercel Serverless Function (works with Vite/React frontends)
 * Path: /api/chat.ts  (must live in a top-level /api folder, NOT in /src)
 *
 * Install: npm install groq-sdk @vercel/node
 * Env var required: GROQ_API_KEY (set in Vercel dashboard -> Settings ->
 * Environment Variables. NEVER prefix with VITE_ or expose to the client).
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are the CIVIC-AI Support Assistant, embedded inside a municipal
civic-issue reporting platform (Civic-IQ / CIVIC-AI) used by citizens, city
administrators, and field crews.

You help with:
- Explaining how the platform works (reporting issues, AI triage/priority
  scoring, duplicate detection, field crew dispatch, ratings).
- Answering questions about active complaints, crew rosters, and department
  routing when that context is provided to you.
- General guidance on using the Citizen App, Admin Dashboard, and Field Crew
  App.

Keep answers concise, friendly, and specific to civic/municipal operations.
If you don't have real-time data about a specific complaint ID or crew
member, say so honestly rather than inventing details.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS (safe to keep even on same-origin Vercel deploys)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // req.body is already parsed JSON on Vercel Node functions
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "`message` is required and must be a string." });
    }

    const priorMessages = Array.isArray(history)
      ? history
          .filter(
            (m: any) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .map((m: any) => ({ role: m.role, content: m.content }))
      : [];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...priorMessages,
        { role: "user", content: message },
      ],
      temperature: 0.4,
      max_tokens: 700,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response just now. Please try again.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Groq chat completion failed:", error);
    return res.status(500).json({ error: "Failed to reach the AI assistant." });
  }
}
