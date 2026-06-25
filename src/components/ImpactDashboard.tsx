import React from "react";
import { DashboardStats } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { BarChart2, TrendingUp, Clock, FileCheck, Landmark, ClipboardList } from "lucide-react";

interface ImpactDashboardProps {
  stats: DashboardStats;
}

export default function ImpactDashboard({ stats }: ImpactDashboardProps) {
  // Translate average hours into elegant days / hours string
  const formatAvgTime = (hours: number) => {
    if (hours < 24) return `${hours.toFixed(1)} HOURS`;
    const days = Math.floor(hours / 24);
    const remHours = Math.round(hours % 24);
    return `${days} DAYS · ${remHours} HRS`;
  };

  const categoriesColorMap = {
    "Pothole": "#E8631C",
    "Streetlight": "#F59E0B",
    "Waste": "#92400E",
    "Water Leakage": "#0D9488",
    "Other": "#6B6B63"
  };

  return (
    <div className="bg-stamped-cream text-blueprint p-6 border-2 border-pencil-grey shadow-[4px_4px_0px_0px_rgba(27,42,63,1)] max-w-4xl mx-auto space-y-6" style={{ borderRadius: "0" }}>
      {/* Ledger Register Header */}
      <div className="border-b-2 border-pencil-grey/50 pb-3.5 flex justify-between items-center">
        <div>
          <span className="font-mono text-[9px] text-pencil-grey font-bold">FISCAL YEAR DOCKET SUMMARY · OAKLAND-SECTOR-4</span>
          <h2 className="font-space text-2xl tracking-tight text-blueprint uppercase font-extrabold">MUNICIPAL PERFORMANCE LEDGER</h2>
        </div>
        <div className="stamp-badge text-verified-green border-verified-green rotate-[4deg] text-[10px] font-extrabold tracking-widest bg-[#E8F0EA] px-3 py-1.5 border-dashed">
          AUDITED SUMMARY
        </div>
      </div>

      {/* Tally Stacked Register / Ledger Format (Old Book style running totals) */}
      <div className="border-2 border-blueprint divide-y-2 divide-blueprint font-mono text-xs bg-blueprint/5">
        {/* Ledger Column Headers */}
        <div className="grid grid-cols-3 bg-blueprint text-stencil-white px-3 py-3 font-space tracking-wider font-extrabold">
          <span>REGISTRY ITEM</span>
          <span className="text-right">CURRENT COUNT / TALLY</span>
          <span className="text-right">LEDGER NOTE</span>
        </div>

        {/* Item 1 */}
        <div className="grid grid-cols-3 px-3 py-3 items-center">
          <span className="font-bold flex items-center gap-1.5 text-blueprint font-space">
            <ClipboardList className="w-4 h-4 text-safety-orange" />
            01. TOTAL DOCKET CLAIMS LOGGED
          </span>
          <span className="text-right font-mono font-black text-sm text-blueprint">{stats.totalReported} FILINGS</span>
          <span className="text-right text-[10px] text-pencil-grey font-bold">All resident registrations registered</span>
        </div>

        {/* Item 2 */}
        <div className="grid grid-cols-3 px-3 py-3 items-center">
          <span className="font-bold flex items-center gap-1.5 text-verified-green font-space">
            <FileCheck className="w-4 h-4 text-verified-green" />
            02. REMEDIATIONS COMPLETED & AUDITED
          </span>
          <span className="text-right font-mono font-black text-sm text-verified-green">+{stats.totalResolved} RESOLVED</span>
          <span className="text-right text-[10px] text-pencil-grey font-bold">Remediation closed via Gemini visual audit</span>
        </div>

        {/* Item 3 */}
        <div className="grid grid-cols-3 px-3 py-3 items-center">
          <span className="font-bold flex items-center gap-1.5 text-safety-orange font-space">
            <TrendingUp className="w-4 h-4 text-safety-orange" />
            03. DEFECTS IN WORK QUEUE
          </span>
          <span className="text-right font-mono font-black text-sm text-safety-orange">{stats.totalInProgress} IN-QUEUE</span>
          <span className="text-right text-[10px] text-pencil-grey font-bold">Actively routed or community-endorsed</span>
        </div>

        {/* Item 4 */}
        <div className="grid grid-cols-3 px-3 py-3 items-center bg-stamped-cream">
          <span className="font-bold flex items-center gap-1.5 text-blueprint font-space">
            <Clock className="w-4 h-4 text-safety-orange" />
            04. MEAN REPAIR TIMEFRAME
          </span>
          <span className="text-right font-mono font-black text-sm text-blueprint">
            {formatAvgTime(stats.avgResolutionTimeHours)}
          </span>
          <span className="text-right text-[10px] text-pencil-grey font-black">LODGE TO AUDIT COMPLETE</span>
        </div>
      </div>

      {/* Drafted Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Category Bar Chart */}
        <div className="border-2 border-pencil-grey p-4 space-y-3 bg-white/40 shadow-[2px_2px_0px_0px_rgba(27,42,63,1)]">
          <h3 className="font-space text-sm tracking-tight border-b-2 border-pencil-grey pb-2 flex items-center gap-1.5 font-extrabold uppercase text-blueprint">
            <BarChart2 className="w-4.5 h-4.5 text-safety-orange" />
            DISORDER INCIDENCE BY CATEGORY
          </h3>
          
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.categoryDistribution}
                margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#D1C7BD" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: "#1B2A3F", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" }} 
                  axisLine={{ stroke: "#1B2A3F", strokeWidth: 2 }}
                  tickLine={{ stroke: "#1B2A3F", strokeWidth: 2 }}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fill: "#1B2A3F", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" }} 
                  axisLine={{ stroke: "#1B2A3F", strokeWidth: 2 }}
                  tickLine={{ stroke: "#1B2A3F", strokeWidth: 2 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#FAF7F0", border: "2px solid #6B6B63", fontFamily: "monospace", fontSize: 10, fontWeight: "bold" }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#1B2A3F" 
                  stroke="#1B2A3F"
                  strokeWidth={2}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <span className="font-mono text-[9px] text-pencil-grey block text-center font-bold">
            FIGURE 1: Active municipal register distribution counts.
          </span>
        </div>

        {/* Chart 2: 30-Day Trend Area/Line Chart */}
        <div className="border-2 border-pencil-grey p-4 space-y-3 bg-white/40 shadow-[2px_2px_0px_0px_rgba(27,42,63,1)]">
          <h3 className="font-space text-sm tracking-tight border-b-2 border-pencil-grey pb-2 flex items-center gap-1.5 font-extrabold uppercase text-blueprint">
            <Landmark className="w-4.5 h-4.5 text-safety-orange" />
            30-DAY HISTORIC TELEMETRY FLOW
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.history30Days}
                margin={{ top: 5, right: 15, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#D1C7BD" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: "#1B2A3F", fontSize: 8, fontFamily: "monospace", fontWeight: "bold" }} 
                  axisLine={{ stroke: "#1B2A3F", strokeWidth: 2 }}
                  tickLine={{ stroke: "#1B2A3F", strokeWidth: 2 }}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fill: "#1B2A3F", fontSize: 9, fontFamily: "monospace", fontWeight: "bold" }} 
                  axisLine={{ stroke: "#1B2A3F", strokeWidth: 2 }}
                  tickLine={{ stroke: "#1B2A3F", strokeWidth: 2 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#FAF7F0", border: "2px solid #6B6B63", fontFamily: "monospace", fontSize: 10, fontWeight: "bold" }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: 9, fontFamily: "monospace", fontWeight: "bold" }}
                />
                <Line 
                  name="LOGGED CLAIMS" 
                  type="monotone" 
                  dataKey="reported" 
                  stroke="#E8631C" 
                  strokeWidth={3}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  name="AUDITED CLOSED" 
                  type="monotone" 
                  dataKey="resolved" 
                  stroke="#4A7C59" 
                  strokeWidth={3}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="font-mono text-[9px] text-pencil-grey block text-center font-bold">
            FIGURE 2: Comparative trend line of entries lodged vs resolved.
          </span>
        </div>
      </div>

      {/* Footer stamp/cert note */}
      <div className="font-mono text-[9px] text-pencil-grey flex items-center justify-between border-t-2 border-pencil-grey/40 pt-3 font-bold">
        <span>CERTIFICATION CODE: AUTH-DOCKET-SECTOR4-FMH</span>
        <span>AUDITED: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" }).toUpperCase()}</span>
      </div>
    </div>
  );
}
