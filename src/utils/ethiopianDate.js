/**
 * Ethiopian Calendar Utility & Date Converter
 * Provides Gregorian <-> Ethiopian date conversions and formatting
 * for Jate Kidane Mehret Fnote Semaetat Sunday School.
 */

export const ETHIOPIAN_MONTHS = [
  { am: "መስከረም", en: "Meskerem" },
  { am: "ጥቅምት", en: "Tikimt" },
  { am: "ኅዳር", en: "Hidar" },
  { am: "ታኅሣሥ", en: "Tahsas" },
  { am: "ጥር", en: "Tir" },
  { am: "የካቲት", en: "Yekatit" },
  { am: "መጋቢት", en: "Megabit" },
  { am: "ሚያዝያ", en: "Miazia" },
  { am: "ግንቦት", en: "Ginbot" },
  { am: "ሰኔ", en: "Sene" },
  { am: "ሐምሌ", en: "Hamle" },
  { am: "ነሐሴ", en: "Nehase" },
  { am: "ጳጉሜን", en: "Pagume" },
];

export const ETHIOPIAN_WEEKDAYS = [
  { am: "እሑድ", en: "Sunday" },
  { am: "ሰኞ", en: "Monday" },
  { am: "ማክሰኞ", en: "Tuesday" },
  { am: "ረቡዕ", en: "Wednesday" },
  { am: "ሐሙስ", en: "Thursday" },
  { am: "ዐርብ", en: "Friday" },
  { am: "ቅዳሜ", en: "Saturday" },
];

/**
 * Convert Gregorian Date object or string to Ethiopian Date
 * @param {Date|string} dateInput
 * @returns {{ year: number, month: number, day: number, monthNameAm: string, monthNameEn: string }}
 */
export function toEthiopianDate(dateInput = new Date()) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return {
      year: 2018,
      month: 1,
      day: 1,
      monthNameAm: "መስከረም",
      monthNameEn: "Meskerem",
    };
  }

  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  // Julian Day Number calculation
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  const jdn =
    gd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // JDN of Ethiopian Era: August 29, 8 CE (Julian) = JDN 1724221
  const ethJdnOffset = 1723856;
  const r = (jdn - ethJdnOffset) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);

  const ey =
    4 * Math.floor((jdn - ethJdnOffset) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const em = Math.floor(n / 30) + 1;
  const ed = (n % 30) + 1;

  const monthIdx = Math.min(Math.max(em - 1, 0), 12);
  const monthData = ETHIOPIAN_MONTHS[monthIdx] || ETHIOPIAN_MONTHS[0];

  return {
    year: ey,
    month: em,
    day: ed,
    monthNameAm: monthData.am,
    monthNameEn: monthData.en,
  };
}

/**
 * Format date as Ethiopian string, e.g. "መስከረም 5, 2018 ዓ.ም"
 */
export function formatEthiopianDate(dateInput = new Date(), lang = "am") {
  const eth = toEthiopianDate(dateInput);
  if (lang === "am") {
    return `${eth.monthNameAm} ${eth.day}, ${eth.year} ዓ.ም`;
  }
  return `${eth.monthNameEn} ${eth.day}, ${eth.year} E.C.`;
}

/**
 * Dual date badge: "መስከረም 5, 2018 | Sep 15, 2026"
 */
export function getDualDateString(dateInput = new Date(), lang = "am") {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const ethStr = formatEthiopianDate(date, lang);
  const gregStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${ethStr} (${gregStr})`;
}

export function formatEthiopianDateTime(dateInput = new Date(), lang = "am") {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "—";

  const eth = formatEthiopianDate(date, lang);
  const time = date.toLocaleTimeString(lang === "am" ? "am-ET" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${eth} · ${time}`;
}

export function isEthiopianLeapYear(year) {
  return year % 4 === 3;
}

export function getEthiopianMonthDays(year, month) {
  if (month < 13) return 30;
  return isEthiopianLeapYear(year) ? 6 : 5;
}

export function fromEthiopianDate(year, month, day) {
  // Search the small Gregorian window around the Ethiopian new year. This
  // keeps the inverse conversion consistent with the established converter.
  const start = new Date(year + 7, 8, 1);
  for (let offset = -30; offset <= 400; offset += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + offset);
    const converted = toEthiopianDate(candidate);
    if (
      converted.year === year &&
      converted.month === month &&
      converted.day === day
    ) {
      return `${candidate.getFullYear().toString().padStart(4, "0")}-${(candidate.getMonth() + 1).toString().padStart(2, "0")}-${candidate.getDate().toString().padStart(2, "0")}`;
    }
  }

  return `${year + 7}-09-11`;
}
