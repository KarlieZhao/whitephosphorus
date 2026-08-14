"use client";
/**
 * PROTOTYPE — standalone experiment, not linked from the live nav.
 *
 * Inverted timeline: towns across the top (x, fixed — never scrolls sideways),
 * dates running down (y), uniform cells.
 *
 * Counts here are tiny integers (1–8 shells), which colour ramps read badly. Default
 * encoding is therefore one wedge-shaped pip per shell — countable and exact — with
 * heat and size available for comparison.
 *
 * Every cell sums EVERY incident for that town/day. That matters: 29 of the 133 filled
 * cells hold more than one incident, and the live heatmap's `new Map(data.map(...))`
 * lookup keeps only the last one per date+town, silently dropping the rest.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/app/_components/header";
import "@/app/globals.css";

const WEDGES_PER_SHELL = 116;
const DAY_MS = 86400000;

const GUTTER = 120;
const ROW_H = 26;
const EVENT_H = 22;
const ACCENT = "#ff6a3d";

type Incident = { code: string; date: string; town?: string; country?: string; shell_count?: number; lon?: number | null };
type Agg = { shells: number; incidents: number; codes: string[] };
type Cell = Agg & { town: string; date: string; row: number; col: number };
type Sort = "total" | "alpha" | "geo";
type Enc = "circles" | "segments" | "heat" | "size";

/**
 * Only the ground invasion is marked — it is the event that bears on the legality of
 * WP use, unlike the wider political timeline. Date taken from heatMapHorizontal.
 */
