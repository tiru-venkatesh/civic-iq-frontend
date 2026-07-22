/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  MapPin,
  CheckCircle,
  FileText,
  Clock,
  ArrowLeft,
  X,
  Camera,
  Navigation,
  AlertTriangle,
  Wifi,
  WifiOff,
  CornerUpRight,
  MessageSquare,
  Phone,
  Mic,
  Play,
  Square,
  Shield,
  Sparkles,
  RefreshCw,
  Star,
  Car,
  Zap,
  Check,
  CheckSquare,
  Info,
  ChevronRight,
  Briefcase,
  Layers,
  Compass
} from "lucide-react";
import { Complaint, FieldWorker } from "../types";

interface FieldWorkerAppProps {
  complaints: Complaint[];
  worker: FieldWorker;
  onAcceptJob?: (complaintId: string) => void;
  onUpdateComplaintStatus: (
    id: string,
    status: "Accepted" | "In Progress" | "Resolved",
    comment: string,
    photo: string | null,
    completionDetails?: { beforePhoto?: string; afterPhoto?: string; voiceNote?: string }
  ) => void;
}

const REPAIR_BEFORE_SAMPLES = [
  { name: "Damaged Asphalt / Pothole", url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80" },
  { name: "Burst Water Main Leak", url: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80" },
  { name: "Fallen Tree Branch Hazard", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80" }
];

const REPAIR_AFTER_SAMPLES = [
  { name: "Pavement Poured & Hot-Sealed", url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80" },
  { name: "Pressure Collar Installed & Tested", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80" },
  { name: "Debris Cleared & Site Capped", url: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&auto=format&fit=crop&q=80" }
];

export default function FieldWorkerApp({
  complaints,
  worker,
  onAcceptJob,
  onUpdateComplaintStatus,
}: FieldWorkerAppProps) {
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineSyncQueue, setOfflineSyncQueue] = useState<any[]>([]);
  
  // Navigation tabs: "available" | "my_jobs" | "resolved"
  const [activeTab, setActiveTab] = useState<"available" | "my_jobs" | "resolved">("available");
  
  // Detail views for active task
  const [selectedTask, setSelectedTask] = useState<Complaint | null>(null);
  const [detailSubTab, setDetailSubTab] = useState<"nav" | "proof">("nav");

  // Modals & Drawers
  const [showCallModal, setShowCallModal] = useState(false);
  const [showAINotesModal, setShowAINotesModal] = useState(false);

  // Real-time Traffic ETA State Engine
  const [trafficLevel, setTrafficLevel] = useState<"clear" | "moderate" | "heavy">("moderate");
  const [liveDistanceKm, setLiveDistanceKm] = useState<number>(1.2);
  const [liveEtaMins, setLiveEtaMins] = useState<number>(10);
  const [isUpdatingEta, setIsUpdatingEta] = useState(false);

  // Completion Form State
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [proofComment, setProofComment] = useState("");
  const [proofLoading, setProofLoading] = useState(false);

  // Voice Note Recording Simulator State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordedVoiceNote, setRecordedVoiceNote] = useState<string | null>(null);
  const [recordTimeSeconds, setRecordTimeSeconds] = useState(0);

  // Timer effect for voice recording
  useEffect(() => {
    let timer: any = null;
    if (isRecordingVoice) {
      timer = setInterval(() => {
        setRecordTimeSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  // Recalculate ETA when traffic level or task changes
  useEffect(() => {
    if (!selectedTask) return;
    setIsUpdatingEta(true);
    const baseKm = 1.4;
    let factor = 1.0;
    if (trafficLevel === "clear") factor = 0.7;
    if (trafficLevel === "heavy") factor = 1.8;

    const computedEta = Math.round((baseKm / 0.15) * factor);
    
    const timer = setTimeout(() => {
      setLiveDistanceKm(baseKm);
      setLiveEtaMins(computedEta);
      setIsUpdatingEta(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [trafficLevel, selectedTask]);

  // Filter complaints
  // 1. Available Jobs: Complaints that are Pending or Unassigned
  const availableJobs = complaints.filter(
    (c) => c.status === "Pending" || (!c.assignedWorkerId && c.status !== "Resolved")
  );

  // 2. My Active Jobs: Assigned or Accepted or In Progress by this worker
  const myActiveJobs = complaints.filter(
    (c) => (c.assignedWorkerId === worker.id || c.assignedWorkerName === worker.name) && c.status !== "Resolved"
  );

  // 3. Resolved Jobs
  const myCompletedTasks = complaints.filter(
    (c) => (c.assignedWorkerId === worker.id || c.assignedWorkerName === worker.name) && c.status === "Resolved"
  );

  // Actions
  const handleAcceptJobClick = (c: Complaint) => {
    if (onAcceptJob) {
      onAcceptJob(c.id);
    } else {
      onUpdateComplaintStatus(c.id, "Accepted", `${worker.name} accepted job from field queue.`, null);
    }
    setSelectedTask({ ...c, status: "Accepted", assignedWorkerId: worker.id, assignedWorkerName: worker.name });
    setActiveTab("my_jobs");
    setDetailSubTab("nav");
  };

  const handleStartTask = () => {
    if (!selectedTask) return;
    if (offlineMode) {
      setOfflineSyncQueue((prev) => [...prev, { id: selectedTask.id, action: "In Progress", comment: "Task started offline." }]);
      selectedTask.status = "In Progress";
    } else {
      onUpdateComplaintStatus(selectedTask.id, "In Progress", `${worker.name} arrived on site and initiated repairs.`, null);
    }
    setSelectedTask({ ...selectedTask, status: "In Progress" });
  };

  const handleToggleVoiceRecord = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      setRecordedVoiceNote(`Audio Note recorded (${recordTimeSeconds}s): Site cleared, no structural pipe fracture detected.`);
    } else {
      setRecordTimeSeconds(0);
      setIsRecordingVoice(true);
    }
  };

  const handleMarkResolved = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setProofLoading(true);
    setTimeout(() => {
      const finalAfter = afterPhoto || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80";
      const finalBefore = beforePhoto || selectedTask.images[0] || "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80";
      const finalComment = proofComment || "Infrastructure asset repaired, tested under load, and verified clean.";

      if (offlineMode) {
        setOfflineSyncQueue((prev) => [
          ...prev,
          {
            id: selectedTask.id,
            action: "Resolved",
            comment: finalComment,
            photo: finalAfter,
            details: { beforePhoto: finalBefore, afterPhoto: finalAfter, voiceNote: recordedVoiceNote || undefined }
          }
        ]);
        selectedTask.status = "Resolved";
      } else {
        onUpdateComplaintStatus(selectedTask.id, "Resolved", finalComment, finalAfter, {
          beforePhoto: finalBefore,
          afterPhoto: finalAfter,
          voiceNote: recordedVoiceNote || undefined
        });
      }

      setProofLoading(false);
      setProofComment("");
      setBeforePhoto(null);
      setAfterPhoto(null);
      setRecordedVoiceNote(null);
      setSelectedTask(null);
      setActiveTab("my_jobs");
    }, 1000);
  };

  const triggerOfflineSync = () => {
    if (offlineSyncQueue.length === 0) return;
    offlineSyncQueue.forEach((item) => {
      onUpdateComplaintStatus(item.id, item.action, item.comment, item.photo || null, item.details);
    });
    setOfflineSyncQueue([]);
    alert("Offline Queue Synced! Packet data submitted to BMC Command Center.");
  };

  return (
    <div className="w-full bg-slate-100 rounded-3xl border border-slate-300 shadow-xl overflow-hidden flex flex-col font-sans min-h-[720px] max-w-2xl mx-auto">
      
      {/* HEADER: Field Crew Mobile Operating Terminal */}
      <div className="bg-slate-950 text-white p-4 border-b border-slate-800 sticky top-0 z-20 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={worker.avatar} alt={worker.name} className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-500 shadow-md" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-black text-white tracking-tight">{worker.name}</h4>
                <span className="bg-blue-900/80 text-blue-300 border border-blue-700/50 text-[9px] px-2 py-0.2 rounded-full font-mono font-bold uppercase">
                  VERIFIED CREW
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[210px] sm:max-w-xs">{worker.role}</p>
            </div>
          </div>

          {/* Offline Mode Switch */}
          <button
            onClick={() => {
              if (offlineMode) {
                setOfflineMode(false);
                triggerOfflineSync();
              } else {
                setOfflineMode(true);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
              offlineMode
                ? "bg-red-950/80 text-red-400 border-red-800 hover:bg-red-900"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850"
            }`}
          >
            {offlineMode ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                <span>OFFLINE ({offlineSyncQueue.length})</span>
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                <span>ONLINE</span>
              </>
            )}
          </button>
        </div>

        {/* Operational Stats Bar */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/90 border border-slate-800/80 p-2.5 rounded-2xl text-center text-[10px] font-mono">
          <div>
            <span className="text-slate-400 block text-[9px] uppercase">Available</span>
            <span className="text-amber-400 font-extrabold text-xs">{availableJobs.length} Jobs</span>
          </div>
          <div className="border-x border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase">My Active</span>
            <span className="text-blue-400 font-extrabold text-xs">{myActiveJobs.length} Mission</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px] uppercase">Completed</span>
            <span className="text-emerald-400 font-extrabold text-xs">{myCompletedTasks.length} Fixed</span>
          </div>
        </div>
      </div>

      {/* Offline Mode Banner */}
      {offlineMode && (
        <div className="bg-red-600 text-white p-2 text-center text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-inner">
          <AlertTriangle className="h-3.5 w-3.5 animate-bounce" />
          <span>OFFLINE DISPATCH MODE • {offlineSyncQueue.length} packet actions cached</span>
        </div>
      )}

      {/* MAIN NAVIGATION TAB SWITCHER */}
      {!selectedTask && (
        <div className="bg-white border-b border-slate-200 p-1.5 flex items-center gap-1 font-mono text-xs shadow-2xs">
          <button
            onClick={() => setActiveTab("available")}
            className={`flex-1 py-2.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[11px] ${
              activeTab === "available"
                ? "bg-gov-blue text-white shadow-md font-black"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Available Jobs ({availableJobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("my_jobs")}
            className={`flex-1 py-2.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[11px] ${
              activeTab === "my_jobs"
                ? "bg-gov-blue text-white shadow-md font-black"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>My Jobs ({myActiveJobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("resolved")}
            className={`py-2.5 px-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[11px] ${
              activeTab === "resolved"
                ? "bg-emerald-600 text-white shadow-md font-black"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Done ({myCompletedTasks.length})</span>
          </button>
        </div>
      )}

      {/* BODY CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">

        {/* ================= TAB 1: AVAILABLE JOBS QUEUE ================= */}
        {!selectedTask && activeTab === "available" && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-900 font-medium">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600 shrink-0 animate-pulse" />
                <span className="text-[11px] font-bold">Unassigned Municipal Field Queue • Tap to inspect & accept</span>
              </div>
              <span className="text-[10px] font-mono bg-amber-200/80 px-2 py-0.5 rounded-full font-bold">
                Auto-Triage Active
              </span>
            </div>

            {availableJobs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-2xs">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h5 className="font-bold text-sm text-slate-800">Queue Clear!</h5>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  No pending citizen complaints in your sector require immediate dispatch.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {availableJobs.map((c) => {
                  let badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
                  if (c.aiAnalysis.severity === "Critical") badgeColor = "bg-red-100 text-red-800 border-red-300";
                  if (c.aiAnalysis.severity === "High") badgeColor = "bg-orange-100 text-orange-800 border-orange-300";

                  return (
                    <div
                      key={c.id}
                      className="bg-white border border-slate-200 hover:border-gov-blue rounded-3xl p-4 space-y-3.5 shadow-2xs hover:shadow-md transition-all relative overflow-hidden"
                    >
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400 font-bold">{c.id}</span>
                            <span className={`text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                              {c.aiAnalysis.severity} • Score {c.aiAnalysis.priorityScore}/100
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-gov-blue px-2.5 py-1 rounded-xl border border-blue-200 shrink-0">
                          {c.category}
                        </span>
                      </div>

                      {/* Photo + AI Summary Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Image Preview */}
                        <div className="sm:col-span-1 rounded-2xl overflow-hidden border border-slate-200 h-28 relative bg-slate-100">
                          <img
                            src={c.images[0] || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80"}
                            alt={c.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded-md">
                            Citizen Media
                          </span>
                        </div>

                        {/* Details & AI Summary */}
                        <div className="sm:col-span-2 space-y-2 text-xs">
                          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 space-y-1">
                            <span className="text-[9px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-gov-blue" />
                              <span>AI Automated Triage Summary:</span>
                            </span>
                            <p className="text-[11px] text-slate-700 italic leading-relaxed line-clamp-2">
                              "{c.aiAnalysis.reasoning}"
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-600">
                            <div className="bg-slate-100 p-2 rounded-xl border border-slate-200 flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-blue-600" />
                              <span>Est. Work: <strong>{c.aiAnalysis.timeToRepairHours || 1.5}h</strong></span>
                            </div>
                            <div className="bg-slate-100 p-2 rounded-xl border border-slate-200 flex items-center gap-1.5">
                              <Compass className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Distance: <strong>0.8 km</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Location & Accept Action Row */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono truncate">
                          <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAcceptJobClick(c)}
                          className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
                        >
                          <CheckSquare className="h-4 w-4" />
                          <span>ACCEPT JOB ORDER</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: MY JOBS (ACTIVE DISPATCHES) ================= */}
        {!selectedTask && activeTab === "my_jobs" && (
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
              Assigned & Active Missions ({myActiveJobs.length})
            </h4>

            {myActiveJobs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-2">
                <p className="text-xs font-bold text-slate-700">No active work orders accepted.</p>
                <p className="text-[11px] text-slate-400">Switch to "Available Jobs" tab to accept a new work order.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myActiveJobs.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTask(t);
                      setDetailSubTab("nav");
                    }}
                    className="bg-white border-2 border-gov-blue/30 hover:border-gov-blue rounded-3xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400 font-bold">{t.id}</span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border ${
                        t.status === "In Progress"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-blue-100 text-blue-800 border-blue-300"
                      }`}>
                        {t.status === "In Progress" ? "🔨 In Progress" : "🚀 Accepted / En Route"}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900">{t.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{t.description}</p>

                    <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2 font-mono">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-red-500" />
                        <span className="truncate max-w-[180px]">{t.address}</span>
                      </div>
                      <span className="text-gov-blue font-bold flex items-center gap-1 uppercase text-[10px]">
                        <span>Open Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: RESOLVED TODAY ================= */}
        {!selectedTask && activeTab === "resolved" && (
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
              Completed Repairs Ledger ({myCompletedTasks.length})
            </h4>

            {myCompletedTasks.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-1 text-slate-400">
                <CheckCircle className="h-8 w-8 mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-bold text-slate-600">No completed jobs yet today.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myCompletedTasks.map((t) => (
                  <div key={t.id} className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{t.id}</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold uppercase font-mono">
                        ✓ Verified Complete
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-800">{t.title}</h5>
                    {t.rating && (
                      <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl text-xs flex items-center justify-between">
                        <span className="font-bold text-amber-900 text-[11px]">Citizen Rating:</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          {"★".repeat(t.rating.stars)} ({t.rating.stars}.0)
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= DETAILED MISSION WORKSPACE (SELECTED TASK) ================= */}
        {selectedTask && (
          <div className="space-y-4">
            
            {/* Top Navigation Bar back button */}
            <div className="bg-white p-3.5 border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Job Queue</span>
              </button>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">{selectedTask.id}</span>
                <span className="text-xs font-extrabold text-slate-800">{selectedTask.category}</span>
              </div>
            </div>

            {/* Quick Action Navigation Bar */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setDetailSubTab("nav")}
                className={`py-2.5 px-2 rounded-2xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                  detailSubTab === "nav"
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Navigation className="h-4 w-4 text-blue-400" />
                <span>Navigate</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCallModal(true)}
                className="py-2.5 px-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-2xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer"
              >
                <Phone className="h-4 w-4 text-emerald-600" />
                <span>Call Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAINotesModal(true)}
                className="py-2.5 px-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-2xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer"
              >
                <Shield className="h-4 w-4 text-gov-blue" />
                <span>AI Notes</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailSubTab("proof")}
                className={`py-2.5 px-2 rounded-2xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                  detailSubTab === "proof"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Complete</span>
              </button>
            </div>

            {/* ================= SUBTAB: NAVIGATION & REAL-TIME TRAFFIC ETA ================= */}
            {detailSubTab === "nav" && (
              <div className="space-y-4">
                
                {/* REAL-TIME TRAFFIC ETA INDICATOR CARD */}
                <div className="bg-slate-900 text-white p-4 rounded-3xl space-y-3.5 shadow-xl border border-slate-800 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-blue-400" />
                      <div>
                        <h5 className="text-xs font-black uppercase font-mono tracking-wider text-blue-300">
                          Real-Time Live Traffic ETA
                        </h5>
                        <p className="text-[10px] text-slate-400">GPS Navigation telemetry feed</p>
                      </div>
                    </div>
                    {isUpdatingEta && (
                      <span className="text-[10px] text-emerald-400 font-mono animate-pulse flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" /> Live Recalculating...
                      </span>
                    )}
                  </div>

                  {/* Big ETA Display */}
                  <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Estimated Arrival:</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-white tracking-tight">{liveEtaMins} mins</span>
                        <span className="text-xs font-bold text-slate-400 font-mono">({liveDistanceKm} km)</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase font-mono block">Corridor Traffic:</span>
                      <span className={`text-xs font-extrabold uppercase font-mono px-2.5 py-0.5 rounded-full border ${
                        trafficLevel === "clear"
                          ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                          : trafficLevel === "moderate"
                          ? "bg-amber-950 text-amber-400 border-amber-800"
                          : "bg-red-950 text-red-400 border-red-800"
                      }`}>
                        {trafficLevel === "clear" && "🟢 Clear Flow"}
                        {trafficLevel === "moderate" && "🟡 Moderate (+2m)"}
                        {trafficLevel === "heavy" && "🔴 Bottleneck (+6m)"}
                      </span>
                    </div>
                  </div>

                  {/* Traffic Mode Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">
                      Simulate Traffic Condition:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTrafficLevel("clear")}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold font-mono transition-all border cursor-pointer ${
                          trafficLevel === "clear"
                            ? "bg-emerald-600 text-white border-emerald-400"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        Clear Highway
                      </button>

                      <button
                        type="button"
                        onClick={() => setTrafficLevel("moderate")}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold font-mono transition-all border cursor-pointer ${
                          trafficLevel === "moderate"
                            ? "bg-amber-600 text-white border-amber-400"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        Normal Traffic
                      </button>

                      <button
                        type="button"
                        onClick={() => setTrafficLevel("heavy")}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold font-mono transition-all border cursor-pointer ${
                          trafficLevel === "heavy"
                            ? "bg-red-600 text-white border-red-400"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        Heavy Monsoon
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulated Vector Navigation Route Map */}
                <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
                  <span className="text-xs font-bold text-slate-800 font-mono uppercase block">Turn-By-Turn Route Preview:</span>
                  
                  <div className="relative h-36 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 400 140">
                      <rect width="400" height="140" fill="#f1f5f9" />
                      {/* Roads */}
                      <path d="M 0,70 L 400,70" stroke="#cbd5e1" strokeWidth="16" />
                      <path d="M 200,0 L 200,140" stroke="#cbd5e1" strokeWidth="16" />
                      
                      {/* Active Route Path */}
                      <path d="M 50,70 L 200,70 L 200,120 L 320,120" fill="none" stroke="#2563eb" strokeWidth="6" strokeDasharray="8 4" className="animate-pulse" />
                      
                      {/* Crew Marker */}
                      <circle cx="50" cy="70" r="7" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                      
                      {/* Destination Marker */}
                      <circle cx="320" cy="120" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="320" cy="120" r="18" fill="none" stroke="#ef4444" strokeWidth="1.5" className="animate-ping" />
                    </svg>

                    <div className="absolute top-2 left-2 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-mono border border-white/20">
                      📍 Next Turn: Right onto SV Road (180m)
                    </div>
                  </div>
                </div>

                {/* Task Details & State Button */}
                <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
                  <h5 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                    {selectedTask.title}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">{selectedTask.description}</p>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Location Address:</span>
                    <span className="font-bold text-slate-800">{selectedTask.address}</span>
                  </div>

                  {/* Start Work / Mark Complete Action Buttons */}
                  {selectedTask.status === "Accepted" || selectedTask.status === "Assigned" ? (
                    <button
                      type="button"
                      onClick={handleStartTask}
                      className="w-full py-3.5 bg-gov-blue hover:bg-gov-blue-hover text-white font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="h-4 w-4" />
                      <span>START ON-SITE REPAIR WORK</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDetailSubTab("proof")}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>WORK UNDERWAY • SUBMIT COMPLETION PROOF</span>
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* ================= SUBTAB: COMPLETION PROOF FORM ================= */}
            {detailSubTab === "proof" && (
              <form onSubmit={handleMarkResolved} className="space-y-4">
                
                {/* 1. BEFORE PHOTO SELECTION */}
                <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
                  <span className="text-xs font-bold font-mono text-slate-800 uppercase block">1. Before Repair Photo:</span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {REPAIR_BEFORE_SAMPLES.map((r, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setBeforePhoto(r.url)}
                        className={`border rounded-2xl overflow-hidden text-left bg-slate-50 transition-all cursor-pointer ${
                          beforePhoto === r.url ? "border-blue-600 ring-2 ring-blue-500/20 shadow-md" : "border-slate-200"
                        }`}
                      >
                        <img src={r.url} alt={r.name} className="w-full h-12 object-cover" />
                        <span className="p-1.5 text-[8px] font-bold text-slate-700 block truncate">{r.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. AFTER PHOTO SELECTION */}
                <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
                  <span className="text-xs font-bold font-mono text-slate-800 uppercase block">2. After Completion Photo:</span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {REPAIR_AFTER_SAMPLES.map((r, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAfterPhoto(r.url)}
                        className={`border rounded-2xl overflow-hidden text-left bg-slate-50 transition-all cursor-pointer ${
                          afterPhoto === r.url ? "border-emerald-600 ring-2 ring-emerald-500/20 shadow-md" : "border-slate-200"
                        }`}
                      >
                        <img src={r.url} alt={r.name} className="w-full h-12 object-cover" />
                        <span className="p-1.5 text-[8px] font-bold text-slate-700 block truncate">{r.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. VOICE NOTE RECORDING SIMULATOR */}
                <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
                  <span className="text-xs font-bold font-mono text-slate-800 uppercase block">3. Field Crew Audio Voice Note:</span>
                  
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                    <button
                      type="button"
                      onClick={handleToggleVoiceRecord}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isRecordingVoice
                          ? "bg-red-600 text-white animate-pulse"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      <Mic className="h-4 w-4" />
                      <span>{isRecordingVoice ? `Recording (${recordTimeSeconds}s)...` : "Record Voice Note"}</span>
                    </button>

                    {recordedVoiceNote && (
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl font-bold">
                        ✓ Audio Saved
                      </span>
                    )}
                  </div>

                  {recordedVoiceNote && (
                    <p className="text-xs text-slate-600 bg-blue-50 border border-blue-200 p-2.5 rounded-xl italic">
                      "{recordedVoiceNote}"
                    </p>
                  )}
                </div>

                {/* 4. COMPLETION COMMENTS */}
                <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-2 shadow-2xs">
                  <label className="text-xs font-bold font-mono text-slate-800 uppercase block">4. Work Completion Summary:</label>
                  <textarea
                    value={proofComment}
                    onChange={(e) => setProofComment(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-sans resize-none"
                    placeholder="e.g., Road surface filled with hot-mix asphalt and compacted with roller. Safety barricades removed."
                    required
                  ></textarea>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={proofLoading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
                >
                  {proofLoading ? (
                    <span>Archiving Proof & Notifying Citizen...</span>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>MARK JOB AS COMPLETED</span>
                    </>
                  )}
                </button>

              </form>
            )}

          </div>
        )}

      </div>

      {/* CALL CITIZEN MODAL */}
      {showCallModal && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <Phone className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Calling Citizen Contact</h4>
              <p className="text-xs text-slate-500 mt-0.5">Direct phone patch via BMC Dispatch Center</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left text-xs font-mono space-y-1">
              <div><span className="text-slate-400">Reporter:</span> <strong className="text-slate-800">{selectedTask.reportedBy || "Citizen Resident"}</strong></div>
              <div><span className="text-slate-400">Number:</span> <strong className="text-blue-600">+91 98200 12345</strong></div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  alert(`Calling +91 98200 12345... (Simulated phone connection established)`);
                  setShowCallModal(false);
                }}
                className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-2xl text-xs hover:bg-emerald-700 transition-all cursor-pointer"
              >
                Dial Now
              </button>
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW AI NOTES MODAL */}
      {showAINotesModal && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gov-blue" />
                <h4 className="text-sm font-bold font-mono uppercase text-blue-300">AI Diagnostic Ledger</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAINotesModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono text-slate-300">
              <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-500 uppercase block">Threat Severity:</span>
                  <span className="text-red-400 font-bold">{selectedTask.aiAnalysis.severity}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">Confidence Score:</span>
                  <span className="text-emerald-400 font-bold">{Math.round(selectedTask.aiAnalysis.confidence * 100)}%</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Reasoning Analysis:</span>
                <p className="font-sans text-slate-200 bg-slate-950 p-3 rounded-2xl border border-slate-800 leading-relaxed italic">
                  "{selectedTask.aiAnalysis.reasoning}"
                </p>
              </div>

              <div className="bg-blue-950/60 border border-blue-900/60 p-3 rounded-2xl text-[11px] text-blue-200 space-y-1">
                <span className="font-bold block uppercase text-[9px] text-blue-400">Safety Precautions Required:</span>
                <p className="font-sans">Deploy traffic cones 15 meters prior to repair zone. High-visibility vest required.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAINotesModal(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs font-mono uppercase transition-all cursor-pointer"
            >
              Close Diagnostic Drawer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
