/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { MapPin, Users, Flame, Navigation, AlertTriangle, Layers, Globe, Map as MapIcon } from "lucide-react";
import { Complaint, FieldWorker } from "../types";
import { Language } from "../utils/translations";

interface SmartCityMapProps {
  complaints?: Complaint[];
  workers?: FieldWorker[];
  selectedComplaintId?: string | null;
  onSelectComplaint?: (id: string) => void;
  interactiveMode?: boolean; // If true, citizen can click to drop pin
  manualPin?: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
  showHeatmap?: boolean;
  showClusters?: boolean;
  showWorkers?: boolean;
  showTraffic?: boolean;
  showPriorityZones?: boolean;
  heightClass?: string;
  lang?: Language;
  initialMapMode?: "street" | "satellite";
  onMapModeChange?: (mode: "street" | "satellite") => void;
}

export default function SmartCityMap({
  complaints = [],
  workers = [],
  selectedComplaintId = null,
  onSelectComplaint,
  interactiveMode = false,
  manualPin = null,
  onMapClick,
  showHeatmap = true,
  showClusters = true,
  showWorkers = true,
  showTraffic = false,
  showPriorityZones = true,
  heightClass = "h-[450px]",
  lang = "en",
  initialMapMode = "street",
  onMapModeChange,
}: SmartCityMapProps) {
  const [mapMode, setMapMode] = useState<"street" | "satellite">(initialMapMode);

  const toggleMapMode = () => {
    const nextMode = mapMode === "street" ? "satellite" : "street";
    setMapMode(nextMode);
    if (onMapModeChange) {
      onMapModeChange(nextMode);
    }
  };

  const [hoveredEntity, setHoveredEntity] = useState<{
    x: number;
    y: number;
    title: string;
    type: "complaint" | "worker" | "pin";
    detail?: string;
  } | null>(null);

  // Constants for Mumbai Map Bounding Coordinates
  const minLat = 19.0000;
  const maxLat = 19.1600;
  const minLng = 72.8100;
  const maxLng = 72.9500;

  const mapCoordsToSvg = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 800;
    const y = 600 - ((lat - minLat) / (maxLat - minLat)) * 600;
    return { x, y };
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactiveMode || !onMapClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Scale back to viewBox coordinates (800x600)
    const svgX = (clickX / rect.width) * 800;
    const svgY = (clickY / rect.height) * 600;

    // Convert SVG x,y back to Lat, Lng
    const lng = minLng + (svgX / 800) * (maxLng - minLng);
    const lat = minLat + ((600 - svgY) / 600) * (maxLat - minLat);

    // Round for clean coordinate printing
    onMapClick(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
  };

  // Predefined vector layouts representing Mumbai Coastline, Mithi River, and Powai Lake
  const coastlineAndSea = [
    // Arabian Sea Coastline on the West (Left side)
    "M 0,0 L 160,0 L 190,140 L 140,280 L 110,400 L 170,520 L 220,600 L 0,600 Z"
  ];

  const lakesAndRivers = [
    // Powai Lake (Top Right area)
    { cx: 580, cy: 150, rx: 45, ry: 30, label: lang === "hi" ? "पवई झील" : "Powai Lake" },
    // Mithi River Stream
    { path: "M 560,180 Q 420,260 380,340 T 180,420", label: lang === "hi" ? "मीठी नदी" : "Mithi River" }
  ];

  const greenZones = [
    // Aarey Colony / Sanjay Gandhi Park Forest Zone
    { x: 500, y: 30, w: 260, h: 100, label: lang === "hi" ? "आरे कॉलोनी / पार्क" : "Aarey Forest Reserve" }
  ];

  const mainRoads = [
    // Western Express Highway (WEH - Main Diagonal North-South Corridor)
    { path: "M 480,0 L 440,180 L 380,320 L 320,460 L 280,600", label: "Western Express Hwy", traffic: "heavy" },
    // Eastern Express Highway (EEH - East side)
    { path: "M 680,0 L 640,200 L 580,400 L 520,600", label: "Eastern Express Hwy", traffic: "moderate" },
    // S.V. Road & Link Road (Coastal Arterial)
    { path: "M 280,0 L 260,190 L 220,380 L 240,600", label: "S.V. Road / Link Rd", traffic: "jammed" },
    // LBS Marg (Central East Suburbs)
    { path: "M 580,0 L 540,220 L 480,450 L 440,600", label: "LBS Marg", traffic: "heavy" },
    // Bandra-Worli Sea Link Connector
    { path: "M 150,420 C 180,460 220,490 260,510", label: "Sea Link", traffic: "light" }
  ];

  const priorityZones = [
    // WEH Andheri Traffic & Pothole Hazard Zone
    {
      points: "360,140 480,150 460,230 340,210",
      name: lang === "hi" ? "अंधेरी ई-वार्ड सड़क सुरक्षा गलियारा" : "Andheri K-East Pothole Corridor",
      color: "rgba(249, 115, 22, 0.08)",
      stroke: "#F97316"
    },
    // Kurla Low-lying Monsoon Flood Plain
    {
      points: "420,310 540,320 520,410 400,400",
      name: lang === "hi" ? "कुर्ला एल-वार्ड जलभराव क्षेत्र" : "Kurla L-Ward Low-lying Flood Zone",
      color: "rgba(37, 99, 235, 0.08)",
      stroke: "#2563EB"
    }
  ];

  return (
    <div className="relative w-full border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col shadow-xs font-sans">
      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-2 max-w-[210px]">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          <Layers className="h-4 w-4 text-[#1565C0]" />
          <span>{lang === "hi" ? "मुंबई वार्ड नक्शा" : "BMC Ward Map Legend"}</span>
        </div>
        <div className="space-y-1.5 text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span>{lang === "hi" ? "गंभीर समस्या (Critical)" : "Critical Incident"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span>{lang === "hi" ? "उच्च जोखिम (High)" : "High Severity"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>{lang === "hi" ? "मध्यम जोखिम (Medium)" : "Medium Severity"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>{lang === "hi" ? "समाधान हुआ (Resolved)" : "Resolved"}</span>
          </div>
          {showWorkers && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1565C0] animate-pulse inline-block"></span>
              <span>{lang === "hi" ? "बीएमसी टीम (लाइव)" : "BMC Worker (Live)"}</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Container */}
      <div className={`relative w-full ${heightClass} overflow-hidden cursor-crosshair`}>
        {/* Floating Action Button for Map Mode Toggle (Street View vs Satellite) */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-slate-900/90 text-white backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-xl">
          <button
            type="button"
            onClick={toggleMapMode}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mapMode === "street"
                ? "bg-gov-blue text-white shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
            title="Switch to Vector Street View"
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span>Street View</span>
          </button>
          <button
            type="button"
            onClick={toggleMapMode}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mapMode === "satellite"
                ? "bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400/40"
                : "text-slate-300 hover:text-white"
            }`}
            title="Switch to High-Res Satellite Imagery"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Satellite Mode</span>
          </button>
        </div>

        {/* Satellite Indicator Badge (when in satellite mode) */}
        {mapMode === "satellite" && (
          <div className="absolute bottom-10 left-3 z-10 bg-slate-950/80 text-emerald-400 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>🛰️ HD Orbit Scan • 0.3m Imagery</span>
          </div>
        )}

        <svg
          viewBox="0 0 800 600"
          className="w-full h-full select-none"
          onClick={handleMapClick}
        >
          {/* Map Grid Patterns */}
          <defs>
            <pattern id="grid-mumbai" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={mapMode === "satellite" ? "#1e293b" : "#E2E8F0"} strokeWidth="0.5" />
            </pattern>
            {/* Satellite Terrain Texture Pattern */}
            <pattern id="sat-buildings" width="60" height="60" patternUnits="userSpaceOnUse">
              <rect width="60" height="60" fill="#0f172a" />
              <rect x="5" y="5" width="18" height="18" fill="#1e293b" opacity="0.6" rx="2" />
              <rect x="28" y="8" width="24" height="14" fill="#1e293b" opacity="0.5" rx="2" />
              <rect x="8" y="30" width="20" height="22" fill="#1e293b" opacity="0.7" rx="2" />
              <rect x="34" y="28" width="18" height="24" fill="#1e293b" opacity="0.6" rx="2" />
              <path d="M 0 0 L 60 60 M 60 0 L 0 60" stroke="#101c2e" strokeWidth="1" opacity="0.3" />
            </pattern>
            <radialGradient id="heat-grad-mumbai" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#F97316" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Canvas Background */}
          <rect
            width="800"
            height="600"
            fill={mapMode === "satellite" ? "url(#sat-buildings)" : "url(#grid-mumbai)"}
          />

          {/* Arabian Sea Coastline */}
          {coastlineAndSea.map((pathStr, idx) => (
            <path
              key={`sea-${idx}`}
              d={pathStr}
              fill={mapMode === "satellite" ? "#032b43" : "#E0F2FE"}
              stroke={mapMode === "satellite" ? "#0284c7" : "#BAE6FD"}
              strokeWidth={mapMode === "satellite" ? "2" : "1.5"}
            />
          ))}

          {/* Powai Lake & Mithi River */}
          {lakesAndRivers.map((item, idx) => {
            if ("cx" in item) {
              return (
                <g key={`lake-${idx}`}>
                  <ellipse
                    cx={item.cx}
                    cy={item.cy}
                    rx={item.rx}
                    ry={item.ry}
                    fill={mapMode === "satellite" ? "#0284c7" : "#38BDF8"}
                    opacity={mapMode === "satellite" ? "0.85" : "0.6"}
                    stroke={mapMode === "satellite" ? "#38bdf8" : "#0284C7"}
                    strokeWidth="1.5"
                  />
                  <text
                    x={item.cx}
                    y={item.cy + 3}
                    fill={mapMode === "satellite" ? "#f0f9ff" : "#0369A1"}
                    fontSize="10"
                    fontWeight="700"
                    textAnchor="middle"
                    className="font-sans"
                  >
                    {item.label}
                  </text>
                </g>
              );
            }
            return (
              <g key={`river-${idx}`}>
                <path
                  d={item.path}
                  fill="none"
                  stroke={mapMode === "satellite" ? "#0284c7" : "#0284C7"}
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity={mapMode === "satellite" ? "0.9" : "0.7"}
                />
              </g>
            );
          })}

          {/* Forest & Park Reserve */}
          {greenZones.map((gZone, idx) => (
            <g key={`park-${idx}`}>
              <rect
                x={gZone.x}
                y={gZone.y}
                width={gZone.w}
                height={gZone.h}
                fill={mapMode === "satellite" ? "#064e3b" : "#DCFCE7"}
                rx="8"
                stroke={mapMode === "satellite" ? "#059669" : "#BBF7D0"}
                strokeWidth="1.5"
                opacity={mapMode === "satellite" ? "0.9" : "1"}
              />
              <text
                x={gZone.x + gZone.w / 2}
                y={gZone.y + gZone.h / 2}
                fill={mapMode === "satellite" ? "#a7f3d0" : "#15803D"}
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                className="font-sans"
              >
                {gZone.label}
              </text>
            </g>
          ))}

          {/* Priority Safety/Incident Zones */}
          {showPriorityZones && priorityZones.map((z, idx) => (
            <g key={`zone-${idx}`}>
              <polygon points={z.points} fill={z.color} stroke={z.stroke} strokeWidth="1.5" strokeDasharray="4 3" />
              <text
                x={idx === 0 ? 380 : 430}
                y={idx === 0 ? 180 : 360}
                fill={mapMode === "satellite" ? "#fdba74" : z.stroke}
                fontSize="9"
                fontWeight="700"
                className="font-mono uppercase tracking-wider"
              >
                ⚠️ {z.name}
              </text>
            </g>
          ))}

          {/* Main Roads */}
          {mainRoads.map((road, idx) => {
            let color = mapMode === "satellite" ? "#f59e0b" : "#FFFFFF";
            let width = 10;
            if (showTraffic) {
              if (road.traffic === "heavy") { color = "#F97316"; width = 12; }
              else if (road.traffic === "jammed") { color = "#EF4444"; width = 12; }
              else { color = "#10B981"; }
            }
            return (
              <g key={`road-${idx}`}>
                {/* Road Casing */}
                <path
                  d={road.path}
                  fill="none"
                  stroke={mapMode === "satellite" ? "#334155" : "#CBD5E1"}
                  strokeWidth={width + 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Active Road surface */}
                <path
                  d={road.path}
                  fill="none"
                  stroke={color}
                  strokeWidth={width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={mapMode === "satellite" ? "12 4" : undefined}
                />
              </g>
            );
          })}

          {/* Text Labels for Mumbai Locations */}
          <text x="420" y="70" fill={mapMode === "satellite" ? "#f8fafc" : "#475569"} fontSize="10" fontWeight="700" className="font-sans">Andheri East</text>
          <text x="210" y="320" fill={mapMode === "satellite" ? "#f8fafc" : "#475569"} fontSize="10" fontWeight="700" className="font-sans">Bandra West</text>
          <text x="450" y="370" fill={mapMode === "satellite" ? "#f8fafc" : "#475569"} fontSize="10" fontWeight="700" className="font-sans">Kurla West</text>
          <text x="310" y="520" fill={mapMode === "satellite" ? "#f8fafc" : "#475569"} fontSize="10" fontWeight="700" className="font-sans">Dadar East</text>
          <text x="600" y="190" fill={mapMode === "satellite" ? "#f8fafc" : "#475569"} fontSize="10" fontWeight="700" className="font-sans">Powai</text>

          {/* Heatmap Layer */}
          {showHeatmap && complaints.map((c) => {
            if (c.aiAnalysis.isDuplicate) return null;
            if (c.aiAnalysis.severity !== "Critical" && c.aiAnalysis.severity !== "High") return null;
            const { x, y } = mapCoordsToSvg(c.latitude, c.longitude);
            return (
              <circle
                key={`heat-${c.id}`}
                cx={x}
                cy={y}
                r={c.aiAnalysis.severity === "Critical" ? 55 : 35}
                fill="url(#heat-grad-mumbai)"
                className="pointer-events-none"
              />
            );
          })}

          {/* Complaint Clusters */}
          {showClusters && (
            <g>
              <circle cx="415" cy="182" r="30" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="3 3 animate-pulse" />
              <rect x="385" y="200" width="60" height="15" rx="4" fill="#6366F1" />
              <text x="415" y="211" fill="#FFFFFF" fontSize="9" fontWeight="700" textAnchor="middle" className="font-mono">
                CLUSTER (2)
              </text>
            </g>
          )}

          {/* Active Incident Pins */}
          {complaints.map((c) => {
            const { x, y } = mapCoordsToSvg(c.latitude, c.longitude);
            const isSelected = selectedComplaintId === c.id;

            let pinColor = "#3B82F6"; // Low
            if (c.status === "Resolved") pinColor = "#10B981"; // Resolved green
            else if (c.aiAnalysis.severity === "Critical") pinColor = "#EF4444"; // Critical Red
            else if (c.aiAnalysis.severity === "High") pinColor = "#F97316"; // High Orange
            else if (c.aiAnalysis.severity === "Medium") pinColor = "#F59E0B"; // Yellow

            if (c.aiAnalysis.isDuplicate) {
              return (
                <g
                  key={c.id}
                  className="cursor-pointer group"
                  onClick={() => onSelectComplaint && onSelectComplaint(c.id)}
                  onMouseEnter={() => setHoveredEntity({ x, y: y - 10, title: "Duplicate Report Merged", type: "complaint", detail: `${c.id}: Merged under primary report.` })}
                  onMouseLeave={() => setHoveredEntity(null)}
                >
                  <circle cx={x + 5} cy={y + 5} r="5" fill="#94A3B8" stroke="#FFFFFF" strokeWidth="1" />
                </g>
              );
            }

            return (
              <g
                key={c.id}
                className="cursor-pointer"
                onClick={() => onSelectComplaint && onSelectComplaint(c.id)}
                onMouseEnter={() => setHoveredEntity({
                  x,
                  y: y - 12,
                  title: `${c.id}: ${c.category}`,
                  type: "complaint",
                  detail: `${c.title}\nPriority Score: ${c.aiAnalysis.priorityScore}/100`
                })}
                onMouseLeave={() => setHoveredEntity(null)}
              >
                {isSelected && (
                  <circle cx={x} cy={y} r="16" fill="none" stroke={pinColor} strokeWidth="2">
                    <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                <ellipse cx={x} cy={y + 3} rx="4" ry="1.5" fill="rgba(0,0,0,0.2)" />

                <path
                  d="M 8,0 C 8,4.5 3.5,9 0,14 C -3.5,9 -8,4.5 -8,0 C -8,-4.5 -3.5,-8 0,-8 C 3.5,-8 8,-4.5 8,0 Z"
                  transform={`translate(${x}, ${y})`}
                  fill={pinColor}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="transition-transform duration-200 hover:scale-125"
                />

                <circle cx={x} cy={y} r="3" fill="#FFFFFF" />
              </g>
            );
          })}

          {/* Live Field Workers tracking */}
          {showWorkers && workers.map((w) => {
            if (w.status === "Offline") return null;
            const { x, y } = mapCoordsToSvg(w.currentLat, w.currentLng);
            return (
              <g
                key={w.id}
                onMouseEnter={() => setHoveredEntity({
                  x,
                  y: y - 14,
                  title: `${w.name} (${w.role})`,
                  type: "worker",
                  detail: `Dept: ${w.department}\nStatus: ${w.status}`
                })}
                onMouseLeave={() => setHoveredEntity(null)}
              >
                <circle cx={x} cy={y} r="12" fill="none" stroke="#1565C0" strokeWidth="1" opacity="0.6">
                  <animate attributeName="r" values="4;15" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0" dur="3s" repeatCount="indefinite" />
                </circle>

                <circle cx={x} cy={y} r="6.5" fill="#1565C0" stroke="#FFFFFF" strokeWidth="1.5" />
                <path d="M -3,-3 L 3,3 M 3,-3 L -3,3" stroke="#FFFFFF" strokeWidth="1" transform={`translate(${x}, ${y})`} />
              </g>
            );
          })}

          {/* Citizen Manual GPS Pin */}
          {manualPin && (
            <g
              onMouseEnter={() => setHoveredEntity({
                x: mapCoordsToSvg(manualPin.lat, manualPin.lng).x,
                y: mapCoordsToSvg(manualPin.lat, manualPin.lng).y - 12,
                title: "Selected GPS Anchor",
                type: "pin",
                detail: `Lat: ${manualPin.lat}, Lng: ${manualPin.lng}`
              })}
              onMouseLeave={() => setHoveredEntity(null)}
            >
              <circle
                cx={mapCoordsToSvg(manualPin.lat, manualPin.lng).x}
                cy={mapCoordsToSvg(manualPin.lat, manualPin.lng).y}
                r="18"
                fill="none"
                stroke="#1565C0"
                strokeWidth="2"
                strokeDasharray="3 2 animate-spin"
              />
              <path
                d="M 10,0 C 10,5.5 4.5,11 0,18 C -4.5,11 -10,5.5 -10,0 C -10,-5.5 -4.5,-10 0,-10 C 4.5,-10 10,-5.5 10,0 Z"
                transform={`translate(${mapCoordsToSvg(manualPin.lat, manualPin.lng).x}, ${mapCoordsToSvg(manualPin.lat, manualPin.lng).y})`}
                fill="#1565C0"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <circle
                cx={mapCoordsToSvg(manualPin.lat, manualPin.lng).x}
                cy={mapCoordsToSvg(manualPin.lat, manualPin.lng).y}
                r="4"
                fill="#FFFFFF"
              />
            </g>
          )}
        </svg>

        {/* Hover / Tooltip HUD element */}
        {hoveredEntity && (
          <div
            className="absolute z-20 bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs pointer-events-none transition-all font-sans border border-slate-700"
            style={{
              left: `${(hoveredEntity.x / 800) * 100}%`,
              top: `${(hoveredEntity.y / 600) * 100}%`,
              transform: "translate(-50%, -100%)",
              marginTop: "-8px"
            }}
          >
            <div className="font-bold flex items-center gap-1.5 text-blue-300">
              {hoveredEntity.type === "complaint" && <MapPin className="h-3.5 w-3.5" />}
              {hoveredEntity.type === "worker" && <Users className="h-3.5 w-3.5" />}
              {hoveredEntity.type === "pin" && <Navigation className="h-3.5 w-3.5" />}
              <span>{hoveredEntity.title}</span>
            </div>
            {hoveredEntity.detail && (
              <div className="text-[11px] text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed max-w-[220px]">
                {hoveredEntity.detail}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mini control panel bar */}
      <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-[#1565C0]" />
          <span className="text-slate-800 font-mono text-[11px]">
            {lang === "hi" ? "सीमाएं: मुंबई बीएमसी क्षेत्र (19.00°N से 19.16°N)" : "Boundaries: Mumbai BMC Zone (19.00°N to 19.16°N)"}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono uppercase bg-slate-100 px-2 py-0.5 rounded-md font-bold">
          BMC Vector Map Layer v2.0
        </div>
      </div>
    </div>
  );
}
