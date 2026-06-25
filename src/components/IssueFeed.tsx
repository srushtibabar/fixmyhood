import React, { useState, useMemo } from "react";
import { IssueReport, IssueCategory, IssueStatus } from "../types";
import { Search, MapPin, Eye, ThumbsUp, Calendar, Clock, Image as ImageIcon, Video, ArrowRight, ShieldCheck, Download, FileSpreadsheet, FileJson } from "lucide-react";

interface IssueFeedProps {
  reports: IssueReport[];
  currentUserId: string;
  userLocation: { lat: number; lng: number };
  onConfirmIssue: (reportId: string) => void;
  onSelectIssue: (report: IssueReport) => void;
  selectedIssueId?: string;
}

const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function IssueFeed({
  reports,
  currentUserId,
  userLocation,
  onConfirmIssue,
  onSelectIssue,
  selectedIssueId,
}: IssueFeedProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | "ALL">("ALL");
  const [selectedArea, setSelectedArea] = useState<string>("ALL");

  // Export filtered docket list to CSV
  const downloadCSV = () => {
    const headers = ["ID", "Category", "Status", "Area Name", "Latitude", "Longitude", "Confirm Count", "Created At", "Description"];
    const rows = sortedAndFilteredReports.map(r => {
      const sanitizedArea = r.areaName.replace(/"/g, '""');
      const sanitizedDesc = r.description.replace(/"/g, '""');
      return [
        r.id,
        r.category,
        r.status,
        `"${sanitizedArea}"`,
        r.lat,
        r.lng,
        r.confirmCount,
        r.createdAt,
        `"${sanitizedDesc}"`
      ];
    });
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FMH_DOCKET_INDEX_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export filtered docket list to JSON
  const downloadJSON = () => {
    const jsonContent = JSON.stringify(sortedAndFilteredReports, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FMH_DOCKET_INDEX_${new Date().toISOString().slice(0, 10)}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get unique areas for filter list
  const areas = useMemo(() => {
    const list = reports.map((r) => r.areaName);
    return ["ALL", ...Array.from(new Set(list))];
  }, [reports]);

  // Filter and Sort reports (high priority unresolved sorted to the top)
  const sortedAndFilteredReports = useMemo(() => {
    const filtered = reports.filter((r) => {
      const matchSearch =
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.areaName.toLowerCase().includes(search.toLowerCase());
      
      const matchCategory = selectedCategory === "ALL" || r.category === selectedCategory;
      const matchStatus = selectedStatus === "ALL" || r.status === selectedStatus;
      const matchArea = selectedArea === "ALL" || r.areaName === selectedArea;

      return matchSearch && matchCategory && matchStatus && matchArea;
    });

    // Sort: High priority active (confirmCount >= 6 and status !== 'RESOLVED') first
    return [...filtered].sort((a, b) => {
      const aHp = a.confirmCount >= 6 && a.status !== "RESOLVED" ? 1 : 0;
      const bHp = b.confirmCount >= 6 && b.status !== "RESOLVED" ? 1 : 0;
      if (aHp !== bHp) {
        return bHp - aHp; // High-priority active comes first
      }
      // Keep descending date order as secondary sort
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reports, search, selectedCategory, selectedStatus, selectedArea]);

  // Style categories
  const getCategoryBadgeClass = (cat: IssueCategory) => {
    switch (cat) {
      case "Pothole":
        return "bg-safety-orange/10 text-safety-orange border border-safety-orange/30";
      case "Streetlight":
        return "bg-amber-500/10 text-amber-600 border border-amber-500/30";
      case "Waste":
        return "bg-amber-800/10 text-amber-800 border border-amber-800/30";
      case "Water Leakage":
        return "bg-teal-600/10 text-teal-700 border border-teal-600/30";
      default:
        return "bg-zinc-600/10 text-zinc-700 border border-zinc-500/30";
    }
  };

  // Stamp styling depending on status and confirmCount
  const getStampStyles = (status: IssueStatus, confirmCount: number) => {
    if (status === "RESOLVED") {
      return {
        text: "RESOLVED",
        colorClass: "text-verified-green border-verified-green bg-stamped-cream/90 shadow-[0_0_10px_rgba(74,124,89,0.1)]",
        rotation: "rotate-[-6deg]",
      };
    }
    if (confirmCount >= 6) {
      return {
        text: "URGENT // HIGH PRIORITY",
        colorClass: "text-red-600 border-red-600 bg-stamped-cream/90 shadow-[0_0_10px_rgba(220,38,38,0.15)]",
        rotation: "rotate-[4deg]",
      };
    }
    switch (status) {
      case "VERIFIED":
        return {
          text: "VERIFIED",
          colorClass: "text-safety-orange border-safety-orange bg-stamped-cream/90 shadow-[0_0_10px_rgba(232,99,28,0.1)]",
          rotation: "rotate-[5deg]",
        };
      default:
        return {
          text: "ROUTED",
          colorClass: "text-blueprint/80 border-blueprint/60 bg-stamped-cream/90",
          rotation: "rotate-[-2deg]",
        };
    }
  };

  // Convert date format
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Ledger Filter System - Bold Typography styling */}
      <div className="bg-stamped-cream text-blueprint p-6 border-2 border-pencil-grey shadow-[4px_4px_0px_0px_rgba(27,42,63,1)]">
        <div className="flex items-center gap-2 border-b-2 border-pencil-grey pb-3.5 mb-5">
          <Search className="w-5 h-5 text-safety-orange" />
          <span className="font-space tracking-tight text-base font-extrabold uppercase">LEDGER SEARCH & FILTER REGISTRY</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search ID, Description, Area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-blueprint/5 border-2 border-pencil-grey p-3 font-sans text-xs focus:outline-none focus:border-safety-orange focus:ring-1 focus:ring-safety-orange text-blueprint font-semibold placeholder:text-pencil-grey/70 transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full bg-blueprint/5 border-2 border-pencil-grey p-3 font-mono text-xs focus:outline-none focus:border-safety-orange focus:ring-1 focus:ring-safety-orange text-blueprint font-bold transition-all cursor-pointer"
            >
              <option value="ALL">ALL CATEGORIES</option>
              <option value="Pothole">POTHOLE</option>
              <option value="Streetlight">STREETLIGHT</option>
              <option value="Waste">WASTE MANAGEMENT</option>
              <option value="Water Leakage">WATER LEAKAGE</option>
              <option value="Other">OTHER CIVIC ISSUES</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-blueprint/5 border-2 border-pencil-grey p-3 font-mono text-xs focus:outline-none focus:border-safety-orange focus:ring-1 focus:ring-safety-orange text-blueprint font-bold transition-all cursor-pointer"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="ROUTED">ROUTED (PENDING)</option>
              <option value="VERIFIED">VERIFIED (QUEUED)</option>
              <option value="RESOLVED">RESOLVED (COMPLETED)</option>
            </select>
          </div>

          {/* Area */}
          <div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full bg-blueprint/5 border-2 border-pencil-grey p-3 font-mono text-xs focus:outline-none focus:border-safety-orange focus:ring-1 focus:ring-safety-orange text-blueprint font-bold transition-all cursor-pointer"
            >
              <option value="ALL">ALL AREAS</option>
              {areas.filter((a) => a !== "ALL").map((area) => (
                <option key={area} value={area}>{area.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Found Label & Export Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-1">
        <span className="font-mono text-xs text-stencil-white uppercase tracking-wider font-bold">
          ENTRIES LOGGED: {sortedAndFilteredReports.length} OF {reports.length}
        </span>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <span className="font-mono text-[9px] text-pencil-grey uppercase font-bold mr-1 hidden md:inline">LEDGER UTILITY:</span>
          <button
            onClick={downloadCSV}
            title="Download formatted CSV spreadsheet"
            className="flex-1 sm:flex-none font-space text-[10px] font-extrabold px-3 py-1.5 bg-stamped-cream text-blueprint border-2 border-pencil-grey hover:bg-safety-orange hover:text-stencil-white hover:border-safety-orange transition-all cursor-pointer flex items-center justify-center gap-1.5"
            style={{ borderRadius: "0px" }}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>EXPORT CSV INDEX</span>
          </button>
          <button
            onClick={downloadJSON}
            title="Download raw JSON docket stream"
            className="flex-1 sm:flex-none font-space text-[10px] font-extrabold px-3 py-1.5 bg-stamped-cream text-blueprint border-2 border-pencil-grey hover:bg-safety-orange hover:text-stencil-white hover:border-safety-orange transition-all cursor-pointer flex items-center justify-center gap-1.5"
            style={{ borderRadius: "0px" }}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>EXPORT JSON INDEX</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      {sortedAndFilteredReports.length === 0 ? (
        <div className="bg-stamped-cream/5 border-2 border-dashed border-pencil-grey py-12 text-center">
          <p className="font-space tracking-tight text-lg text-pencil-grey font-extrabold uppercase">NO CIVIC ENTRIES FOUND MATCHING REGISTRY FILTERS</p>
          <p className="font-mono text-[10px] text-pencil-grey mt-1">Check search syntax or adjust filter selections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedAndFilteredReports.map((r) => {
            const stamp = getStampStyles(r.status, r.confirmCount);
            const isConfirmedByMe = r.confirmedBy.includes(currentUserId);
            const isSelected = r.id === selectedIssueId;
            const distance = getDistanceInKm(userLocation.lat, userLocation.lng, r.lat, r.lng);
            const isLocal = distance <= 8.0;

            return (
              <div
                key={r.id}
                onClick={() => onSelectIssue(r)}
                className={`group relative bg-stamped-cream text-blueprint p-6 border-2 border-pencil-grey flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? "bg-[#FAF7F0] border-safety-orange shadow-[6px_6px_0px_0px_rgba(232,99,28,1)] -translate-y-1" 
                    : "hover:bg-[#FAF7F0] hover:shadow-[4px_4px_0px_0px_rgba(27,42,63,1)] hover:-translate-y-0.5"
                }`}
                style={{ borderRadius: "0px" }} // Rigid blueprint edges
              >
                {/* Ledger Sheet Header */}
                <div className="flex justify-between items-start border-b-2 border-pencil-grey/40 pb-3 mb-4">
                  <div className="font-mono text-[11px] text-pencil-grey flex flex-col leading-tight">
                    <span className="font-extrabold text-blueprint text-sm font-space">{r.id}</span>
                    <span className="mt-1">{formatDate(r.createdAt)} · {formatTime(r.createdAt)}</span>
                  </div>

                  {/* Stamped Status Badge */}
                  <div className="relative">
                    <div className={`stamp-badge animate-stamp-thump ${stamp.colorClass} ${stamp.rotation} text-[10px] font-extrabold tracking-widest`}>
                      {stamp.text}
                    </div>
                  </div>
                </div>

                {/* Media and Details Section */}
                <div className="flex gap-4 mb-4">
                  {/* Media Thumbnail */}
                  <div className="relative w-28 h-20 bg-blueprint/10 border-2 border-pencil-grey overflow-hidden flex-shrink-0">
                    <img
                      src={r.mediaUrl}
                      alt={r.category}
                      className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-300"
                    />
                    <div className="absolute bottom-1 right-1 bg-blueprint text-stamped-cream p-1 scale-75 border border-pencil-grey">
                      {r.mediaType === "video" ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    </div>
                  </div>

                  {/* Core Text */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-mono tracking-wider font-extrabold border ${getCategoryBadgeClass(r.category)}`}>
                        {r.category.toUpperCase()}
                      </span>
                      <span className="font-mono text-[10px] text-pencil-grey font-bold flex items-center gap-0.5 truncate">
                        <MapPin className="w-3 h-3 text-safety-orange" />
                        {r.areaName.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-space text-base font-extrabold tracking-tight text-blueprint leading-none uppercase">
                      {r.category === "Other" ? "CIVIC DISORDER" : r.category.toUpperCase()}
                    </h3>
                    <p className="font-sans text-xs text-blueprint/90 line-clamp-2 leading-relaxed font-medium">
                      {r.description}
                    </p>
                  </div>
                </div>

                {/* Footer Controls & Stats */}
                <div className="mt-auto border-t-2 border-pencil-grey/40 pt-3 flex items-center justify-between">
                  {/* Coordinates Monospace Log */}
                  <span className="font-mono text-[9px] text-pencil-grey font-bold">
                    GPS: {r.lat.toFixed(4)}°N, {Math.abs(r.lng).toFixed(4)}°W
                  </span>

                  {/* Confirmation / Inspect CTAs */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {isLocal ? (
                      <button
                        onClick={() => onConfirmIssue(r.id)}
                        disabled={isConfirmedByMe || r.status === "RESOLVED"}
                        className={`font-space text-[10px] sm:text-[11px] font-extrabold px-3 py-1.5 border-2 flex items-center gap-1.5 transition-all rotate-[-1deg] cursor-pointer ${
                          isConfirmedByMe
                            ? "bg-blueprint text-stamped-cream border-blueprint shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)] cursor-not-allowed opacity-90"
                            : r.status === "RESOLVED"
                            ? "bg-pencil-grey/10 text-pencil-grey/40 border-pencil-grey/20 cursor-not-allowed"
                            : "bg-transparent text-blueprint border-blueprint hover:bg-blueprint hover:text-stamped-cream active:scale-95"
                        }`}
                        style={{ borderRadius: "0" }}
                        title={isConfirmedByMe ? "You endorsed this civic issue." : "Verify presence of this issue."}
                      >
                        <span className="text-sm">🖎</span>
                        <span>{isConfirmedByMe ? "APPROVED" : "TALLY +1"}</span>
                        <span className={`px-1.5 py-0.5 text-[9.5px] font-mono leading-none ${
                          isConfirmedByMe ? "bg-stamped-cream text-blueprint font-black" : "bg-blueprint text-stamped-cream font-black"
                        }`}>
                          {r.confirmCount}
                        </span>
                      </button>
                    ) : (
                      <span className="font-mono text-[9px] text-pencil-grey font-extrabold uppercase tracking-wider px-2" title="Issue is outside your immediate local vicinity.">
                        OUT OF RANGE
                      </span>
                    )}

                    <button
                      onClick={() => onSelectIssue(r)}
                      className="font-space text-[10px] sm:text-[11px] font-extrabold px-3 py-1.5 bg-blueprint text-stencil-white border-2 border-blueprint hover:bg-safety-orange hover:border-safety-orange hover:text-stencil-white hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-1.5 cursor-pointer"
                      style={{ borderRadius: "0" }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>LOGBOOK</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
