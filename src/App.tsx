import React, { useState, useEffect, useMemo } from "react";
import { IssueReport, Contributor, DashboardStats, IssueCategory, Hotspot } from "./types";
import BlueprintMap from "./components/BlueprintMap";
import IssueFeed from "./components/IssueFeed";
import TimelineView from "./components/TimelineView";
import ReportIssueForm from "./components/ReportIssueForm";
import ImpactDashboard from "./components/ImpactDashboard";
import LeaderboardBoard from "./components/LeaderboardBoard";
import UserProfile from "./components/UserProfile";
import { ClipboardList, Map as MapIcon, PlusSquare, BarChart2, Users, User, Compass, Flame, AlertCircle, Sparkles, LogOut, Radio, RefreshCw } from "lucide-react";

type ActiveTab = "FEED" | "MAP" | "REPORT" | "STATS" | "LEADERBOARD" | "PROFILE";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("FEED");
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedReport, setSelectedReport] = useState<IssueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // User Profile Identification State
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("Srushti Babar");
  const [userEmail, setUserEmail] = useState("srushtibabar.s@gmail.com");

  // User Location (default: center of Sprocket District)
  const [userLocation, setUserLocation] = useState({ lat: 37.8050, lng: -122.2700 });

  // Coordinates from Map double clicks to prefill report form
  const [prefilledCoords, setPrefilledCoords] = useState<{ lat: number; lng: number; areaName: string } | null>(null);

  // Initialize and load user identity from localstorage on mount
  useEffect(() => {
    let storedId = localStorage.getItem("fmh_user_id");
    if (!storedId) {
      storedId = `usr-${Math.floor(100000 + Math.random() * 900000)}`;
      localStorage.setItem("fmh_user_id", storedId);
    }
    setUserId(storedId);

    const storedName = localStorage.getItem("fmh_name");
    const storedEmail = localStorage.getItem("fmh_email");
    if (storedName) setUserName(storedName);
    if (storedEmail) setUserEmail(storedEmail);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Using default Sprocket District central coordinates:", error);
        }
      );
    }

    fetchCoreData();
  }, []);

  // Fetch API registries
  const fetchCoreData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [reportsRes, contribsRes, statsRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/contributors"),
        fetch("/api/stats"),
      ]);

      if (!reportsRes.ok || !contribsRes.ok || !statsRes.ok) {
        throw new Error("Failed to pull municipal ledger streams.");
      }

      const reportsData = await reportsRes.json();
      const contribsData = await contribsRes.json();
      const statsData = await statsRes.json();

      setReports(reportsData);
      setContributors(contribsData);
      setStats(statsData);

      // Sync active selected report if it's currently open in logbook
      setSelectedReport((prev) => {
        if (!prev) return null;
        const updated = reportsData.find((r: IssueReport) => r.id === prev.id);
        return updated || prev;
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Telemetry connection error: Failed to fetch registers. Verify your network or server status.");
    } finally {
      setLoading(false);
    }
  };

  // Submit confirmation / upvote presence
  const handleConfirmIssue = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userEmail,
          userName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Endorsement rejected.");
      }

      // Re-fetch instantly for immediate state updates in feeds
      await fetchCoreData();
    } catch (err: any) {
      alert(err.message || "Failed to confirm presence.");
    }
  };

  // Submit resolution before/after verification
  const handleResolveIssue = async (reportId: string, resolutionMediaBase64: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolutionMedia: resolutionMediaBase64,
          resolutionMediaType: "image",
          userEmail,
          userName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI resolution verification failed.");
      }

      // Refresh data
      await fetchCoreData();
      return { success: data.isResolved, explanation: data.explanation };
    } catch (err: any) {
      console.error(err);
      return { success: false, explanation: err.message || "Server connection error." };
    }
  };

  // Save profile and update state
  const handleSaveProfile = (name: string, email: string) => {
    setUserName(name);
    setUserEmail(email);
    localStorage.setItem("fmh_name", name);
    localStorage.setItem("fmh_email", email);

    // Re-fetch to synchronize leaderboard names/emails or add new user entry
    fetchCoreData();
  };

  // Handle map selection coordinates
  const handleMapClickPrefill = (lat: number, lng: number, areaName: string) => {
    setPrefilledCoords({ lat, lng, areaName });
    setActiveTab("REPORT"); // Swap tab to forms
  };

  // Clear prefilled coords after form consumption
  const handleFormSubmitted = () => {
    setPrefilledCoords(null);
    setActiveTab("FEED"); // Return to list view
    fetchCoreData();
  };

  // Compute hotspots sidebar lists for map view
  const mapHotspots = useMemo(() => {
    const computed: { category: IssueCategory; areaName: string; count: number; lat: number; lng: number }[] = [];
    const categories: IssueCategory[] = ["Pothole", "Streetlight", "Waste", "Water Leakage", "Other"];

    categories.forEach((cat) => {
      const catReports = reports.filter((r) => r.category === cat && r.status !== "RESOLVED");
      const usedIds = new Set<string>();

      catReports.forEach((r1) => {
        if (usedIds.has(r1.id)) return;

        const cluster = catReports.filter((r2) => {
          const latDiff = r1.lat - r2.lat;
          const lngDiff = r1.lng - r2.lng;
          const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
          return dist <= 0.0018; // ~200m
        });

        if (cluster.length >= 3) {
          cluster.forEach((c) => usedIds.add(c.id));
          computed.push({
            category: cat,
            areaName: r1.areaName,
            count: cluster.length,
            lat: r1.lat,
            lng: r1.lng,
          });
        }
      });
    });

    return computed;
  }, [reports]);

  return (
    <div className="min-h-screen bg-blueprint flex flex-col border-4 md:border-8 border-blueprint font-sans selection:bg-safety-orange selection:text-stencil-white">
      {/* Top Ledger Ribbon Signage - Bold Typography Theme */}
      <header className="bg-blueprint border-b-2 border-pencil-grey/60 px-6 py-5 select-none flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4">
          {/* Municipal Ticker Brand */}
          <div className="flex flex-col sm:flex-row items-baseline gap-3 text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter uppercase leading-none text-stencil-white font-space">
              FIXMYHOOD
            </h1>
            <span className="text-[10px] font-mono text-safety-orange/90 tracking-widest font-bold uppercase sm:border-l sm:border-pencil-grey/40 sm:pl-3">
              // SECTOR-07 MUNICIPAL LEDGER v2.5
            </span>
          </div>

          {/* Connected User Badge Indicator */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 font-mono text-[10px] uppercase text-stencil-white font-bold bg-blueprint-grid border border-pencil-grey/30 py-2 px-4 shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-1.5">
              <span className="opacity-50">STATUS:</span> 
              <span className="text-safety-orange flex items-center gap-1 font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-safety-orange animate-ping" />
                ACTIVE MONITORING
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="opacity-50">LOC:</span> 
              <span className="text-stamped-cream font-extrabold">37.8044 N / 122.2712 W</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="opacity-50">AGENT:</span> 
              <span className="text-stencil-white font-extrabold bg-safety-orange/15 px-1.5 py-0.5 border border-safety-orange/20 text-[9px]">{userName.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tab Index Navigation (Sleek Folder/Blueprinted TABS style) */}
      <nav className="bg-blueprint/45 px-6 py-3 select-none flex-shrink-0 border-b-2 border-pencil-grey/60">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2.5">
          {[
            { id: "FEED", label: "01. DOCKET FEED", icon: ClipboardList },
            { id: "MAP", label: "02. BLUEPRINT MAP", icon: MapIcon },
            { id: "REPORT", label: "03. REGISTER CLAIM", icon: PlusSquare },
            { id: "STATS", label: "04. PERFORMANCE LEDGER", icon: BarChart2 },
            { id: "LEADERBOARD", label: "05. WALL OF FIXERS", icon: Users },
            { id: "PROFILE", label: "06. IDENTITY CARD", icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as ActiveTab);
                  setSelectedReport(null); // Close sidebar on shift
                }}
                className={`font-space tracking-tight text-xs md:text-sm px-4.5 py-3 border-2 transition-all flex items-center gap-2 uppercase font-bold cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  isActive
                    ? "bg-safety-orange text-stencil-white border-safety-orange shadow-[0_4px_12px_rgba(232,99,28,0.25)]"
                    : "bg-stamped-cream text-blueprint border-pencil-grey/80 hover:bg-stamped-cream/90 hover:border-blueprint"
                }`}
                style={{ borderRadius: "0px" }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Primary Workstation */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex gap-4 overflow-hidden relative">
        
        {/* Network Error Alert */}
        {errorMsg && (
          <div className="absolute top-2 left-4 right-4 bg-safety-orange border-2 border-stamped-cream p-3 flex items-start gap-2 text-stencil-white z-50 shadow-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-mono text-[11px] leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Render Active View Segment */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading && reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-safety-orange animate-spin" />
              <p className="font-space text-stamped-cream tracking-wide text-lg uppercase font-extrabold">OPENING DOCKET FILES...</p>
              <p className="font-mono text-[10px] text-pencil-grey">Synchronizing with sector 4 database ledger.</p>
            </div>
          ) : (
            <>
              {/* Tab: FEED */}
              {activeTab === "FEED" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                  <div className="lg:col-span-2">
                    <IssueFeed
                      reports={reports}
                      currentUserId={userId}
                      onConfirmIssue={handleConfirmIssue}
                      onSelectIssue={(r) => setSelectedReport(r)}
                      selectedIssueId={selectedReport?.id}
                      userLocation={userLocation}
                    />
                  </div>
                  {/* Side brief instructions */}
                  <div className="bg-stamped-cream text-blueprint p-4 border border-pencil-grey/40 space-y-3" style={{ borderRadius: "0" }}>
                    <h3 className="font-space tracking-tight text-xs border-b border-pencil-grey/20 pb-1.5 flex items-center gap-1.5 font-extrabold uppercase">
                      <Compass className="w-4 h-4 text-safety-orange" />
                      MUNICIPAL DECREES
                    </h3>
                    <ul className="font-sans text-[11px] space-y-2 leading-relaxed text-blueprint/90 list-disc pl-3">
                      <li>Use search and filters to locate logged disorders across streets.</li>
                      <li>Endorse active defects you see. At <strong>5 endorsements</strong>, status is auto-verified for fast repair.</li>
                      <li>Remediated defects must pass a visual audit by the <strong>Gemini-3.5-Flash inspector</strong> before closing.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab: MAP */}
              {activeTab === "MAP" && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                  <div className="lg:col-span-3">
                    <BlueprintMap
                      reports={reports}
                      selectedReportId={selectedReport?.id}
                      onSelectReport={(r) => setSelectedReport(r)}
                      onMapClick={handleMapClickPrefill}
                      currentUserId={userId}
                      userLocation={userLocation}
                      onConfirmIssue={handleConfirmIssue}
                    />
                  </div>
                  
                  {/* Hotspots Predictive Analytics Sidebar */}
                  <div className="bg-stamped-cream text-blueprint p-4 border border-pencil-grey/40 space-y-4 h-[580px] overflow-y-auto" style={{ borderRadius: "0" }}>
                    <div className="border-b border-pencil-grey/30 pb-2 flex items-center gap-1.5 text-safety-orange">
                      <Flame className="w-4.5 h-4.5 animate-pulse" />
                      <h3 className="font-space text-xs tracking-tight font-extrabold uppercase">RECURRING HOTSPOTS</h3>
                    </div>
                    
                    <p className="font-sans text-[10px] text-pencil-grey leading-relaxed">
                      AI mapping of clusters with 3+ matching active reports within a 200m grid overlay.
                    </p>

                    <div className="space-y-3">
                      {mapHotspots.map((hs, idx) => (
                        <div key={idx} className="border border-safety-orange/40 p-2.5 bg-safety-orange/5 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="px-1.5 py-0.5 bg-safety-orange text-stencil-white font-mono text-[8.5px] font-bold">
                              {hs.category.toUpperCase()} CLUSTER
                            </span>
                            <span className="font-mono text-[9px] text-safety-orange font-extrabold flex items-center gap-0.5">
                              <Radio className="w-3 h-3 animate-ping" />
                              {hs.count} DISORDERS
                            </span>
                          </div>
                          
                          <p className="font-sans font-bold text-[11px] text-blueprint leading-tight uppercase">
                            {hs.areaName} WARD
                          </p>
                          <p className="font-mono text-[8px] text-pencil-grey leading-none">
                            GPS CENTER: {hs.lat.toFixed(4)}°N, {Math.abs(hs.lng).toFixed(4)}°W
                          </p>
                        </div>
                      ))}

                      {mapHotspots.length === 0 && (
                        <div className="text-center py-6 border border-dashed border-pencil-grey/20">
                          <span className="font-stencil text-[10px] text-pencil-grey">NO CRITICAL HOTSPOTS FLAGGED</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: REPORT FORM */}
              {activeTab === "REPORT" && (
                <ReportIssueForm
                  prefilledLat={prefilledCoords?.lat}
                  prefilledLng={prefilledCoords?.lng}
                  prefilledAreaName={prefilledCoords?.areaName}
                  onReportSuccess={handleFormSubmitted}
                />
              )}

              {/* Tab: STATS */}
              {activeTab === "STATS" && stats && (
                <ImpactDashboard stats={stats} />
              )}

              {/* Tab: LEADERBOARD */}
              {activeTab === "LEADERBOARD" && (
                <LeaderboardBoard
                  contributors={contributors}
                  currentUserEmail={userEmail}
                />
              )}

              {/* Tab: PROFILE */}
              {activeTab === "PROFILE" && (
                <UserProfile
                  contributors={contributors}
                  currentUserName={userName}
                  currentUserEmail={userEmail}
                  onSaveProfile={handleSaveProfile}
                />
              )}
            </>
          )}
        </div>

        {/* Sidebar Logbook Slider Drawer */}
        {selectedReport && (
          <div className="w-[380px] h-full absolute lg:relative right-4 top-4 bottom-4 lg:right-0 lg:top-0 lg:bottom-0 z-40 flex-shrink-0">
            <TimelineView
              report={selectedReport}
              onClose={() => setSelectedReport(null)}
              onResolveIssue={handleResolveIssue}
              currentUserId={userId}
              userLocation={userLocation}
              onConfirmIssue={handleConfirmIssue}
            />
          </div>
        )}
      </main>

      {/* Footer System Credits */}
      <footer className="bg-blueprint border-t border-pencil-grey/30 py-3.5 px-4 text-center select-none flex-shrink-0">
        <p className="font-mono text-[9px] text-pencil-grey tracking-wider uppercase">
          STENCIL WORKS & MUNICIPAL RECORDS DIVISION // FIXED HOOD CORP SYSTEM // ALL CITIZEN CONTRIBUTIONS CERTIFIED
        </p>
      </footer>
    </div>
  );
}
