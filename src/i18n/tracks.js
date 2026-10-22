const TRACK_KEY_MAP = {
  prekg: "students.trackPreKG",
  young: "students.trackYoung",
  regular: "students.trackRegular",
  distance: "students.trackDistance",
};

export function trackI18nKey(name) {
  if (!name) return null;
  return TRACK_KEY_MAP[String(name).trim().toLowerCase()] || null;
}

export function translateTrack(t, name) {
  if (!name) return "";
  const raw = String(name).trim();
  const lower = raw.toLowerCase();

  const key = trackI18nKey(lower);
  if (key && typeof t === "function") {
    const val = t(key);
    // Guard against missing key echoing back raw key string like "students.trackYoung"
    if (val && val !== key && !val.startsWith("students.track")) {
      return val;
    }
  }

  // Friendly human fallback for known tracks
  if (lower === "prekg" || lower.startsWith("pre-kg")) return "Pre-KG (ቅድመ-ሕፃናት)";
  if (lower === "regular") return "Regular (መደበኛ ትምህርት)";
  if (lower === "distance") return "Distance (የርቀት ትምህርት)";
  if (lower === "young") return "Young (ወጣቶች)";

  return raw;
}

