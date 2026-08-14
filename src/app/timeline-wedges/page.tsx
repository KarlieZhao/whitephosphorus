"use client";
/**
 * PROTOTYPE — standalone experiment, not linked from the live nav.
 *
 * Renders every felt wedge from every geolocated strike, accumulating over time at its
 * real coordinates. All content here is generated from our own dataset (dates, coords,
 * shell counts) — no third-party media, so nothing to license.
 *
 * Burst radius: 95m (190m max-burst diameter, Forensic Architecture & Situ Studio 2018,
 * Fig. 14). Wedge count per shell: 116, matching the M825A1.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/app/_components/header";
import "@/app/globals.css";

const WEDGES_PER_SHELL = 116;
const BURST_RADIUS_M = 95;
const M_PER_DEG_LAT = 111320;
const DAY_MS = 86400000;

type Incident = {
  code: string;
  date: string;
  lat: number | null;
  lon: number | null;
  shell_count?: number;
  town?: string;
};

/** FNV-1a seeded PRNG — same approach as the map, so a given strike always scatters identically. */
function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

// age bands, oldest first — points are sorted by date so age descends monotonically,
// which lets the draw loop change fillStyle only ~4 times per frame instead of per point
const BANDS = [
  { minAge: 180, fill: "rgba(196,190,185,0.30)" },
  { minAge: 30, fill: "rgba(232,222,216,0.50)" },
  { minAge: 7, fill: "rgba(255,150,100,0.75)" },
  { minAge: -1, fill: "rgba(255,91,61,0.95)" },
];

