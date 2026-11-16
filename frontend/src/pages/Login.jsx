import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginMP } from "../api";
import { ShieldCheck, Lock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("mp@vizag.gov.in");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await loginMP(email, password);
      if (res.success) {
        localStorage.setItem("mp_token", res.access_token);
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Invalid login. Use mp@vizag.gov.in and admin123");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
        <div className="w-14 h-14 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mb-4 shadow">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-slate-900">
          Member of Parliament Login
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Visakhapatnam Parliamentary Constituency • Official MPLADS Portal
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-xs font-bold mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Official Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Lock className="w-4 h-4" />
            Login to MP Priority Dashboard
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 text-center">
          Demo Credentials Pre-filled: <strong>mp@vizag.gov.in</strong> /{" "}
          <strong>admin123</strong>
        </div>
      </div>
    </div>
  );
}