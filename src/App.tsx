/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Shield,
  FileText,
  Users,
  Bell,
  Clock,
  TrendingUp,
  Sliders,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  Info,
  MapPin,
  X,
  Plus,
  Home,
  Lock,
  Key
} from "lucide-react";
import { Complaint, FieldWorker, Notification } from "./types";
import {
  INITIAL_COMPLAINTS,
  INITIAL_WORKERS,
  INITIAL_NOTIFICATIONS
} from "./data/mockData";
import CitizenApp from "./components/CitizenApp";
import AdminDashboard from "./components/AdminDashboard";
import FieldWorkerApp from "./components/FieldWorkerApp";
import DesignSystemDocs from "./components/DesignSystemDocs";
import LandingPage from "./components/LandingPage";
import AdminLogin from "./components/AdminLogin";
import AIChatbot from "./components/AIChatbot";
import AIAssistantStack from "./components/AIAssistantStack";
import OnboardingModal from "./components/OnboardingModal";

export default function App() {
  // Global States representing database persistence
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem("ciq_complaints");
    return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
  });

  const [workers, setWorkers] = useState<FieldWorker[]>(() => {
    const saved = localStorage.getItem("ciq_workers");
    return saved ? JSON.parse(saved) : INITIAL_WORKERS;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("ciq_notifications");
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Current active viewport workspace
  // "landing" | "admin" | "citizen" | "worker" | "docs"
  const [activeRole, setActiveRole] = useState<"landing" | "admin" | "citizen" | "worker" | "docs">("landing");

  // Localized clock state
  const [currentTime, setCurrentTime] = useState("");

  // Notification center visible flag
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // First-time Onboarding Modal state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return !localStorage.getItem("ciq_onboarding_seen");
  });

  const handleCloseOnboarding = () => {
    localStorage.setItem("ciq_onboarding_seen", "true");
    setShowOnboarding(false);
  };

  // Selected complaint ID for the global detail sidebar overlay
  const [inspectIncidentId, setInspectIncidentId] = useState<string | null>(null);

  // Admin authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("ciq_admin_auth") === "true";
  });

  // Sync state with local storage on edits
  useEffect(() => {
    sessionStorage.setItem("ciq_admin_auth", String(isAdminAuthenticated));
  }, [isAdminAuthenticated]);

  useEffect(() => {
    localStorage.setItem("ciq_complaints", JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem("ciq_workers", JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem("ciq_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Clock ticks
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Incident updates functions
  const handleAddNewComplaint = (newComplaint: Complaint) => {
    setComplaints((prev) => [newComplaint, ...prev]);

    // Create system notification
    const newNotif: Notification = {
      id: `N-CT-${Date.now()}`,
      role: "Admin",
      title: "New Citizen Incident Logged",
      message: `${newComplaint.id}: '${newComplaint.title}' pre-classified at Priority ${newComplaint.aiAnalysis.priorityScore}.`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleAssignWorker = (complaintId: string, workerId: string) => {
    const targetWorker = workers.find((w) => w.id === workerId);
    if (!targetWorker) return;

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: "Assigned",
            assignedWorkerId: workerId,
            history: [
              ...c.history,
              {
                status: "Assigned",
                updatedAt: new Date().toISOString(),
                comment: `Admin manually assigned work order to ${targetWorker.name} (${targetWorker.role}).`,
                updatedBy: "Command Center Dispatcher"
              }
            ]
          };
        }
        return c;
      })
    );

    // Update worker status to On Mission
    setWorkers((prev) =>
      prev.map((w) => (w.id === workerId ? { ...w, status: "On Mission" } : w))
    );

    // Add alert notifications for Worker and Admin
    const newNotifs: Notification[] = [
      {
        id: `N-AW-${Date.now()}-1`,
        role: "Worker",
        title: "New Dispatch Order",
        message: `You have been assigned to investigate and repair incident ${complaintId}.`,
        createdAt: new Date().toISOString(),
        read: false
      },
      {
        id: `N-AW-${Date.now()}-2`,
        role: "Admin",
        title: "Crew Assigned to Work order",
        message: `Technician ${targetWorker.name} has been dispatched to ${complaintId}.`,
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
    setNotifications((prev) => [...newNotifs, ...prev]);
  };

  const handleAcceptJob = (complaintId: string, workerId: string, workerName: string) => {
    const targetWorker = workers.find((w) => w.id === workerId) || { name: workerName || "Rahul Patil" };

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: "Accepted",
            assignedWorkerId: workerId,
            assignedWorkerName: targetWorker.name,
            etaMinutes: 12,
            history: [
              ...c.history,
              {
                status: "Accepted",
                updatedAt: new Date().toISOString(),
                comment: `${targetWorker.name} accepted the work order and is en route.`,
                updatedBy: targetWorker.name
              }
            ]
          };
        }
        return c;
      })
    );

    // Update worker status to On Mission
    setWorkers((prev) =>
      prev.map((w) => (w.id === workerId ? { ...w, status: "On Mission" } : w))
    );

    // Create notifications for Citizen & Admin
    const newNotifs: Notification[] = [
      {
        id: `N-ACC-${Date.now()}-1`,
        role: "Citizen",
        title: "Complaint Accepted!",
        message: `${targetWorker.name} has accepted your complaint #${complaintId}. Technician crew is en route (ETA ~12 mins).`,
        createdAt: new Date().toISOString(),
        read: false
      },
      {
        id: `N-ACC-${Date.now()}-2`,
        role: "Admin",
        title: "Work Order Accepted",
        message: `${targetWorker.name} accepted job #${complaintId} directly from Field App queue.`,
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
    setNotifications((prev) => [...newNotifs, ...prev]);
  };

  const handleWorkerUpdateStatus = (
    complaintId: string,
    status: "Accepted" | "In Progress" | "Resolved",
    comment: string,
    photo: string | null,
    completionDetails?: { beforePhoto?: string; afterPhoto?: string; voiceNote?: string }
  ) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          const finalHistoryEvent = {
            status,
            updatedAt: new Date().toISOString(),
            comment,
            updatedBy: c.assignedWorkerName || "Field Crew Dispatch"
          };

          const beforeP = completionDetails?.beforePhoto || c.images[0];
          const afterP = completionDetails?.afterPhoto || photo || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80";

          return {
            ...c,
            status,
            history: [...c.history, finalHistoryEvent],
            completionProof:
              status === "Resolved"
                ? {
                    photos: [afterP],
                    beforePhoto: beforeP,
                    afterPhoto: afterP,
                    completedAt: new Date().toISOString(),
                    comments: comment,
                    voiceNote: completionDetails?.voiceNote
                  }
                : c.completionProof
          };
        }
        return c;
      })
    );

    // If Resolved, update worker status back to Available
    if (status === "Resolved") {
      const finishedComplaint = complaints.find((c) => c.id === complaintId);
      if (finishedComplaint?.assignedWorkerId) {
        setWorkers((prev) =>
          prev.map((w) =>
            w.id === finishedComplaint.assignedWorkerId ? { ...w, status: "Available" } : w
          )
        );
      }
    }

    // Push notification alert
    const newNotifs: Notification[] = [
      {
        id: `N-WU-${Date.now()}`,
        role: "Admin",
        title: status === "Resolved" ? "Work Order Completed" : "Repair Work Initiated",
        message: `Incident ${complaintId} has been updated to ${status}. Proof of work archived in logs.`,
        createdAt: new Date().toISOString(),
        read: false
      }
    ];

    if (status === "Resolved") {
      newNotifs.push({
        id: `N-RES-${Date.now()}`,
        role: "Citizen",
        title: "Work Completed!",
        message: `Work on your complaint #${complaintId} is finished. Please rate your experience!`,
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    setNotifications((prev) => [...newNotifs, ...prev]);
  };

  const handleRateComplaint = (complaintId: string, rating: Rating) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          return {
            ...c,
            rating,
            history: [
              ...c.history,
              {
                status: c.status,
                updatedAt: new Date().toISOString(),
                comment: `Citizen rated response: ${rating.stars} Stars. Feedback: "${rating.comment || rating.tags?.join(", ") || "Great service"}"`,
                updatedBy: "Citizen Portal"
              }
            ]
          };
        }
        return c;
      })
    );

    const newNotif: Notification = {
      id: `N-RAT-${Date.now()}`,
      role: "Admin",
      title: "Citizen Feedback Received",
      message: `Complaint #${complaintId} received a ${rating.stars}-Star rating from citizen.`,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearPersistence = () => {
    if (window.confirm("Restore platform to default GovTech mock dataset? All custom submissions will clear.")) {
      localStorage.removeItem("ciq_complaints");
      localStorage.removeItem("ciq_workers");
      localStorage.removeItem("ciq_notifications");
      setComplaints(INITIAL_COMPLAINTS);
      setWorkers(INITIAL_WORKERS);
      setNotifications(INITIAL_NOTIFICATIONS);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const inspectedComplaint = complaints.find((c) => c.id === inspectIncidentId);

  if (activeRole === "landing") {
    return <LandingPage onSelectRole={setActiveRole} />;
  }

  const showSidebar = activeRole !== "admin" || isAdminAuthenticated;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-800 antialiased font-sans flex flex-col">
      
      {/* TOP NAVIGATION BAR - Full-width modern dark navy enterprise banner */}
      <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-45 shadow-md shrink-0 transition-all">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-6 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Brand Logo & Meta */}
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <div 
              className="flex items-center gap-3 cursor-pointer select-none group" 
              onClick={() => setActiveRole("landing")}
              id="top-nav-logo-brand"
            >
              <img
                src="/src/assets/images/civiciq_logo_1783246559258.jpg"
                alt="CIVIC-AI Logo"
                className="w-9 h-9 rounded-full shrink-0 object-cover border border-slate-700 group-hover:border-blue-400 transition-colors"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-display font-black tracking-tight uppercase bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                    CIVIC-AI
                  </span>
                  <span className="text-[8px] uppercase font-mono font-extrabold text-blue-300 bg-blue-950/80 border border-blue-900/50 px-1.5 py-0.2 rounded-sm">
                    Enterprise v2.0
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Smart City Operations Platform</p>
              </div>
            </div>

            {/* Mobile/Tablet Controls Block */}
            <div className="flex items-center gap-3 lg:hidden">
              {/* Alert Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                  className="p-1.5 text-slate-300 hover:text-white relative bg-slate-900 hover:bg-slate-850 rounded-lg transition-colors border border-slate-800 cursor-pointer"
                  id="mobile-alerts-btn"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              </div>
              <button
                onClick={handleClearPersistence}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-[9px] uppercase font-bold tracking-wider font-mono cursor-pointer"
              >
                Reset Data
              </button>
            </div>
          </div>

          {/* Central Portal Navigation links - full width scroll on touch */}
          <nav className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-lg font-mono text-xs overflow-x-auto shrink-0 scrollbar-none max-w-full">
            <button
              onClick={() => setActiveRole("landing")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                (activeRole as string) === "landing"
                  ? "bg-slate-850 text-blue-400 border border-slate-800"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Home className="h-3.5 w-3.5 shrink-0" />
              <span>Portal Home</span>
            </button>
            <button
              onClick={() => setActiveRole("admin")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeRole === "admin"
                  ? "bg-[#1565C0] text-white border border-blue-600 shadow-sm font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span>1. Admin Dashboard</span>
            </button>
            <button
              onClick={() => setActiveRole("citizen")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeRole === "citizen"
                  ? "bg-[#1565C0] text-white border border-blue-600 shadow-sm font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span>2. Citizen Portal</span>
            </button>
            <button
              onClick={() => setActiveRole("worker")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeRole === "worker"
                  ? "bg-[#1565C0] text-white border border-blue-600 shadow-sm font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>3. Field Crew</span>
            </button>
            <button
              onClick={() => setActiveRole("docs")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeRole === "docs"
                  ? "bg-[#1565C0] text-white border border-blue-600 shadow-sm font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              <span>4. Design System</span>
            </button>
          </nav>

          {/* Right Side Utility Stack - Desktop ONLY */}
          <div className="hidden lg:flex items-center gap-4 font-mono text-xs">
            {/* Clock */}
            <div className="flex items-center gap-2 text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="text-[11px] font-bold text-slate-300">{currentTime || "2026-07-06 02:37"}</span>
            </div>

            {/* Notification drop block button */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-slate-800 cursor-pointer"
                title="System Alerts"
                id="desktop-alerts-btn"
              >
                <Bell className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-bold uppercase text-[10px]">Alerts</span>
                {unreadCount > 0 ? (
                  <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                    {unreadCount}
                  </span>
                ) : (
                  <span className="text-slate-500">•</span>
                )}
              </button>

              {/* Notification dropdown overlay */}
              {showNotificationCenter && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 text-slate-800 rounded-xl shadow-2xl z-50 p-4 space-y-3 font-sans" id="desktop-notifications-menu">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-xs font-mono uppercase tracking-wider">System Alerts</span>
                    <button onClick={markAllNotifsRead} className="text-[10px] text-[#1565C0] font-bold uppercase hover:underline cursor-pointer">
                      Mark All Read
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4 italic">No active alert logs.</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div key={n.id} className={`p-2 rounded-lg text-xs space-y-1 border ${n.read ? "bg-slate-50 border-slate-100" : "bg-blue-50/40 border-blue-100"}`}>
                          <div className="flex justify-between font-mono text-[9px] text-slate-400">
                            <span className="font-bold text-slate-500">{n.role.toUpperCase()}</span>
                            <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <h5 className="font-bold text-slate-800 truncate leading-tight">{n.title}</h5>
                          <p className="text-[11px] text-slate-500 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => setShowNotificationCenter(false)}
                    className="w-full py-1.5 text-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold font-mono uppercase border border-slate-200 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Onboarding Tour launcher */}
            <button
              onClick={() => setShowOnboarding(true)}
              className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 font-bold rounded-lg transition-all text-center cursor-pointer font-mono text-[10px] tracking-wide flex items-center gap-1.5"
              id="desktop-take-tour-btn"
            >
              <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
              <span>Take Tour</span>
            </button>

            {/* Reset button */}
            <button
              onClick={handleClearPersistence}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 hover:text-red-400 border border-slate-800 hover:border-red-900 text-slate-400 uppercase font-bold rounded-lg transition-all text-center cursor-pointer font-mono text-[10px] tracking-wide"
            >
              Reset Data
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Alert overlay panel outside top nav block */}
      {showNotificationCenter && (
        <div className="block lg:hidden mx-4 mt-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xl z-30 space-y-3 font-sans" id="mobile-notifications-menu">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 text-xs font-mono uppercase">System Alerts Log</span>
            <button onClick={markAllNotifsRead} className="text-[10px] text-[#1565C0] font-bold uppercase hover:underline cursor-pointer">
              Mark Read
            </button>
          </div>
          <div className="space-y-2.5 max-h-40 overflow-y-auto">
            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className={`p-2 rounded text-xs space-y-0.5 border ${n.read ? "bg-slate-50 border-slate-100" : "bg-blue-50/50 border-blue-100"}`}>
                <p className="text-xs text-slate-700 leading-normal"><span className="font-bold">{n.title}</span>: {n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPLIT SCREEN VIEW - LEFT (75%) & RIGHT (25%) */}
      <div className="flex-1 max-w-[1920px] w-full mx-auto px-4 lg:px-6 py-6" id="dashboard-split-screen-grid-wrapper">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
          
          {/* LEFT COLUMN: Main Administrative Command Workspace (75% or 9 cols, dynamic 100% if no sidebar) */}
          <div className={showSidebar ? "lg:col-span-9 space-y-6 min-w-0" : "lg:col-span-12 space-y-6 min-w-0"} id="left-workspace-content-pane">
            
            {/* Role Helper Banner */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5 text-xs text-slate-600 leading-relaxed max-w-3xl">
                <div className="p-2 bg-gov-blue-light text-[#1565C0] rounded-lg shrink-0 mt-0.5">
                  <Info className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-xs">
                    {activeRole === "admin" && (isAdminAuthenticated ? "Admin Dashboard" : "Admin Login")}
                    {activeRole === "citizen" && "Citizen Portal"}
                    {activeRole === "worker" && "Field Crew Dashboard"}
                    {activeRole === "docs" && "Design System"}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {activeRole === "admin" && (isAdminAuthenticated ? "Manage citizen complaints, dispatch field workers, and view ward repair estimates." : "Please enter your official employee ID and password to access the admin portal.")}
                    {activeRole === "citizen" && "Report issues via photo or voice, drop your location on the map, and get real-time AI updates."}
                    {activeRole === "worker" && "Track assigned work orders, navigate to repair sites, upload completion photos, and update ticket statuses."}
                    {activeRole === "docs" && "View design standards, color palettes, typography guidelines, and accessibility benchmarks."}
                  </p>
                </div>
              </div>

              {activeRole === "admin" && isAdminAuthenticated && (
                <button
                  onClick={() => setIsAdminAuthenticated(false)}
                  className="px-3.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-end md:self-center cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>

            {/* WORKSPACE RENDER BLOCK */}
            <div className="min-h-[500px]" id="workspace-sub-render-block">
              {activeRole === "admin" && (
                isAdminAuthenticated ? (
                  <AdminDashboard
                    complaints={complaints}
                    workers={workers}
                    onAssignWorker={handleAssignWorker}
                    onUpdateStatus={handleWorkerUpdateStatus}
                  />
                ) : (
                  <AdminLogin
                    onLoginSuccess={() => setIsAdminAuthenticated(true)}
                    onBackToHome={() => setActiveRole("landing")}
                  />
                )
              )}

              {activeRole === "citizen" && (
                <CitizenApp
                  complaints={complaints}
                  onSubmitComplaint={handleAddNewComplaint}
                  onViewComplaintDetails={(id) => {
                    setInspectIncidentId(id);
                  }}
                  onRateComplaint={handleRateComplaint}
                />
              )}

              {activeRole === "worker" && (
                <FieldWorkerApp
                  complaints={complaints}
                  worker={workers[0] || INITIAL_WORKERS[0]} // Defaults to Rahul Patil
                  onAcceptJob={(complaintId) => {
                    const activeWorker = workers[0] || INITIAL_WORKERS[0];
                    handleAcceptJob(complaintId, activeWorker.id, activeWorker.name);
                  }}
                  onUpdateComplaintStatus={handleWorkerUpdateStatus}
                />
              )}

              {activeRole === "docs" && (
                <DesignSystemDocs />
              )}
            </div>

            {/* Civic Footer inside Left Column */}
            <footer className="bg-white border border-slate-200 rounded-xl py-6 px-6 text-center space-y-2 font-mono text-[10px] text-slate-400 uppercase font-bold tracking-wider shadow-xs">
              <div>MUNICIPALITY OF METRO SECTOR • NATIONAL SMART CITY ALLIANCE</div>
              <div className="font-normal text-slate-300">
                This system complies fully with US Federal (WDS), EU Digital Single Market, and ISO-37120 standards.
              </div>
            </footer>

          </div>

          {/* RIGHT COLUMN: AI Assistant Stack Sticky Sidebar (25% or 3 cols) */}
          {showSidebar && (
            <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-4 self-start" id="right-ai-sidebar-container">
              <AIAssistantStack />
            </div>
          )}

        </div>
      </div>

        {/* GLOBAL INCIDENT DETAILS INSPECTOR MODAL/DRAWER OVERLAY */}
        {inspectIncidentId && inspectedComplaint && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-end z-50">
            <div className="bg-white border-l border-slate-200 h-full w-full max-w-lg shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
              <div className="space-y-5">
                
                {/* Header Title bar */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      Incident Audit Ledger: {inspectedComplaint.id}
                    </span>
                    <h4 className="font-display font-semibold text-slate-900 text-base mt-1">
                      {inspectedComplaint.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => setInspectIncidentId(null)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Status Badge rows */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase font-bold">
                    {inspectedComplaint.category}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full uppercase font-bold border ${
                    inspectedComplaint.status === "Resolved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {inspectedComplaint.status}
                  </span>
                  <span className="text-gov-blue bg-gov-blue-light px-2.5 py-1 rounded font-bold">
                    Priority: {inspectedComplaint.aiAnalysis.priorityScore}/100
                  </span>
                </div>

                {/* Citizen Description narrative */}
                <div className="space-y-1 text-xs">
                  <span className="text-slate-400 font-mono text-[10px] uppercase block">Citizen Narrative description:</span>
                  <p className="text-slate-700 leading-relaxed font-sans bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    {inspectedComplaint.description}
                  </p>
                </div>

                {/* Image Attachments */}
                {inspectedComplaint.images.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-mono text-[10px] uppercase block">Media uploads:</span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44">
                      <img
                        src={inspectedComplaint.images[0]}
                        alt="Attachment proof"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* AI Agent diagnostics panel */}
                <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-lg border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-blue-400 flex items-center gap-1.5">
                      <Shield className="h-4 w-4" />
                      <span>AI Reasoning & Explanation</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Confidence: {Math.round(inspectedComplaint.aiAnalysis.confidence * 100)}%
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs text-slate-300">
                    <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-slate-800 pb-2">
                      <div>
                        <span className="text-slate-500 block uppercase">Affected Population:</span>
                        <span className="text-white font-bold">{inspectedComplaint.aiAnalysis.populationAffected} citizens</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase">Threat Severity:</span>
                        <span className="text-white font-bold">{inspectedComplaint.aiAnalysis.severity}</span>
                      </div>
                    </div>

                    <div className="text-[11px] leading-relaxed">
                      <span className="text-slate-500 block uppercase text-[9px] mb-0.5 font-bold">Reasoning Chain logic:</span>
                      <p className="text-slate-300 font-sans italic">"{inspectedComplaint.aiAnalysis.reasoning}"</p>
                    </div>

                    {/* Future risk graph simulation */}
                    <div className="border-t border-slate-800 pt-2 text-[10px]">
                      <span className="text-slate-500 block uppercase text-[9px] mb-1 font-bold">Predictive future risk index (If unrepaired):</span>
                      
                      {/* Tiny visual SVG sparkline indicating exponential threat growth */}
                      <div className="h-10 bg-slate-950 rounded border border-slate-800 flex items-center justify-between px-3 relative overflow-hidden">
                        <span className="absolute left-2 top-1 text-[8px] text-slate-500">24h Delay Risk Curve</span>
                        <svg className="w-full h-full" viewBox="0 0 300 40">
                          {/* Exponential line */}
                          <path d="M 0,35 Q 100,32 180,24 T 300,5" fill="none" stroke="#EF4444" strokeWidth="2" />
                          <circle cx="300" cy="5" r="3" fill="#EF4444" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit timelines */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-slate-400 font-mono text-[10px] uppercase block">Audit Lifecycle Trail:</span>
                  <div className="space-y-3 font-mono text-[10px] text-slate-600 pl-1">
                    {inspectedComplaint.history.map((h, idx) => (
                      <div key={idx} className="relative pl-4 border-l border-slate-200 pb-1">
                        <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white inline-block"></span>
                        <div className="flex items-center justify-between text-slate-800">
                          <span className="font-bold uppercase text-[9px]">{h.status}</span>
                          <span className="text-[8px] text-slate-400">{new Date(h.updatedAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-tight">{h.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Completion logs if resolved */}
                {inspectedComplaint.completionProof && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2.5">
                    <div className="font-mono text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle className="h-4.5 w-4.5" />
                      <span>Completion Proof Verified</span>
                    </div>
                    <p className="text-xs text-slate-600 font-sans italic leading-relaxed">
                      "{inspectedComplaint.completionProof.comments}"
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Completed At: {new Date(inspectedComplaint.completionProof.completedAt).toLocaleDateString()} 
                    </span>
                  </div>
                )}

              </div>

              <button
                onClick={() => setInspectIncidentId(null)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors font-mono uppercase mt-4"
              >
                Exit Inspector Ledger
              </button>
            </div>
          </div>
        )}

        {/* ONBOARDING GUIDED TOUR MODAL */}
        <OnboardingModal isOpen={showOnboarding} onClose={handleCloseOnboarding} />

    </div>
  );
}
