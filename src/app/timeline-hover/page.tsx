"use client";
/**
 * PROTOTYPE — standalone experiment at /timeline-hover, not linked from the nav.
 * Same chart as /timeline, with two changes under trial:
 *   1. a scan line follows the cursor across the plot and reports the exact day plus the
 *      running total of strikes recorded up to it, after the NYT poll-average charts
 *   2. the year labels move from above the chart to below it, freeing the top strip for
 *      that readout
 *
 * Timeline: towns alphabetical down the y-axis, time across the x-axis binned by month
 * so the full span always fits the width — the page scrolls down through towns rather
 * than sideways through time.
 *
 * Layout after Observable's d3 "The impact of vaccines" example (© Observable, Inc.,
 * ISC licence), itself a recreation of a WSJ graphic by Tynan DeBold and Dov Friedman.
 *
 * Cells are binned by month, but event markers are positioned to the exact day within
 * their month, so a short ceasefire still reads as a narrow band rather than snapping
 * to a month boundary.
 *
 * Every incident for a town/month is summed. That matters: 29 of the filled town/day
 * cells hold more than one incident, and the previous heatMapHorizontal implementation
 * kept only the last one per date+town.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import Header from "@/app/_components/header";
import Footer from "@/app/_components/footer";
import { isMobileDevice } from "@/app/_components/mobile-detector";
import "@/app/globals.css";

const WEDGES_PER_STRIKE = 116;
const ROW_H = 13.6; // squeezed ~15% so the whole chart clears the fold
const M_LEFT = 112;
const M_RIGHT = 88; // also the run-out for the ongoing-ceasefire fade
const M_TOP = 58; // headroom for the scan readout above the month labels
const M_BOTTOM = 78; // years and ceasefire labels share the first row, invasion below

const INVASION = { date: "2024-10-01", name: "Ground invasion of southern Lebanon" };
const INVASION_COLOR = "#b0e4f4";
const INVASION_TINT = "rgba(158,214,236,0.10)";
const CF_LINE = "rgba(214,226,235,0.9)";
const CF_BAND = "rgba(198,214,226,0.085)";

/**
 * Ceasefire periods:
 *  - 2024 agreement took effect 27 Nov 2024 02:00 GMT and was set to expire 2 Mar 2026,
 *    breaking down on that date amid the 2026 Iran war.
 *  - 2026 agreement took effect 16 Apr 2026, initially 10 days, then repeatedly extended
 *    (23 Apr, 15 May), so it is still running at the end of this dataset.
 *
 * The six-day truce of 24–30 Nov 2023 is deliberately left out: too short to read as a
 * band at this scale, and it crowded the left edge for an episode few readers recall.
 */
const CEASEFIRES: { start: string; end: string | null; name: string }[] = [
  { start: "2024-11-27", end: "2026-03-02", name: "2024 ceasefire agreement" },
  { start: "2026-04-16", end: null, name: "2026 ceasefire" },
];

type Incident = { code: string; date: string; town?: string; country?: string; shell_count?: number };
/**
 * A few verified incidents have neither coordinates nor a confirmed town, so they have no
 * row of their own. They collect in one row pinned to the bottom rather than being dropped
 * — they are part of the count, and hiding them would make the chart disagree with the
 * counter. Incidents whose town IS known but whose coordinates are still pending stay in
 * their own town's row: the chart places them by town, not by coordinate.
 */
const UNPLACED = "To be geolocated";
const townOf = (r: Incident) => (r.town ? r.town.trim() : UNPLACED);
/** a date the scan line is magnetically drawn to: a year boundary or a marked event */
type Landmark = { x: number; iso: string; name: string | null; color: string };
type Scan = { date: Date; x: number; total: number; snap: Landmark | null };
type Bucket = { strikes: number; incidents: number; codes: string[]; dates: Set<string> };

const STEPS = [
  { min: 1, max: 1, fill: "#5c1e12" },
  { min: 2, max: 2, fill: "#8a2a15" },
  { min: 3, max: 3, fill: "#b23a18" },
  { min: 4, max: 5, fill: "#d64f22" },
  { min: 6, max: 8, fill: "#f26a33" },
  { min: 9, max: 9999, fill: "#ff9457" },
];
const EMPTY = "rgba(255,255,255,0.04)";
const stepFill = (n: number) => STEPS.find((b) => n >= b.min && n <= b.max)?.fill ?? EMPTY;

