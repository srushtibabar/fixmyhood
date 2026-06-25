import React, { useState, useEffect } from "react";
import { Contributor } from "../types";
import { User, Award, Shield, FileText, CheckCircle2, Bookmark, Save, RefreshCw } from "lucide-react";

interface UserProfileProps {
  contributors: Contributor[];
  currentUserEmail: string;
  currentUserName: string;
  onSaveProfile: (name: string, email: string) => void;
}

export default function UserProfile({
  contributors,
  currentUserEmail,
  currentUserName,
  onSaveProfile,
}: UserProfileProps) {
  const [name, setName] = useState(currentUserName);
  const [email, setEmail] = useState(currentUserEmail);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setName(currentUserName);
    setEmail(currentUserEmail);
  }, [currentUserName, currentUserEmail]);

  // Find contributor details if registered
  const myStats = contributors.find((c) => c.email.toLowerCase() === currentUserEmail.toLowerCase()) || {
    points: 0,
    badges: [] as string[],
    issuesReported: 0,
    issuesConfirmed: 0,
    issuesResolved: 0,
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSaveProfile(name.trim(), email.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const testerPersonas = [
    { name: "Srushti Babar", email: "srushtibabar.s@gmail.com", label: "PRO REPORTER" },
    { name: "Rusty Pen", email: "rusty@fixers.org", label: "GOLD FIXED (MOCK)" },
    { name: "GreenQueen", email: "green@fixers.org", label: "SILVER FIXED (MOCK)" },
  ];

  return (
    <div className="bg-stamped-cream text-blueprint p-6 border-2 border-pencil-grey shadow-[4px_4px_0px_0px_rgba(27,42,63,1)] max-w-xl mx-auto space-y-6" style={{ borderRadius: "0px" }}>
      {/* Header Stamp */}
      <div className="border-b-2 border-pencil-grey pb-3.5 mb-5 flex justify-between items-center">
        <div>
          <span className="font-mono text-[9px] text-pencil-grey font-bold">LEDGER REGISTER SECTION #00</span>
          <h2 className="font-space text-2xl tracking-tight text-blueprint uppercase font-extrabold">CIVIC RECORD IDENTIFIER</h2>
        </div>
        <div className="stamp-badge text-blueprint border-blueprint rotate-[6deg] text-[10px] font-extrabold tracking-widest bg-[#EFE4CF] px-3 py-1.5 border-dashed">
          CITIZEN CARD
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile details form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <h3 className="font-space text-xs tracking-tight border-b-2 border-pencil-grey pb-1.5 uppercase text-safety-orange font-extrabold">
            IDENTIFIER DETAILS
          </h3>

          <div className="space-y-1.5">
            <span className="font-mono text-[9px] text-pencil-grey block font-bold">FULL LEGAL NAME:</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-blueprint/5 border-2 border-pencil-grey p-3 font-sans text-xs focus:outline-none focus:border-safety-orange focus:ring-1 focus:ring-safety-orange text-blueprint font-extrabold"
            />
          </div>

          <div className="space-y-1.5">
            <span className="font-mono text-[9px] text-pencil-grey block font-bold">DIGITAL EMAIL INBOX:</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-blueprint/5 border-2 border-pencil-grey p-3 font-sans text-xs focus:outline-none focus:border-safety-orange focus:ring-1 focus:ring-safety-orange text-blueprint font-extrabold"
            />
          </div>

          <button
            type="submit"
            className="w-full font-space tracking-tight text-xs py-3 bg-blueprint text-stencil-white hover:bg-safety-orange hover:text-stencil-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-2 border-blueprint font-extrabold cursor-pointer"
            style={{ borderRadius: "0" }}
          >
            <Save className="w-4 h-4" />
            <span>SAVE TELEMETRY IDENTITY</span>
          </button>

          {saveSuccess && (
            <div className="font-mono text-[10px] text-verified-green text-center font-bold">
              ✓ Identity registry logs updated in database.
            </div>
          )}
        </form>

        {/* Hackathon switch board */}
        <div className="space-y-4">
          <h3 className="font-space text-xs tracking-tight border-b-2 border-pencil-grey pb-1.5 uppercase text-safety-orange font-extrabold">
            QUICK HACK-PERSONA SWITCHER
          </h3>
          <p className="font-sans text-[10px] text-pencil-grey leading-relaxed font-semibold">
            Switch identities to simulate points allocations, badges awarding levels, and distinct reporter claims.
          </p>

          <div className="space-y-2">
            {testerPersonas.map((p) => (
              <button
                key={p.email}
                onClick={() => {
                  onSaveProfile(p.name, p.email);
                  setName(p.name);
                  setEmail(p.email);
                }}
                className={`w-full text-left font-mono text-[10px] p-2.5 border-2 flex justify-between items-center transition-all cursor-pointer hover:scale-[1.01] ${
                  currentUserEmail === p.email
                    ? "bg-safety-orange text-stencil-white border-pencil-grey font-black"
                    : "bg-blueprint/5 border-pencil-grey text-blueprint hover:bg-blueprint/10 font-bold"
                }`}
                style={{ borderRadius: "0" }}
              >
                <div>
                  <span className="font-black block text-xs">{p.name.toUpperCase()}</span>
                  <span className="text-[8.5px] opacity-90 block font-semibold">{p.email}</span>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 bg-blueprint/15 border border-blueprint/20 font-black">
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Citizen Scorecard Register */}
      <div className="bg-blueprint/5 border-2 border-pencil-grey p-5 space-y-4">
        <h3 className="font-space text-xs tracking-tight border-b-2 border-pencil-grey pb-1.5 uppercase text-blueprint font-extrabold">
          PERSONAL DOCKET DISPATCH SCORECARD
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-blueprint text-stencil-white p-3 border-2 border-pencil-grey">
            <span className="font-space text-[9px] block text-pencil-grey/90 font-extrabold tracking-wider">TOTAL POINTS</span>
            <span className="font-mono text-base font-black text-safety-orange">{myStats.points} PTS</span>
          </div>
          <div className="bg-blueprint text-stencil-white p-3 border-2 border-pencil-grey">
            <span className="font-space text-[9px] block text-pencil-grey/90 font-extrabold tracking-wider">ISSUES FILED</span>
            <span className="font-mono text-base font-black text-stamped-cream">{myStats.issuesReported}</span>
          </div>
          <div className="bg-blueprint text-stencil-white p-3 border-2 border-pencil-grey">
            <span className="font-space text-[9px] block text-pencil-grey/90 font-extrabold tracking-wider">CO-SIGNINGS</span>
            <span className="font-mono text-base font-black text-stamped-cream">{myStats.issuesConfirmed}</span>
          </div>
          <div className="bg-blueprint text-stencil-white p-3 border-2 border-pencil-grey">
            <span className="font-space text-[9px] block text-pencil-grey/90 font-extrabold tracking-wider">AI VERIFIED</span>
            <span className="font-mono text-base font-black text-verified-green">{myStats.issuesResolved}</span>
          </div>
        </div>

        {/* Badges Drawer */}
        <div className="pt-2">
          <span className="font-mono text-[9px] text-pencil-grey block mb-1.5 font-bold">AWARDED CITIZEN BADGES:</span>
          {myStats.badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {myStats.badges.map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blueprint text-stencil-white font-space text-[10px] tracking-wider border-2 border-pencil-grey font-extrabold"
                  style={{ borderRadius: "0px" }}
                >
                  <Award className="w-3.5 h-3.5 text-safety-orange" />
                  <span>{badge.toUpperCase()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono text-[9px] text-pencil-grey italic font-bold">
              [ Submit reports or endorse issues to earn 50+ points for Bronze Reporter badge ]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
