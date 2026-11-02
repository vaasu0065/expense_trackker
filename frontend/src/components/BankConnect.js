import { useCallback, useEffect, useState } from "react";
import Navbar from "./Navbar";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import api from "../api";
import { parseDate } from "../utils/date";
import {
  Landmark,
  ShieldCheck,
  RefreshCw,
  Link2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Check,
  Info,
  Inbox,
} from "lucide-react";

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

function formatDay(value) {
  if (!value) return "";
  const d = parseDate(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }) {
  if (status === "active") {
    return (
      <span className="badge-income px-3 py-1 text-sm">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Connected
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="badge-warning px-3 py-1 text-sm">
        <Clock className="h-4 w-4" aria-hidden="true" /> Awaiting approval
      </span>
    );
  }
  return (
    <span className="badge-neutral px-3 py-1 text-sm">
      <Link2 className="h-4 w-4" aria-hidden="true" />
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Not connected"}
    </span>
  );
}

function Step({ number, state, title, description, children }) {
  // state: "done" | "current" | "upcoming"
  return (
    <li
      className={`flex gap-4 rounded-xl border p-4 sm:p-5 md:flex-col ${
        state === "current" ? "border-brand-500/40 bg-brand-500/[0.06]" : "border-white/[0.08] bg-ink-850/60"
      }`}
      aria-current={state === "current" ? "step" : undefined}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          state === "done"
            ? "bg-income-500/15 text-income-400"
            : state === "current"
            ? "bg-brand-500 text-white"
            : "bg-white/[0.06] text-slate-400"
        }`}
      >
        {state === "done" ? <Check className="h-4 w-4" aria-label="Done" /> : number}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className={`text-[15px] font-semibold ${state === "upcoming" ? "text-slate-300" : "text-white"}`}>{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
        {children && <div className="mt-4 md:mt-auto md:pt-4">{children}</div>}
      </div>
    </li>
  );
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
  const pending = connection?.status === "pending";
  const synced = Boolean(connection?.last_synced_at);

  const stepState = {
    connect: connection ? "done" : "current",
    approve: connected ? "done" : pending ? "current" : "upcoming",
    sync: connected ? (synced ? "done" : "current") : "upcoming",
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}
      <Navbar />

      <main className="page">
        <header className="page-header">
          <div>
            <h1 className="page-title">Bank sync</h1>
            <p className="page-subtitle">Link a bank account and pull its transactions into your ledger.</p>
          </div>
          <div className="self-start sm:self-auto">
            <StatusBadge status={connection?.status} />
          </div>
        </header>

        {/* Steps */}
        <section className="card card-pad mb-6" aria-labelledby="steps-title">
          <div className="card-header">
            <div>
              <h2 id="steps-title" className="card-title">Connect in three steps</h2>
              <p className="card-subtitle">Sandbox mode — no real bank credentials are used.</p>
            </div>
          </div>

          <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            <Step
              number={1}
              state={stepState.connect}
              title="Connect"
              description={connection ? "A consent request has been created." : "Start a consent request with the sandbox bank."}
            >
              <button
                type="button"
                onClick={connect}
                disabled={loading}
                className={`${connection ? "btn-secondary" : "btn-primary"} w-full sm:w-auto md:w-full`}
              >
                <Link2 className="h-4 w-4" aria-hidden="true" />
                {connection ? "Regenerate consent" : "Connect sandbox bank"}
              </button>
            </Step>

            <Step
              number={2}
              state={stepState.approve}
              title="Approve consent"
              description={
                connected
                  ? "Consent approved. Your account is linked."
                  : "Allow read-only access to your account transactions."
              }
            >
              {pending && (
                <button
                  type="button"
                  onClick={approve}
                  disabled={loading}
                  className="btn-primary w-full sm:w-auto md:w-full"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Approve consent
                </button>
              )}
            </Step>

            <Step
              number={3}
              state={stepState.sync}
              title="Sync"
              description={
                synced ? `Last synced ${formatDateTime(connection.last_synced_at)}.` : "Pull the latest transactions into your ledger."
              }
            >
              <button
                type="button"
                onClick={sync}
                disabled={loading || !connected}
                className={`${connected ? "btn-primary" : "btn-secondary"} w-full sm:w-auto md:w-full`}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
                {loading ? "Working…" : "Sync transactions"}
              </button>
            </Step>
          </ol>
        </section>

        {/* Connection details */}
        <section className="card card-pad mb-6" aria-labelledby="details-title">
          <div className="card-header mb-4">
            <div className="flex items-center gap-3">
              <div className="icon-tile bg-brand-500/15 text-brand-300">
                <Landmark className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="details-title" className="card-title">Connection details</h2>
                <p className="card-subtitle">Provider: {connection?.provider || "None (sandbox)"}</p>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3">
            <div className="bg-ink-900 p-4">
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">Linked account</dt>
              <dd className={`mt-1.5 text-[15px] ${connection?.account_mask ? "font-mono text-white" : "text-slate-500"}`}>
                {connection?.account_mask || "No account linked"}
              </dd>
            </div>
            <div className="bg-ink-900 p-4">
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">Last synced</dt>
              <dd className={`mt-1.5 text-[15px] tabular-nums ${synced ? "text-white" : "text-slate-500"}`}>
                {formatDateTime(connection?.last_synced_at)}
              </dd>
            </div>
            <div className="min-w-0 bg-ink-900 p-4">
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">Consent ID</dt>
              <dd className={`mt-1.5 break-all ${connection?.consent_id ? "font-mono text-sm text-slate-200" : "text-[15px] text-slate-500"}`}>
                {connection?.consent_id || "Not assigned"}
              </dd>
            </div>
          </dl>

          <p className="mt-4 flex items-start gap-2 text-xs text-slate-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Synced transactions are added to your ledger as credits and debits. Duplicates are skipped.
          </p>
        </section>

        {/* Last sync result */}
        {lastSync && (
          <section className="card card-pad animate-slide-up" aria-labelledby="sync-title">
            <div className="card-header">
              <div>
                <h2 id="sync-title" className="card-title">Sync results</h2>
                <p className="card-subtitle">What was imported in this sync</p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl border border-white/[0.08] bg-ink-850 p-4">
                <p className="kpi-label">Credits</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums text-income-400">
                  {lastSync.imported?.creditCount || 0}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-ink-850 p-4">
                <p className="kpi-label">Debits</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums text-expense-400">
                  {lastSync.imported?.debitCount || 0}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-ink-850 p-4">
                <p className="kpi-label">Total</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums text-white">{lastSync.imported?.count || 0}</p>
              </div>
            </div>

            {lastSync.newTransactions?.length > 0 ? (
              <>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Synced transactions</h3>
                <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
                  {lastSync.newTransactions.map((item) => {
                    const credit = item.type === "credit";
                    return (
                      <li key={`${item.type}-${item.title}-${item.date}`} className="flex items-center gap-3 p-3.5 sm:p-4">
                        <div
                          className={`icon-tile ${credit ? "bg-income-500/15 text-income-400" : "bg-expense-500/15 text-expense-400"}`}
                        >
                          {credit ? (
                            <ArrowDownLeft className="h-5 w-5" aria-hidden="true" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-white">{item.title}</p>
                          <p className="text-xs text-slate-400">
                            {credit ? "Credit" : "Debit"} · {formatDay(item.date)}
                            {item.time ? ` at ${item.time}` : ""}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[15px] ${credit ? "amount-in" : "amount-out"}`}>
                          {credit ? "+" : "−"}₹{Number(item.amount).toLocaleString("en-IN")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className="empty-state rounded-xl border border-dashed border-white/10">
                <Inbox className="h-6 w-6 text-slate-500" aria-hidden="true" />
                <p>No new transactions were found in this sync.</p>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
