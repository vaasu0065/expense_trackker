import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = enter email, 2 = set new password
  const [email, setEmail] = useState("");
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
      await api.post("/auth/forgot-password/verify-email", { email: email.trim() });
      showToast("Email verified! Set your new password.", "success");
      setStep(2);
    } catch (err) {
      showToast(err.response?.data?.msg || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
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
      await api.post("/auth/reset-password", { email: email.trim(), newPassword });
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

      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 space-y-6 animate-slide-up">

            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 text-white text-2xl font-bold shadow-card mb-4">
                ₹
              </div>
              <h1 className="text-2xl font-bold text-slate-800">
                {step === 1 ? "Forgot password?" : "Set new password"}
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                {step === 1
                  ? "Enter your registered email to continue"
                  : `Resetting password for ${email}`}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? "bg-primary-500" : "bg-slate-200"}`} />
              <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? "bg-primary-500" : "bg-slate-200"}`} />
            </div>

            {/* Step 1 – Email */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoFocus
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
                  />
                </div>
                <button
                  onClick={handleVerifyEmail}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying…" : "Continue"}
                </button>
              </div>
            )}

            {/* Step 2 – New password */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      autoFocus
                      className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {newPassword.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            newPassword.length >= level * 4
                              ? level === 1 ? "bg-red-400" : level === 2 ? "bg-yellow-400" : "bg-primary-500"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-slate-400 ml-1">
                        {newPassword.length < 4 ? "Weak" : newPassword.length < 8 ? "Fair" : "Strong"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-300 bg-red-50"
                        : confirmPassword && confirmPassword === newPassword
                        ? "border-primary-300 bg-primary-50"
                        : "border-slate-200"
                    }`}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="text-xs text-primary-600 mt-1">✓ Passwords match</p>
                  )}
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating password…" : "Update password"}
                </button>

                <button
                  onClick={() => { setStep(1); setNewPassword(""); setConfirmPassword(""); }}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  ← Use a different email
                </button>
              </div>
            )}

            {/* Back to login */}
            <div className="text-center pt-2 border-t border-slate-100">
              <a href="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline">
                ← Back to sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
