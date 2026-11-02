import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const VARIANTS = {
  success: { Icon: CheckCircle2, accent: "bg-income-500", icon: "text-income-400" },
  error: { Icon: AlertCircle, accent: "bg-expense-500", icon: "text-expense-400" },
  info: { Icon: Info, accent: "bg-brand-500", icon: "text-brand-400" },
  warning: { Icon: AlertTriangle, accent: "bg-orange-500", icon: "text-orange-400" },
};

export default function Toast({ message, type = "success", onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const { Icon, accent, icon } = VARIANTS[type] || VARIANTS.info;

  return (
    <div
      className="fixed inset-x-4 top-4 z-[200] flex justify-center sm:inset-x-auto sm:right-5 sm:top-5 sm:justify-end"
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <div className="relative flex w-full max-w-md items-start gap-3 overflow-hidden rounded-xl border border-white/10 bg-ink-850 py-3 pl-4 pr-2 shadow-pop animate-slide-in sm:min-w-[320px]">
        <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden="true" />
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${icon}`} aria-hidden="true" />
        <p className="flex-1 py-0.5 text-sm font-medium leading-snug text-stone-100">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="-my-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors duration-150 hover:bg-white/5 hover:text-white"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
