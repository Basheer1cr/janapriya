import React, { useState, useRef } from "react";
import { sendOTP, verifyOTP, submitCitizenRequest } from "../api";
import {
  Mic,
  Square,
  Camera,
  MapPin,
  CheckCircle,
  Send,
  MessageSquare,
  Sparkles,
  Phone,
  ShieldAlert,
} from "lucide-react";

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

export default function CitizenSubmit({ lang }) {
  const [name, setName] = useState("Rama Rao");
  const [phone, setPhone] = useState("9848012345");
  const [village, setVillage] = useState("Anandapuram");
  const [category, setCategory] = useState("Road");
  const [text, setText] = useState("");
  const [lat, setLat] = useState(17.8962);
  const [lng, setLng] = useState(83.3746);
  const [sourceMode, setSourceMode] = useState("Web Portal");

  const [otpInput, setOtpInput] = useState("123456");
  const [isVerified, setIsVerified] = useState(false);
  const [otpStatusMsg, setOtpStatusMsg] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const uiDict = {
    en: {
      heading: "Submit Your Constituency Priority",
      sub: "Speak or type in Telugu, Hindi, or English. Gemini AI translates, classifies, and updates the MP's priority rank automatically.",
      step1: "Step 1: Citizen Phone Verification (Mock OTP: 123456)",
      step2: "Step 2: Describe Development Need or Grievance",
      sendOtpBtn: "Send Mock OTP",
      verifyOtpBtn: "Verify OTP (123456)",
      verifiedBadge: "Phone Verified via OTP",
      submitBtn: "Submit to AI Priority Engine",
    },
    te: {
      heading: "మీ గ్రామ అభివృద్ధి సమస్యను తెలియజేయండి",
      sub: "తెలుగు, హిందీ లేదా ఇంగ్లీష్‌లో మాట్లాడండి లేదా టైప్ చేయండి. AI దీనిని విశ్లేషించి MP ప్రాధాన్యత జాబితాలో చేరుస్తుంది.",
      step1: "స్టెప్ 1: ఫోన్ నంబర్ ధృవీకరణ (డెమో OTP: 123456)",
      step2: "స్టెప్ 2: మీ గ్రామ సమస్య వివరాలు నమోదు చేయండి",
      sendOtpBtn: "OTP పంపండి",
      verifyOtpBtn: "OTP నిర్ధారించండి (123456)",
      verifiedBadge: "ఫోన్ నంబర్ ధృవీకరించబడింది",
      submitBtn: "AI ప్రాధాన్యత వేదికకు పంపండి",
    },
    hi: {
      heading: "अपने क्षेत्र की विकास प्राथमिकता दर्ज करें",
      sub: "तेलुगु, हिंदी या अंग्रेजी में बोलें या लिखें। AI इसे अनुवाद और वर्गीकृत करके सांसद डैशबोर्ड पर रैंक करेगा।",
      step1: "चरण 1: नागरिक फ़ोन सत्यापन (डेमो OTP: 123456)",
      step2: "चरण 2: अपनी विकास आवश्यकता या शिकायत का विवरण दें",
      sendOtpBtn: "OTP भेजें",
      verifyOtpBtn: "OTP सत्यापित करें (123456)",
      verifiedBadge: "फ़ोन नंबर सत्यापित",
      submitBtn: "AI प्राथमिकता इंजन में जमा करें",
    },
  };

  const ui = uiDict[lang] || uiDict.en;

  const handleVillageChange = (selectedVillage) => {
    setVillage(selectedVillage);
    const coords = VILLAGE_COORDS[selectedVillage] || { lat: 17.85, lng: 83.35 };
    setLat(coords.lat);
    setLng(coords.lng);
  };

  const handleSendOTP = async () => {
    try {
      const res = await sendOTP(phone, name, village);
      setOtpInput("123456");
      setOtpStatusMsg(`Mock SMS Sent! ${res.message}`);
    } catch (err) {
      setOtpStatusMsg("Error sending OTP. Make sure backend is running on port 8000.");
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const res = await verifyOTP(phone, otpInput, name, village);
      if (res.success) {
        setIsVerified(true);
        localStorage.setItem("citizen_token", res.access_token);
        setOtpStatusMsg("Verified! JWT Token Issued.");
      }
    } catch (err) {
      setOtpStatusMsg("Invalid OTP. Please enter 123456.");
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
          const fallback = VILLAGE_COORDS[village];
          setLat(fallback.lat);
          setLng(fallback.lng);
          alert(`Using ${village} village center coordinates: ${fallback.lat}, ${fallback.lng}`);
        }
      );
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang =
          lang === "te" ? "te-IN" : lang === "hi" ? "hi-IN" : "en-IN";
        recognition.continuous = false;
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err) {
      alert("Microphone not found. Inserting sample Telugu voice transcript for demo!");
      setText(
        "ఆనందపురం మెయిన్ రోడ్డు పూర్తిగా గుంతలమయంగా మారింది, అంబులెన్స్ కూడా రావడం లేదు. వెంటనే తారు రోడ్డు వేయండి."
      );
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const fillDemoSample = (sampleType) => {
    if (sampleType === "te_road") {
      handleVillageChange("Anandapuram");
      setCategory("Road");
      setText(
        "ఆనందపురం మెయిన్ రోడ్డు 4 కి.మీ మేర పూర్తిగా గుంతలమయంగా మారింది. రాత్రిపూట గర్భిణీ స్త్రీలను ఆసుపత్రికి తీసుకెళ్లడానికి అంబులెన్స్ కూడా రావడం లేదు."
      );
    } else if (sampleType === "te_school") {
      handleVillageChange("Madhurawada");
      setCategory("School");
      setText(
        "మధురవాడ హైస్కూల్‌లో 1200 మంది విద్యార్థులు ఉన్నారు కానీ సరిపడా తరగతి గదులు, సైన్స్ ల్యాబ్ లేవు. పై చదువుల కోసం 8 కి.మీ దూరం వెళ్లాల్సి వస్తోంది."
      );
    } else if (sampleType === "hi_health") {
      handleVillageChange("Bheemili");
      setCategory("Health");
      setText(
        "भीमिली तटीय गांवों में 5 किलोमीटर के दायरे में कोई 24x7 प्राथमिक स्वास्थ्य केंद्र (PHC) नहीं है। आपातकालीन स्थिति में मरीजों को भारी परेशानी होती है।"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      alert("Please enter or record your development suggestion first.");
      return;
    }

    setIsSubmitting(true);
    setAiResult(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("village", village);
      formData.append("category", category);
      formData.append("text", text);
      formData.append("lat", lat);
      formData.append("lng", lng);
      formData.append("source", audioBlob ? "Voice Note" : sourceMode);

      if (photoFile) {
        formData.append("photo", photoFile);
      }
      if (audioBlob) {
        formData.append("audio", audioBlob, "citizen_voice.webm");
      }

      const result = await submitCitizenRequest(formData);
      setAiResult(result);
    } catch (err) {
      alert("Submission failed. Make sure FastAPI backend is running on port 8000.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              Visakhapatnam Constituency • Citizen Voice
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">{ui.heading}</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">{ui.sub}</p>
          </div>

          <div className="bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSourceMode("Web Portal")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                sourceMode === "Web Portal"
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              Web & Voice Portal
            </button>
            <button
              type="button"
              onClick={() => setSourceMode("WhatsApp Bot")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                sourceMode === "WhatsApp Bot"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Sim
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: Mock OTP Verification */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
            <Phone className="w-5 h-5 text-indigo-600" />
            {ui.step1}
          </h3>
          {isVerified && (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {ui.verifiedBadge}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Citizen Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium"
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium"
          />
          <button
            type="button"
            onClick={handleSendOTP}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-4 py-2.5 text-sm transition"
          >
            {ui.sendOtpBtn}
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="123456"
              className="w-24 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold text-center bg-amber-50"
            />
            <button
              type="button"
              onClick={handleVerifyOTP}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-3 py-2.5 text-xs transition"
            >
              {ui.verifyOtpBtn}
            </button>
          </div>
        </div>

        {otpStatusMsg && (
          <p className="text-xs font-bold text-indigo-700 mt-2.5 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">
            {otpStatusMsg}
          </p>
        )}
      </div>

      {/* Step 2: Submission Form */}
      <form
        onSubmit={handleSubmit}
        className={`rounded-2xl shadow-md border p-6 transition ${
          sourceMode === "WhatsApp Bot"
            ? "bg-emerald-950/5 border-emerald-400"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="font-extrabold text-slate-900 text-base">{ui.step2}</h3>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold mr-1">
              1-Click Demo Fill:
            </span>
            <button
              type="button"
              onClick={() => fillDemoSample("te_road")}
              className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2.5 py-1 rounded-lg border border-amber-300"
            >
              తెలుగు (Anandapuram Road)
            </button>
            <button
              type="button"
              onClick={() => fillDemoSample("te_school")}
              className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold px-2.5 py-1 rounded-lg border border-indigo-300"
            >
              తెలుగు (Madhurawada School)
            </button>
            <button
              type="button"
              onClick={() => fillDemoSample("hi_health")}
              className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold px-2.5 py-1 rounded-lg border border-emerald-300"
            >
              हिंदी (Bheemili PHC)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Village (Visakhapatnam)
            </label>
            <select
              value={village}
              onChange={(e) => handleVillageChange(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold bg-white"
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
              Development Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold bg-white"
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
            Describe Issue (Telugu / Hindi / English)
          </label>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ఉదాహరణకు: మా గ్రామంలో రోడ్డు పూర్తిగా పాడైపోయింది... / Type or use voice button below..."
            className="w-full border border-slate-300 rounded-xl p-3.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="border border-slate-200 bg-slate-50 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-600 mb-1.5 block">
              1. Voice Input (Web Speech + Audio)
            </span>
            {!isRecording ? (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow transition"
              >
                <Mic className="w-4 h-4" />
                Record Voice Note
              </button>
            ) : (
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-amber-400 font-bold py-2.5 px-3 rounded-xl text-xs animate-pulse"
              >
                <Square className="w-4 h-4" />
                Stop Recording...
              </button>
            )}
            {audioBlob && (
              <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
                ✓ Voice audio attached
              </span>
            )}
          </div>

          <div className="border border-slate-200 bg-slate-50 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-600 mb-1.5 block">
              2. Upload Site Photo Proof
            </span>
            <label className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow cursor-pointer transition">
              <Camera className="w-4 h-4" />
              {photoFile ? "Change Photo" : "Upload Photo"}
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
                className="mt-2 h-14 w-full object-cover rounded-lg border border-slate-300"
              />
            )}
          </div>

          <div className="border border-slate-200 bg-slate-50 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-600 mb-1.5 block">
              3. Geo-Tag Location ({lat}, {lng})
            </span>
            <button
              type="button"
              onClick={handleDetectLocation}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow transition"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              Auto-Detect GPS
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition"
        >
          <Send className="w-5 h-5" />
          {isSubmitting
            ? "Analyzing with Gemini AI & Updating Cluster Ranks..."
            : ui.submitBtn}
        </button>
      </form>

      {aiResult && (
        <div className="mt-6 bg-emerald-950 text-white rounded-2xl p-6 shadow-xl border-2 border-emerald-400">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h4 className="text-lg font-extrabold text-amber-400">
                AI Analysis & Live Constituency Rank Updated!
              </h4>
            </div>
            <span className="text-xs bg-emerald-800 text-emerald-200 px-3 py-1 rounded-full font-bold">
              Engine: {aiResult.submission.ai_engine}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-900/60 p-4 rounded-xl text-xs mb-4">
            <div>
              <span className="text-emerald-300 block">Detected Language</span>
              <span className="text-base font-extrabold">
                {aiResult.submission.language}
              </span>
            </div>
            <div>
              <span className="text-emerald-300 block">AI Classified Category</span>
              <span className="text-base font-extrabold">
                {aiResult.submission.category} ({aiResult.submission.village})
              </span>
            </div>
            <div>
              <span className="text-emerald-300 block">Detected Urgency</span>
              <span className="text-base font-extrabold text-amber-300 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
                {aiResult.submission.urgency}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm bg-slate-900/70 p-4 rounded-xl">
            <p>
              <strong className="text-amber-400">English Translation: </strong>
              {aiResult.submission.translated_text}
            </p>
            <p>
              <strong className="text-amber-400">1-Line AI Summary: </strong>
              {aiResult.submission.summary}
            </p>
            <p className="pt-2 border-t border-slate-700 text-emerald-300 font-bold">
              Cluster Impact: "{aiResult.cluster_impact.cluster_title}" is now Rank #
              {aiResult.cluster_impact.current_rank} with{" "}
              {aiResult.cluster_impact.total_requests} verified requests (Priority
              Score: {aiResult.cluster_impact.priority_score} / 100).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}