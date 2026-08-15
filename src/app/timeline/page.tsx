"use client";
/**
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
const ROW_H = 16;
const M_LEFT = 112;
const M_RIGHT = 88; // also the run-out for the ongoing-ceasefire fade
const M_TOP = 48;
const M_BOTTOM = 48; // two-line ceasefire labels, then the invasion label below them

const INVASION = { date: "2024-10-01", name: "Ground invasion of southern Lebanon" };
const INVASION_COLOR = "#b0e4f4";
const INVASION_TINT = "rgba(158,214,236,0.20)";
const CF_LINE = "rgba(214,226,235,0.9)";
const CF_BAND = "rgba(198,214,226,0.17)";

/**
 * Ceasefire periods. The first is from heatMapHorizontal.tsx; the rest are sourced
 * (see the note rendered under the chart) rather than inferred:
 *  - 2024 agreement took effect 27 Nov 2024 02:00 GMT and was set to expire 2 Mar 2026,
 *    breaking down on that date amid the 2026 Iran war.
 *  - 2026 agreement took effect 16 Apr 2026, initially 10 days, then repeatedly extended
 *    (23 Apr, 15 May), so it is still running at the end of this dataset.
 */
const CEASEFIRES: { start: string; end: string | null; name: string }[] = [
  { start: "2023-11-24", end: "2023-11-30", name: "Ceasefire" },
  { start: "2024-11-27", end: "2026-03-02", name: "2024 ceasefire agreement" },
  { start: "2026-04-16", end: null, name: "2026 ceasefire" },
];

