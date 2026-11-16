import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Landmark, Send, BarChart3, ShieldCheck, Globe } from "lucide-react";

export default function Navbar({ lang, setLang }) {
  const location = useLocation();

  // Simple multi-language labels for the top navigation bar
  const labels = {
    en: {
      title: "JANAPRIYA",
      subtitle: "Visakhapatnam Constituency AI Development Platform",
      citizenBtn: "Citizen Submit",
      dashboardBtn: "MP Priority Dashboard",
      loginBtn: "MP Login",
    },
    te: {
      title: "జనప్రియ (JANAPRIYA)",
      subtitle: "విశాఖపట్నం నియోజకవర్గ అభివృద్ధి ప్రణాళిక వేదిక",
      citizenBtn: "పౌరుల విజ్ఞప్తి",
      dashboardBtn: "MP డ్యాష్‌బోర్డ్",
      loginBtn: "MP లాగిన్",
    },
    hi: {
      title: "जनप्रिय (JANAPRIYA)",
      subtitle: "विशाखापत्तनम लोकसभा विकास प्राथमिकता मंच",
      citizenBtn: "नागरिक सुझाव",
      dashboardBtn: "सांसद डैशबोर्ड",
      loginBtn: "सांसद लॉगिन",
    },
  };

  const t = labels[lang] || labels.en;

  // Helper function to highlight the active page button
  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Title */}
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-950 p-2.5 rounded-xl shadow">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wide text-amber-400">
              {t.title}
            </h1>
            <p className="text-xs text-slate-300">{t.subtitle}</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
              isActive("/")
                ? "bg-amber-500 text-slate-950 shadow"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            <Send className="w-4 h-4" />
            {t.citizenBtn}
          </Link>

          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
              isActive("/dashboard")
                ? "bg-amber-500 text-slate-950 shadow"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {t.dashboardBtn}
          </Link>

          <Link
            to="/login"
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg font-semibold text-sm transition ${
              isActive("/login")
                ? "bg-amber-500 text-slate-950 shadow"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {t.loginBtn}
          </Link>
        </nav>

        {/* Prominent Language Toggle Buttons (Telugu / Hindi / English) */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          <Globe className="w-4 h-4 text-amber-400 ml-1.5 mr-1" />
          <button
            type="button"
            onClick={() => setLang("te")}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
              lang === "te"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            తెలుగు
          </button>
          <button
            type="button"
            onClick={() => setLang("hi")}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
              lang === "hi"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            हिंदी
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
              lang === "en"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            English
          </button>
        </div>
      </div>
    </header>
  );
}