const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default function WedgeTimelinePrototype() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const [pts, setPts] = useState<{ x: Float32Array; y: Float32Array; d: Int32Array } | null>(null);
  const [border, setBorder] = useState<[number, number][][]>([]);
  const [startMs, setStartMs] = useState(0);
  const [maxDay, setMaxDay] = useState(0);
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(6); // days per second
  const [totals, setTotals] = useState({ strikes: 0, wedges: 0, incidents: 0 });

  // ---- load + precompute ----------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/data/geoData.json").then((r) => r.json()),
      fetch("/data/LBN_extendedBorder.geojson").then((r) => r.json()).catch(() => null),
    ]).then(([raw, geo]: [Incident[], any]) => {
      if (cancelled) return;

      const located = raw.filter(
        (d) => typeof d.lat === "number" && typeof d.lon === "number" && !isNaN(d.lat!) && !isNaN(d.lon!)
      );

      const times = located.map((d) => new Date(d.date + "T00:00:00Z").getTime());
      const t0 = Math.min(...times);
      const t1 = Math.max(...times);
      const span = Math.round((t1 - t0) / DAY_MS);

      // bounds, padded slightly so wedges near the edge aren't clipped
      const lats = located.map((d) => d.lat as number);
      const lons = located.map((d) => d.lon as number);
      const pad = 0.02;
      const minLat = Math.min(...lats) - pad;
      const maxLat = Math.max(...lats) + pad;
      const minLon = Math.min(...lons) - pad;
      const maxLon = Math.max(...lons) + pad;

      // normalised 0..1 projection so resizing never needs a recompute
      const project = (lat: number, lon: number): [number, number] => [
        (lon - minLon) / (maxLon - minLon),
        1 - (lat - minLat) / (maxLat - minLat),
      ];

      // one point per felt wedge
      const rows: { x: number; y: number; d: number }[] = [];
      let strikes = 0;
      located.forEach((inc) => {
        const shells = Math.max(1, inc.shell_count ?? 1);
        strikes += shells;
        const di = Math.round((new Date(inc.date + "T00:00:00Z").getTime() - t0) / DAY_MS);
        const mPerDegLon = M_PER_DEG_LAT * Math.cos(((inc.lat as number) * Math.PI) / 180);

        for (let s = 0; s < shells; s++) {
          const rnd = seededRandom(`${inc.code}:${s}`);
          for (let w = 0; w < WEDGES_PER_SHELL; w++) {
            const ang = rnd() * Math.PI * 2;
            const rad = BURST_RADIUS_M * Math.sqrt(rnd()); // sqrt => uniform over the disc
            const wLat = (inc.lat as number) + (Math.sin(ang) * rad) / M_PER_DEG_LAT;
            const wLon = (inc.lon as number) + (Math.cos(ang) * rad) / mPerDegLon;
            const [px, py] = project(wLat, wLon);
            rows.push({ x: px, y: py, d: di });
          }
        }
      });

      rows.sort((a, b) => a.d - b.d);
      const x = new Float32Array(rows.length);
      const y = new Float32Array(rows.length);
      const d = new Int32Array(rows.length);
      rows.forEach((r, i) => {
        x[i] = r.x;
        y[i] = r.y;
        d[i] = r.d;
      });

      // border rings, projected the same way
      const rings: [number, number][][] = [];
      if (geo?.features) {
        const pushRing = (coords: any[]) => rings.push(coords.map(([lo, la]: number[]) => project(la, lo)));
        geo.features.forEach((f: any) => {
          const g = f.geometry;
          if (!g) return;
          if (g.type === "Polygon") g.coordinates.forEach(pushRing);
          else if (g.type === "MultiPolygon") g.coordinates.forEach((p: any) => p.forEach(pushRing));
          else if (g.type === "LineString") pushRing(g.coordinates);
          else if (g.type === "MultiLineString") g.coordinates.forEach(pushRing);
        });
      }

      setPts({ x, y, d });
      setBorder(rings);
      setStartMs(t0);
      setMaxDay(span);
      setDay(span); // open on the full accumulated picture
      setTotals({ strikes, wedges: rows.length, incidents: located.length });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- draw -----------------------------------------------------------------
  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || !pts) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const w = cv.width;
    const h = cv.height;
    ctx.clearRect(0, 0, w, h);

    // keep geography undistorted
    const aspect = 1.71; // lon span / lat span for this area
    let vw = w;
    let vh = w / aspect;
    if (vh > h) {
      vh = h;
      vw = h * aspect;
    }
    const ox = (w - vw) / 2;
    const oy = (h - vh) / 2;
    const X = (nx: number) => ox + nx * vw;
    const Y = (ny: number) => oy + ny * vh;

    // border
    if (border.length) {
      ctx.strokeStyle = "rgba(255,255,255,0.13)";
      ctx.lineWidth = 1;
      border.forEach((ring) => {
        ctx.beginPath();
        ring.forEach(([nx, ny], i) => (i ? ctx.lineTo(X(nx), Y(ny)) : ctx.moveTo(X(nx), Y(ny))));
        ctx.stroke();
      });
    }

    // how many wedges have landed by `day` (points are date-sorted → binary search)
    const d = pts.d;
    let lo = 0;
    let hi = d.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (d[mid] <= day) lo = mid + 1;
      else hi = mid;
    }
    const count = lo;

    const size = Math.max(1, Math.round(vw / 900));
    let band = -1;
    for (let i = 0; i < count; i++) {
      const age = day - d[i];
      let b = 0;
      while (b < BANDS.length - 1 && age < BANDS[b].minAge) b++;
      if (b !== band) {
        band = b;
        ctx.fillStyle = BANDS[b].fill;
      }
      ctx.fillRect(X(pts.x[i]), Y(pts.y[i]), size, size);
    }

    return count;
  }, [pts, border, day]);

  // redraw on state change + handle resize/DPR
  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const r = wrap.getBoundingClientRect();
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      cv.style.width = `${r.width}px`;
      cv.style.height = `${r.height}px`;
      draw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ---- playback -------------------------------------------------------------
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setDay((prev) => {
        const next = prev + dt * speed;
        if (next >= maxDay) {
          setPlaying(false);
          return maxDay;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, speed, maxDay]);

  // ---- derived counters -----------------------------------------------------
  const shown = useMemo(() => {
    if (!pts) return 0;
    const d = pts.d;
    let lo = 0;
    let hi = d.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (d[mid] <= day) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }, [pts, day]);

  const currentMs = startMs + day * DAY_MS;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header TypewriterFinished={true} />

      <div className="pt-32 px-6 pb-6" style={{ fontFamily: "Inconsolata, monospace" }}>
        <div className="flex items-baseline gap-3 flex-wrap mb-1">
          <h1 className="text-xl tracking-wide">Felt wedge accumulation</h1>
          <span className="text-[0.7rem] text-white/40">prototype</span>
        </div>
        <p className="text-[0.75rem] text-white/50 max-w-[70ch] leading-relaxed">
          Every geolocated strike, drawn as its {WEDGES_PER_SHELL} felt wedges scattered across the
          estimated {BURST_RADIUS_M * 2}m burst footprint, accumulating in real position over time.
        </p>

        {/* counters */}
        <div className="flex gap-10 mt-5 mb-3 flex-wrap">
          <Stat label="Date" value={startMs ? fmtDate(currentMs) : "—"} wide />
          <Stat label="Strikes" value={Math.round(shown / WEDGES_PER_SHELL).toLocaleString()} />
          <Stat label="Felt Wedges" value={shown.toLocaleString()} />
        </div>

        {/* canvas */}
        <div
          ref={wrapRef}
          className="relative w-full rounded"
          style={{ height: "min(58vh, 620px)", background: "#0a0a0a" }}
        >
          <canvas ref={canvasRef} className="block" />
          {!pts && (
            <div className="absolute inset-0 grid place-items-center text-white/40 text-sm">loading…</div>
          )}
        </div>

        {/* transport */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <button
            onClick={() => {
              if (day >= maxDay) setDay(0);
              setPlaying((p) => !p);
            }}
            className="px-4 py-1.5 border border-white/25 rounded hover:bg-white/10 text-sm min-w-[5.5rem]"
          >
            {playing ? "Pause" : day >= maxDay ? "Replay" : "Play"}
          </button>

          <input
            type="range"
            min={0}
            max={maxDay || 1}
            step={0.5}
            value={day}
            onChange={(e) => {
              setPlaying(false);
              setDay(parseFloat(e.target.value));
            }}
            className="flex-1 min-w-[240px] accent-[#ff5b3d]"
            aria-label="Scrub timeline"
          />

          <label className="text-[0.7rem] text-white/50 flex items-center gap-2">
            speed
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-black border border-white/20 rounded px-2 py-1 text-white text-[0.7rem]"
            >
              <option value={2}>slow</option>
              <option value={6}>normal</option>
              <option value={20}>fast</option>
            </select>
          </label>
        </div>

        {/* legend */}
        <div className="flex gap-6 mt-4 flex-wrap text-[0.7rem] text-white/50 items-center">
          <span>age of wedge:</span>
          <Key color="rgba(255,91,61,0.95)" label="first week" />
          <Key color="rgba(255,150,100,0.75)" label="first month" />
          <Key color="rgba(232,222,216,0.50)" label="within 6 months" />
          <Key color="rgba(196,190,185,0.30)" label="older" />
        </div>

        <p className="text-[0.68rem] text-white/35 mt-5 max-w-[80ch] leading-relaxed">
          Showing {totals.incidents} geolocated incidents ({totals.strikes} strikes,{" "}
          {totals.wedges.toLocaleString()} wedges). Verified strikes that are not yet geolocated are
          excluded here because they have no coordinates to plot. Wedge scatter is an even
          distribution across the maximum documented burst footprint — illustrative of scale and
          position, not a per-wedge reconstruction.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className={`${wide ? "text-lg" : "text-2xl"} text-white leading-tight tabular-nums`}>{value}</span>
      <span className="text-[0.7rem] text-white/50">{label}</span>
    </div>
  );
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
