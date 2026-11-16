import React, { useState, useEffect, useRef } from "react";

// Backend URL: Reads Vercel environment variable in production, localhost in development
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (window.location.hostname === "localhost" ? "http://localhost:8000" : "");

const VILLAGES = ["Anandapuram", "Madhurawada", "Bheemili", "Pendurthi"];
const CATEGORIES = [
  "Road",
  "Water",
  "School",
  "Health",
  "Drainage",
  "Electricity",
  "Agriculture",
  "Employment",
];

const VILLAGE_COORDS = {
  Anandapuram: { lat: 17.8962, lng: 83.3746 },
  Madhurawada: { lat: 17.8211, lng: 83.3561 },
  Bheemili: { lat: 17.8904, lng: 83.4521 },
  Pendurthi: { lat: 17.8139, lng: 83.2089 },
};

export default function App() {
  // Navigation state ("citizen" | "dashboard" | "login")
  const [activeTab, setActiveTab] = useState("citizen");
  const [lang, setLang] = useState("en");

  // ---------------- CITIZEN FORM STATES ----------------
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("Anandapuram");
  const [category, setCategory] = useState("Road");
  const [text, setText] = useState("");
  const [lat, setLat] = useState(17.8962);
  const [lng, setLng] = useState(83.3746);
  const [sourceMode, setSourceMode] = useState("Web Portal");

  // Mock OTP states
  const [otpInput, setOtpInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [otpStatusMsg, setOtpStatusMsg] = useState("");

  // Voice & Photo states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);

  // Submission result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // ---------------- MP DASHBOARD STATES ----------------
  const [villageFilter, setVillageFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stats, setStats] = useState({
    total_submissions: 0,
    total_clusters: 0,
    critical_requests: 0,
    actioned_projects: 0,
  });
  const [priorities, setPriorities] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Proof Modal states
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [proofData, setProofData] = useState(null);

  // MP Login states
  const [mpEmail, setMpEmail] = useState("mp@vizag.gov.in");
  const [mpPassword, setMpPassword] = useState("admin123");
  const [loginError, setLoginError] = useState("");

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Translations
  const labels = {
    en: {
      title: "JANAPRIYA",
      subtitle: "Visakhapatnam Constituency AI Development Platform",
      citizenBtn: "Citizen Submit",
      dashboardBtn: "MP Priority Dashboard",
      loginBtn: "MP Login",
      heading: "Submit Your Constituency Priority",
      sub: "Speak or type in Telugu, Hindi, or English. Gemini AI translates, classifies, and updates the MP's priority rank automatically.",
      step1: "Step 1: Citizen Phone Verification (OTP: 123456)",
      step2: "Step 2: Describe Development Need or Grievance",
      sendOtpBtn: "Send OTP",
      verifyOtpBtn: "Verify OTP",
      submitBtn: "Submit to AI Priority Engine",
    },
    te: {
      title: "జనప్రియ (JANAPRIYA)",
      subtitle: "విశాఖపట్నం నియోజకవర్గ అభివృద్ధి ప్రణాళిక వేదిక",
      citizenBtn: "పౌరుల విజ్ఞప్తి",
      dashboardBtn: "MP డ్యాష్‌బోర్డ్",
      loginBtn: "MP లాగిన్",
      heading: "మీ గ్రామ అభివృద్ధి సమస్యను తెలియజేయండి",
      sub: "తెలుగు, హిందీ లేదా ఇంగ్లీష్‌లో మాట్లాడండి లేదా టైప్ చేయండి. AI దీనిని విశ్లేషించి MP ప్రాధాన్యత జాబితాలో చేరుస్తుంది.",
      step1: "స్టెప్ 1: ఫోన్ నంబర్ ధృవీకరణ (OTP: 123456)",
      step2: "స్టెప్ 2: మీ గ్రామ సమస్య వివరాలు నమోదు చేయండి",
      sendOtpBtn: "OTP పంపండి",
      verifyOtpBtn: "OTP నిర్ధారించండి",
      submitBtn: "AI ప్రాధాన్యత వేదికకు పంపండి",
    },
    hi: {
      title: "जनप्रिय (JANAPRIYA)",
      subtitle: "विशाखापत्तनम लोकसभा विकास प्राथमिकता मंच",
      citizenBtn: "नागरिक सुझाव",
      dashboardBtn: "सांसद डैशबोर्ड",
      loginBtn: "सांसद लॉगिन",
      heading: "अपने क्षेत्र की विकास प्राथमिकता दर्ज करें",
      sub: "तेलुगु, हिंदी या अंग्रेजी में बोलें या लिखें। AI इसे अनुवाद और वर्गीकृत करके सांसद डैशबोर्ड पर रैंक करेगा।",
      step1: "चरण 1: नागरिक फ़ोन सत्यापन (OTP: 123456)",
      step2: "चरण 2: अपनी विकास आवश्यकता या शिकायत का विवरण दें",
      sendOtpBtn: "OTP भेजें",
      verifyOtpBtn: "OTP सत्यापित करें",
      submitBtn: "AI प्राथमिकता इंजन में जमा करें",
    },
  }[lang || "en"];

  // ---------------- CITIZEN HANDLERS ----------------
  const handleVillageChange = (v) => {
    setVillage(v);
    const coords = VILLAGE_COORDS[v] || { lat: 17.85, lng: 83.35 };
    setLat(coords.lat);
    setLng(coords.lng);
  };

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      setOtpStatusMsg("Please enter your phone number first.");
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name: name || "Citizen", village }),
      });
      const data = await res.json();
      setOtpInput("123456");
      setOtpStatusMsg(`OTP Sent! (${data.message})`);
    } catch (e) {
      setOtpStatusMsg("Error connecting to backend server.");
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp_code: otpInput,
          name: name || "Citizen",
          village,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVerified(true);
        setOtpStatusMsg("Phone Verified via OTP! JWT Token Issued.");
      } else {
        setOtpStatusMsg("Invalid OTP. Use 123456.");
      }
    } catch (e) {
      setOtpStatusMsg("Invalid OTP. Use 123456.");
    }
  };

  const handleDetectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(5)));
          setLng(Number(pos.coords.longitude.toFixed(5)));
        },
        () => {
          const fb = VILLAGE_COORDS[village];
          setLat(fb.lat);
          setLng(fb.lng);
        }
      );
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        setAudioBlob(new Blob(chunks, { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setIsRecording(true);

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.lang = lang === "te" ? "te-IN" : lang === "hi" ? "hi-IN" : "en-IN";
        rec.onresult = (ev) => {
          const tr = ev.results[0][0].transcript;
          setText((prev) => (prev ? `${prev} ${tr}` : tr));
        };
        rec.start();
        recognitionRef.current = rec;
      }
    } catch (err) {
      alert("Microphone permission needed to record audio.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      alert("Please enter your development suggestion first.");
      return;
    }
    setIsSubmitting(true);
    setAiResult(null);

    try {
      const fd = new FormData();
      fd.append("name", name.trim() || "Verified Citizen");
      fd.append("phone", phone.trim() || "9848000000");
      fd.append("village", village);
      fd.append("category", category);
      fd.append("text", text);
      fd.append("lat", lat);
      fd.append("lng", lng);
      fd.append("source", audioBlob ? "Voice Note" : sourceMode);
      if (photoFile) fd.append("photo", photoFile);
      if (audioBlob) fd.append("audio", audioBlob, "voice.webm");

      const res = await fetch(`${BACKEND_URL}/api/citizen/submit`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      setAiResult(data);
      setText("");
      setPhotoFile(null);
      setPhotoPreview(null);
      setAudioBlob(null);
    } catch (err) {
      alert("Cannot reach backend server. Please check your deployment URL.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------- MP DASHBOARD HANDLERS ----------------
  const loadDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const params = new URLSearchParams();
      if (villageFilter !== "All") params.append("village", villageFilter);
      if (categoryFilter !== "All") params.append("category", categoryFilter);
      const res = await fetch(
        `${BACKEND_URL}/api/mp/priorities?${params.toString()}`
      );
      const data = await res.json();
      setStats(
        data.stats || {
          total_submissions: 0,
          total_clusters: 0,
          critical_requests: 0,
          actioned_projects: 0,
        }
      );
      setPriorities(data.priorities || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
      loadDashboard();
    }
  }, [activeTab, villageFilter, categoryFilter]);

  // Initialize & update Leaflet Map when on Dashboard tab
  useEffect(() => {
    if (activeTab !== "dashboard") {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    const L = window.L;
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([17.855, 83.345], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
      priorities.forEach((c) => {
        const color =
          c.priority_score >= 80
            ? "#dc2626"
            : c.priority_score >= 65
            ? "#ea580c"
            : "#2563eb";
        const radius = Math.min(14 + c.total_requests * 0.25, 40);

        const circle = L.circleMarker([c.lat, c.lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: 0.45,
          weight: 3,
        });
        circle.bindPopup(
          `<b>Rank #${c.rank}: ${c.title}</b><br/>Requests: ${c.total_requests}<br/>Score: ${c.priority_score}/100`
        );
        circle.on("click", () => handleViewProofs(c));
        circle.addTo(markersLayerRef.current);
      });
    }
  }, [activeTab, priorities]);

  const handleViewProofs = async (cluster) => {
    setSelectedCluster(cluster);
    setProofData(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/mp/cluster/${cluster.id}/proofs`
      );
      const data = await res.json();
      setProofData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (clusterId, status) => {
    await fetch(`${BACKEND_URL}/api/mp/cluster/${clusterId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadDashboard();
  };

  const handleMpLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/mp/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mpEmail, password: mpPassword }),
      });
      if (res.ok) {
        setActiveTab("dashboard");
      } else {
        setLoginError("Invalid credentials. Use mp@vizag.gov.in / admin123");
      }
    } catch (err) {
      setLoginError("Backend connection error.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* ---------------- TOP NAVBAR ---------------- */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div
            onClick={() => setActiveTab("citizen")}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="bg-amber-500 text-slate-950 font-black text-xl px-3 py-2 rounded-xl">
              JP
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wide text-amber-400">
                {labels.title}
              </h1>
              <p className="text-xs text-slate-300">{labels.subtitle}</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("citizen")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                activeTab === "citizen"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {labels.citizenBtn}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                activeTab === "dashboard"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {labels.dashboardBtn}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                activeTab === "login"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {labels.loginBtn}
            </button>
          </nav>

          {/* Language Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setLang("te")}
              className={`px-3 py-1 rounded-lg text-sm font-bold ${
                lang === "te" ? "bg-emerald-500 text-slate-950" : "text-slate-300"
              }`}
            >
              తెలుగు
            </button>
            <button
              type="button"
              onClick={() => setLang("hi")}
              className={`px-3 py-1 rounded-lg text-sm font-bold ${
                lang === "hi" ? "bg-emerald-500 text-slate-950" : "text-slate-300"
              }`}
            >
              हिंदी
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded-lg text-sm font-bold ${
                lang === "en" ? "bg-emerald-500 text-slate-950" : "text-slate-300"
              }`}
            >
              English
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- TAB 1: CITIZEN SUBMIT ---------------- */}
      {activeTab === "citizen" && (
        <div className="max-w-4xl mx-auto w-full px-4 py-8">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-block bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase mb-2">
                Visakhapatnam Constituency • Citizen Portal
              </span>
              <h2 className="text-2xl font-extrabold">{labels.heading}</h2>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">{labels.sub}</p>
            </div>

            <div className="bg-slate-800 p-1.5 rounded-2xl flex gap-1">
              <button
                type="button"
                onClick={() => setSourceMode("Web Portal")}
                className={`px-3 py-2 rounded-xl text-xs font-bold ${
                  sourceMode === "Web Portal"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-300"
                }`}
              >
                Web Portal
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("WhatsApp Bot")}
                className={`px-3 py-2 rounded-xl text-xs font-bold ${
                  sourceMode === "WhatsApp Bot"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300"
                }`}
              >
                WhatsApp Sim
              </button>
            </div>
          </div>

          {/* Step 1: Mock OTP */}
          <div className="bg-white rounded-2xl shadow border border-slate-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-slate-900">{labels.step1}</h3>
              {isVerified && (
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                  ✓ Verified
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Your Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
              />
              <input
                type="tel"
                placeholder="10-Digit Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={handleSendOTP}
                className="bg-slate-900 text-white font-bold rounded-xl px-4 py-2.5 text-sm"
              >
                {labels.sendOtpBtn}
              </button>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="123456"
                  className="w-24 border border-slate-300 rounded-xl px-2 py-2.5 text-sm font-bold text-center bg-amber-50"
                />
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  className="flex-1 bg-emerald-600 text-white font-bold rounded-xl px-3 py-2.5 text-xs"
                >
                  {labels.verifyOtpBtn}
                </button>
              </div>
            </div>
            {otpStatusMsg && (
              <p className="text-xs font-bold text-indigo-700 mt-2">{otpStatusMsg}</p>
            )}
          </div>

          {/* Step 2: Grievance Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow border border-slate-200 p-6"
          >
            <h3 className="font-extrabold text-slate-900 mb-4">{labels.step2}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Village
                </label>
                <select
                  value={village}
                  onChange={(e) => handleVillageChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold bg-white"
                >
                  {VILLAGES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Describe Development Need (Telugu / Hindi / English)
              </label>
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your development request in Telugu, Hindi, or English..."
                className="w-full border border-slate-300 rounded-xl p-3.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="border border-slate-200 bg-slate-50 p-3 rounded-xl">
                <span className="text-xs font-bold text-slate-600 block mb-1.5">
                  1. Voice Input
                </span>
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="w-full bg-rose-600 text-white font-bold py-2 rounded-xl text-xs"
                  >
                    🎤 Record Voice Note
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="w-full bg-slate-900 text-amber-400 font-bold py-2 rounded-xl text-xs animate-pulse"
                  >
                    ⏹ Stop Recording
                  </button>
                )}
              </div>

              <div className="border border-slate-200 bg-slate-50 p-3 rounded-xl">
                <span className="text-xs font-bold text-slate-600 block mb-1.5">
                  2. Photo Proof
                </span>
                <label className="w-full block text-center bg-indigo-600 text-white font-bold py-2 rounded-xl text-xs cursor-pointer">
                  📷 {photoFile ? "Change Photo" : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="mt-2 h-12 w-full object-cover rounded"
                  />
                )}
              </div>

              <div className="border border-slate-200 bg-slate-50 p-3 rounded-xl">
                <span className="text-xs font-bold text-slate-600 block mb-1.5">
                  3. GPS ({lat}, {lng})
                </span>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="w-full bg-slate-800 text-white font-bold py-2 rounded-xl text-xs"
                >
                  📍 Auto-Detect GPS
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base py-4 rounded-2xl shadow-lg"
            >
              {isSubmitting ? "Analyzing with AI..." : labels.submitBtn}
            </button>
          </form>

          {aiResult && aiResult.submission && (
            <div className="mt-6 bg-emerald-950 text-white rounded-2xl p-6 shadow-xl border-2 border-emerald-400">
              <h4 className="text-lg font-extrabold text-amber-400 mb-2">
                ✓ AI Analysis & Live Constituency Rank Updated!
              </h4>
              <p className="text-sm">
                <strong>Category:</strong> {aiResult.submission.category} |{" "}
                <strong>Urgency:</strong> {aiResult.submission.urgency}
              </p>
              <p className="text-sm mt-1">
                <strong>English Translation:</strong>{" "}
                {aiResult.submission.translated_text}
              </p>
              <p className="text-sm mt-1 text-emerald-300 font-bold">
                Current Rank: #{aiResult.cluster_impact.current_rank} (Score:{" "}
                {aiResult.cluster_impact.priority_score}/100)
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 2: MP DASHBOARD ---------------- */}
      {activeTab === "dashboard" && (
        <div className="max-w-7xl mx-auto w-full px-4 py-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Total Citizen Requests
              </span>
              <div className="text-2xl font-black">{stats.total_submissions}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">
                AI Clustered Works
              </span>
              <div className="text-2xl font-black">{stats.total_clusters}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Critical Urgency
              </span>
              <div className="text-2xl font-black text-red-600">
                {stats.critical_requests}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">
                MP Actioned Works
              </span>
              <div className="text-2xl font-black text-emerald-700">
                {stats.actioned_projects}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-extrabold text-sm">Filter:</span>
              <select
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
              >
                {["All", ...VILLAGES].map((v) => (
                  <option key={v} value={v}>
                    Village: {v}
                  </option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
              >
                {["All", ...CATEGORIES].map((c) => (
                  <option key={c} value={c}>
                    Category: {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              ↻ Refresh Rankings
            </button>
          </div>

          {/* Leaflet Map */}
          <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden mb-6">
            <div className="bg-slate-900 text-amber-400 px-4 py-2.5 text-xs font-bold uppercase">
              Live Constituency Hotspot Map (OpenStreetMap)
            </div>
            <div
              ref={mapContainerRef}
              style={{ height: "380px", width: "100%" }}
            />
          </div>

          {/* Ranked Cards */}
          {loadingDashboard ? (
            <div className="p-8 text-center font-bold text-slate-500">
              Loading Rankings...
            </div>
          ) : priorities.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300">
              <p className="font-extrabold text-base">
                No citizen submissions yet.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Go to &quot;Citizen Submit&quot; and submit a grievance to see it ranked here!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {priorities.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl shadow border border-slate-200 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-lg mr-2">
                        RANK #{c.rank}
                      </span>
                      <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg mr-2">
                        {c.village} • {c.category}
                      </span>
                      <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-lg">
                        Status: {c.status}
                      </span>
                      <h3 className="text-lg font-extrabold mt-2">{c.title}</h3>
                    </div>
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-right">
                      <div className="text-[10px] text-amber-400 font-bold uppercase">
                        AI Priority Score
                      </div>
                      <div className="text-2xl font-black">
                        {c.priority_score} / 100
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-xs font-semibold">
                    {c.reason}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewProofs(c)}
                      className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                    >
                      🔍 View Citizen Proofs & Photos ({c.total_requests})
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(c.id, "Approved")}
                        className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(c.id, "In-Progress")}
                        className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl"
                      >
                        In-Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(c.id, "Completed")}
                        className="bg-purple-600 text-white text-xs font-bold px-3 py-2 rounded-xl"
                      >
                        Completed
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Proof Modal */}
          {selectedCluster && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-extrabold text-lg">
                    Rank #{selectedCluster.rank}: {selectedCluster.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedCluster(null)}
                    className="bg-slate-200 px-3 py-1 rounded-lg font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>
                {!proofData ? (
                  <p className="py-6 text-center">Loading proofs...</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {proofData.sample_proofs.map((p, i) => (
                      <div
                        key={p.id}
                        className="border rounded-xl p-3 bg-slate-50 text-xs space-y-1"
                      >
                        <div className="font-bold">
                          #{i + 1} • {p.citizen_name} ({p.language} • {p.urgency})
                        </div>
                        <div className="bg-white p-2 rounded border text-sm">
                          &quot;{p.original_text}&quot;
                        </div>
                        <div>
                          <strong>Translation:</strong> {p.translated_text}
                        </div>
                        <div>
                          📍 GPS: {p.lat}, {p.lng}
                        </div>
                        {p.photo_path && (
                          <img
                            src={`${BACKEND_URL}${p.photo_path}`}
                            alt="Proof"
                            className="h-36 rounded mt-2 object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: MP LOGIN ---------------- */}
      {activeTab === "login" && (
        <div className="max-w-md mx-auto w-full px-4 py-16">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-black">Member of Parliament Login</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Visakhapatnam Parliamentary Constituency
            </p>
            {loginError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold mb-4">
                {loginError}
              </div>
            )}
            <form onSubmit={handleMpLogin} className="space-y-4">
              <input
                type="email"
                value={mpEmail}
                onChange={(e) => setMpEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold"
              />
              <input
                type="password"
                value={mpPassword}
                onChange={(e) => setMpPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold"
              />
              <button
                type="submit"
                className="w-full bg-slate-900 text-amber-400 font-black py-3.5 rounded-xl text-sm"
              >
                Login to MP Dashboard
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}