type Incident = { code: string; date: string; town?: string; country?: string; shell_count?: number };
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

    const towns = Array.from(
      new Set(raw.map((r) => (r.town || r.country || "Unknown").trim()))
    ).sort((a, b) => a.localeCompare(b));

    const grid = new Map<string, Bucket>();
    raw.forEach((r) => {
      const town = (r.town || r.country || "Unknown").trim();
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

    return { cols, colIndex, towns, grid, maxStrikes, totalStrikes };
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

  useEffect(() => {
    if (!model) return;
    if (hasAnimated) {
      setRevealCol(model.cols.length);
      setShowBands(true);
      setShowMarks(true);
      return;
    }
    const STEP = 42; // per month column
    const timers: ReturnType<typeof setTimeout>[] = [];
    model.cols.forEach((_, i) => timers.push(setTimeout(() => setRevealCol(i), i * STEP)));
    const sweep = model.cols.length * STEP;
    timers.push(setTimeout(() => setShowBands(true), sweep + 180));
    timers.push(setTimeout(() => setShowMarks(true), sweep + 520));
    timers.push(
      setTimeout(() => {
        setHasAnimated(true);
        sessionStorage.setItem("timelineAnimated", "true");
      }, sweep + 1200)
    );
    return () => timers.forEach(clearTimeout);
  }, [model, hasAnimated]);

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

  const yearMarks: { i: number; year: number }[] = [];
  model?.cols.forEach((c, i) => {
    if (i === 0 || c.getUTCFullYear() !== model.cols[i - 1].getUTCFullYear())
      yearMarks.push({ i, year: c.getUTCFullYear() });
  });

  const plotBottom = height - M_BOTTOM;

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
      <div className={isMobile ? "pl-1 pr-2 pt-28" : "px-6 pt-40"}>
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
              onClick={() => setSel(null)}>
              <defs>
                {/* The 2026 ceasefire is still running past the end of the data. Fading the
                    tint alone left a seam, because the empty-cell wash also stops at the plot
                    edge — so this fades the COMPOSITE tone (black + cell wash + ceasefire
                    tint) out across the right margin, which blends continuously. */}
                <linearGradient id="edgeFade" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#252a2e" stopOpacity={1} />
                  <stop offset="30%" stopColor="#252a2e" stopOpacity={0.78} />
                  <stop offset="60%" stopColor="#252a2e" stopOpacity={0.4} />
                  <stop offset="82%" stopColor="#252a2e" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#252a2e" stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* phase 2 of the intro: the regions fade up once the strikes have swept in */}
              <g style={{ opacity: showBands ? 1 : 0, transition: "opacity 700ms ease" }}>
              {/* Post-invasion tint, drawn only OUTSIDE ceasefire periods. Painting it under
                  the blue bands would stack two translucent fills into a third colour, and a
                  ceasefire is not "invasion ongoing" anyway — so the two are kept exclusive. */}
              {(() => {
                const xi = xAtDate(INVASION.date);
                if (xi === null) return null;
                const right = LEFT + plotW;

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

                return gaps.map(([a, b], i) => (
                  <rect key={i} x={a} y={M_TOP} width={b - a}
                    height={plotBottom - M_TOP} fill={INVASION_TINT} />
                ));
              })()}

              {/* ceasefire spans, drawn under the cells */}
              {CEASEFIRES.map((cf) => {
                const x1 = xAtDate(cf.start);
                if (x1 === null) return null;
                // an open-ended ceasefire is still running at the end of the dataset,
                // so its band runs to the edge of the chart
                const x2 = cf.end ? xAtDate(cf.end) : LEFT + plotW;
                return (
                  <g key={cf.start}>
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
                  </g>
                );
              })}

              </g>

              {/* year labels — the divider lines are drawn later, on top of everything */}
              {yearMarks.map(({ i, year }) =>
                i === 0 ? null : (
                  <text key={year} x={xOf(i)} y={18} fill="#fff" fontSize={isMobile ? 11 : 15} fontWeight="bold">{year}</text>
                )
              )}

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
                            // only the filled cells animate; the empty wash is already faint
                            opacity: b && !colIn(ci) ? 0 : 1,
                            transition: "opacity 300ms ease",
                          }}
                          onMouseEnter={(e) => b && setHover({ x: e.clientX, y: e.clientY, town, label, b })}
                          onMouseMove={(e) => b && setHover({ x: e.clientX, y: e.clientY, town, label, b })}
                          onMouseLeave={() => setHover(null)}
                          onClick={(e) => { if (b) { e.stopPropagation(); setSel({ town, label, b }); } }}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* phase 3: markers and labels last */}
              <g style={{ opacity: showMarks ? 1 : 0, transition: "opacity 550ms ease" }}>
              {/* right-edge fade for the still-running ceasefire */}
              <rect x={LEFT + plotW} y={M_TOP} width={M_RIGHT} height={plotBottom - M_TOP}
                fill="url(#edgeFade)" />

              {/* year dividers, drawn after the cells and tints so they sit above them */}
              {yearMarks.map(({ i, year }) =>
                i > 0 ? (
                  <g key={`yl-${year}`}>
                    {/* line runs down to the triangle's base and is covered by it */}
                    <line x1={xOf(i)} x2={xOf(i)} y1={24} y2={plotBottom + 15.6}
                      stroke="#8a8a8a" strokeWidth={1.2} />
                    <polygon
                      points={`${xOf(i)},${plotBottom + 6} ${xOf(i) - 5.4},${plotBottom + 15.6} ${xOf(i) + 5.4},${plotBottom + 15.6}`}
                      fill="#8a8a8a" />
                  </g>
                ) : null
              )}

              {/* ground invasion */}
              {(() => {
                const x = xAtDate(INVASION.date);
                if (x === null) return null;
                return (
                  <g>
                    <line x1={x} x2={x} y1={M_TOP} y2={plotBottom + 27.5}
                      stroke={INVASION_COLOR} strokeWidth={1} strokeDasharray="4,3" />
                    <circle cx={x} cy={M_TOP - 2.5} r={2.5} fill={INVASION_COLOR} />
                    <circle cx={x} cy={plotBottom + 30} r={2.5} fill={INVASION_COLOR} />
                    <text x={x + 9} y={plotBottom + 30} dy="0.35em" fill={INVASION_COLOR} fontSize={isMobile ? 10 : 15} fontWeight="bold" textAnchor="start">
                      {INVASION.name}
                    </text>
                  </g>
                );
              })()}

              {/* ceasefire labels on a second line so they clear the invasion label */}
              {CEASEFIRES.map((cf) => {
                const x1 = xAtDate(cf.start);
                if (x1 === null) return null;
                const x2 = cf.end ? xAtDate(cf.end) : LEFT + plotW;
                // an open-ended ceasefire runs off the chart, so label it hard right
                const openEnded = !cf.end;
                const mid = openEnded ? LEFT + plotW : x2 !== null ? (x1 + x2) / 2 : x1;
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
                    <text x={labelX} y={plotBottom + 20} textAnchor={anchor} fill={CF_LINE} fontSize={isMobile ? 8 : 10}>
                      {cf.name}
                    </text>
                    <text x={labelX} y={plotBottom + 32} textAnchor={anchor} fill={CF_LINE} fontSize={isMobile ? 7 : 9} opacity={0.8}>
                      {range}
                    </text>
                  </g>
                );
              })}
              </g>
            </svg>
          )}
          {!model && <div className="text-white/40 text-sm">loading…</div>}
          </div>
        </div>
      </div>

      {/* readout */}
      <div className="px-6 pt-0 pb-1 min-h-[56px]">
        {sel ? (
          <div>
            <div className="text-lg text-white">
              {sel.b.strikes} strike{sel.b.strikes > 1 ? "s" : ""}
              <span className="text-[0.8rem] text-white/60">
                {" "}· {(sel.b.strikes * WEDGES_PER_STRIKE).toLocaleString()} felt wedges
              </span>
            </div>
            <div className="text-[0.78rem] text-white/70 mt-1">
              {sel.town} · {sel.label} · {sel.b.incidents} incident{sel.b.incidents > 1 ? "s" : ""} on{" "}
              {sel.b.dates.size} day{sel.b.dates.size > 1 ? "s" : ""}
            </div>
            <div className="text-[0.72rem] mt-1" style={{ color: "#ff8a5c" }}>{sel.b.codes.join(" · ")}</div>
          </div>
        ) : (
          <div className="text-[0.75rem] text-white/35">Hover a cell for its incident codes, click to pin.</div>
        )}
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
