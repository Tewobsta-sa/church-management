// Maps a raw backend track / program_type name (e.g. "Young", "Regular",
// "Distance") to its i18n key. Falls back to the original string so any
// unexpected values still render safely.
const TRACK_KEY_MAP = {
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
  const key = trackI18nKey(name);
  return key ? t(key) : String(name);
}
