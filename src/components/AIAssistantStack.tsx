/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Bot,
  Brain,
  Trash2,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  MessageSquare,
  HelpCircle,
  X,
  ChevronRight,
  Globe,
  PhoneCall,
  Shield,
  Layers,
  Mic,
  Volume2,
  VolumeX,
  TrendingUp,
  Activity
} from "lucide-react";
import Markdown from "react-markdown";
import { ResponsiveContainer, LineChart, Line } from "recharts";

function SparklineChart({
  data,
  color = "#3b82f6"
}: {
  data: { h: string; r: number }[];
  color?: string;
}) {
  return (
    <div className="w-11 h-4.5 shrink-0 inline-block pointer-events-none opacity-90 group-hover/chip:opacity-100">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 1, right: 1, bottom: 1, left: 1 }}>
          <Line
            type="monotone"
            dataKey="r"
            stroke={color}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isError?: boolean;
}

export type ChatMode = "assistant" | "advisor";

// Categorized Starter Prompts for Mode 1: Assistant (Citizens & General Support)
const ASSISTANT_CATEGORIZED_PROMPTS = [
  {
    category: "Suggested",
    color: "bg-blue-500",
    prompts: [
      {
        label: "📘 Platform Guide",
        text: "How to Use Civic-IQ (Complete Guide)",
        riskScore: 35,
        strokeColor: "#3b82f6",
        riskData: [
          { h: "0h", r: 10 },
          { h: "6h", r: 18 },
          { h: "12h", r: 25 },
          { h: "18h", r: 30 },
          { h: "24h", r: 35 },
        ],
      },
      {
        label: "📸 Report an Issue",
        text: "How do I submit a new complaint on this platform?",
        riskScore: 82,
        strokeColor: "#3b82f6",
        riskData: [
          { h: "0h", r: 20 },
          { h: "6h", r: 35 },
          { h: "12h", r: 55 },
          { h: "18h", r: 70 },
          { h: "24h", r: 82 },
        ],
      },
      {
        label: "📍 Track Complaint",
        text: "How can I track the status of my reported civic issue?",
        riskScore: 68,
        strokeColor: "#3b82f6",
        riskData: [
          { h: "0h", r: 15 },
          { h: "6h", r: 28 },
          { h: "12h", r: 42 },
          { h: "18h", r: 58 },
          { h: "24h", r: 68 },
        ],
      },
    ],
  },
  {
    category: "Priority",
    color: "bg-red-500",
    prompts: [
      {
        label: "☎ Contact Support",
        text: "How can I contact BMC civic support or emergency helplines?",
        riskScore: 98,
        strokeColor: "#ef4444",
        riskData: [
          { h: "0h", r: 45 },
          { h: "6h", r: 65 },
          { h: "12h", r: 80 },
          { h: "18h", r: 92 },
          { h: "24h", r: 98 },
        ],
      },
      {
        label: "🤖 AI Features",
        text: "What AI features does Civic-IQ use to process complaints?",
        riskScore: 60,
        strokeColor: "#ef4444",
        riskData: [
          { h: "0h", r: 12 },
          { h: "6h", r: 25 },
          { h: "12h", r: 40 },
          { h: "18h", r: 52 },
          { h: "24h", r: 60 },
        ],
      },
    ],
  },
  {
    category: "Recent",
    color: "bg-emerald-500",
    prompts: [
      {
        label: "🗺 Explain Map",
        text: "Can you explain how to use the interactive city map?",
        riskScore: 28,
        strokeColor: "#10b981",
        riskData: [
          { h: "0h", r: 8 },
          { h: "6h", r: 14 },
          { h: "12h", r: 20 },
          { h: "18h", r: 25 },
          { h: "24h", r: 28 },
        ],
      },
      {
        label: "🌐 Change Language",
        text: "How do I switch the application language between English and Hindi?",
        riskScore: 18,
        strokeColor: "#10b981",
        riskData: [
          { h: "0h", r: 5 },
          { h: "6h", r: 8 },
          { h: "12h", r: 12 },
          { h: "18h", r: 15 },
          { h: "24h", r: 18 },
        ],
      },
    ],
  },
];

