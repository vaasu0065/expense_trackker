import { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    info: <Info className="w-5 h-5 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
  };

  const styles = {
    success: "bg-emerald-950/80 text-emerald-100 border-emerald-500/30 ring-emerald-500/20",
    error: "bg-rose-950/80 text-rose-100 border-rose-500/30 ring-rose-500/20",
    info: "bg-indigo-950/80 text-indigo-100 border-indigo-500/30 ring-indigo-500/20",
    warning: "bg-amber-950/80 text-amber-100 border-amber-500/30 ring-amber-500/20",
  };

  const iconColors = {
    success: "text-emerald-400 bg-emerald-500/20 p-1.5 rounded-xl border border-emerald-500/30",
    error: "text-rose-400 bg-rose-500/20 p-1.5 rounded-xl border border-rose-500/30",
    info: "text-indigo-400 bg-indigo-500/20 p-1.5 rounded-xl border border-indigo-500/30",
    warning: "text-amber-400 bg-amber-500/20 p-1.5 rounded-xl border border-amber-500/30",
  };

  return (
    <div className="fixed top-5 right-5 z-[200] animate-slide-in">
      <div
        className={`flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl shadow-glow backdrop-blur-xl border ring-1 ${styles[type]} min-w-[300px] max-w-md transition-all`}
      >
        <div className={iconColors[type]}>{icons[type]}</div>
        <p className="flex-1 font-bold text-sm tracking-tight leading-snug">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-xl opacity-70 hover:opacity-100 hover:bg-white/10 transition-all active:scale-90"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
