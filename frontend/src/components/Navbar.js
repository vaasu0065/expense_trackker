import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api";
import { 
  LayoutDashboard, 
  BarChart3, 
  UploadCloud, 
  Landmark, 
  HandCoins, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  UserCheck
} from "lucide-react";

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

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Statistics", path: "/stats", icon: BarChart3 },
    { name: "Import", path: "/import", icon: UploadCloud },
    { name: "Bank Sync", path: "/bank", icon: Landmark },
    { name: "Lend & Borrow", path: "/lendborrow", icon: HandCoins },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200/70 shadow-glass transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link
            to="/"
            className="group flex items-center gap-3 text-slate-800 hover:text-primary-600 transition-all duration-300"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-teal-400 text-white font-black text-xl shadow-card group-hover:shadow-glow group-hover:scale-105 transition-all duration-300">
              ₹
              <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-300 animate-pulseGlow" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 bg-clip-text text-transparent block">
                Vegavruddhi
              </span>
              <span className="text-[10px] font-semibold text-primary-600 uppercase tracking-widest -mt-1 block">
                Expense AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-white text-primary-700 shadow-sm scale-[1.02]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "text-primary-600 scale-110" : "text-slate-400 group-hover:text-slate-600"}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* User Profile & Logout */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2.5 pl-3 pr-4 py-1.5 rounded-2xl bg-gradient-to-r from-primary-50 to-emerald-50/50 border border-primary-200/60 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-700 truncate max-w-[120px]">
                  {user.name}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-500 hover:text-white border border-rose-200/60 hover:border-transparent transition-all duration-300 shadow-sm active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70 transition-all duration-200 active:scale-95"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6 text-rose-500" /> : <Menu className="w-6 h-6 text-slate-700" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200/80 animate-slide-down">
            <div className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-primary-50 text-primary-700 border border-primary-200/60 shadow-sm"
                        : "text-slate-600 hover:bg-slate-100/80"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-primary-600" : "text-slate-400"}`} />
                    {item.name}
                  </Link>
                );
              })}
              
              {user && (
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between px-4">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-semibold text-slate-700">{user.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
