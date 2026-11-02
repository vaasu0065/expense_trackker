import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import { KeyRound, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";

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

  const strength = newPassword.length < 4 ? "Weak" : newPassword.length < 8 ? "Fair" : "Strong";
  const strengthColor = { Weak: "bg-expense-500", Fair: "bg-orange-400", Strong: "bg-income-500" }[strength];
  const strengthText = { Weak: "text-expense-400", Fair: "text-orange-400", Strong: "text-income-400" }[strength];
  const mismatch = confirmPassword && confirmPassword !== newPassword;
  const matches = confirmPassword && confirmPassword === newPassword;

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />
      )}

      <main className="flex min-h-screen items-center justify-center px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] animate-fade-in">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-2.5 text-white">
            <span className="brand-mark h-10 w-10">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Expense Tracker</span>
          </div>

          <div className="card-gold p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-stone-400">
                <KeyRound className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
                Step {step} of 2
              </p>
              <h1 className="font-display text-[2rem] leading-tight text-white">
                {step === 1 ? "Reset your password" : "Enter your code"}
              </h1>
              <p className="mt-1 text-sm text-stone-400">
                {step === 1 ? (
                  "Enter your account email and we'll send you a 6-digit reset code."
                ) : (
                  <>
                    We sent a 6-digit code to <span className="font-medium text-stone-200">{email}</span>.
                  </>
                )}
              </p>
              <div className="mt-4 flex gap-2" aria-hidden="true">
                <div className="h-1 flex-1 rounded-full bg-brand-400" />
                <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-brand-400" : "bg-white/10"}`} />
              </div>
            </div>

            {/* Step 1 – Email */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="fp-email" className="label">Email</label>
                  <input
                    id="fp-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoFocus
                    className="input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={loading}
                  aria-busy={loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending code…
                    </>
                  ) : (
                    <>
                      Send reset code
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2 – New password */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="fp-code" className="label">6-digit reset code</label>
                  <input
                    id="fp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength="6"
                    placeholder="000000"
                    aria-describedby="fp-code-hint"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyPress={handleKeyPress}
                    autoFocus
                    className="input text-center text-lg font-semibold tracking-[0.4em] tabular-nums"
                  />
                  <p id="fp-code-hint" className="field-hint">The code expires 10 minutes after it was sent.</p>
                </div>

                <div>
                  <label htmlFor="fp-new" className="label">New password</label>
                  <div className="relative">
                    <input
                      id="fp-new"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="input pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="btn-icon absolute right-1 top-1/2 -translate-y-1/2"
                      aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {newPassword.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            newPassword.length >= level * 4 ? strengthColor : "bg-white/10"
                          }`}
                        />
                      ))}
                      <span className={`ml-1.5 text-xs font-medium ${strengthText}`}>{strength}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="fp-confirm" className="label">Confirm new password</label>
                  <input
                    id="fp-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    aria-invalid={mismatch ? "true" : undefined}
                    aria-describedby="fp-confirm-status"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`input ${
                      mismatch
                        ? "border-expense-500/60 focus:border-expense-400 focus:ring-expense-400/30"
                        : matches
                        ? "border-income-500/50"
                        : ""
                    }`}
                  />
                  <div id="fp-confirm-status" aria-live="polite">
                    {mismatch && (
                      <p className="field-error flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> Passwords do not match
                      </p>
                    )}
                    {matches && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-income-400">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Passwords match
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  aria-busy={loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Updating password…
                    </>
                  ) : (
                    "Save new password"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setResetCode(""); setNewPassword(""); setConfirmPassword(""); }}
                  className="btn-ghost w-full"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Use a different email
                </button>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-stone-400">
            Remembered it?{" "}
            <a href="/login" className="font-medium text-brand-400 hover:text-brand-300 hover:underline">
              Back to sign in
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
