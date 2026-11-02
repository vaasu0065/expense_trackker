import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api";
import {
  LayoutDashboard,
  BarChart3,
  UploadCloud,
  Landmark,
  HandCoins,
  LogOut,
  RefreshCw,
  Wallet,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", short: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Statistics", short: "Stats", path: "/stats", icon: BarChart3 },
  { name: "Import", short: "Import", path: "/import", icon: UploadCloud },
  { name: "Bank Sync", short: "Bank", path: "/bank", icon: Landmark },
  { name: "Lend & Borrow", short: "Lend", path: "/lendborrow", icon: HandCoins },
];

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);

  const triggerHardRefresh = () => {
    setRefreshing(true);
    if (window.hardRefreshPWA) {
      window.hardRefreshPWA();
    } else {
      window.location.reload(true);
    }
  };

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

  // Close the user menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-ink-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-xl text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="whitespace-nowrap text-base font-semibold tracking-tight">Expense Tracker</span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Main" className="hidden min-w-0 items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-brand-500/15 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? "text-brand-400" : ""}`}
                    aria-hidden="true"
                  />
                  <span className="lg:hidden">{item.short}</span>
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="flex min-h-[44px] items-center gap-2 rounded-xl px-1.5 text-slate-300 transition-colors duration-150 hover:bg-white/5 hover:text-white sm:px-2"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-sm font-semibold text-white">
                {initial}
              </span>
              {user && (
                <span className="hidden max-w-[140px] truncate text-sm font-medium xl:inline">
                  {user.name}
                </span>
              )}
              <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" aria-hidden="true" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/[0.08] bg-ink-900 p-1.5 shadow-pop animate-fade-in"
              >
                {user && (
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                    {user.email && <p className="truncate text-xs text-slate-400">{user.email}</p>}
                  </div>
                )}
                {user && <div className="divider my-1" />}
                <button
                  type="button"
                  role="menuitem"
                  onClick={triggerHardRefresh}
                  disabled={refreshing}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-slate-200 transition-colors duration-150 hover:bg-white/5 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 text-slate-400 ${refreshing ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                  {refreshing ? "Refreshing…" : "Refresh app"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-expense-300 transition-colors duration-150 hover:bg-expense-500/10"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150 ${
                    isActive ? "text-brand-300" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full ${
                      isActive ? "bg-brand-500/15" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {item.short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