const EVENT = { date: "2024-10-01", name: "Ground Invasion of Southern Lebanon" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

function heat(t: number) {
  const a = [58, 22, 16];
  const b = [255, 106, 61];
  const e = Math.pow(Math.min(1, Math.max(0, t)), 0.6);
  return `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * e)).join(",")})`;
}

export default function TimelineGridPrototype() {
  const [raw, setRaw] = useState<Incident[] | null>(null);
  const [sort, setSort] = useState<Sort>("total");
  const [enc, setEnc] = useState<Enc>("circles");
  const [allDays, setAllDays] = useState(true);
  const [sel, setSel] = useState<Cell | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; c: Cell } | null>(null);
  const [width, setWidth] = useState(1200);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/geoData.json").then((r) => r.json()).then(setRaw);
  }, []);

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

    const agg = new Map<string, Agg>();
    const townShells = new Map<string, number>();
    const townLon = new Map<string, number>();

    raw.forEach((d) => {
      const town = d.town || d.country || "Unknown";
      const date = d.date.slice(0, 10);
      const key = `${town}|${date}`;
      const shells = Math.max(1, d.shell_count ?? 1);
      const prev = agg.get(key);
      if (prev) {
        prev.shells += shells;
        prev.incidents += 1;
        prev.codes.push(d.code);
      } else {
        agg.set(key, { shells, incidents: 1, codes: [d.code] });
      }
      townShells.set(town, (townShells.get(town) ?? 0) + shells);
      if (typeof d.lon === "number" && !townLon.has(town)) townLon.set(town, d.lon);
    });

    const towns = Array.from(townShells.keys()).sort((a, b) => {
      if (sort === "alpha") return a.localeCompare(b);
      if (sort === "geo") return (townLon.get(a) ?? 0) - (townLon.get(b) ?? 0);
      return (townShells.get(b) ?? 0) - (townShells.get(a) ?? 0) || a.localeCompare(b);
    });

    const hitDates = Array.from(new Set(Array.from(agg.keys()).map((k) => k.split("|")[1]))).sort();
    let dates: string[];
    if (allDays) {
      const t0 = new Date(hitDates[0] + "T00:00:00Z").getTime();
      const t1 = new Date(hitDates[hitDates.length - 1] + "T00:00:00Z").getTime();
      dates = [];
      for (let t = t0; t <= t1; t += DAY_MS) dates.push(iso(t));
    } else {
      dates = hitDates;
    }

    const colOf = new Map(towns.map((t, i) => [t, i]));
    const rowOf = new Map(dates.map((d, i) => [d, i]));

    const cells: Cell[] = [];
    agg.forEach((v, key) => {
      const [town, date] = key.split("|");
      const row = rowOf.get(date);
      const col = colOf.get(town);
      if (row === undefined || col === undefined) return;
      cells.push({ town, date, row, col, ...v });
    });

    const cw = Math.max(16, Math.floor((width - GUTTER) / towns.length));
    const maxShells = Math.max(...cells.map((c) => c.shells));
    const totalShells = cells.reduce((s, c) => s + c.shells, 0);
    const multi = cells.filter((c) => c.incidents > 1).length;

    // the event band takes real vertical space rather than covering a row
    let eventIdx = dates.findIndex((d) => d >= EVENT.date);
    if (eventIdx < 0) eventIdx = dates.length;
    const topOf = (i: number) => i * ROW_H + (i >= eventIdx ? EVENT_H : 0);
    const bodyH = dates.length * ROW_H + EVENT_H;

    return { cells, towns, dates, townShells, maxShells, totalShells, multi, cw, eventIdx, topOf, bodyH };
  }, [raw, sort, allDays, width]);

  if (!model) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header TypewriterFinished={true} />
        <div ref={wrapRef} className="pt-32 px-6 text-white/40 text-sm">loading…</div>
      </div>
    );
  }

  const { cells, towns, dates, townShells, maxShells, totalShells, multi, cw, eventIdx, topOf, bodyH } = model;

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "Inconsolata, monospace" }}>
      <Header TypewriterFinished={true} />

      <div className="pt-32 px-6">
        <div ref={wrapRef} className="overflow-y-auto overflow-x-hidden border-t border-white/10" style={{ maxHeight: "62vh" }}>
          <div style={{ position: "relative", width: GUTTER + towns.length * cw }}>
            {/* town headers */}
            <div className="sticky top-0 z-20 flex" style={{ height: 118, background: "#000" }}>
              <div className="flex-shrink-0" style={{ width: GUTTER, background: "#000" }} />
              {towns.map((t) => (
                <div key={t} className="relative flex-shrink-0" style={{ width: cw }}>
                  <span
                    className="absolute whitespace-nowrap text-[0.66rem] text-white/70"
                    style={{ bottom: 6, left: cw / 2 + 4, transformOrigin: "left bottom", transform: "rotate(-62deg)" }}
                    title={`${t} — ${townShells.get(t)} shells (${(townShells.get(t)! * WEDGES_PER_SHELL).toLocaleString()} wedges)`}
                  >
                    {t}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex">
              {/* dates */}
              <div className="flex-shrink-0" style={{ width: GUTTER, background: "#000" }}>
                {dates.map((d, i) => {
                  const dt = new Date(d + "T00:00:00Z");
                  const first = dt.getUTCDate() === 1;
                  return (
                    <div key={d}>
                      {i === eventIdx && <div style={{ height: EVENT_H }} />}
                      <div
                        className="flex items-center text-[0.64rem] text-white/45 pr-3"
                        style={{ height: ROW_H, borderTop: first ? "1px solid rgba(255,255,255,0.18)" : undefined }}>
                        {`${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* body */}
              <div style={{
                position: "relative", width: towns.length * cw, height: bodyH,
                backgroundImage:
                  `repeating-linear-gradient(to right, rgba(255,255,255,0.05) 0 1px, transparent 1px ${cw}px),` +
                  `repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0 1px, transparent 1px ${ROW_H}px)`,
              }}>
                {/* ground invasion — thick band with the label set inside it */}
                <div
                  style={{
                    position: "absolute", left: 0, top: eventIdx * ROW_H, width: "100%",
                    height: EVENT_H, background: "rgba(255,255,255,0.92)",
                    display: "flex", alignItems: "center", zIndex: 15, pointerEvents: "none",
                  }}>
                  <span className="text-[0.66rem] font-semibold" style={{ color: "#000", paddingLeft: 8, letterSpacing: "0.02em" }}>
                    {EVENT.name} · {EVENT.date}
                  </span>
                </div>

                {cells.map((c) => {
                  const isSel = sel?.town === c.town && sel?.date === c.date;
                  return (
                    <div key={`${c.town}|${c.date}`}
                      style={{
                        position: "absolute", left: c.col * cw, top: topOf(c.row),
                        width: cw, height: ROW_H, cursor: "pointer",
                        outline: isSel ? "1.5px solid #fff" : undefined,
                      }}
                      onMouseEnter={(e) => setHover({ x: e.clientX, y: e.clientY, c })}
                      onMouseMove={(e) => setHover({ x: e.clientX, y: e.clientY, c })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => setSel(c)}>
                      <CellMark shells={c.shells} enc={enc} maxShells={maxShells} w={cw} h={ROW_H} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* readout */}
      <div className="px-6 py-4 min-h-[92px]">
        {sel ? (
          <div>
            <div className="text-lg text-white">
              {sel.shells} shell{sel.shells > 1 ? "s" : ""}{" "}
              <span className="text-[0.8rem] text-white/60">
                · {(sel.shells * WEDGES_PER_SHELL).toLocaleString()} felt wedges
              </span>
            </div>
            <div className="text-[0.78rem] text-white/70 mt-1">
              {sel.town} ·{" "}
              {new Date(sel.date + "T00:00:00Z").toLocaleDateString("en-US", {
                weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
              })}
            </div>
            <div className="text-[0.72rem] text-white/50 mt-1">
              {sel.incidents} incident{sel.incidents > 1 ? "s" : ""}:{" "}
              <span className="text-white/80">{sel.codes.join(" · ")}</span>
            </div>
          </div>
        ) : (
          <div className="text-[0.75rem] text-white/35">
            Hover a box for its incident codes, click to pin. {multi} of {cells.length} filled boxes hold
            more than one incident — summed here rather than overwritten.
          </div>
        )}
      </div>

      {/* controls + legend, kept at the bottom */}
      <div className="px-6 pt-6 pb-12 border-t border-white/10">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-xl tracking-wide">Strikes by town and day</h1>
          <span className="text-[0.7rem] text-white/40">prototype</span>
        </div>

        <div className="flex items-center gap-5 mt-4 flex-wrap text-[0.72rem]">
          <label className="flex items-center gap-2 text-white/60">
            show as
            <select value={enc} onChange={(e) => setEnc(e.target.value as Enc)}
              className="bg-black border border-white/20 rounded px-2 py-1 text-white">
              <option value="circles">white circles (one per shell)</option>
              <option value="segments">split box (one segment per shell)</option>
              <option value="heat">heat colour</option>
              <option value="size">proportional square</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-white/60">
            order
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
              className="bg-black border border-white/20 rounded px-2 py-1 text-white">
              <option value="total">most struck</option>
              <option value="alpha">A–Z</option>
              <option value="geo">west → east</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-white/60 cursor-pointer">
            <input type="checkbox" checked={allDays} onChange={(e) => setAllDays(e.target.checked)} className="accent-[#ff5b3d]" />
            every calendar day
          </label>

          <span className="text-white/35">
            {towns.length} towns · {dates.length} rows · {totalShells} shells ·{" "}
            {(totalShells * WEDGES_PER_SHELL).toLocaleString()} wedges
          </span>
        </div>

        {/* legend */}
        <div className="flex items-center gap-5 mt-5 flex-wrap">
          {[1, 2, 3, 6, maxShells].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div style={{ width: cw, height: ROW_H, border: "1px solid rgba(255,255,255,0.12)" }}>
                <CellMark shells={s} enc={enc} maxShells={maxShells} w={cw} h={ROW_H} />
              </div>
              <span className="text-[0.68rem] text-white/50">
                {s} shell{s > 1 ? "s" : ""}
                <span className="text-white/30"> · {(s * WEDGES_PER_SHELL).toLocaleString()} wedges</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {hover && (
        <div className="fixed z-50 pointer-events-none bg-black/92 border border-white/25 rounded px-2.5 py-1.5 text-[0.7rem] max-w-[260px]"
          style={{ left: hover.x + 14, top: hover.y + 14 }}>
          <div className="text-white">
            {hover.c.shells} shell{hover.c.shells > 1 ? "s" : ""}
            <span className="text-white/50"> · {(hover.c.shells * WEDGES_PER_SHELL).toLocaleString()} wedges</span>
          </div>
          <div className="text-white/60">{hover.c.town} · {hover.c.date}</div>
          <div className="mt-1 pt-1 border-t border-white/15" style={{ color: ACCENT }}>
            {hover.c.codes.join(" · ")}
          </div>
          {hover.c.incidents > 1 && (
            <div className="text-white/40 mt-0.5">{hover.c.incidents} separate incidents</div>
          )}
        </div>
      )}
    </div>
  );
}

/** one wedge-shaped pip per shell — countable, unlike a colour ramp */
function CellMark({ shells, enc, maxShells, w, h }: { shells: number; enc: Enc; maxShells: number; w: number; h: number }) {
  if (enc === "heat") {
    return <div style={{ width: "100%", height: "100%", background: heat(shells / maxShells) }} />;
  }

  if (enc === "size") {
    const t = Math.sqrt(shells / maxShells); // area-proportional
    const s = Math.max(4, Math.min(w, h) * 0.92 * t);
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div style={{ width: s, height: s, background: ACCENT, borderRadius: 1 }} />
      </div>
    );
  }

  // the box divided into one segment per shell — slot width is fixed, so segment count
  // and total ink both grow with the strike count, and nothing changes size
  const GAP = 1;
  const inset = 2;
  const slot = (w - inset * 2 + GAP) / maxShells;
  const segW = Math.max(1.5, slot - GAP);

  return (
    <div className="w-full h-full flex items-center" style={{ paddingLeft: inset, gap: GAP }}>
      {Array.from({ length: shells }).map((_, i) => (
        <div key={i} style={{ width: segW, height: h - 11, background: ACCENT }} />
      ))}
    </div>
  );
}