// Categorized Starter Prompts for Mode 2: AI Advisor (Government Officers & Triage)
const ADVISOR_CATEGORIZED_PROMPTS = [
  {
    category: "Priority",
    color: "bg-red-500",
    prompts: [
      {
        label: "Why is Issue Critical?",
        text: "Why is the Broadway sinkhole complaint marked as Critical?",
        riskScore: 99,
        strokeColor: "#ef4444",
        riskData: [
          { h: "0h", r: 50 },
          { h: "6h", r: 72 },
          { h: "12h", r: 88 },
          { h: "18h", r: 95 },
          { h: "24h", r: 99 },
        ],
      },
      {
        label: "How Weather Affects Priority",
        text: "How does severe weather affect complaint priority scores?",
        riskScore: 94,
        strokeColor: "#ef4444",
        riskData: [
          { h: "0h", r: 40 },
          { h: "6h", r: 60 },
          { h: "12h", r: 78 },
          { h: "18h", r: 89 },
          { h: "24h", r: 94 },
        ],
      },
    ],
  },
  {
    category: "Suggested",
    color: "bg-blue-500",
    prompts: [
      {
        label: "How Priority Works",
        text: "Explain the mathematical formula used to calculate Priority Scores.",
        riskScore: 76,
        strokeColor: "#3b82f6",
        riskData: [
          { h: "0h", r: 22 },
          { h: "6h", r: 35 },
          { h: "12h", r: 52 },
          { h: "18h", r: 68 },
          { h: "24h", r: 76 },
        ],
      },
      {
        label: "Explain AI Reasoning",
        text: "Can you provide the detailed AI reasoning behind the triage scores?",
        riskScore: 65,
        strokeColor: "#3b82f6",
        riskData: [
          { h: "0h", r: 18 },
          { h: "6h", r: 30 },
          { h: "12h", r: 45 },
          { h: "18h", r: 58 },
          { h: "24h", r: 65 },
        ],
      },
    ],
  },
  {
    category: "Recent",
    color: "bg-emerald-500",
    prompts: [
      {
        label: "How Duplicates Merge",
        text: "How does AI detect and merge duplicate complaints in the same area?",
        riskScore: 42,
        strokeColor: "#10b981",
        riskData: [
          { h: "0h", r: 10 },
          { h: "6h", r: 18 },
          { h: "12h", r: 28 },
          { h: "18h", r: 35 },
          { h: "24h", r: 42 },
        ],
      },
      {
        label: "How Crew Assignment Works",
        text: "How does AI select which field worker or technician to assign?",
        riskScore: 55,
        strokeColor: "#10b981",
        riskData: [
          { h: "0h", r: 15 },
          { h: "6h", r: 25 },
          { h: "12h", r: 38 },
          { h: "18h", r: 48 },
          { h: "24h", r: 55 },
        ],
      },
    ],
  },
];

const CIVIC_IQ_GUIDE_TEXT = `### 📘 How to Use Civic-IQ (Complete Guide)

Welcome to **Civic-IQ Mumbai**, the AI-powered municipal portal for citizens and municipal officers! Here is a simple guide to all key features:

---

#### 1. 📊 Dashboard (Admin & Overview)
- **Live Incident Grid**: View all reported municipal issues filtered by Ward, Category, or Status (*Pending*, *In Progress*, *Resolved*).
- **Ward Analytics & Budget Simulator**: Municipal officers can forecast repair completion times based on budget allocations.

#### 2. 📝 Citizen Portal & Complaint Submission
- **Submit Reports**: Upload photos or speak a **Voice Message** in English or Hindi to report potholes, water leaks, or streetlights.
- **Track Issues**: View live status tags and repair progress under **Your Reported Issues**.

#### 3. 📍 Interactive GIS Maps
- **Pinpoint Hazard Coordinates**: Tap anywhere on the city map to anchor exact GPS coordinates for field repair crews.

#### 4. 🧠 AI Analysis & Priority Score
- **Smart Triage**: AI automatically calculates a **0-100 Priority Score** based on hazard severity, public safety risk, affected population, and delay impact.
- **Duplicate Detection**: Reports submitted within 20 meters of an active hazard are merged automatically into a single master ticket.

#### 5. 👷 Field Workers & Dispatches
- **Technician Roster**: Real-time tracking of assigned field technicians, job navigation routes, and completion photo proof.

#### 6. ⚡ Reports & Weather Impact
- **Monsoon & Flood Escalation**: Active weather warnings automatically increase priority scores (+40 points) for drainage and road hazards.
- **PDF Reports**: Export official municipal digest summaries anytime.

#### 7. 🌐 Language Switching
- **English & Hindi**: Click the **Language** toggle in the top navigation bar to switch between English and Hindi (हिंदी) instantly.`;

