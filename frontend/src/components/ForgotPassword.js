import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import { KeyRound, Mail, Lock, ArrowRight, ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter code and new password
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const navigate = useNavigate();

  const handleVerifyEmail = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      showToast("Please enter your email address", "error");
      return;
    }
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/verify-email", { email: email.trim() });
      showToast(res.data?.msg || "Reset code sent. Check your email.", "success", 5000);
      setStep(2);
    } catch (err) {
      showToast(err.response?.data?.msg || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode.trim()) {
      showToast("Please enter the reset code", "error");
      return;
    }
    if (!/^\d{6}$/.test(resetCode.trim())) {
      showToast("Reset code must be 6 digits", "warning");
      return;
    }
    if (!newPassword) {
      showToast("Please enter a new password", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: email.trim(),
        resetCode: resetCode.trim(),
        newPassword,
      });
      showToast("Password updated! Redirecting to sign in…", "success");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to reset password", "error");
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") step === 1 ? handleVerifyEmail() : handleResetPassword();
  };

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden animate-fade-in">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/20 shadow-glow space-y-7 animate-slide-up">

            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl font-black shadow-lg mb-4 ring-4 ring-white/10">
                <KeyRound className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-extrabold border border-indigo-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Account Recovery
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                {step === 1 ? "Reset Password" : "Verify Code"}
              </h1>
              <p className="text-slate-400 mt-1 text-sm font-medium">
                {step === 1
                  ? "Enter your account email to receive a secure recovery code"
                  : `Enter the 6-digit verification code dispatched to ${email}`}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-2 rounded-full transition-all duration-300 ${step >= 1 ? "bg-gradient-to-r from-indigo-500 to-purple-600" : "bg-slate-700"}`} />
              <div className={`flex-1 h-2 rounded-full transition-all duration-300 ${step >= 2 ? "bg-gradient-to-r from-indigo-500 to-purple-600" : "bg-slate-700"}`} />
            </div>

            {/* Step 1 – Email */}
            {step === 1 && (
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
                    autoFocus
                    className="w-full px-4 py-3.5 bg-[#1A253D] border border-white/20 rounded-2xl font-semibold text-white placeholder-slate-400 text-sm focus:bg-[#1E2B48] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all shadow-inner"
                  />
                </div>
                <button
                  onClick={handleVerifyEmail}
                  disabled={loading}
                  className="w-full py-4 px-4 bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 text-white font-black text-base rounded-2xl shadow-card hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading ? "Verifying Email…" : "Send Reset Code →"}
                </button>
              </div>
            )}

            {/* Step 2 – New password */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    placeholder="000000"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyPress={handleKeyPress}
                    autoFocus
                    className="w-full px-4 py-3.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all tracking-[0.45em] font-black text-center text-lg text-primary-700 shadow-inner"
                  />
                  <p className="text-[11px] font-semibold text-slate-400 mt-1.5 text-center">
                    Expires in 10 minutes from dispatch.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary-600" /> New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-3.5 bg-slate-50/90 pr-12 border border-slate-200/80 rounded-2xl font-semibold text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {newPassword.length > 0 && (
                    <div className="mt-2 flex gap-1 items-center">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            newPassword.length >= level * 4
                              ? level === 1 ? "bg-rose-500" : level === 2 ? "bg-amber-500" : "bg-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                      <span className="text-[11px] font-black uppercase text-slate-400 ml-1.5">
                        {newPassword.length < 4 ? "Weak" : newPassword.length < 8 ? "Fair" : "Strong"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`w-full px-4 py-3.5 border rounded-2xl font-semibold text-slate-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-rose-300 bg-rose-50/70"
                        : confirmPassword && confirmPassword === newPassword
                        ? "border-emerald-300 bg-emerald-50/70"
                        : "border-slate-200/80 bg-slate-50/90"
                    }`}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs font-bold text-rose-500 mt-1.5">⚠ Passwords do not match</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="text-xs font-bold text-emerald-600 mt-1.5">✓ Passwords exactly match</p>
                  )}
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full py-4 px-4 bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 text-white font-black text-base rounded-2xl shadow-card hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading ? "Updating Password…" : "Save New Password & Sign In"}
                </button>

                <button
                  onClick={() => { setStep(1); setResetCode(""); setNewPassword(""); setConfirmPassword(""); }}
                  className="w-full py-2.5 text-xs font-extrabold text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Use a different email address
                </button>
              </div>
            )}

            {/* Back to login */}
            <div className="text-center pt-2 border-t border-slate-100">
              <a href="/login" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-extrabold hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </a>
            </div>
          </div>

          <p className="text-center text-slate-400 font-medium text-xs mt-6 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure 256-bit Identity Protection
          </p>
        </div>
      </div>
    </>
  );
}