const fmtMon = d3.utcFormat("%b");
const fmtMonthYear = d3.utcFormat("%B %Y");
const fmtDay = d3.utcFormat("%e %b %Y");

export default function Timeline() {
  const [raw, setRaw] = useState<Incident[] | null>(null);
  const [width, setWidth] = useState(1100);
  const [hover, setHover] = useState<{ x: number; y: number; town: string; label: string; b: Bucket } | null>(null);
  const [sel, setSel] = useState<{ town: string; label: string; b: Bucket } | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  /** a scan parked on a marked date by clicking it, so it survives the cursor leaving */
  const [pinned, setPinned] = useState<Scan | null>(null);

  /**
   * Intro: strikes sweep in chronologically, then the ceasefire/invasion regions fade
   * up behind them, then the markers and labels. Plays once per session, matching the
   * map's `mapDotsAnimated` behaviour, so navigating back doesn't replay it.
   */
  const [hasAnimated, setHasAnimated] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem("timelineAnimated") === "true"
  );
  const [revealCol, setRevealCol] = useState(-1);
  const [showBands, setShowBands] = useState(false);
  const [showMarks, setShowMarks] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    fetch("/data/geoData.json").then((r) => r.json()).then(setRaw);
  }, []);

  // measured on an unpadded inner element — clientWidth includes padding, which would
  // size the svg wider than its container and clip the final months
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [raw]);

  const model = useMemo(() => {
    if (!raw) return null;

    const dates = raw.map((r) => new Date(r.date.slice(0, 10) + "T00:00:00Z"));
    const start = d3.utcMonth(d3.min(dates)!);
    const end = d3.utcDay.offset(d3.max(dates)!, 1);

    const cols = d3.utcMonths(start, end);
    const colIndex = new Map(cols.map((c, i) => [+c, i]));

    const towns = Array.from(new Set(raw.map(townOf))).sort((a, b) =>
      a === UNPLACED ? 1 : b === UNPLACED ? -1 : a.localeCompare(b)
    );

    const grid = new Map<string, Bucket>();
    raw.forEach((r) => {
      const town = townOf(r);
      const d = new Date(r.date.slice(0, 10) + "T00:00:00Z");
      const ci = colIndex.get(+d3.utcMonth.floor(d));
      if (ci === undefined) return;
      const key = `${town}|${ci}`;
      let b = grid.get(key);
      if (!b) {
        b = { strikes: 0, incidents: 0, codes: [], dates: new Set() };
        grid.set(key, b);
      }
      b.strikes += Math.max(1, r.shell_count ?? 1);
      b.incidents += 1;
      b.codes.push(r.code);
      b.dates.add(r.date.slice(0, 10));
    });

    const maxStrikes = d3.max(Array.from(grid.values()), (b) => b.strikes) ?? 1;
    const totalStrikes = Array.from(grid.values()).reduce((s, b) => s + b.strikes, 0);

    /**
     * Running total by day, for the scan readout. Binned by DAY rather than by the
     * month the cells use — the cursor resolves to an exact date, so a total that only
     * stepped once a month would lag the line by up to four weeks.
     */
    const perDay = new Map<string, number>();
    raw.forEach((r) => {
      const d = r.date.slice(0, 10);
      perDay.set(d, (perDay.get(d) ?? 0) + Math.max(1, r.shell_count ?? 1));
    });
    let run = 0;
    const cum = Array.from(perDay.keys())
      .sort()
      .map((d) => ({ d, total: (run += perDay.get(d)!) }));

    return { cols, colIndex, towns, grid, maxStrikes, totalStrikes, cum };
  }, [raw]);

  /**
   * On a phone the full span cannot fit: 32 months across ~390px leaves ~5px per month.
   * So mobile keeps every town visible vertically (shorter rows, no vertical scroll) and
   * scrolls sideways through time instead, with the town labels drawn in a separate,
   * non-scrolling svg beside the grid — without that pinning you lose track of the rows.
   */
  const rowH = isMobile ? 14 : ROW_H;
  const labelW = isMobile ? 84 : M_LEFT;
  const LEFT = isMobile ? 0 : M_LEFT; // the grid svg's own left offset
  const MOBILE_CELL_W = 28;

  const colIn = (ci: number) => hasAnimated || ci <= revealCol;

  const height = model ? rowH * model.towns.length + M_TOP + M_BOTTOM : 400;
  const plotW = isMobile
    ? (model ? model.cols.length * MOBILE_CELL_W : 0)
    : Math.max(320, width - M_LEFT - M_RIGHT);
  const cellW = model ? (isMobile ? MOBILE_CELL_W : plotW / model.cols.length) : 0;
  const gridSvgW = isMobile ? plotW + M_RIGHT : width;
  const xOf = (i: number) => LEFT + i * cellW;

  /** exact-day x position, so short ceasefires don't snap to a whole month */
  const xAtDate = (isoDate: string): number | null => {
    if (!model) return null;
    const d = new Date(isoDate + "T00:00:00Z");
    const mStart = d3.utcMonth.floor(d);
    const ci = model.colIndex.get(+mStart);
    if (ci === undefined) return null;
    const daysInMonth = d3.utcDays(mStart, d3.utcMonth.offset(mStart, 1)).length;
    return xOf(ci) + ((d.getUTCDate() - 1) / daysInMonth) * cellW;
  };

  /**
   * Inverse of xAtDate: turn a cursor position back into the exact day it points at.
   * Cells are binned by month, so the fractional part of the column resolves the day.
   */
  const scanAt = (px: number): Scan | null => {
    if (!model || !cellW) return null;
    const clamped = Math.max(LEFT, Math.min(px, LEFT + plotW - 0.001));

    /**
     * Magnetic pull toward the marked dates. Those lines are what the eye is already on,
     * so landing exactly on one is nearly always what was meant — and without it, reading
     * the total "at the ceasefire" means pixel-hunting.
     */
    let snap: Landmark | null = null;
    for (const l of landmarks) {
      const d = Math.abs(clamped - l.x);
      if (d <= SNAP_PX && (!snap || d < Math.abs(clamped - snap.x))) snap = l;
    }

    let date: Date;
    let x: number;
    if (snap) {
      date = new Date(snap.iso + "T00:00:00Z");
      x = snap.x;
    } else {
      const t = (clamped - LEFT) / cellW;
      const ci = Math.min(model.cols.length - 1, Math.max(0, Math.floor(t)));
      const mStart = model.cols[ci];
      const dim = d3.utcDays(mStart, d3.utcMonth.offset(mStart, 1)).length;
      const day = Math.min(dim, Math.max(1, Math.floor((t - ci) * dim) + 1));
      date = new Date(Date.UTC(mStart.getUTCFullYear(), mStart.getUTCMonth(), day));
      x = xOf(ci) + ((day - 1) / dim) * cellW;
    }

    // last cumulative entry on or before this day
    const a = model.cum;
    const iso = date.toISOString().slice(0, 10);
    let lo = 0, hi = a.length - 1, total = 0;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (a[m].d <= iso) { total = a[m].total; lo = m + 1; } else hi = m - 1;
    }
    return { date, x, total, snap };
  };

  const yearMarks: { i: number; year: number }[] = [];
  model?.cols.forEach((c, i) => {
    if (i === 0 || c.getUTCFullYear() !== model.cols[i - 1].getUTCFullYear())
      yearMarks.push({ i, year: c.getUTCFullYear() });
  });

  const plotBottom = height - M_BOTTOM;

  /** how close the cursor must get before the scan line is pulled onto a marked date */
  const SNAP_PX = 8;

  const landmarks: Landmark[] = [];
  if (model) {
    yearMarks.forEach(({ i, year }) => {
      if (i === 0) return;
      const lx = xAtDate(`${year}-01-01`);
      // the year reads off the axis already, so the chip does not repeat it
      if (lx !== null) landmarks.push({ x: lx, iso: `${year}-01-01`, name: null, color: "#c9c9c9" });
    });
    const xi = xAtDate(INVASION.date);
    if (xi !== null)
      landmarks.push({ x: xi, iso: INVASION.date, name: "Ground invasion", color: INVASION_COLOR });
    CEASEFIRES.forEach((cf) => {
      const a = xAtDate(cf.start);
      if (a !== null) landmarks.push({ x: a, iso: cf.start, name: `${cf.name} begins`, color: CF_LINE });
      if (cf.end) {
        const b = xAtDate(cf.end);
        if (b !== null) landmarks.push({ x: b, iso: cf.end, name: `${cf.name} ends`, color: CF_LINE });
      }
    });
  }

  /**
   * The tinted periods fade in one at a time, in the order they happened, each together
   * with the dashed lines marking its edges. The post-invasion tint is broken around the
   * ceasefires, and every piece of it takes its own place in that sequence.
   */
  const regions: { key: string; at: number; node: React.ReactNode }[] = (() => {
    if (!model) return [];
    const out: { key: string; at: number; node: React.ReactNode }[] = [];
    const right = LEFT + plotW;

    CEASEFIRES.forEach((cf) => {
      const x1 = xAtDate(cf.start);
      if (x1 === null) return;
      // an open-ended ceasefire is still running at the end of the dataset,
      // so its band runs to the edge of the chart
      const x2 = cf.end ? xAtDate(cf.end) : right;
      out.push({
        key: `cf-${cf.start}`,
        at: x1,
        node: (
          <>
            {x2 !== null && (
              <rect x={x1} y={M_TOP} width={Math.max(1.5, x2 - x1)} height={plotBottom - M_TOP}
                fill={CF_BAND} />
            )}
            <line x1={x1} x2={x1} y1={M_TOP} y2={plotBottom}
              stroke={CF_LINE} strokeWidth={1} strokeDasharray="2,2" />
            <circle cx={x1} cy={M_TOP - 2.5} r={2.5} fill={CF_LINE} />
            <circle cx={x1} cy={plotBottom + 2.5} r={2.5} fill={CF_LINE} />
            {/* only draw a closing edge where the ceasefire actually ended —
                an open-ended one must not look like it stopped at the chart edge */}
            {cf.end && x2 !== null && (
              <>
                <line x1={x2} x2={x2} y1={M_TOP} y2={plotBottom}
                  stroke={CF_LINE} strokeWidth={1} strokeDasharray="2,2" />
                <circle cx={x2} cy={M_TOP - 2.5} r={2.5} fill={CF_LINE} />
                <circle cx={x2} cy={plotBottom + 2.5} r={2.5} fill={CF_LINE} />
              </>
            )}
          </>
        ),
      });
    });

    /* Post-invasion tint, drawn only OUTSIDE ceasefire periods. Painting it under the
       blue bands would stack two translucent fills into a third colour, and a ceasefire
       is not "invasion ongoing" anyway — so the two are kept exclusive. */
    const xi = xAtDate(INVASION.date);
    if (xi !== null) {
      const spans = CEASEFIRES
        .map((c) => {
          const a = xAtDate(c.start);
          const b = c.end ? xAtDate(c.end) : right;
          if (a === null || b === null) return null;
          return [Math.max(xi, a), Math.min(right, b)] as [number, number];
        })
        .filter((v): v is [number, number] => !!v && v[1] > v[0])
        .sort((p, q) => p[0] - q[0]);

      const gaps: [number, number][] = [];
      let cursor = xi;
      spans.forEach(([a, b]) => {
        if (a > cursor) gaps.push([cursor, a]);
        cursor = Math.max(cursor, b);
      });
      if (cursor < right) gaps.push([cursor, right]);

      gaps.forEach(([a, b], i) => {
        out.push({
          key: `inv-${i}`,
          at: a,
          node: <rect x={a} y={M_TOP} width={b - a} height={plotBottom - M_TOP} fill={INVASION_TINT} />,
        });
      });
    }

    return out.sort((p, q) => p.at - q.at);
  })();

  const bandsIn = hasAnimated || showBands;
  /** what the scan line shows: the live cursor, falling back to a parked marker */
  const view = scan ?? pinned;

  /**
   * Intro sequence: the strikes sweep in month by month, then every tinted period fades
   * up together with the dashed lines marking its edges, then the markers and labels.
   */
  useEffect(() => {
    if (!model) return;
    if (hasAnimated) {
      setRevealCol(model.cols.length);
      setShowBands(true);
      setShowMarks(true);
      return;
    }
    const STEP = 42;      // strikes, per month column
    const BAND_FADE = 700; // how long the tints take to come up
    const n = model.cols.length;
    const timers: ReturnType<typeof setTimeout>[] = [];

    model.cols.forEach((_, i) => timers.push(setTimeout(() => setRevealCol(i), i * STEP)));
    const sweep = n * STEP;

    const bandStart = sweep + 150;
    timers.push(setTimeout(() => setShowBands(true), bandStart));
    const bandEnd = bandStart + BAND_FADE;

    timers.push(setTimeout(() => setShowMarks(true), bandEnd + 180));
    timers.push(
      setTimeout(() => {
        setHasAnimated(true);
        sessionStorage.setItem("timelineAnimated", "true");
      }, bandEnd + 900)
    );
    return () => timers.forEach(clearTimeout);
  }, [model, hasAnimated]);

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "Inconsolata, monospace" }}>
      {/* globals.css sets `overscroll-behavior: none` on :root and `contain` on body, which
          stops wheel scrolling from chaining up to the page scroller — so the wheel does
          nothing while the scrollbar still works. It also hides the scrollbar site-wide.
          Both are overridden for this page only. */}
      <style jsx global>{`
        :root,
        html,
        body {
          overscroll-behavior: auto !important;
          overscroll-behavior-y: auto !important;
          scrollbar-width: thin !important;
          -ms-overflow-style: auto !important;
          scroll-behavior: auto !important;
          overflow-y: auto !important;
        }
        body::-webkit-scrollbar {
          display: block !important;
          width: 10px;
        }
        body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.28);
          border-radius: 5px;
        }
      `}</style>

      <Header TypewriterFinished={true} />

      {/* breathing room between the counter bar and the chart */}
      <div className={isMobile ? "pl-1 pr-2 pt-28" : "px-6 pt-[146px]"}>
        <div ref={wrapRef} className={isMobile ? "flex items-start" : undefined}>
          {/* town labels, pinned outside the scroll container on mobile */}
          {isMobile && model && (
            <svg width={labelW} height={height}
              style={{ display: "block", flexShrink: 0 }}>
              {model.towns.map((town, ti) => (
                <text key={town} x={labelW - 5} y={M_TOP + ti * rowH + rowH / 2} dy="0.32em"
                  textAnchor="end" fill="rgba(255,255,255,0.68)" fontSize="8">
                  {town}
                </text>
              ))}
            </svg>
          )}

          <div className={isMobile ? "overflow-x-auto flex-1 min-w-0" : undefined}>
          {model && (
            <svg width={gridSvgW} height={height} style={{ display: "block", maxWidth: isMobile ? "none" : "100%" }}
              onClick={(e) => {
                /**
                 * Clicking on a marked date parks the line there; clicking anywhere else
                 * clears both the parked line and any pinned cell. The position is worked
                 * out from this event rather than read off `scan`, because the move that
                 * preceded the click may not have re-rendered yet — reading the state here
                 * saw a stale value and the click missed the marker.
                 */
                const r = e.currentTarget.getBoundingClientRect();
                const at = scanAt(e.clientX - r.left);
                if (at?.snap) {
                  setPinned((p) => (p?.snap?.iso === at.snap!.iso ? null : at));
                } else {
                  setPinned(null);
                  setSel(null);
                }
              }}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setScan(scanAt(e.clientX - r.left));
              }}
              onMouseLeave={() => { setScan(null); setHover(null); }}>
              <defs>
                {/* everything left of the scan line, in plain chart coordinates — kept out
                    of the eased group so its edge is always exact and never overshoots */}
                <clipPath id="scanPast">
                  <rect x={0} y={0} width={view ? view.x : 0} height={height} />
                </clipPath>
              </defs>
              {/* phase 2 of the intro: the tinted periods fade up together, each with the
                  dashed lines marking its edges, once the strikes have swept in */}
              <g style={{ opacity: bandsIn ? 1 : 0, transition: "opacity 700ms ease" }}>
                {regions.map((r) => (
                  <g key={r.key}>{r.node}</g>
                ))}
              </g>

              {/* months */}
              {model.cols.map((c, i) => (
                <text key={i} x={xOf(i) + cellW / 2} y={M_TOP - 12} textAnchor="middle"
                  fill="rgba(255,255,255,0.4)" fontSize={isMobile ? 7.5 : 8.5}>
                  {fmtMon(c)}
                </text>
              ))}

              {/* town rows */}
              {model.towns.map((town, ti) => {
                const y = M_TOP + ti * rowH;
                return (
                  <g key={town}>
                    {/* on mobile these live in the pinned svg instead */}
                    {!isMobile && (
                      <text x={LEFT - 6} y={y + rowH / 2} dy="0.32em" textAnchor="end"
                        fill="rgba(255,255,255,0.68)" fontSize="9.5">
                        {town}
                      </text>
                    )}
                    {model.cols.map((c, ci) => {
                      const b = model.grid.get(`${town}|${ci}`);
                      const label = fmtMonthYear(c);
                      const isSel = sel?.town === town && sel?.label === label;
                      return (
                        <rect key={ci}
                          x={xOf(ci) + 0.5} y={y + 0.5}
                          width={Math.max(1, cellW - 1)} height={rowH - 1}
                          fill={b ? stepFill(b.strikes) : EMPTY}
                          stroke={isSel ? "#fff" : undefined} strokeWidth={isSel ? 1.2 : undefined}
                          style={{
                            cursor: b ? "pointer" : "default",
                            // only the filled cells animate; the empty wash is already faint.
                            // While a scan line is showing they all sit back, and the bright
                            // copy clipped to the left of the line is drawn over them.
                            opacity: b ? (!colIn(ci) ? 0 : view ? 0.32 : 1) : 1,
                            transition: "opacity 300ms ease",
                          }}
                          onMouseEnter={(e) => b && setHover({ x: e.clientX, y: e.clientY, town, label, b })}
                          onMouseMove={(e) => b && setHover({ x: e.clientX, y: e.clientY, town, label, b })}
                          onMouseLeave={() => setHover(null)}
                          onClick={(e) => {
                            if (!b) return;
                            // on a marked date the click belongs to the scan line, so let it
                            // through to the svg — again computed from the event, not state
                            const svgEl = e.currentTarget.ownerSVGElement;
                            if (svgEl && scanAt(e.clientX - svgEl.getBoundingClientRect().left)?.snap) return;
                            e.stopPropagation();
                            setSel({ town, label, b });
                          }}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* The strike cells again, at full strength but clipped to the left of the
                  scan line, over the dimmed originals — so the chart fills in as the
                  cursor sweeps right. Only the cells take part: the tints, the ceasefire
                  edges and the year lines stay as they are, which avoids the hard step
                  those verticals showed where a wash would have stopped. A month cell the
                  line lands inside is cut at that exact point, so no day-level geometry is
                  needed to make it fill gradually. */}
              {view && (
                <g pointerEvents="none" clipPath="url(#scanPast)">
                  {model.towns.map((town, ti) =>
                    model.cols.map((c, ci) => {
                      const b = model.grid.get(`${town}|${ci}`);
                      if (!b || !colIn(ci)) return null;
                      return (
                        <rect key={`lit-${town}-${ci}`}
                          x={xOf(ci) + 0.5} y={M_TOP + ti * rowH + 0.5}
                          width={Math.max(1, cellW - 1)} height={rowH - 1}
                          fill={stepFill(b.strikes)} />
                      );
                    })
                  )}
                </g>
              )}

              {/* Faint rules separating the town rows. The cells already leave a 1px gap
                  at each boundary, so these land in that gap rather than over any cell,
                  and they are drawn after the cells so they carry across the tints too. */}
              <g pointerEvents="none">
                {model.towns.map((town, ti) => (
                  <line key={`rule-${town}`}
                    x1={LEFT} x2={LEFT + plotW}
                    y1={M_TOP + ti * rowH} y2={M_TOP + ti * rowH}
                    stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
                ))}
                <line x1={LEFT} x2={LEFT + plotW} y1={plotBottom} y2={plotBottom}
                  stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
              </g>

              {/* the invasion's dashed edge sits above the cells, unlike the ceasefire
                  edges, so it is drawn here — but timed with the tint it opens */}
              {(() => {
                const x = xAtDate(INVASION.date);
                if (x === null) return null;
                return (
                  <g style={{ opacity: bandsIn ? 1 : 0, transition: "opacity 700ms ease" }}>
                    <line x1={x} x2={x} y1={M_TOP} y2={plotBottom + 54.5}
                      stroke={INVASION_COLOR} strokeWidth={1} strokeDasharray="4,3" />
                    <circle cx={x} cy={M_TOP - 2.5} r={2.5} fill={INVASION_COLOR} />
                    <circle cx={x} cy={plotBottom + 57} r={2.5} fill={INVASION_COLOR} />
                  </g>
                );
              })()}

              {/* phase 3: markers and labels last */}
              <g style={{ opacity: showMarks ? 1 : 0, transition: "opacity 550ms ease" }}>
              {/* year dividers, drawn after the cells and tints so they sit above them */}
              {yearMarks.map(({ i, year }) =>
                i > 0 ? (
                  <g key={`yl-${year}`}>
                    {/* line runs down to the triangle's base and is covered by it. It no
                        longer reaches up past the plot — the year it announced is now
                        printed at the other end. */}
                    <line x1={xOf(i)} x2={xOf(i)} y1={M_TOP - 8} y2={plotBottom + 15.6}
                      stroke="#8a8a8a" strokeWidth={1.2} />
                    <polygon
                      points={`${xOf(i)},${plotBottom + 6} ${xOf(i) - 5.4},${plotBottom + 15.6} ${xOf(i) + 5.4},${plotBottom + 15.6}`}
                      fill="#8a8a8a" />
                    {/* the year row is the first line of text under the chart; the
                        ceasefire and invasion labels follow beneath it */}
                    <text x={xOf(i)} y={plotBottom + 33} textAnchor="middle"
                      fill="#fff" fontSize={isMobile ? 11 : 15} fontWeight="bold">
                      {year}
                    </text>
                  </g>
                ) : null
              )}

              {/* ground invasion label — its dashed edge is drawn separately, below, so it
                  can fade in with the tint it opens rather than with the other markers */}
              {(() => {
                const x = xAtDate(INVASION.date);
                if (x === null) return null;
                return (
                  <text x={x + 9} y={plotBottom + 57} dy="0.35em" fill={INVASION_COLOR} fontSize={isMobile ? 10 : 15} fontWeight="bold" textAnchor="start">
                    {INVASION.name}
                  </text>
                );
              })()}

              {/* ceasefire labels on a second line so they clear the invasion label */}
              {CEASEFIRES.map((cf) => {
                const x1 = xAtDate(cf.start);
                if (x1 === null) return null;
                const x2 = cf.end ? xAtDate(cf.end) : LEFT + plotW;
                const openEnded = !cf.end;
                // every band, open-ended included, is labelled on its own midpoint —
                // an open-ended one simply ends at the plot edge
                const mid = x2 !== null ? (x1 + x2) / 2 : x1;
                /**
                 * Desktop switches to start/end anchoring near the edges so labels don't
                 * clip. On mobile the grid scrolls, so that just knocks the text off-centre
                 * from its band — centre it instead and nudge it clear of the left edge.
                 */
                const anchor = isMobile
                  ? "middle"
                  : openEnded ? "middle" : mid > LEFT + plotW * 0.82 ? "end" : mid < LEFT + 70 ? "start" : "middle";
                const labelX = isMobile ? Math.max(mid, 48) : mid;
                const range = cf.end
                  ? `${fmtDay(new Date(cf.start + "T00:00:00Z")).trim()} – ${fmtDay(new Date(cf.end + "T00:00:00Z")).trim()}`
                  : `from ${fmtDay(new Date(cf.start + "T00:00:00Z")).trim()}, ongoing`;
                return (
                  <g key={cf.start}>
                    <text x={labelX} y={plotBottom + 21} textAnchor={anchor} fill={CF_LINE} fontSize={isMobile ? 8 : 10}>
                      {cf.name}
                    </text>
                    <text x={labelX} y={plotBottom + 32} textAnchor={anchor} fill={CF_LINE} fontSize={isMobile ? 7 : 9} opacity={0.8}>
                      {range}
                    </text>
                  </g>
                );
              })}
              </g>

              {/* Scan line: follows the cursor and reports the day it points at, with the
                  running total of strikes up to and including it. It eases rather than
                  tracks exactly, which is what makes the pull onto a marked date read as a
                  magnet instead of a jump. */}
              {view && (() => {
                const fs = isMobile ? 11 : 13;
                const day = fmtDay(view.date).trim();
                const n = view.total.toLocaleString();
                const tail = n === "1" ? " strike to date" : " strikes to date";
                const NB = "\u00a0";
                const name = view.snap?.name ?? null;
                const col = view.snap ? view.snap.color : "rgba(255,255,255,0.6)";
                // Inconsolata is monospaced, so the run width is exact enough to box
                const chars = (name ? name.length + 3 : 0) + day.length + 3 + n.length + tail.length;
                const w = chars * fs * 0.55 + 16;
                const h = fs + 10;
                const bx = Math.max(0, Math.min(view.x - w / 2, gridSvgW - w));
                const by = 4;
                return (
                  <g pointerEvents="none"
                    style={{
                      transform: `translateX(${view.x}px)`,
                      transition: "transform 90ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}>
                    <line x1={0} x2={0} y1={M_TOP} y2={plotBottom}
                      stroke={col} strokeWidth={view.snap ? 1.5 : 1} />
                    {/* the marker caps the line where the plot starts, pointing into it */}
                    <polygon points={`0,${M_TOP} -5,${M_TOP - 8} 5,${M_TOP - 8}`} fill={col} />
                    {/* the box is clamped to the chart in absolute terms, then drawn
                        relative to the line the group is translated to */}
                    <rect x={bx - view.x} y={by} width={w} height={h} rx={2}
                      fill="rgba(0,0,0,0.82)"
                      stroke={view.snap ? col : "rgba(255,255,255,0.35)"} />
                    <text x={bx - view.x + w / 2} y={by + h / 2} dy="0.35em"
                      textAnchor="middle" fontSize={fs}>
                      {name && <tspan fill={col} fontWeight="bold">{name + NB + "\u00b7" + NB}</tspan>}
                      <tspan fill="rgba(255,255,255,0.7)">{day}</tspan>
                      <tspan fill="rgba(255,255,255,0.35)">{NB + "\u00b7" + NB}</tspan>
                      <tspan fill="#ff9457" fontWeight="bold">{n}</tspan>
                      <tspan fill="rgba(255,255,255,0.7)">{tail}</tspan>
                    </text>
                  </g>
                );
              })()}
            </svg>
          )}
          {!model && <div className="text-white/40 text-sm">loading…</div>}
          </div>
        </div>
      </div>

      {/* legend — kept deliberately short */}
      {model && (
        <div className="px-6 pt-2 pb-24 border-t border-white/10">
          <div className="flex items-center gap-3 flex-wrap text-[0.7rem] text-white/50">
            <span>strikes per month</span>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 12, height: 12, background: EMPTY, display: "inline-block" }} />0
            </span>
            {STEPS.map((s) => (
              <span key={s.min} className="flex items-center gap-1.5">
                <span style={{ width: 12, height: 12, background: s.fill, display: "inline-block" }} />
                {s.min === s.max ? s.min : s.max > 100 ? `${s.min}+` : `${s.min}–${s.max}`}
              </span>
            ))}
            <span className="flex items-center gap-1.5 ml-2">
              <span style={{ width: 16, height: 12, background: CF_BAND, borderLeft: `1px dashed ${CF_LINE}`, borderRight: `1px dashed ${CF_LINE}`, display: "inline-block" }} />
              ceasefire
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ width: 16, height: 0, borderTop: `1px dashed ${INVASION_COLOR}`, display: "inline-block" }} />
              ground invasion
            </span>
          </div>
        </div>
      )}

      {!isMobile && <Footer />}

      {hover && (() => {
        // keep the box on screen: cells near the right edge would otherwise push it
        // past the viewport, and near the bottom it would run under the fold
        const BOX_W = 280;
        const BOX_H = 110;
        const PAD = 8;
        const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
        const vh = typeof window !== "undefined" ? window.innerHeight : 800;
        const left = Math.max(PAD, Math.min(hover.x + 14, vw - BOX_W - PAD));
        const top = Math.max(PAD, Math.min(hover.y + 14, vh - BOX_H - PAD));
        return (
        <div className="fixed z-50 pointer-events-none rounded px-2.5 py-1.5 text-[0.7rem] max-w-[280px]"
          style={{
            left, top,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(3px)",
            border: "1px solid rgba(255,255,255,0.3)",
          }}>
          <div className="text-white">
            {hover.b.strikes} strike{hover.b.strikes > 1 ? "s" : ""}
            <span className="text-white/55"> · {(hover.b.strikes * WEDGES_PER_STRIKE).toLocaleString()} wedges</span>
          </div>
          <div className="text-white/65">{hover.town} · {hover.label}</div>
          <div className="mt-1 pt-1 border-t border-white/20" style={{ color: "#ff8a5c" }}>
            {hover.b.codes.join(" · ")}
          </div>
        </div>
        );
      })()}
    </div>
  );
}
