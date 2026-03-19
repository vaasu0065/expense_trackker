import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

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
      showToast("Account created. Please sign in.", "success");
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

      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 text-white text-2xl font-bold shadow-card mb-4">
                ₹
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Create account</h1>
              <p className="text-slate-500 mt-1">Sign up to start tracking your expenses</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <button
                onClick={register}
                disabled={loading}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </div>

            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Already have an account?</span>
              </div>
            </div>

            <div className="text-center">
              <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium hover:underline">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
