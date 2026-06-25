import React from "react";
import { Contributor } from "../types";
import { Award, CheckCircle2, FileText, Sparkles, Trophy, User } from "lucide-react";

interface LeaderboardBoardProps {
  contributors: Contributor[];
  currentUserEmail: string;
}

export default function LeaderboardBoard({
  contributors,
  currentUserEmail,
}: LeaderboardBoardProps) {
  // Sort and pick top contributors
  const sortedContributors = [...contributors].sort((a, b) => b.points - a.points);

  const getBadgeColorClass = (badge: string) => {
    if (badge.includes("Gold")) return "text-amber-500 border-amber-500 bg-amber-50";
    if (badge.includes("Silver")) return "text-slate-400 border-slate-400 bg-slate-50";
    return "text-amber-700 border-amber-600 bg-amber-50";
  };

  return (
    <div className="bg-blueprint text-stencil-white p-5 max-w-4xl mx-auto space-y-6 select-none">
      {/* Bulletin Board header */}
      <div className="border-b-2 border-pencil-grey/50 pb-3 flex justify-between items-center">
        <div>
          <span className="font-mono text-[9px] text-pencil-grey font-bold uppercase">// DISTRICT SECTOR 4 COMMUNITY BOARD</span>
          <h2 className="font-space text-2xl tracking-tight text-stamped-cream uppercase flex items-center gap-2 font-extrabold">
            <Trophy className="w-5.5 h-5.5 text-safety-orange" />
            WALL OF CIVIC FIXERS
          </h2>
        </div>
        <div className="stamp-badge text-safety-orange border-safety-orange rotate-[-3deg] text-[10px] font-extrabold tracking-widest bg-stamped-cream px-3 py-1.5 border-dashed">
          ACTIVE REGISTRY
        </div>
      </div>

      <p className="font-sans text-xs text-stamped-cream/90 max-w-2xl leading-relaxed font-semibold">
        Honor roll of local residents validating and repairing neighborhood deficits. Earn points for civic acts:
        <strong className="text-safety-orange font-black"> +10 points </strong> per issue reported,
        <strong className="text-safety-orange font-black"> +5 points </strong> for confirmations, and
        <strong className="text-safety-orange font-black"> +20 points </strong> if your report is resolved.
      </p>

      {/* bulletin Board Grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-3">
        {sortedContributors.map((c, idx) => {
          const isCurrentUser = c.email === currentUserEmail;
          
          return (
            <div
              key={c.id || idx}
              className={`relative bg-stamped-cream text-blueprint p-6 border-2 flex flex-col justify-between transition-all duration-200 hover:-rotate-1 active:scale-98 cursor-default ${
                isCurrentUser 
                  ? "border-safety-orange shadow-[6px_6px_0px_0px_rgba(232,99,28,1)]" 
                  : "border-pencil-grey shadow-[4px_4px_0px_0px_rgba(27,42,63,0.85)] hover:shadow-[4px_4px_0px_0px_rgba(27,42,63,1)]"
              }`}
              style={{
                borderRadius: "0px",
                // Subtle staggered rotations to make them look hand-pinned like index cards
                transform: `rotate(${(idx % 2 === 0 ? 0.8 : -0.8) * (idx + 1) * 0.4}deg)`,
              }}
            >
              {/* Paper Pin Tacks */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-red-800 border border-red-950 shadow-sm" />

              {/* Contributor Header */}
              <div className="border-b-2 border-dashed border-pencil-grey/30 pb-3 mb-4">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[9px] text-pencil-grey font-black">
                    FIXER #{String(idx + 1).padStart(3, "0")}
                  </span>
                  
                  {isCurrentUser && (
                    <span className="font-mono text-[8px] bg-safety-orange text-stencil-white px-1.5 py-0.5 font-black">
                      YOU
                    </span>
                  )}
                </div>
                
                <h3 className="font-space text-base text-blueprint uppercase tracking-tight flex items-center gap-1.5 mt-1.5 truncate font-extrabold">
                  <User className="w-4 h-4 text-blueprint" />
                  {c.name}
                </h3>
                <span className="font-mono text-[9px] text-pencil-grey truncate block font-bold mt-0.5">{c.email}</span>
              </div>

              {/* Ledger breakdown */}
              <div className="space-y-1.5 font-mono text-[10px] text-blueprint/90 mb-4 bg-blueprint/5 p-3 border border-pencil-grey/25">
                <div className="flex justify-between font-bold">
                  <span>TOTAL DISPATCH:</span>
                  <span className="font-black text-safety-orange">{c.points} PTS</span>
                </div>
                <div className="flex justify-between">
                  <span>RECON REPORTED:</span>
                  <span className="font-bold">{c.issuesReported} FILED</span>
                </div>
                <div className="flex justify-between">
                  <span>CO-SIGHTINGS:</span>
                  <span className="font-bold">{c.issuesConfirmed} ENDORSED</span>
                </div>
                <div className="flex justify-between">
                  <span>REMEDIES DONE:</span>
                  <span className="font-bold">{c.issuesResolved} SOLVED</span>
                </div>
              </div>

              {/* Badges Stamp Row */}
              <div className="mt-auto">
                {c.badges.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {c.badges.map((badge) => (
                      <span
                        key={badge}
                        className={`font-space text-[8.5px] px-2 py-1 border border-pencil-grey tracking-wider font-extrabold ${getBadgeColorClass(
                          badge
                        )}`}
                        style={{ borderRadius: "0px" }}
                      >
                        {badge.toUpperCase()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="font-mono text-[8px] text-pencil-grey italic block pt-1 font-bold">
                    [ No ranking badges awarded yet ]
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty Contributors fallback */}
      {contributors.length === 0 && (
        <div className="text-center bg-stamped-cream/5 border-2 border-dashed border-pencil-grey py-12">
          <p className="font-space text-pencil-grey text-lg uppercase font-extrabold">WALL VACANT // REGISTER NOW</p>
          <p className="font-mono text-[10px] text-pencil-grey mt-1">Be the first to docket reports to win badges.</p>
        </div>
      )}
    </div>
  );
}
