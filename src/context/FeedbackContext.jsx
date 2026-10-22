import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";

const FeedbackContext = createContext(null);

let toastId = 0;

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    bar: "bg-emerald-500",
    iconColor: "text-emerald-600",
  },
  error: {
    icon: XCircle,
    bar: "bg-red-500",
    iconColor: "text-red-600",
  },
  info: {
    icon: Info,
    bar: "bg-brand-500",
    iconColor: "text-brand-600",
  },
  warning: {
    icon: AlertTriangle,
    bar: "bg-amber-500",
    iconColor: "text-amber-600",
  },
};

function Toast({ toast, onDismiss }) {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  const Icon = style.icon;
  return (
    <div className="pointer-events-auto relative overflow-hidden flex items-start gap-3 w-[min(24rem,calc(100vw-2rem))] rounded-xl bg-white shadow-xl shadow-slate-900/15 border border-slate-200 px-4 py-3 animate-[toast-in_0.25s_ease-out]">
      <span className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} />
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${style.iconColor}`} />
      <p className="flex-1 text-sm font-semibold text-slate-800 whitespace-pre-line leading-snug">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ConfirmDialog({ dialog, onResolve }) {
  const { title, message, confirmLabel, cancelLabel, danger, input } = dialog;
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  const close = (value) => {
    if (input && value && input.required && !inputValue.trim()) return;
    onResolve(input ? (value ? inputValue.trim() : null) : value);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close(input ? null : false);
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 animate-[toast-in_0.2s_ease-out]">
        <div className="flex items-start gap-3 p-5 pb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              danger ? "bg-red-50" : "bg-brand-50"
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${danger ? "text-red-600" : "text-brand-600"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-slate-900">{title}</h3>
            <p className="mt-1 text-sm font-medium text-slate-600 whitespace-pre-line leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {input && (
          <div className="px-5 pb-2">
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") close(true);
                if (e.key === "Escape") close(null);
              }}
              placeholder={input.placeholder || ""}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 p-5 pt-3">
          <button
            type="button"
            onClick={() => close(input ? null : false)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {cancelLabel || "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            disabled={input?.required && !inputValue.trim()}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AlertDialog({ dialog, onResolve }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onResolve();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 animate-[toast-in_0.2s_ease-out]">
        <div className="flex items-start gap-3 p-5 pb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              dialog.type === "error"
                ? "bg-red-50"
                : dialog.type === "success"
                  ? "bg-emerald-50"
                  : "bg-brand-50"
            }`}
          >
            {dialog.type === "error" ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : dialog.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <Info className="w-5 h-5 text-brand-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-slate-900">
              {dialog.title || "Notice"}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-600 whitespace-pre-line leading-relaxed">
              {dialog.message}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end p-5 pt-3">
          <button
            type="button"
            autoFocus
            onClick={onResolve}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
          >
            {dialog.okLabel || "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [alertState, setAlertState] = useState(null);
  const resolvers = useRef({});

  const notify = useCallback((message, type = "info", duration = 4500) => {
    const id = ++toastId;
    setToasts((current) => [...current, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const confirmAction = useCallback(
    ({ title, message, confirmLabel, cancelLabel, danger = false, input }) =>
      new Promise((resolve) => {
        resolvers.current.confirm = resolve;
        setConfirmState({
          title: title || "Are you sure?",
          message,
          confirmLabel,
          cancelLabel,
          danger,
          input,
        });
      }),
    [],
  );

  const resolveConfirm = useCallback((value) => {
    setConfirmState(null);
    resolvers.current.confirm?.(value);
    resolvers.current.confirm = null;
  }, []);

  const alertAction = useCallback(
    (message, options = {}) =>
      new Promise((resolve) => {
        resolvers.current.alert = resolve;
        setAlertState({
          message,
          title: options.title,
          okLabel: options.okLabel,
          type: options.type || "info",
        });
      }),
    [],
  );

  const resolveAlert = useCallback(() => {
    setAlertState(null);
    resolvers.current.alert?.();
    resolvers.current.alert = null;
  }, []);

  const value = { notify, confirmAction, alertAction };

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {/* Toast stack */}
      <div className="pointer-events-none fixed top-4 right-4 z-[210] flex flex-col items-end gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>

      {confirmState && (
        <ConfirmDialog dialog={confirmState} onResolve={resolveConfirm} />
      )}
      {alertState && (
        <AlertDialog dialog={alertState} onResolve={resolveAlert} />
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return ctx;
}
