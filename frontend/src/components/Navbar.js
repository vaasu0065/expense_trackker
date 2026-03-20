import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const loadUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser, location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-800 hover:text-primary-600 transition-colors"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-500 text-white font-bold text-lg shadow-card">
              ₹
            </span>
            <span className="font-bold text-xl tracking-tight hidden sm:block">
              Expense Tracker
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? "bg-primary-100 text-primary-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/stats"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/stats"
                  ? "bg-primary-100 text-primary-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              Statistics
            </Link>
            <Link
              to="/lendborrow"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/lendborrow"
                  ? "bg-primary-100 text-primary-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              Lend & Borrow
            </Link>
            {user && (
              <span className="ml-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium">
                {user.name}
              </span>
            )}
            <button
              onClick={logout}
              className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 animate-fade-in">
            <div className="flex flex-col gap-1">
              <Link to="/" className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                Dashboard
              </Link>
              <Link to="/stats" className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                Statistics
              </Link>
              <Link to="/lendborrow" className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                Lend & Borrow
              </Link>
              {user && (
                <div className="px-4 py-2 text-slate-500 text-sm">Signed in as {user.name}</div>
              )}
              <button
                onClick={logout}
                className="text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
