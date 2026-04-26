// Locale-aware date/time formatters used across attendance + grade views.
// "LT" mirrors moment.js's locale-localized time format ("h:mm A" in en, etc.).

import i18n from "../i18n";

const LOCALE_MAP = {
  am: "am-ET",
  en: "en-US",
};

const resolveLocale = (lang) => LOCALE_MAP[lang] || lang || "en-US";

export const formatTimeLT = (value) => {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(resolveLocale(i18n.language), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatDateL = (value) => {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(resolveLocale(i18n.language), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTimeLLT = (value) => {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatDateL(d)} ${formatTimeLT(d)}`;
};
