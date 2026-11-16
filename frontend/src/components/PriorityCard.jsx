import React from "react";
import {
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  FileSearch,
  IndianRupee,
  AlertTriangle,
} from "lucide-react";

export default function PriorityCard({
  cluster,
  onViewProofs,
  onUpdateStatus,
}) {
  // Split the bilingual reason string ("English reason | తెలుగు కారణం") into two clean lines
  const reasonParts = (cluster.reason || "").split("|");
  const englishReason = reasonParts[0] ? reasonParts[0].trim() : cluster.reason;
  const teluguReason = reasonParts[1] ? reasonParts[1].trim() : "";

  // Color badge for current work status
  const statusStyles = {
    Pending: "bg-amber-100 text-amber-800 border-amber-300",
    Approved: "bg-emerald-100 text-emerald-800 border-emerald-300",
    "In-Progress": "bg-blue-100 text-blue-800 border-blue-300",
    Completed: "bg-purple-100 text-purple-800 border-purple-300",
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 hover:shadow-lg transition">
      {/* Top Row: Rank Badge, Title, and Priority Score */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-extrabold text-white shadow shrink-0 ${
              cluster.rank === 1
                ? "bg-red-600"
                : cluster.rank <= 3
                ? "bg-orange-600"
                : "bg-slate-800"
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider opacity-80">
              Rank
            </span>
            <span className="text-lg leading-none">#{cluster.rank}</span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-600" />
                {cluster.village}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {cluster.category}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  statusStyles[cluster.status] || statusStyles.Pending
                }`}
              >
                {cluster.status}
              </span>
              {!cluster.is_in_development_plan && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Missing in Old Plan
                </span>
              )}
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 mt-1.5">
              {cluster.title}
            </h3>
          </div>
        </div>

        {/* AI Priority Score Box */}
        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
            AI Priority Score
          </div>
          <div className="text-2xl font-black">
            {cluster.priority_score}
            <span className="text-xs font-normal text-slate-400"> / 100</span>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-slate-500 block">Citizen Requests</span>
          <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
            <Users className="w-4 h-4 text-indigo-600" />
            {cluster.total_requests} Verified
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Population Impact</span>
          <span className="font-extrabold text-slate-900 text-sm">
            {cluster.population.toLocaleString()} People
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Infra Gap Score</span>
          <span className="font-extrabold text-slate-900 text-sm">
            {cluster.infrastructure_gap_score} / 100
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Est. MPLADS Cost</span>
          <span className="font-extrabold text-emerald-700 text-sm flex items-center gap-0.5">
            <IndianRupee className="w-3.5 h-3.5" />
            {cluster.estimated_cost}
          </span>
        </div>
      </div>

      {/* Bilingual AI Ranking Justification (English + Telugu) */}
      <div className="mt-3.5 bg-amber-50/80 border-l-4 border-amber-500 p-3 rounded-r-xl text-sm space-y-1">
        <p className="font-bold text-slate-900">{englishReason}</p>
        {teluguReason && (
          <p className="text-slate-700 font-medium text-xs">{teluguReason}</p>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewProofs(cluster)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition"
        >
          <FileSearch className="w-4 h-4" />
          View 3 Citizen Proofs & Photos
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdateStatus(cluster.id, "Approved")}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              cluster.status === "Approved"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve
          </button>

          <button
            type="button"
            onClick={() => onUpdateStatus(cluster.id, "In-Progress")}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              cluster.status === "In-Progress"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Mark In-Progress
          </button>

          <button
            type="button"
            onClick={() => onUpdateStatus(cluster.id, "Completed")}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              cluster.status === "Completed"
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100"
            }`}
          >
            Completed
          </button>
        </div>
      </div>
    </div>
  );
}