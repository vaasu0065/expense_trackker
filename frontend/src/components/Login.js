import { useState } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import { LogIn, Mail, Lock, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const login = async (isRetry = false) => {
    if (!email?.trim() || !password) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email: email.trim(), password });
      const token = res.data?.token;
      if (!token) {
        showToast("Invalid response from server", "error");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", token);
      const userName = res.data?.user?.name || "User";
      showToast(`Welcome back, ${userName}!`, "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (err) {
      if (!err.response) {
        const base = process.env.REACT_APP_API_URL || "http://localhost:5001";
        const isRender = base.includes("onrender.com");

        if (isRender && !isRetry) {
          showToast("Server may be waking up (free tier). Retrying in 10 seconds…", "info", 12000);
          setLoading(false);
          setTimeout(() => login(true), 10000);
          return;
        }

        showToast(`Cannot connect to server. Is the backend running at ${base}?`, "error", 6000);
        setLoading(false);
        console.error("Login network error:", err.message);
        return;
      }
      setLoading(false);
      const msg = err.response?.data?.msg || `Login failed (${err.response?.status || "error"})`;
      const needsVerification = err.response?.data?.needsVerification;
      showToast(msg, "error", needsVerification ? 6000 : 4000);
      if (needsVerification && err.response?.data?.email) {
        console.log("User needs to verify email:", err.response.data.email);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") login();
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden animate-fade-in">
        {/* Background ambient glowing spheres */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/20 shadow-glow space-y-7">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl font-black shadow-lg mb-4 ring-4 ring-white/10">
                ₹
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-extrabold border border-indigo-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Expense Tracker Pro
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">Welcome Back</h1>
              <p className="text-slate-400 mt-1 text-sm font-medium">Sign in to manage and analyze your wealth</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3.5 bg-[#1A253D] border border-white/20 rounded-2xl font-semibold text-white placeholder-slate-400 text-sm focus:bg-[#1E2B48] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all shadow-inner"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" /> Password
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-bold transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3.5 bg-[#1A253D] border border-white/20 rounded-2xl font-semibold text-white placeholder-slate-400 text-sm focus:bg-[#1E2B48] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all shadow-inner"
                />
              </div>

              <button
                onClick={() => login()}
                disabled={loading}
                className="w-full py-4 px-4 bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 text-white font-black text-base rounded-2xl shadow-card hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider font-extrabold">
                <span className="px-3 bg-white/90 rounded-full text-slate-400">Don't have an account?</span>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-sm transition-all active:scale-95 border border-slate-200/80"
              >
                <span>Create a New Account</span>
                <Sparkles className="w-4 h-4 text-primary-600" />
              </a>
            </div>
          </div>

          <p className="text-center text-slate-400 font-medium text-xs mt-6 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Bank-grade encryption & automated sync
          </p>
        </div>
      </div>
    </>
  );
}
