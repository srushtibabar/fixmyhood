import React, { useState, useRef } from "react";
import { IssueReport, TimelineEvent } from "../types";
import { Clock, CheckCircle, AlertCircle, Camera, Check, RefreshCw, X, ArrowLeft, ArrowUpRight, HelpCircle, ShieldAlert, CheckCircle2 } from "lucide-react";

interface TimelineViewProps {
  report: IssueReport;
  onClose: () => void;
  onResolveIssue: (reportId: string, resolutionMediaBase64: string) => Promise<{ success: boolean; explanation: string }>;
  currentUserId: string;
  userLocation: { lat: number; lng: number };
  onConfirmIssue: (reportId: string) => void;
}

export default function TimelineView({
  report,
  onClose,
  onResolveIssue,
  currentUserId,
  userLocation,
  onConfirmIssue,
}: TimelineViewProps) {
  const [resolutionMedia, setResolutionMedia] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{ success: boolean; explanation: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Proximity helper
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

  const isConfirmedByMe = report.confirmedBy.includes(currentUserId);
  const distance = getDistanceInKm(userLocation.lat, userLocation.lng, report.lat, report.lng);

  // Conversion of uploaded file to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setResolutionMedia(reader.result as string);
      setAuditResult(null); // Clear previous audit result
    };
    reader.readAsDataURL(file);
  };

  // Pre-configured mock resolution images for speedy testing/hacking demo
  const mockResolutionImages = [
    {
      name: "Asphalt Patched Cleanly",
      url: "https://images.unsplash.com/photo-1542013936693-8848e5740475?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Sidewalk Waste Cleared",
      url: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=600&q=80"
    }
  ];

  const selectMockResolution = async (url: string) => {
    try {
      setIsAuditing(true);
      // Fetch the mock image and convert to Base64 to simulate a real upload to our backend
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setResolutionMedia(base64);
        
        // Trigger resolution api on backend
        const result = await onResolveIssue(report.id, base64);
        setAuditResult({ success: result.success, explanation: result.explanation });
        setIsAuditing(false);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error(e);
      setIsAuditing(false);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitResolution = async () => {
    if (!resolutionMedia) return;
    setIsAuditing(true);
    try {
      const result = await onResolveIssue(report.id, resolutionMedia);
      setAuditResult({ success: result.success, explanation: result.explanation });
    } catch (e) {
      console.error(e);
      setAuditResult({ success: false, explanation: "Server error during Gemini AI resolution audit." });
    } finally {
      setIsAuditing(false);
    }
  };

  const formatDateTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  };

  return (
    <div className="bg-stamped-cream text-blueprint border-2 border-pencil-grey shadow-xl flex flex-col h-full max-h-[700px] overflow-hidden select-none" style={{ borderRadius: "0px" }}>
      {/* Log Header */}
      <div className="bg-blueprint text-stencil-white px-4 py-3.5 flex items-center justify-between border-b-2 border-pencil-grey flex-shrink-0">
        <div className="flex items-center gap-2">
          <ArrowLeft className="w-4.5 h-4.5 cursor-pointer hover:text-safety-orange transition-colors" onClick={onClose} />
          <span className="font-space tracking-tight text-sm font-extrabold">CIVIC LEDGER LOG: {report.id}</span>
        </div>
        <button onClick={onClose} className="hover:text-safety-orange transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Core Dossier Details */}
        <div className="border-b-2 border-dashed border-pencil-grey/30 pb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 font-mono text-[9.5px] tracking-wider font-bold bg-blueprint text-stamped-cream">
                  {report.category.toUpperCase()}
                </span>
                
                {/* High Priority Stamp */}
                {report.confirmCount >= 6 && report.status !== "RESOLVED" && (
                  <span className="stamp-badge border-red-600 text-red-600 rotate-[-3deg] text-[9.5px] font-black tracking-wider bg-stamped-cream/50 py-0 px-1.5 border-dashed">
                    URGENT
                  </span>
                )}
                
                {/* Community Verified Stamp */}
                {report.status === "VERIFIED" && report.confirmCount === 5 && (
                  <span className="stamp-badge border-verified-green text-verified-green rotate-[2deg] text-[9.5px] font-black tracking-wider bg-stamped-cream/50 py-0 px-1.5 border-dashed">
                    VERIFIED
                  </span>
                )}
              </div>
              <h3 className="font-space text-xl text-blueprint uppercase tracking-tight font-extrabold mt-2">{report.areaName}</h3>
            </div>
            <div className="font-mono text-[9.5px] text-pencil-grey text-right font-bold leading-tight">
              <p>REPORTED BY: {report.reportedBy.toUpperCase()}</p>
              <p className="mt-1">COORDS: {report.lat.toFixed(4)}°N, {Math.abs(report.lng).toFixed(4)}°W</p>
            </div>
          </div>

          <p className="font-sans text-xs text-blueprint/95 leading-relaxed bg-blueprint/5 p-3.5 border-2 border-pencil-grey font-semibold mt-2">
            {report.description}
          </p>

          {/* Dossier Before Image */}
          <div className="mt-4 relative w-full h-44 bg-blueprint/10 border-2 border-pencil-grey overflow-hidden">
            <img src={report.mediaUrl} alt="Before remediation" className="w-full h-full object-cover grayscale brightness-90" />
            <div className="absolute top-2 left-2 bg-safety-orange text-stencil-white px-2 py-0.5 font-space text-[10px] tracking-wide font-extrabold uppercase">
              ORIGINAL FILING EVIDENCE
            </div>
          </div>

          {/* Community Tally Verification Button inside Dossier */}
          <div className="mt-4 flex justify-between items-center bg-blueprint/5 p-3 border-2 border-pencil-grey">
            <div className="font-mono text-[9px] text-pencil-grey flex flex-col font-bold">
              <span className="uppercase">LEDGER TALLY RECORD</span>
              <span>{report.confirmCount} CITIZEN ENDORSEMENTS</span>
            </div>
            
            {distance <= 8.0 ? (
              <button
                onClick={() => {
                  if (!isConfirmedByMe && report.status !== "RESOLVED") {
                    onConfirmIssue(report.id);
                  }
                }}
                disabled={isConfirmedByMe || report.status === "RESOLVED"}
                className={`font-stencil text-[11px] font-black px-3.5 py-1.5 border-2 flex items-center gap-1.5 transition-all cursor-pointer rotate-[-1deg] ${
                  isConfirmedByMe
                    ? "bg-blueprint text-stamped-cream border-blueprint shadow-inner cursor-not-allowed"
                    : report.status === "RESOLVED"
                    ? "bg-pencil-grey/10 text-pencil-grey/40 border-pencil-grey/20 cursor-not-allowed"
                    : "bg-transparent text-blueprint border-blueprint hover:bg-blueprint hover:text-stamped-cream hover:border-blueprint active:scale-95"
                }`}
                style={{ borderRadius: "0px" }}
              >
                <span>🖎</span>
                <span>{isConfirmedByMe ? "APPROVED" : "TALLY +1"}</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-mono leading-none ${
                  isConfirmedByMe ? "bg-stamped-cream text-blueprint" : "bg-blueprint text-stamped-cream"
                }`}>
                  {report.confirmCount}
                </span>
              </button>
            ) : (
              <span className="font-mono text-[9px] text-pencil-grey font-bold uppercase tracking-wider px-2" title="Issue is outside your immediate vicinity.">
                OUT OF RANGE
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Timeline Registry */}
        <div className="space-y-4">
          <h4 className="font-space tracking-tight text-xs border-b-2 border-pencil-grey/40 pb-1.5 flex items-center gap-1.5 text-blueprint font-extrabold uppercase">
            <Clock className="w-4 h-4 text-safety-orange" />
            OFFICIAL LOGBOOK TIMELINE
          </h4>

          <div className="relative pl-5 border-l-2 border-pencil-grey/60 ml-2 space-y-5">
            {report.timeline.map((event, idx) => (
              <div key={event.id || idx} className="relative group">
                {/* Timeline node marker */}
                <div className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-stamped-cream flex items-center justify-center ${
                  event.status === "RESOLVED"
                    ? "bg-verified-green"
                    : event.status === "VERIFIED"
                    ? "bg-safety-orange"
                    : "bg-blueprint"
                }`} />

                <div className="font-mono text-[9px] text-pencil-grey font-bold">
                  {formatDateTime(event.timestamp)} {event.user && `· AGENT: ${event.user.toUpperCase()}`}
                </div>
                <h5 className="font-sans font-black text-xs text-blueprint uppercase tracking-wide mt-0.5">{event.title}</h5>
                <p className="font-sans text-[11px] text-blueprint/80 leading-relaxed max-w-sm font-semibold">
                  {event.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Resolved Stamped Area if Completed */}
        {report.status === "RESOLVED" && report.resolutionMediaUrl ? (
          <div className="bg-verified-green/10 border-2 border-verified-green p-4 space-y-3 relative overflow-hidden">
            <div className="absolute top-2 right-2 stamp-badge text-verified-green border-verified-green rotate-[-6deg] text-[10px] font-extrabold tracking-widest bg-emerald-50 px-2 py-1">
              AUDITED RESOLVED
            </div>
            
            <h4 className="font-space text-verified-green text-xs tracking-tight font-extrabold uppercase flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              VERIFIED RESOLUTION MEDIA
            </h4>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="space-y-1">
                <span className="font-mono text-[8.5px] text-pencil-grey block font-bold">BEFORE (ORIGINAL)</span>
                <div className="h-24 bg-blueprint/10 border-2 border-pencil-grey overflow-hidden">
                  <img src={report.mediaUrl} alt="Before" className="w-full h-full object-cover grayscale" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[8.5px] text-pencil-grey block font-bold">AFTER (REMEDIATION)</span>
                <div className="h-24 bg-blueprint/10 border-2 border-pencil-grey overflow-hidden">
                  <img src={report.resolutionMediaUrl} alt="After" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            <p className="font-sans text-[10px] text-blueprint/95 leading-relaxed bg-stamped-cream/50 p-2.5 border-2 border-verified-green font-bold">
              <strong>RESOLUTION TIMESTAMP:</strong> {formatDateTime(report.resolvedAt || "")}
            </p>
          </div>
        ) : (
          /* Resolution Audit Form */
          <div className="border-t-2 border-dashed border-pencil-grey/30 pt-4 space-y-3.5">
            <h4 className="font-space tracking-tight text-xs flex items-center gap-1.5 text-safety-orange font-extrabold uppercase">
              <Camera className="w-4.5 h-4.5" />
              AI-VERIFIED RESOLUTION AUDIT
            </h4>
            <p className="font-sans text-[10px] text-pencil-grey leading-relaxed font-semibold">
              Re-mounted a fix? Upload a photo of the resolved site. The server-side Gemini 3.5 Flash engine will audit the comparison to confirm resolution.
            </p>

            {/* Upload Area */}
            <div className="space-y-3.5">
              <div className="flex gap-2">
                <button
                  onClick={handleTriggerUpload}
                  disabled={isAuditing}
                  className="flex-1 font-space text-[10.5px] p-4 border-2 border-dashed border-pencil-grey hover:border-safety-orange hover:bg-blueprint/5 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 font-extrabold transition-colors"
                >
                  <Camera className="w-6 h-6 text-pencil-grey animate-pulse" />
                  <span>UPLOAD SITE REPAIR PHOTO</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Quick Demo Preloads */}
              <div className="space-y-1.5">
                <span className="font-mono text-[9px] text-pencil-grey block font-bold">HACKATHON QUICK-FILL:</span>
                <div className="flex flex-wrap gap-1.5">
                  {mockResolutionImages.map((img) => (
                    <button
                      key={img.name}
                      onClick={() => selectMockResolution(img.url)}
                      disabled={isAuditing}
                      className="font-space text-[9px] px-2.5 py-1 bg-blueprint text-stencil-white hover:bg-safety-orange transition-all active:scale-95 disabled:opacity-50 border-2 border-blueprint font-extrabold cursor-pointer"
                    >
                      {img.name.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Uploaded File Preview and Audit Control */}
              {resolutionMedia && !auditResult && (
                <div className="space-y-2.5 border-2 border-pencil-grey p-2.5 bg-blueprint/5">
                  <div className="relative h-32 overflow-hidden border-2 border-pencil-grey">
                    <img src={resolutionMedia} alt="Resolution upload" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setResolutionMedia(null)}
                      className="absolute top-1 right-1 bg-blueprint text-stamped-cream p-1 border-2 border-pencil-grey cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <button
                    onClick={handleSubmitResolution}
                    disabled={isAuditing}
                    className="w-full font-space tracking-tight text-xs sm:text-sm py-2.5 bg-safety-orange text-stencil-white hover:bg-safety-orange/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-2 border-pencil-grey font-extrabold cursor-pointer"
                  >
                    {isAuditing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>RUNNING GEMINI AUDIT COMPUTE...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>SUBMIT FOR AI AUDIT CHECK</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Audit Processing Overlay Spinner */}
              {isAuditing && !resolutionMedia && (
                <div className="flex flex-col items-center justify-center py-6 bg-blueprint/5 border-2 border-pencil-grey space-y-2 animate-pulse">
                  <RefreshCw className="w-6 h-6 text-safety-orange animate-spin" />
                  <span className="font-space tracking-tight text-xs text-safety-orange font-extrabold">AUDITING BEFORE/AFTER COMPARISON LOGS...</span>
                  <span className="font-mono text-[8px] text-pencil-grey font-bold">PROXIED TO GEMINI-3.5-FLASH</span>
                </div>
              )}

              {/* Audit Results Stamps */}
              {auditResult && (
                <div className={`p-4 border-2 ${
                  auditResult.success 
                    ? "border-verified-green bg-verified-green/5" 
                    : "border-safety-orange bg-safety-orange/5"
                } space-y-2.5 relative overflow-hidden`}>
                  <div className="flex items-center gap-1.5">
                    {auditResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-verified-green animate-bounce" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-safety-orange animate-bounce" />
                    )}
                    <span className={`font-space tracking-tight text-xs font-extrabold uppercase ${auditResult.success ? "text-verified-green" : "text-safety-orange"}`}>
                      {auditResult.success ? "AI RESOLUTION AUDIT PASSED" : "AI RESOLUTION AUDIT REJECTED"}
                    </span>
                  </div>
                  <p className="font-sans text-[10.5px] text-blueprint/95 leading-relaxed bg-stamped-cream/40 p-2.5 border border-pencil-grey/15 font-semibold">
                    {auditResult.explanation}
                  </p>
                  <button 
                    onClick={() => { setAuditResult(null); setResolutionMedia(null); }}
                    className="font-mono text-[9px] uppercase underline text-pencil-grey hover:text-safety-orange block mt-1 font-bold cursor-pointer"
                  >
                    Dismiss Audit
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
