import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import { User, Mail, Lock, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const navigate = useNavigate();

  const register = async () => {
    if (!name?.trim() || !email?.trim() || !password) {
      showToast("Please fill in all fields", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters", "warning");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      showToast("Account created successfully. Redirecting to sign in…", "success");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      showToast(err.response?.data?.msg || "Registration failed", "error");
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") register();
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
                <Sparkles className="w-3.5 h-3.5" /> Start Your Financial Journey
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">Create Account</h1>
              <p className="text-slate-400 mt-1 text-sm font-medium">Join Expense Tracker to master your money</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" /> Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3.5 bg-[#1A253D] border border-white/20 rounded-2xl font-semibold text-white placeholder-slate-400 text-sm focus:bg-[#1E2B48] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all shadow-inner"
                />
              </div>

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
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" /> Password (Min 6 chars)
                </label>
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
                onClick={register}
                disabled={loading}
                className="w-full py-4 px-4 bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 text-white font-black text-base rounded-2xl shadow-card hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account…</span>
                  </>
                ) : (
                  <>
                    <span>Register & Get Started</span>
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
                <span className="px-3 bg-white/90 rounded-full text-slate-400">Already have an account?</span>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-sm transition-all active:scale-95 border border-slate-200/80"
              >
                <span>Sign in to Existing Account</span>
              </a>
            </div>
          </div>

          <p className="text-center text-slate-400 font-medium text-xs mt-6 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure Cloud Vault & End-to-end Sync
          </p>
        </div>
      </div>
    </>
  );
}
