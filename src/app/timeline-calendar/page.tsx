"use client";
/**
 * PROTOTYPE — standalone experiment, not linked from the live nav.
 *
 * Calendar heatmap, one cell per day, years stacked. Layout technique adapted from
 * Observable's d3 "Calendar" example (© Observable, Inc., ISC licence), with three
 * substantive changes required by this dataset:
 *   1. all 7 days are shown — the original drops weekends, which would delete real strikes
 *   2. sequential scale in the site palette, not a diverging ±% scale
 *   3. days with no strikes are drawn as empty cells rather than omitted
 *
 * Colour is stepped into explicit buckets rather than a continuous ramp, so a reader can
 * actually tell 3 from 4 — the weakness of the heatmap we tried earlier.
 */
import { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import Header from "@/app/_components/header";
import "@/app/globals.css";

const WEDGES_PER_SHELL = 116;
const CELL = 15;
const GAP = 1.5;
const LEFT = 44;
const TOP = 20;

type Incident = { code: string; date: string; town?: string; country?: string; shell_count?: number };
type DayAgg = { date: string; shells: number; incidents: number; towns: Map<string, number>; codes: string[] };

/** stepped buckets — discrete, so each level is distinguishable */
const BUCKETS = [
  { min: 1, max: 1, fill: "#5c1e12" },
  { min: 2, max: 2, fill: "#8a2a15" },
  { min: 3, max: 3, fill: "#b23a18" },
  { min: 4, max: 5, fill: "#d64f22" },
  { min: 6, max: 8, fill: "#f26a33" },
  { min: 9, max: 999, fill: "#ff9457" },
];
const bucketFill = (n: number) => BUCKETS.find((b) => n >= b.min && n <= b.max)?.fill ?? "#5c1e12";
const EMPTY_FILL = "rgba(255,255,255,0.045)";

const DAY_LETTER = ["M", "T", "W", "T", "F", "S", "S"];
const countDay = (i: number) => (i + 6) % 7; // 0 = Monday
const timeWeek = d3.utcMonday;
const fmtMonth = d3.utcFormat("%b");
const fmtFull = d3.utcFormat("%a %e %b %Y");
const isoOf = (d: Date) => d.toISOString().slice(0, 10);

export default function CalendarPrototype() {
  const [raw, setRaw] = useState<Incident[] | null>(null);
  const [sel, setSel] = useState<DayAgg | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; d: DayAgg | null; date: string } | null>(null);

  useEffect(() => {
    fetch("/data/geoData.json").then((r) => r.json()).then(setRaw);
  }, []);

  const model = useMemo(() => {
    if (!raw) return null;

    const byDay = new Map<string, DayAgg>();
    raw.forEach((r) => {
      const date = r.date.slice(0, 10);
      const town = r.town || r.country || "Unknown";
      const shells = Math.max(1, r.shell_count ?? 1);
      let a = byDay.get(date);
      if (!a) {
        a = { date, shells: 0, incidents: 0, towns: new Map(), codes: [] };
        byDay.set(date, a);
      }
      a.shells += shells;
      a.incidents += 1;
      a.codes.push(r.code);
      a.towns.set(town, (a.towns.get(town) ?? 0) + shells);
    });

    const dates = Array.from(byDay.keys()).sort();
    const start = d3.utcMonth(new Date(dates[0] + "T00:00:00Z"));
    const end = new Date(dates[dates.length - 1] + "T00:00:00Z");
    const allDays = d3.utcDays(start, d3.utcDay.offset(end, 1));

    const years = d3.groups(allDays, (d) => d.getUTCFullYear());
    const maxShells = d3.max(Array.from(byDay.values()), (d) => d.shells) ?? 1;
    const totalShells = Array.from(byDay.values()).reduce((s, d) => s + d.shells, 0);

    return { byDay, years, maxShells, totalShells, strikeDays: byDay.size, allDays };
  }, [raw]);

  if (!model) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header TypewriterFinished={true} />
        <div className="pt-32 px-6 text-white/40 text-sm">loading…</div>
      </div>
    );
  }

  const { byDay, years, maxShells, totalShells, strikeDays } = model;
  const yearH = CELL * 7 + 34;
  const width = LEFT + (CELL + GAP) * 53 + 20;

  /** month boundary path, adapted from the original's pathMonth for a 7-day week */
  const pathMonth = (t: Date) => {
    const d = countDay(t.getUTCDay());
    const w = timeWeek.count(d3.utcYear(t), t);
    return `${d === 0 ? `M${w * (CELL + GAP)},0` : `M${(w + 1) * (CELL + GAP)},0V${d * CELL}H${w * (CELL + GAP)}`}V${7 * CELL}`;
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "Inconsolata, monospace" }}>
      <Header TypewriterFinished={true} />

      <div className="pt-32 px-6 pb-2">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-xl tracking-wide">Strike calendar</h1>
          <span className="text-[0.7rem] text-white/40">prototype</span>
        </div>
        <p className="text-[0.75rem] text-white/50 max-w-[80ch] mt-1 leading-relaxed">
          One cell per day, all seven days of the week. Colour steps in discrete bands so each
          level is readable rather than blending into a gradient. Empty cells are days with no
          recorded strike.
        </p>
      </div>

      {/* calendar */}
      <div className="px-6 overflow-x-auto">
        <svg width={width} height={yearH * years.length} style={{ maxWidth: "100%", height: "auto" }}>
          {years.map(([year, days], yi) => (
            <g key={year} transform={`translate(${LEFT},${yearH * yi + TOP})`}>
              <text x={-8} y={-6} fontWeight="bold" textAnchor="end" fill="#fff" fontSize="12">
                {year}
              </text>

              {/* weekday labels */}
              {d3.range(7).map((i) => (
                <text key={i} x={-8} y={(i + 0.5) * CELL} dy="0.31em" textAnchor="end"
                  fill="rgba(255,255,255,0.4)" fontSize="9">
                  {DAY_LETTER[i]}
                </text>
              ))}

              {/* day cells */}
              {days.map((dt) => {
                const key = isoOf(dt);
                const agg = byDay.get(key);
                const x = timeWeek.count(d3.utcYear(dt), dt) * (CELL + GAP);
                const y = countDay(dt.getUTCDay()) * CELL;
                const isSel = sel?.date === key;
                return (
                  <rect key={key}
                    x={x} y={y} width={CELL - 1} height={CELL - 1} rx={1.5}
                    fill={agg ? bucketFill(agg.shells) : EMPTY_FILL}
                    stroke={isSel ? "#fff" : undefined} strokeWidth={isSel ? 1.5 : undefined}
                    style={{ cursor: agg ? "pointer" : "default" }}
                    onMouseEnter={(e) => setHover({ x: e.clientX, y: e.clientY, d: agg ?? null, date: key })}
                    onMouseMove={(e) => setHover({ x: e.clientX, y: e.clientY, d: agg ?? null, date: key })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => agg && setSel(agg)}
                  />
                );
              })}

              {/* month separators + labels */}
              {d3.utcMonths(d3.utcMonth(days[0]), days[days.length - 1]).map((m, i) => (
                <g key={+m}>
                  {i > 0 && <path fill="none" stroke="#000" strokeWidth={3} d={pathMonth(m)} />}
                  <text x={timeWeek.count(d3.utcYear(m), timeWeek.ceil(m)) * (CELL + GAP) + 2} y={-6}
                    fill="rgba(255,255,255,0.55)" fontSize="10">
                    {fmtMonth(m)}
                  </text>
                </g>
              ))}
            </g>
          ))}
        </svg>
      </div>

      {/* legend */}
      <div className="px-6 mt-3 flex items-center gap-4 flex-wrap text-[0.7rem] text-white/50">
        <span>shells per day</span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 13, height: 13, background: EMPTY_FILL, display: "inline-block", borderRadius: 2 }} />0
        </span>
        {BUCKETS.map((b) => (
          <span key={b.min} className="flex items-center gap-1.5">
            <span style={{ width: 13, height: 13, background: b.fill, display: "inline-block", borderRadius: 2 }} />
            {b.min === b.max ? b.min : b.max > 100 ? `${b.min}+` : `${b.min}–${b.max}`}
          </span>
        ))}
        <span className="text-white/30">
          · {strikeDays} strike days · {totalShells} shells · busiest {maxShells}
        </span>
      </div>

      {/* readout */}
      <div className="px-6 py-5 min-h-[110px]">
        {sel ? (
          <div>
            <div className="text-lg text-white">
              {sel.shells} shell{sel.shells > 1 ? "s" : ""}
              <span className="text-[0.8rem] text-white/60">
                {" "}· {(sel.shells * WEDGES_PER_SHELL).toLocaleString()} felt wedges
              </span>
            </div>
            <div className="text-[0.78rem] text-white/70 mt-1">
              {fmtFull(new Date(sel.date + "T00:00:00Z"))} · {sel.towns.size} town
              {sel.towns.size > 1 ? "s" : ""} · {sel.incidents} incident{sel.incidents > 1 ? "s" : ""}
            </div>
            <div className="text-[0.74rem] text-white/55 mt-2">
              {Array.from(sel.towns.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([t, n]) => `${t} (${n})`)
                .join(" · ")}
            </div>
            <div className="text-[0.72rem] mt-1" style={{ color: "#ff8a5c" }}>{sel.codes.join(" · ")}</div>
          </div>
        ) : (
          <div className="text-[0.75rem] text-white/35">
            Hover a day for its towns and incident codes, click to pin.
          </div>
        )}
      </div>

      {hover && (
        <div className="fixed z-50 pointer-events-none bg-black/92 border border-white/25 rounded px-2.5 py-1.5 text-[0.7rem] max-w-[280px]"
          style={{ left: hover.x + 14, top: hover.y + 14 }}>
          <div className="text-white/60">{fmtFull(new Date(hover.date + "T00:00:00Z"))}</div>
          {hover.d ? (
            <>
              <div className="text-white mt-0.5">
                {hover.d.shells} shell{hover.d.shells > 1 ? "s" : ""}
                <span className="text-white/50"> · {(hover.d.shells * WEDGES_PER_SHELL).toLocaleString()} wedges</span>
              </div>
              <div className="text-white/55 mt-0.5">
                {Array.from(hover.d.towns.keys()).join(", ")}
              </div>
              <div className="mt-1 pt-1 border-t border-white/15" style={{ color: "#ff8a5c" }}>
                {hover.d.codes.join(" · ")}
              </div>
            </>
          ) : (
            <div className="text-white/35 mt-0.5">no recorded strike</div>
          )}
        </div>
      )}
    </div>
  );
}