export default function AIAssistantStack() {
  const [activeMode, setActiveMode] = useState<ChatMode>("assistant");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Assistant Mode Chat State
  const [assistMessages, setAssistMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: "Hello! I'm your **Civic Assistant**. How can I help you report an issue, track a ticket, or navigate the portal today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [assistInput, setAssistInput] = useState("");
  const [assistLoading, setAssistLoading] = useState(false);

  // AI Advisor Mode Chat State
  const [advisorMessages, setAdvisorMessages] = useState<Message[]>([
    {
      id: "welcome-2",
      role: "assistant",
      content: "Hello Officer! I'm here to help you understand ticket priority scores, weather risk alerts, duplicate report merging, and crew dispatches. How can I assist you?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [advisorInput, setAdvisorInput] = useState("");
  const [advisorLoading, setAdvisorLoading] = useState(false);

  // Copied text tooltip state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dismissed AI Suggestion cards state
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const handleDismissSuggestion = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setDismissedSuggestions((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Auto-scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistMessages, advisorMessages, assistLoading, advisorLoading, activeMode]);

  // Voice Output (Text-to-Speech)
  const speakText = (text: string) => {
    if (!isSpeechEnabled || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`~•-]/g, " ").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  // Voice Input (Speech Dictation)
  const handleVoiceDictation = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      if (isListening) {
        setIsListening(false);
      } else {
        setIsListening(true);
        setTimeout(() => {
          const simulatedSpeech = activeMode === "assistant"
            ? "How do I submit a new complaint on this platform?"
            : "Why is the Broadway sinkhole marked as critical?";
          if (activeMode === "assistant") setAssistInput(simulatedSpeech);
          else setAdvisorInput(simulatedSpeech);
          setIsListening(false);
        }, 1800);
      }
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;

      if (isListening) {
        setIsListening(false);
        return;
      }

      setIsListening(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (activeMode === "assistant") setAssistInput(transcript);
        else setAdvisorInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } catch (e) {
      setIsListening(false);
    }
  };

  // Handle Assistant Send
  const handleSendAssist = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    if (textToSend.includes("How to Use Civic-IQ") || textToSend.includes("Complete Guide")) {
      const userMsg: Message = {
        id: `assist-usr-${Date.now()}`,
        role: "user",
        content: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const aiMsg: Message = {
        id: `assist-guide-${Date.now()}`,
        role: "assistant",
        content: CIVIC_IQ_GUIDE_TEXT,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setAssistMessages((prev) => [...prev, userMsg, aiMsg]);
      setAssistInput("");
      speakText(CIVIC_IQ_GUIDE_TEXT);
      return;
    }

    const userMessage: Message = {
      id: `assist-usr-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAssistMessages((prev) => [...prev, userMessage]);
    setAssistInput("");
    setAssistLoading(true);

    try {
      const history = assistMessages
        .slice(-4)
        .filter((m) => !m.id.startsWith("welcome") && !m.isError)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history,
          chatbotType: "assistant"
        })
      });

      if (!response.ok) throw new Error("Server error");
      const data = await response.json();

      setAssistMessages((prev) => [
        ...prev,
        {
          id: `assist-ai-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      speakText(data.reply);
    } catch (err) {
      console.warn("Using general helper fallback response engine.");
      
      let fallbackText = "Here is guidance from the Civic Support database:\n\n";
      const q = textToSend.toLowerCase();

      if (q.includes("submit") || q.includes("complaint") || q.includes("report")) {
        fallbackText += "• **Submitting a Complaint**: Switch to the **Citizen Portal** tab in the top navigation. Upload a photo or select a sample image, type or speak your report description, click on the map to anchor coordinates, and click **Submit Citizen Complaint**.";
      } else if (q.includes("track") || q.includes("status")) {
        fallbackText += "• **Tracking Status**: Go to the **Citizen Portal** and scroll down to **Your Reported Issues**. Every ticket displays live status tags: *Pending Triage*, *In Progress*, or *Resolved* along with assigned worker updates.";
      } else if (q.includes("language") || q.includes("hindi") || q.includes("switch")) {
        fallbackText += "• **Language Switcher**: Click the **Language** toggle button in the top right header navigation bar to switch between English and Hindi (हिंदी).";
      } else if (q.includes("contact") || q.includes("support") || q.includes("helpline")) {
        fallbackText += "• **BMC Helpline**: For immediate life-safety emergencies call **1916** (BMC Civic Control Room) or **112** (Emergency Services).";
      } else if (q.includes("map") || q.includes("explain map")) {
        fallbackText += "• **Interactive Map**: Tap anywhere on the city map to anchor exact GPS coordinates for field repair crews, view active issue pins, and track nearby worker dispatches.";
      } else if (q.includes("dashboard") || q.includes("admin")) {
        fallbackText += "• **Admin Dashboard**: Accessible under **Admin Dashboard**. Displays all active complaints, priority scores, field worker dispatch status, ward analytics, and budget simulations.";
      } else {
        fallbackText += "• **Civic-IQ Help**: You can ask me how to report issues, track tickets, switch languages, or understand AI priority rankings!";
      }

      setAssistMessages((prev) => [
        ...prev,
        {
          id: `assist-fb-${Date.now()}`,
          role: "assistant",
          content: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: false
        }
      ]);
      speakText(fallbackText);
    } finally {
      setAssistLoading(false);
    }
  };

  // Handle Advisor Send
  const handleSendAdvisor = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: `advisor-usr-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAdvisorMessages((prev) => [...prev, userMessage]);
    setAdvisorInput("");
    setAdvisorLoading(true);

    try {
      const history = advisorMessages
        .slice(-4)
        .filter((m) => !m.id.startsWith("welcome") && !m.isError)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history,
          chatbotType: "intelligence"
        })
      });

      if (!response.ok) throw new Error("Server error");
      const data = await response.json();

      setAdvisorMessages((prev) => [
        ...prev,
        {
          id: `advisor-ai-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      speakText(data.reply);
    } catch (err) {
      console.warn("Using AI advisor fallback response engine.");
      
      let fallbackText = "Here is expert analysis from municipal records:\n\n";
      const q = textToSend.toLowerCase();

      if (q.includes("priority") || q.includes("score") || q.includes("critical") || q.includes("broadway")) {
        fallbackText += "• **AI Priority Triage Formula**: `Priority = (Severity × 0.40) + (Population Affected × 0.25) + (Delay Impact × 0.20) + (Weather/Risk × 0.15)`.\n\n• Critical tickets (e.g. Broadway Sinkhole, score **96/100**) rank highest due to immediate structural collapse risk near high-traffic thoroughfares.";
      } else if (q.includes("duplicate") || q.includes("merge")) {
        fallbackText += "• **Spatial Duplicate Detection**: Uses 20-meter GPS proximity mapping. Duplicate reports under the same category are grouped automatically into a master ticket, preventing redundant crew dispatches.";
      } else if (q.includes("weather") || q.includes("rain") || q.includes("flood")) {
        fallbackText += "• **Weather Impact Escalation**: Severe weather warnings (like monsoon flood alerts) add up to **+40 points** to hydraulic, drainage, and road collapse complaints.";
      } else if (q.includes("worker") || q.includes("assign")) {
        fallbackText += "• **Automated Worker Dispatch**: Evaluates field technician skill tags, proximity to incident coordinates, and current workload to assign the optimal crew member.";
      } else {
        fallbackText += "• **AI Advisor Consulting**: Ask me about triage calculations, duplicate report clustering, weather escalation rules, or budget forecasts!";
      }

      setAdvisorMessages((prev) => [
        ...prev,
        {
          id: `advisor-fb-${Date.now()}`,
          role: "assistant",
          content: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: false
        }
      ]);
      speakText(fallbackText);
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleClearHistory = () => {
    if (activeMode === "assistant") {
      setAssistMessages([
        {
          id: "welcome-1",
          role: "assistant",
          content: "Hello! I am your **Civic Assistant**. How can I help you navigate the portal or file a complaint today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setAdvisorMessages([
        {
          id: "welcome-2",
          role: "assistant",
          content: "Hello Officer! I am your **Civic AI Advisor**. Ask me for priority breakdowns, risk forecasts, duplicate detection audits, or worker assignment logic.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const currentMessages = activeMode === "assistant" ? assistMessages : advisorMessages;
  const currentLoading = activeMode === "assistant" ? assistLoading : advisorLoading;
  const currentInput = activeMode === "assistant" ? assistInput : advisorInput;

  // Main UI Chat Window Content
  const renderChatContent = () => (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
      
      {/* 1. Header & Mode Segmented Switch */}
      <div className="bg-slate-50/80 p-3.5 border-b border-slate-200/80 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gov-blue/10 text-gov-blue flex items-center justify-center border border-gov-blue/20">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight font-display">
                  Civic AI
                </h3>
                <span className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span>Online</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {activeMode === "assistant" ? "Citizen & Portal Assistant" : "Officer AI Governance Advisor"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const nextState = !isSpeechEnabled;
                setIsSpeechEnabled(nextState);
                if (!nextState && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isSpeechEnabled
                  ? "bg-gov-blue/10 text-gov-blue font-bold border border-gov-blue/20"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
              title={isSpeechEnabled ? "Voice output enabled (Speech synthesis ON)" : "Enable voice output (Speech synthesis OFF)"}
            >
              {isSpeechEnabled ? <Volume2 className="h-3.5 w-3.5 text-gov-blue" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={handleClearHistory}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Clear chat history"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {isMobileOpen && (
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer md:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Segmented Control Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-200/60 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveMode("assistant")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === "assistant"
                ? "bg-white text-gov-blue shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Assistant</span>
          </button>
          <button
            onClick={() => setActiveMode("advisor")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === "advisor"
                ? "bg-white text-amber-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            <span>AI Advisor</span>
          </button>
        </div>
      </div>

      {/* 2. Chat Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/30 min-h-[320px] max-h-[460px]">
        
        {/* Permanent Quick Action: How to Use Civic-IQ (in Assistant mode) */}
        {!dismissedSuggestions.has("guide") && activeMode === "assistant" && (
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 space-y-2 ai-suggestion-card transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/15 hover:border-blue-300 relative group/guide">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gov-blue flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                <span>📘 How to Use Civic-IQ</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-blue-600 uppercase font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">
                  Guide
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDismissSuggestion("guide", e)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  title="Dismiss guide"
                  aria-label="Dismiss guide card"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              New to Civic-IQ? Click below to view a complete step-by-step walkthrough of all portals and AI features.
            </p>

            {/* Predictive Risk Sparkline Bar */}
            <div className="flex items-center justify-between bg-white/90 px-2.5 py-1 rounded-lg border border-blue-100 shadow-2xs">
              <div className="flex items-center gap-1 text-[9.5px]">
                <TrendingUp className="h-3 w-3 text-blue-600 shrink-0" />
                <span className="font-mono text-[9px] font-semibold text-slate-700">Predictive Risk: 75% ↑</span>
              </div>
              <SparklineChart
                data={[
                  { h: "0h", r: 15 },
                  { h: "6h", r: 28 },
                  { h: "12h", r: 48 },
                  { h: "18h", r: 62 },
                  { h: "24h", r: 75 },
                ]}
                color="#2563eb"
              />
            </div>

            <button
              onClick={() => handleSendAssist("How to Use Civic-IQ (Complete Guide)")}
              className="w-full py-1.5 px-3 bg-gov-blue hover:bg-gov-blue-hover text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
            >
              <span>Read Platform Guide</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Message Bubble List */}
        {currentMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div className={`max-w-[88%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed group relative shadow-2xs ${
                  msg.role === "user"
                    ? "bg-gov-blue text-white rounded-tr-xs font-medium"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="markdown-body text-slate-800">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-line">{msg.content}</p>
                )}

                {msg.role === "assistant" && (
                  <button
                    onClick={() => handleCopyText(msg.content, msg.id)}
                    className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 bg-slate-100/90 rounded border border-slate-200 text-slate-500 hover:text-slate-800 transition-opacity cursor-pointer shrink-0"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 font-mono px-1">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {currentLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200/80 px-3.5 py-2.5 rounded-2xl rounded-tl-xs flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 bg-gov-blue rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 bg-gov-blue rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 bg-gov-blue rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 3. Input Bar & Interactive Quick Action Chips */}
      <div className="p-2.5 bg-white border-t border-slate-200/80 space-y-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (activeMode === "assistant") handleSendAssist(assistInput);
            else handleSendAdvisor(advisorInput);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={currentInput}
            onChange={(e) => activeMode === "assistant" ? setAssistInput(e.target.value) : setAdvisorInput(e.target.value)}
            placeholder={
              isListening
                ? "Listening... speak now"
                : activeMode === "assistant"
                ? "Ask how to report or track an issue..."
                : "Ask about priority scores or worker assignments..."
            }
            className={`flex-1 border rounded-xl px-3 py-2 text-xs transition-all placeholder:text-slate-400 focus:outline-none ${
              isListening
                ? "bg-red-50 border-red-300 text-red-900 animate-pulse font-medium"
                : "bg-slate-50 border-slate-200 text-slate-800 focus:border-gov-blue focus:bg-white"
            }`}
            disabled={currentLoading}
          />
          <button
            type="button"
            onClick={handleVoiceDictation}
            className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 border ${
              isListening
                ? "bg-red-500 text-white border-red-500 animate-pulse shadow-md"
                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
            }`}
            title={isListening ? "Listening... click to stop" : "Voice input (Speech to text)"}
          >
            <Mic className="h-3.5 w-3.5" />
          </button>
          <button
            type="submit"
            disabled={!currentInput.trim() || currentLoading}
            className="bg-gov-blue hover:bg-gov-blue-hover text-white p-2.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Categorized AI Suggestion Cards & Action Chips */}
        {(() => {
          const activeGroups = (activeMode === "assistant" ? ASSISTANT_CATEGORIZED_PROMPTS : ADVISOR_CATEGORIZED_PROMPTS)
            .map((group) => ({
              ...group,
              prompts: group.prompts.filter(
                (prompt) => !dismissedSuggestions.has(`${activeMode}-${prompt.label}`)
              ),
            }))
            .filter((group) => group.prompts.length > 0);

          if (activeGroups.length === 0) return null;

          return (
            <div className="space-y-2 pt-1 border-t border-slate-100/80">
              {activeGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 px-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${group.color} shrink-0`} />
                    <span>{group.category}</span>
                    <span className="ml-0.5 px-1.5 py-0.2 bg-slate-200/70 text-slate-600 rounded-full text-[8.5px] font-semibold border border-slate-300/40 font-mono">
                      {group.prompts.length}
                    </span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-slate-300">
                    {group.prompts.map((prompt, pIdx) => {
                      const keyId = `${activeMode}-${prompt.label}`;
                      return (
                        <div
                          key={pIdx}
                          className={`inline-flex items-center gap-1.5 text-[10px] whitespace-nowrap px-2.5 py-1 rounded-lg transition-all duration-300 font-medium border ai-suggestion-card ai-prompt-chip group/chip ${
                            activeMode === "assistant"
                              ? "bg-slate-50 text-gov-blue border-gov-blue/20 hover:bg-gov-blue hover:text-white hover:border-gov-blue hover:shadow-md hover:shadow-blue-500/20"
                              : "bg-slate-50 text-amber-800 border-amber-300/60 hover:bg-amber-700 hover:text-white hover:border-amber-700 hover:shadow-md hover:shadow-amber-500/20"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              activeMode === "assistant"
                                ? handleSendAssist(prompt.text)
                                : handleSendAdvisor(prompt.text)
                            }
                            className="inline-flex items-center gap-1.5 cursor-pointer focus:outline-hidden"
                          >
                            <span>{prompt.label}</span>
                            <div className="inline-flex items-center gap-1 bg-white/80 group-hover/chip:bg-white/20 px-1.5 py-0.5 rounded border border-slate-200/60 group-hover/chip:border-white/30 text-[9px]">
                              <SparklineChart data={prompt.riskData} color={prompt.strokeColor} />
                              <span className="font-mono text-[8.5px] font-semibold text-slate-600 group-hover/chip:text-white">
                                Risk {prompt.riskScore}%
                              </span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDismissSuggestion(keyId, e)}
                            className="p-0.5 rounded hover:bg-black/20 transition-colors cursor-pointer text-slate-400 group-hover/chip:text-white/80 hover:!text-white focus:outline-hidden ml-0.5 shrink-0"
                            title="Dismiss suggestion"
                            aria-label={`Dismiss ${prompt.label}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View: Embedded in Sidebar */}
      <div className="hidden lg:block h-full" id="unified-civic-ai-panel-desktop">
        {renderChatContent()}
      </div>

      {/* Mobile Floating Trigger & Slide-Up Modal Drawer */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed bottom-5 right-5 z-40 bg-gov-blue hover:bg-gov-blue-hover text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs cursor-pointer border border-white/20 transition-transform active:scale-95"
          aria-label="Open AI Assistant"
        >
          <Bot className="h-4.5 w-4.5" />
          <span>AI</span>
        </button>

        <AnimatePresence>
          {isMobileOpen && (
            <div
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setIsMobileOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="w-full max-w-lg h-[88vh] sm:h-[620px] p-1.5 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {renderChatContent()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
