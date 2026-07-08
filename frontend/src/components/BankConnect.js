import { useCallback, useEffect, useState } from "react";
import Navbar from "./Navbar";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import api from "../api";

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
      showToast("Mock bank connected", "success");
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

      <div className="min-h-screen bg-surface-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Bank Connect
            </h1>
            <p className="mt-1 text-slate-500">
              Connect bank data through a provider-ready consent flow.
            </p>
          </header>

          <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Connection status</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Current provider: {connection?.provider || "Not connected"}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                  connected
                    ? "bg-primary-100 text-primary-700"
                    : connection?.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {connection?.status || "none"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="border border-slate-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Account</p>
                <p className="mt-1 font-semibold text-slate-800">{connection?.account_mask || "Not linked"}</p>
              </div>
              <div className="border border-slate-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Consent ID</p>
                <p className="mt-1 text-sm font-medium text-slate-700 break-all">{connection?.consent_id || "—"}</p>
              </div>
              <div className="border border-slate-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last synced</p>
                <p className="mt-1 font-semibold text-slate-800">{formatDateTime(connection?.last_synced_at)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                type="button"
                onClick={connect}
                disabled={loading}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-card disabled:opacity-50 transition-colors"
              >
                {connection ? "Create New Consent" : "Connect Bank"}
              </button>
              {connection?.status === "pending" && (
                <button
                  type="button"
                  onClick={approve}
                  disabled={loading}
                  className="px-5 py-2.5 border border-primary-200 text-primary-700 font-semibold rounded-xl hover:bg-primary-50 disabled:opacity-50 transition-colors"
                >
                  Approve Mock Consent
                </button>
              )}
              <button
                type="button"
                onClick={sync}
                disabled={loading || !connected}
                className="px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sync Transactions
              </button>
            </div>
          </section>

          {lastSync && (
            <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Last sync result</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl bg-primary-50 p-4">
                  <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Credits</p>
                  <p className="text-2xl font-bold text-primary-700">{lastSync.imported?.creditCount || 0}</p>
                </div>
                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Debits</p>
                  <p className="text-2xl font-bold text-red-600">{lastSync.imported?.debitCount || 0}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total imported</p>
                  <p className="text-2xl font-bold text-slate-800">{lastSync.imported?.count || 0}</p>
                </div>
              </div>

              {lastSync.newTransactions?.length > 0 ? (
                <div className="space-y-2">
                  {lastSync.newTransactions.map((item) => (
                    <div key={`${item.type}-${item.title}-${item.date}`} className="flex flex-wrap items-center justify-between gap-3 border border-slate-100 rounded-xl p-3">
                      <div>
                        <p className="font-semibold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.date} {item.time}</p>
                      </div>
                      <span className={item.type === "credit" ? "font-bold text-primary-600" : "font-bold text-red-500"}>
                        {item.type === "credit" ? "+" : "-"}₹{Number(item.amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No new transactions in this sync.</p>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
