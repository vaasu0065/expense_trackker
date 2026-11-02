import { useState } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import { ArrowRight, Eye, EyeOff, Loader2, Wallet } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

      <main className="flex min-h-screen items-center justify-center px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] animate-fade-in">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-2.5 text-white">
            <span className="brand-mark h-10 w-10">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Expense Tracker</span>
          </div>

          <div className="card-gold p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="font-display text-[2rem] leading-tight text-white">Welcome back</h1>
              <p className="mt-1 text-sm text-stone-400">Sign in to manage your expenses.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="login-email" className="label">Email</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="input"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="login-password" className="text-sm font-medium text-stone-300">
                    Password
                  </label>
                  <a href="/forgot-password" className="text-sm font-medium text-brand-400 hover:text-brand-300 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="btn-icon absolute right-1 top-1/2 -translate-y-1/2"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => login()}
                disabled={loading}
                aria-busy={loading}
                className="btn-primary mt-2 w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-stone-400">
            Don't have an account?{" "}
            <a href="/register" className="font-medium text-brand-400 hover:text-brand-300 hover:underline">
              Create one
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
