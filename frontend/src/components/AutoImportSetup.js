import { useCallback, useEffect, useState } from "react";
import api from "../api";
import { Smartphone, KeyRound, Copy, Check, RefreshCw, Trash2, AlertTriangle } from "lucide-react";

function formatWhen(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CopyField({ id, label, value, onCopy, copiedId }) {
  const copied = copiedId === id;
  return (
    <div>
      <span className="label" id={`${id}-label`}>{label}</span>
      <div className="flex gap-2">
        <code
          aria-labelledby={`${id}-label`}
          className="flex min-h-[44px] min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap rounded-xl border border-white/10 bg-ink-850 px-3.5 font-mono text-sm text-stone-100"
        >
          {value}
        </code>
        <button
          type="button"
          className="btn-secondary shrink-0"
          onClick={() => onCopy(id, value)}
          aria-label={`Copy ${label.toLowerCase()}`}
        >
          {copied ? <Check className="h-4 w-4 text-income-400" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}

// iPhones don't let any app read SMS, so a Shortcuts automation forwards bank
// messages to /expenses/auto-import using a long-lived, import-only key.
export default function AutoImportSetup({ showToast }) {
  const [key, setKey] = useState(null);
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  const endpoint = `${(api.defaults.baseURL || "").replace(/\/$/, "")}/expenses/auto-import`;

  const load = useCallback(async () => {
    try {
      const res = await api.get("/automation/key");
      setKey(res.data?.key || null);
    } catch {
      setKey(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createKey = async () => {
    if (key && !window.confirm("Replace your key? Automations using the old key will stop working until you update them.")) {
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/automation/key");
      setNewKey(res.data.apiKey);
      setKey(res.data.key);
      showToast("Key created. Copy it now, it won't be shown again.", "success", 5000);
    } catch (err) {
      showToast(err.response?.data?.msg || "Couldn't create a key", "error");
    } finally {
      setBusy(false);
    }
  };

  const revokeKey = async () => {
    if (!window.confirm("Revoke this key? Your iPhone automation will stop importing messages.")) return;
    setBusy(true);
    try {
      await api.delete("/automation/key");
      setKey(null);
      setNewKey("");
      showToast("Key revoked", "success");
    } catch (err) {
      showToast(err.response?.data?.msg || "Couldn't revoke the key", "error");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (id, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? "" : current)), 2000);
    } catch {
      showToast("Couldn't copy. Select the text and copy it manually.", "error");
    }
  };

  return (
    <section className="card card-pad mb-6" aria-labelledby="auto-import-title">
      <div className="card-header">
        <div className="flex items-start gap-3">
          <span className="icon-tile bg-brand-500/15 text-brand-300">
            <Smartphone className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 id="auto-import-title" className="card-title">Auto-import on iPhone</h2>
            <p className="card-subtitle">
              iPhones don't let apps read SMS. A Shortcuts automation can forward each bank message here as it arrives.
            </p>
          </div>
        </div>
        {!loading && (
          <span className={key ? "badge-income" : "badge-neutral"}>{key ? "Key active" : "Not set up"}</span>
        )}
      </div>

      {/* Key status and actions */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-ink-850/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        {loading ? (
          <div className="skeleton h-10 w-56" />
        ) : key ? (
          <dl className="grid grid-cols-3 gap-4 text-sm sm:gap-8">
            <div>
              <dt className="text-xs text-stone-400">Key</dt>
              <dd className="mt-0.5 font-mono text-stone-100">{key.key_prefix}…</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-400">Created</dt>
              <dd className="mt-0.5 text-stone-100">{formatWhen(key.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-400">Last used</dt>
              <dd className="mt-0.5 text-stone-100">{formatWhen(key.last_used_at)}</dd>
            </div>
          </dl>
        ) : (
          <p className="flex items-center gap-2 text-sm text-stone-300">
            <KeyRound className="h-4 w-4 text-stone-400" aria-hidden />
            Create a key for your automation. It can only add transactions, nothing else.
          </p>
        )}
        <div className="flex shrink-0 gap-2">
          <button type="button" className={key ? "btn-secondary" : "btn-primary"} onClick={createKey} disabled={busy || loading}>
            {key ? <RefreshCw className="h-4 w-4" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
            {key ? "Replace key" : "Create key"}
          </button>
          {key && (
            <button type="button" className="btn-danger" onClick={revokeKey} disabled={busy}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Revoke
            </button>
          )}
        </div>
      </div>

      {/* Values to paste into Shortcuts */}
      <div className="mb-6 space-y-4">
        {newKey && (
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-orange-300">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              Copy this now. For your security it won't be shown again.
            </p>
            <CopyField id="auth-header" label="Authorization header value" value={`Bearer ${newKey}`} onCopy={copy} copiedId={copiedId} />
          </div>
        )}
        <CopyField id="endpoint" label="URL" value={endpoint} onCopy={copy} copiedId={copiedId} />
      </div>

      {/* Steps */}
      <h3 className="mb-3 text-sm font-semibold text-white">Set up the automation</h3>
      <ol className="space-y-3 text-sm text-stone-300">
        {[
          <>Open the <strong className="text-white">Shortcuts</strong> app, go to <strong className="text-white">Automation</strong>, tap <strong className="text-white">+</strong> and choose <strong className="text-white">Message</strong>.</>,
          <>Set <strong className="text-white">Message Contains</strong> to <code className="rounded bg-ink-850 px-1.5 py-0.5 font-mono text-stone-100">debited</code> (optionally pick your bank as the sender). Choose <strong className="text-white">Run Immediately</strong>, then <strong className="text-white">Next</strong>.</>,
          <>Create a <strong className="text-white">New Blank Automation</strong> and add the action <strong className="text-white">Get Contents of URL</strong>. Paste the URL above.</>,
          <>Tap the arrow to show more. Set <strong className="text-white">Method</strong> to POST. Add a header named <code className="rounded bg-ink-850 px-1.5 py-0.5 font-mono text-stone-100">Authorization</code> with the header value from this page.</>,
          <>Set <strong className="text-white">Request Body</strong> to JSON, add a Text field named <code className="rounded bg-ink-850 px-1.5 py-0.5 font-mono text-stone-100">message</code>, and set its value to the <strong className="text-white">Shortcut Input</strong> variable (the message content).</>,
          <>Tap <strong className="text-white">Done</strong>. Repeat with <code className="rounded bg-ink-850 px-1.5 py-0.5 font-mono text-stone-100">credited</code> to import incoming money too. When a bank SMS arrives, <strong className="text-white">Last used</strong> above updates and the transaction appears in your ledger.</>,
        ].map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-stone-200">
              {i + 1}
            </span>
            <span className="pt-0.5 leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
      <p className="field-hint mt-4">
        Needs iOS 17 or later to run without asking each time. Sending the same message twice won't create a duplicate.
      </p>
    </section>
  );
}
