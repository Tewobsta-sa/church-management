import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ETHIOPIAN_MONTHS,
  fromEthiopianDate,
  getDualDateString,
  getEthiopianMonthDays,
  toEthiopianDate,
} from "../../utils/ethiopianDate";

const WEEKDAYS = ["እሑድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "ዐርብ", "ቅዳሜ"];

export default function EthiopianDateInput({
  label,
  value,
  onChange,
  required = false,
  className = "",
  min,
  max,
}) {
  const wrapperRef = useRef(null);
  const selected = value ? toEthiopianDate(`${value}T00:00:00`) : toEthiopianDate(new Date());
  const today = toEthiopianDate(new Date());
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ year: selected.year, month: selected.month });

  useEffect(() => {
    if (value) {
      const next = toEthiopianDate(`${value}T00:00:00`);
      setView({ year: next.year, month: next.month });
    }
  }, [value]);

  useEffect(() => {
    const close = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const days = useMemo(() => {
    const total = getEthiopianMonthDays(view.year, view.month);
    const firstIso = fromEthiopianDate(view.year, view.month, 1);
    const firstWeekday = new Date(`${firstIso}T00:00:00`).getDay();
    return [...Array(firstWeekday).fill(null), ...Array.from({ length: total }, (_, index) => index + 1)];
  }, [view]);

  const chooseDay = (day) => {
    onChange({ target: { value: fromEthiopianDate(view.year, view.month, day) } });
    setOpen(false);
  };

  const moveMonth = (amount) => {
    let month = view.month + amount;
    let year = view.year;
    if (month < 1) { month = 13; year -= 1; }
    if (month > 13) { month = 1; year += 1; }
    setView({ year, month });
  };

  const yearOptions = Array.from({ length: 151 }, (_, index) => today.year - 100 + index);
  const displayValue = value ? getDualDateString(`${value}T00:00:00`, "am") : "Select an Ethiopian date";

  return (
    <div ref={wrapperRef} className="relative">
      <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <button type="button" onClick={() => setOpen((current) => !current)} className={`mt-1.5 w-full flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-brand-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all ${className}`} aria-haspopup="dialog" aria-expanded={open}>
        <CalendarDays className="w-5 h-5 text-brand-600 shrink-0" />
        <span className={`text-sm font-bold ${value ? "text-slate-800" : "text-slate-400"}`}>{displayValue}</span>
      </button>

      {open && <div className="absolute z-50 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/15">
        <div className="flex items-center justify-between gap-2 mb-4">
          <button type="button" onClick={() => moveMonth(-1)} className="p-2 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700" aria-label="Previous Ethiopian month"><ChevronLeft className="w-4 h-4" /></button>
          <div className="flex items-center gap-2">
            <select value={view.month} onChange={(event) => setView((current) => ({ ...current, month: Number(event.target.value) }))} className="bg-brand-50 text-brand-800 rounded-lg px-2 py-1.5 text-sm font-black outline-none">
              {ETHIOPIAN_MONTHS.map((month, index) => <option key={month.en} value={index + 1}>{month.am}</option>)}
            </select>
            <select value={view.year} onChange={(event) => setView((current) => ({ ...current, year: Number(event.target.value) }))} className="bg-slate-100 text-slate-800 rounded-lg px-2 py-1.5 text-sm font-black outline-none">
              {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => moveMonth(1)} className="p-2 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700" aria-label="Next Ethiopian month"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">{WEEKDAYS.map((weekday) => <span key={weekday} className="text-center text-[10px] font-black text-slate-400 py-1">{weekday}</span>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => day === null ? <span key={`empty-${index}`} className="h-9" /> : (() => {
            const isSelected = selected.year === view.year && selected.month === view.month && selected.day === day;
            const isToday = today.year === view.year && today.month === view.month && today.day === day;
            return <button type="button" key={day} onClick={() => chooseDay(day)} className={`h-9 rounded-lg text-sm font-bold transition-colors ${isSelected ? "bg-brand-600 text-white shadow-sm" : isToday ? "border border-brand-400 text-brand-700 bg-brand-50" : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"}`}>{day}</button>;
          })())}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-center text-[11px] font-semibold text-slate-500">{value ? displayValue : "Choose a day from the Ethiopian calendar"}</div>
      </div>}
    </div>
  );
}
