import { useCallback, useEffect, useState } from "react";
import Navbar from "./Navbar";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import api from "../api";
import { Landmark, ShieldCheck, RefreshCw, Link2, Sparkles, CheckCircle, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react";

function formatDateTime(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BankConnect() {
  const [connection, setConnection] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const loadStatus = useCallback(async () => {
    try {
      const res = await api.get("/bank/status");
      setConnection(res.data?.connection || null);
    } catch (err) {
      setConnection(null);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const connect = async () => {
    setLoading(true);
    try {
      const res = await api.post("/bank/connect", { provider: "mock" });
      setConnection(res.data?.connection || null);
      showToast("Mock consent created. Approve it to simulate bank connection.", "success", 5000);
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to start bank connection", "error");
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    setLoading(true);
    try {
      const res = await api.post("/bank/mock/approve");
      setConnection(res.data?.connection || null);
      showToast("Mock bank connected successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to approve connection", "error");
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    setLoading(true);
    try {
      const res = await api.post("/bank/sync");
      setLastSync(res.data);
      showToast(res.data?.msg || "Bank sync complete", "success");
      loadStatus();
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to sync bank transactions", "error");
    } finally {
      setLoading(false);
    }
  };

  const connected = connection?.status === "active";

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}
      <Navbar />

      <div className="min-h-screen py-8 animate-fade-in">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-card relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> Secure Open Banking
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                Bank Data Connect
              </h1>
              <p className="mt-1 text-slate-300 text-sm sm:text-base">
                Simulate real-time account verification and auto-sync transactions directly into your ledger.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-sm shadow-sm border ${
                  connected
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    : connection?.status === "pending"
                    ? "bg-amber-500/20 text-amber-300 border-amber-400/30 animate-pulse"
                    : "bg-white/10 text-slate-300 border-white/15"
                }`}
              >
                <Link2 className="w-4 h-4" />
                Status: {connection?.status ? connection.status.toUpperCase() : "DISCONNECTED"}
              </span>
            </div>
          </header>

          <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-white shadow-card mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-100/80 flex items-center justify-center text-primary-600 shadow-sm border border-primary-200/50">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Financial Institution Connection</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Provider Gateway: <strong className="text-slate-700">{connection?.provider || "None (Sandbox Mock)"}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 shadow-inner">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Linked Account</p>
                <p className="font-extrabold text-slate-800 text-base">{connection?.account_mask || "No active account"}</p>
              </div>
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 shadow-inner">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">OAuth Consent Token</p>
                <p className="text-xs font-mono font-semibold text-slate-600 break-all">{connection?.consent_id || "Unassigned"}</p>
              </div>
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 shadow-inner">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Sync Checkpoint</p>
                <p className="font-extrabold text-slate-800 text-base">{formatDateTime(connection?.last_synced_at)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={connect}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-card hover:shadow-glow transition-all disabled:opacity-50 active:scale-95 text-sm"
              >
                <Link2 className="w-4 h-4" />
                <span>{connection ? "Regenerate Consent" : "Simulate Bank Link"}</span>
              </button>
              {connection?.status === "pending" && (
                <button
                  type="button"
                  onClick={approve}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold rounded-2xl shadow-card transition-all disabled:opacity-50 active:scale-95 text-sm animate-pulse"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve Sandbox Consent</span>
                </button>
              )}
              <button
                type="button"
                onClick={sync}
                disabled={loading || !connected}
                className="flex items-center gap-2 px-6 py-3.5 border border-slate-200/80 text-slate-700 font-bold rounded-2xl bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span>Pull Latest Transactions</span>
              </button>
            </div>
          </section>

          {lastSync && (
            <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-white shadow-card animate-slide-up">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Sync Summary Breakdown</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/60 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Credits Pulled</span>
                    <ArrowDownRight className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  </div>
                  <p className="text-3xl font-black text-emerald-700">{lastSync.imported?.creditCount || 0}</p>
                </div>

                <div className="rounded-2xl bg-rose-50/80 border border-rose-200/60 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-rose-600 uppercase tracking-wider">Debits Pulled</span>
                    <ArrowUpRight className="w-4 h-4 text-rose-600 stroke-[3]" />
                  </div>
                  <p className="text-3xl font-black text-rose-600">{lastSync.imported?.debitCount || 0}</p>
                </div>

                <div className="rounded-2xl bg-slate-100/80 border border-slate-200/60 p-5 shadow-sm">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Total Processed</p>
                  <p className="text-3xl font-black text-slate-800">{lastSync.imported?.count || 0}</p>
                </div>
              </div>

              {lastSync.newTransactions?.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Synced Transaction Stream</h3>
                  {lastSync.newTransactions.map((item) => (
                    <div key={`${item.type}-${item.title}-${item.date}`} className="flex flex-wrap items-center justify-between gap-3 bg-white/80 border border-slate-100 rounded-2xl p-4 shadow-sm hover:scale-[1.003] transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${item.type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {item.type === "credit" ? "+" : "-"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                          <p className="text-xs text-slate-500 font-medium">{item.date} at {item.time}</p>
                        </div>
                      </div>
                      <span className={item.type === "credit" ? "font-black text-emerald-600 text-base" : "font-black text-rose-600 text-base"}>
                        {item.type === "credit" ? "+" : "-"}₹{Number(item.amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-500 font-medium">
                  No new transactions were detected during this sync interval.
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
