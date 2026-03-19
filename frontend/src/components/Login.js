import { useState } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

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
      // Network error (backend not reachable) – e.g. Render free tier sleeping
      if (!err.response) {
        const base = process.env.REACT_APP_API_URL || "http://localhost:4000";
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

      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 text-white text-2xl font-bold shadow-card mb-4">
                ₹
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
              <p className="text-slate-500 mt-1">Sign in to your account</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-primary-600 hover:text-primary-700 hover:underline font-medium"
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
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
                />
              </div>
              <button
                onClick={login}
                disabled={loading}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-card hover:shadow-card-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </div>

            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Don't have an account?</span>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/register"
                className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
              >
                Create an account
              </a>
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            Track expenses and stay on budget
          </p>
        </div>
      </div>
    </>
  );
}
