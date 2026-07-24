/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Backend route for the CIVIC-AI chatbot, powered by Groq.
 *
 * Framework: Next.js App Router (app/api/chat/route.ts)
 * If you're on Pages Router instead, use pages/api/chat.ts and adapt the
 * export to `export default async function handler(req, res) { ... }`.
 * If you're on plain Express/Node, adapt to an Express route handler —
 * the Groq SDK call itself (below) stays the same either way.
 *
 * Install: npm install groq-sdk
 * Env var required: GROQ_API_KEY (set in your server environment / .env,
 * NEVER exposed to the client / NEXT_PUBLIC_*).
 */

import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// System prompt gives the model its CIVIC-AI persona and grounding context.
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

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "`message` is required and must be a string." },
        { status: 400 }
      );
    }

    // history: [{ role: "user" | "assistant", content: string }, ...]
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
      // Fast, capable Groq-hosted model. Swap for another Groq model id if needed.
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

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Groq chat completion failed:", error);
    return NextResponse.json(
      { error: "Failed to reach the AI assistant." },
      { status: 500 }
    );
  }
}