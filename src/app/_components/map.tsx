import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { geoDataProps } from "./datasource";
import { TypewriterProps } from "./header";
import { MONTHS } from "./datasource";
import { isMobileDevice } from "./mobile-detector";
type VectorMapProps = geoDataProps & TypewriterProps & {
  getMapDetails: (point: any | null, arg?: any, clicked?: boolean) => void;
  mapZoom: number;
  leafletCenter: [number, number];
  mapInstance: any;
  showSatellite: boolean;
  TypeWriterFinished?: boolean;
  // bumped by the parent's readout close button (mobile has no reachable background to
  // tap for the usual reset) to clear this component's own focus state from outside
  clearSelectionSignal?: number;
};

const CARTODB_TILES_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"

const GRADIENT_CONFIGS = [
  { id: "static", color: "#7777", opacity: 0.8 },
  { id: "hover", color: "#f997", opacity: 0.8 },
  { id: "clicked", color: "#7777", opacity: 0.8 },
  { id: "bg", color: "#333", opacity: 0.8 },
  { id: "satellite", color: "#ff3333", opacity: 0.4 }, // half strength — the red flare read as too strong over satellite imagery
];

const CENTER_FILL = {
  static: "#ccc",
  clicked: "#ff3333",
  hover: "#eee",
  satellite: "#ff3b3b"
}

// estimated wedge-dispersal footprint, sourced from Forensic Architecture &
// Situ Studio, "The Use of White Phosphorus Munitions in Urban Environments"
// (2018), Fig. 14 — documented maximum burst: 190m long axis, ~28,400 m2
const MAX_BURST_M = 190;
const WEDGE_COUNT = 116;
// bloom circle radius is ~48px at max zoom (16), ~24px one zoom out (15), ~12px two zooms
// out (14) — threshold+transition sits between the 14 and 15 values so the circle stays
// fully hidden at 14 and is already at full bloom (weight matching max zoom) by 15
const BLOOM_PX_THRESHOLD = 16;
const BLOOM_TRANSITION_PX = 6;
const WEDGE_REVEAL_FRACTION = 0.5; // wedges only show in the last two zoom levels (15 and 16)
const WEDGE_MAX_OPACITY = 0.5; // kept dim so the solid, fully-opaque center dot still reads as "the real point"

function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

const wedgeOffsetCache: { [key: string]: [number, number][] } = {};
function getWedgeOffsets(id: string, shellIdx: number): [number, number][] {
  const key = id + ':' + shellIdx;
  if (wedgeOffsetCache[key]) return wedgeOffsetCache[key];
  const rnd = seededRandom(key);
  const r = MAX_BURST_M / 2;
  const pts: [number, number][] = [];
  for (let i = 0; i < WEDGE_COUNT; i++) {
    const ang = rnd() * Math.PI * 2;
    const rad = r * Math.sqrt(rnd());
    pts.push([Math.cos(ang) * rad, Math.sin(ang) * rad]);
  }
  wedgeOffsetCache[key] = pts;
  return pts;
}

export function VectorMap({
  geoData,
  selectedCity,
  selectedDay,
  selectedDates,
  selectedAreaType,
  selectedMonth,
  selectedYear,
  TypeWriterFinished,
  getMapDetails,
  mapZoom,
  leafletCenter,
  mapInstance,
  showSatellite,
  clearSelectionSignal,
}: VectorMapProps) {
  const borderDataRef = useRef<any>(null);
  const cartodbLayerRef = useRef<any>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout[]>([]);
  const [hasAnimated, setHasAnimated] = useState(() => typeof window !== "undefined" && sessionStorage.getItem("mapDotsAnimated") === "true");
  const [anyWedgesVisible, setAnyWedgesVisible] = useState(false);
  const wedgeFrameRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // tracks whether wedges were showing as of the LAST render, so re-renders triggered by
  // panning (or zooming between the two "wedges visible" levels) don't replay the fade-in —
  // it should only animate once on the transition into/out of visibility
  const wedgesShownRef = useRef(false);

  const BORDER_DELAY = 500;
  // state, not a ref: a ref's mutation alone never triggers a re-render, so toggling focus
  // off only ever visually applied when some unrelated parent re-render happened to follow
  // it (e.g. opening the detail panel on first click) — clicking the same point twice to
  // deselect calls getMapDetails with the same point, which doesn't reliably cause that,
  // so the DOM was left stuck showing the old focused state
  const [focusedPt, setFocusedPt] = useState<number | null>(null);
  useEffect(() => {
    if (clearSelectionSignal) setFocusedPt(null);
  }, [clearSelectionSignal]);
  const [isMobile, setIsMobile] = useState(false);
  const DOT_ANIMATION_DELAY = TypeWriterFinished ? (isMobile ? 8 : 20) : (isMobile ? 30 : 60);
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // legend centers itself in the space left of the side filter panel, not the full
  // viewport, so it doesn't run under the panel — measured live since the panel's width
  // is content-driven, not a fixed value
  const [legendLeftBound, setLegendLeftBound] = useState<number | null>(null);
  useEffect(() => {
    const panel = document.querySelector(".side-bar") as HTMLElement | null;
    if (!panel) return;
    const measure = () => setLegendLeftBound(panel.getBoundingClientRect().left);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  // mouse hover on circle debounce
  let mouseoverTimeout: NodeJS.Timeout | null = null;
  let mouseoutTimeout: NodeJS.Timeout | null = null;
  const HOVER_DELAY = 50;
  const projectPts = useCallback((lon: number, lat: number): [number, number] => {
    if (!mapInstance || !lat || !lon || isNaN(lat) || isNaN(lon)) {
      return [-1000, -1000];
    }

    const point = mapInstance.latLngToLayerPoint([lat, lon]);

    return [point.x, point.y];
  }, [mapInstance]);

  // offset a lat/lon by a real-world meter delta (small-angle approximation, fine at this scale)
  const offsetLatLon = useCallback((lat: number, lon: number, dxMeters: number, dyMeters: number): [number, number] => {
    const dLat = dyMeters / 111320;
    const dLon = dxMeters / (111320 * Math.cos(lat * Math.PI / 180));
    return [lat + dLat, lon + dLon];
  }, []);

  // on-screen pixel radius a real-world-meter circle would have at the current zoom,
  // computed via the live Leaflet projection so it's correct at every zoom level
  const metersToPixelRadius = useCallback((lat: number, lon: number, meters: number): number => {
    const [x0, y0] = projectPts(lon, lat);
    const [offLat] = offsetLatLon(lat, lon, 0, meters);
    const [x1, y1] = projectPts(lon, offLat);
    return Math.hypot(x1 - x0, y1 - y0);
  }, [projectPts, offsetLatLon]);

  const visiblePoints = useMemo(() => {
    const filtered = geoData.filter(pt => {
      const matchesCity = selectedCity === "" || pt.town === selectedCity;
      const matchesAreaType = !selectedAreaType || pt.landscape === selectedAreaType;
      const date = new Date(pt.date);
      const day = (date.getDay() + 6) % 7;
      const matchesDay = selectedDay === -1 || day === selectedDay;
      let mathcesMonth = false;
      if (selectedMonth === null) mathcesMonth = true;
      else if (selectedMonth != null && pt.date.slice(0, 7) === MONTHS[selectedMonth]) mathcesMonth = true;
      let withinDateRange = true;
      if (selectedDates?.[0] && selectedDates[1]) {
        const start = new Date(selectedDates[0]);
        const end = new Date(selectedDates[1]);
        withinDateRange = date >= start && date <= end;
      }
      const matchesYear = !selectedYear || pt.date.slice(0, 4) === selectedYear;
      return matchesCity && matchesDay && matchesAreaType && mathcesMonth && withinDateRange && matchesYear;
    });

    // Sort by date chronologically for animation
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [geoData, selectedCity, selectedDay, selectedDates, selectedAreaType, selectedMonth, selectedYear]);

  // points excluded only by the year filter, shown as a faint backdrop instead of hidden
  const dimmedPoints = useMemo(() => {
    if (!selectedYear) return [];
    return geoData.filter(pt => pt.date.slice(0, 4) !== selectedYear);
  }, [geoData, selectedYear]);

  const clearAnimationTimeouts = useCallback(() => {
    animationTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    animationTimeoutRef.current = [];
  }, []);


  const createGradients = useCallback(
    (defs: d3.Selection<SVGDefsElement, unknown, null, undefined>) => {
      // Clear existing gradients
      GRADIENT_CONFIGS.forEach((config) => {
        defs.select(`#${config.id}`).remove();
      });

      // Create new gradients
      GRADIENT_CONFIGS.forEach((config) => {
        const gradient = defs
          .append("radialGradient")
          .attr("id", config.id)
          .attr("cx", "50%")
          .attr("cy", "50%")
          .attr("r", "50%")
          .attr("fx", "50%")
          .attr("fy", "50%");

        gradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", config.color)
          .attr("stop-opacity", config.opacity);

        gradient
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", config.color)
          .attr("stop-opacity", 0);
      });
    },
    []
  );
  const getRingFill = useCallback((d: any) => {
    if (focusedPt !== null && visiblePoints.indexOf(d) === focusedPt) return `url(#clicked)`;
    if (showSatellite) return `url(#satellite)`;
    return `url(#static)`;
  }, [focusedPt, visiblePoints, showSatellite]);

  const getCenterFill = useCallback((d: any) => {
    if (visiblePoints.indexOf(d) === focusedPt) return CENTER_FILL.clicked
    else if (showSatellite) {
      return CENTER_FILL.satellite
    } else return CENTER_FILL.static;
  }, [focusedPt, visiblePoints, showSatellite])

  const getDotOpacity = useCallback((d: any) => {
    if (focusedPt === null) return 1.0
    if (focusedPt === visiblePoints.indexOf(d)) return 1.0
    else if (showSatellite) return 0.6
    return 0.5
  }, [focusedPt, visiblePoints, showSatellite])

  const getDotSize = useCallback((d: any) => {
    const dotsize = Math.min(14, Math.max(10, 5 * (mapZoom - 8.5)));
    if (focusedPt === null) return dotsize;
    if (focusedPt === visiblePoints.indexOf(d)) return dotsize * 1.5
    else if (showSatellite) return dotsize
    return dotsize * 0.8
  }, [focusedPt, visiblePoints, showSatellite])

  // CartoDB layer
  useEffect(() => {
    if (!mapInstance) return;

    if (!TypeWriterFinished || !mapInstance || !mapInstance.getPane) return;

    // Remove existing CartoDB layer
    if (cartodbLayerRef.current) {
      mapInstance.removeLayer(cartodbLayerRef.current);
      cartodbLayerRef.current = null;
    }
    cartodbLayerRef.current = (window as any).L.tileLayer(CARTODB_TILES_URL,
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://carto.com/attribution">CartoDB</a> | Imagery ©️ Planet Labs PBC, 27 September 2025 &copy;',
        minZoom: 0,
        maxZoom: 18
      }
    );
    if (mapInstance.getPane("tilePane")) {
      cartodbLayerRef.current.addTo(mapInstance);
    }

    return () => {
      if (cartodbLayerRef.current && mapInstance.hasLayer(cartodbLayerRef.current)) {
        mapInstance.removeLayer(cartodbLayerRef.current);
      }
    };
  }, [mapInstance]);

  useEffect(() => {
    if (!mapInstance) return
    const tileEle = mapInstance.getPane('tilePane').children[0]
    if (!tileEle) return;
    if (showSatellite) {
      cartodbLayerRef.current.setUrl('');
    } else {
      cartodbLayerRef.current.setUrl(CARTODB_TILES_URL);
    }
  }, [showSatellite])

  //===== DOTS ======
  useEffect(() => {
    const svg = document.querySelector("#map .leaflet-overlay-pane svg") as SVGSVGElement;
    if (!svg) return;

    // Setup SVG groups
    let g: d3.Selection<SVGGElement, unknown, null, undefined> = d3.select(svg).select<SVGGElement>("g");
    const gExisted = !g.empty();
    if (!gExisted) {
      g = d3.select(svg).append("g");
    }

    // figure out whether wedges will be visible this render, before wiping anything, so we
    // know if this is a fresh entry into visibility, a transition out of it, or unchanged
    let willShowWedges = false;
    if (hasAnimated && mapInstance && mapInstance.getBounds) {
      try {
        const precheckBounds = mapInstance.getBounds().pad(0.3);
        for (const d of visiblePoints) {
          if (!d.lat || !d.lon || isNaN(d.lat) || isNaN(d.lon)) continue;
          if (!precheckBounds.contains([d.lat, d.lon])) continue;
          const r = metersToPixelRadius(d.lat, d.lon, MAX_BURST_M / 2);
          if (r <= BLOOM_PX_THRESHOLD) continue;
          const t = Math.min(1, (r - BLOOM_PX_THRESHOLD) / BLOOM_TRANSITION_PX);
          if (t > WEDGE_REVEAL_FRACTION) { willShowWedges = true; break; }
        }
      } catch {
        // mapInstance can be mid-teardown (e.g. React StrictMode's dev-only double-mount
        // remove()s and recreates the Leaflet instance); treat as "can't tell yet" — the
        // effect re-runs once the fresh mapInstance prop settles
      }
    }
    const wasShowingWedges = wedgesShownRef.current;
    wedgesShownRef.current = willShowWedges;

    if (gExisted) {
      if (wasShowingWedges && !willShowWedges) {
        // leaving wedge-visibility: detach the existing wedge dots into a holder outside
        // `g` so the wipe below doesn't just delete them, then fade that holder out
        const oldWedgeDotGroups = g.selectAll<SVGGElement, unknown>(".bloom-group > g").nodes();
        if (oldWedgeDotGroups.length > 0) {
          const fadeHolder = d3.select(svg).append("g")
            .attr("class", "wedge-fadeout-holder")
            .style("pointer-events", "none");
          oldWedgeDotGroups.forEach((node) => fadeHolder.node()!.appendChild(node));
          fadeHolder.selectAll("g")
            .style("transition", "opacity 300ms ease")
            .style("opacity", 0);
          setTimeout(() => { fadeHolder.remove(); }, 320);
        }
      }
      g.selectAll("*").remove();
    }

    let defs: d3.Selection<SVGDefsElement, unknown, null, undefined> = d3.select(svg).select<SVGDefsElement>("defs");
    if (defs.empty()) {
      defs = d3.select(svg).append("defs");
    }

    createGradients(defs);

    // Setup projection
    const leafletProjection = {
      stream: (stream: any) => ({
        point: (x: number, y: number) => {
          const [px, py] = projectPts(x, y);
          if (x !== -10 && y !== -10) stream.point(px, py);
        },
        sphere: () => stream.sphere?.(),
        lineStart: () => stream.lineStart?.(),
        lineEnd: () => stream.lineEnd?.(),
        polygonStart: () => stream.polygonStart?.(),
        polygonEnd: () => stream.polygonEnd?.(),
      }),
    };
    const geoPath = d3.geoPath().projection(leafletProjection as any);
    let background = g.select<SVGRectElement>("rect.background");

    if (background.empty()) {
      // reset dot selection, colors, opacty when clicked on background
      background = g.insert("rect", ":first-child")
        .attr("class", "background")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", svg.clientWidth)
        .attr("height", svg.clientHeight)
        .style("fill", "transparent")
        .style("pointer-events", "all")
        .on("click", () => {
          //reset
          setFocusedPt(null);
          getMapDetails(null)
        });
    }

    // Render function
    const renderMap = (borderGeoJson: any) => {
      // Always create border elements
      const borders = g.selectAll("path.border")
        .data(borderGeoJson.features)
        .enter()
        .append("path")
        .attr("class", "border")
        .attr("d", geoPath as any)
        .attr("stroke", "#9994")
        .attr("stroke-width", TypeWriterFinished ? 0 : 2.3)
        .attr("fill", "none")
        .style("opacity", hasAnimated ? 1 : 0);

      // faint backdrop for points excluded only by the year filter — vector-map only; in
      // satellite mode the excluded points are just left out entirely
      // rendered as one group so overlapping dots don't compound their opacity
      if (dimmedPoints.length > 0 && !showSatellite) {
        const dimmedGroup = g.append("g")
          .attr("class", "dimmed-group")
          .style("opacity", hasAnimated ? 0.28 : 0);

        dimmedGroup.selectAll("circle.dimmed-point")
          .data(dimmedPoints)
          .enter()
          .append("circle")
          .attr("class", "dimmed-point")
          .attr("cx", (d) => projectPts(d.lon, d.lat)[0])
          .attr("cy", (d) => projectPts(d.lon, d.lat)[1])
          .attr("r", (d) => getDotSize(d) * 0.2);
      }

      if (!visiblePoints || visiblePoints.length === 0) return;

      // estimated coverage-area bloom: past a zoom threshold, a point expands into
      // its estimated wedge-dispersal footprint. The circle boundary is cheap and
      // drawn immediately; the 116-point wedge scatter is the expensive part, so it's
      // deferred one frame so the core dots still reposition immediately on zoomend
      // instead of momentarily flashing at their stale pre-zoom coordinates.
      if (wedgeFrameRef.current) {
        clearTimeout(wedgeFrameRef.current);
        wedgeFrameRef.current = null;
      }

      let safeBounds: any = null;
      if (hasAnimated && mapInstance && mapInstance.getBounds) {
        try { safeBounds = mapInstance.getBounds().pad(0.3); } catch { safeBounds = null; }
      }
      if (safeBounds) {
        const bounds = safeBounds;
        const bloomGroup = g.append("g").attr("class", "bloom-group").style("pointer-events", "none");
        const wedgeColor = showSatellite ? "#ff3b3b" : "#eee";
        const wedgeJobs: Array<() => void> = [];
        // fresh entry into visibility fades in once; if wedges were already visible last
        // render (e.g. this render was triggered by a pan, or a zoom between the two
        // "wedges visible" levels), skip the animation and just set the target opacity
        const isFreshEntry = willShowWedges && !wasShowingWedges;

        visiblePoints.forEach((d) => {
          if (!d.lat || !d.lon || isNaN(d.lat) || isNaN(d.lon)) return;
          if (!bounds.contains([d.lat, d.lon])) return;

          const burstRadiusPx = metersToPixelRadius(d.lat, d.lon, MAX_BURST_M / 2);
          if (burstRadiusPx <= BLOOM_PX_THRESHOLD) return;

          const bloomT = Math.min(1, (burstRadiusPx - BLOOM_PX_THRESHOLD) / BLOOM_TRANSITION_PX);
          // scale line/dot weight to bloomT (the same 0-1 bloom-in progress used for the
          // circle's own size), not to raw pixel radius — bloomT is already fully at 1 by
          // the second-to-last zoom, so tying weight to it keeps the last two zooms at
          // identical thickness instead of the earlier one reading thinner
          const weightScale = bloomT;

          {
            const [olat, olon] = [d.lat, d.lon];
            const [cx, cy] = projectPts(olon, olat);
            const r = burstRadiusPx * bloomT + 2;

            bloomGroup.append("ellipse")
              .attr("cx", cx).attr("cy", cy)
              .attr("rx", r).attr("ry", r)
              .attr("fill", "rgba(196,33,0,0.16)")
              .attr("stroke", "rgba(255,91,61,0.65)")
              .attr("stroke-width", Math.max(0.6, 1.2 * weightScale))
              .attr("stroke-dasharray", "4,3")
              .style("pointer-events", "all")
              .style("cursor", "pointer")
              .on("mouseover", function () {
                if (!hasAnimated) return;
                d3.select(this).attr("fill", "rgba(255,91,61,0.3)").attr("stroke", "rgba(255,161,140,0.9)");
                if (!isMobile && focusedPt === null) getMapDetails(d);
              })
              .on("mouseout", function () {
                if (!hasAnimated) return;
                d3.select(this).transition().duration(200)
                  .attr("fill", "rgba(196,33,0,0.16)")
                  .attr("stroke", "rgba(255,91,61,0.65)");
              })
              .on("click", function (e) {
                e.stopPropagation();
                if (!hasAnimated) return;
                const index = visiblePoints.indexOf(d);
                // functional update: rapid clicks on different points, fired before the
                // effect has re-run and rebuilt these handlers with a fresh closure, would
                // otherwise all read the SAME stale `focusedPt` snapshot and could toggle
                // the wrong way, leaving the map stuck focused with no way back to "none
                // selected" — the updater form always sees the true latest value
                setFocusedPt(prev => prev === index ? null : index);
                getMapDetails(d, null, true);
              });

            if (bloomT > WEDGE_REVEAL_FRACTION) {
              const wedgeAlpha = Math.min(1, (bloomT - WEDGE_REVEAL_FRACTION) / (1 - WEDGE_REVEAL_FRACTION)) * WEDGE_MAX_OPACITY;
              const wedgeRadius = Math.max(0.5, 1.15 * weightScale);
              wedgeJobs.push(() => {
                const wedgeGroup = bloomGroup.append("g")
                  .style("opacity", isFreshEntry ? 0 : wedgeAlpha)
                  .style("transition", isFreshEntry ? "opacity 450ms ease 400ms" : "none");
                getWedgeOffsets(d.code, 0).forEach(([wx, wy]) => {
                  const [wlat, wlon] = offsetLatLon(olat, olon, wx, wy);
                  const [wpx, wpy] = projectPts(wlon, wlat);
                  wedgeGroup.append("circle")
                    .attr("cx", wpx).attr("cy", wpy)
                    .attr("r", wedgeRadius)
                    .attr("fill", wedgeColor);
                });
                if (isFreshEntry) {
                  // set at 0 opacity above, then flip to the target on the next tick so the
                  // browser has painted the 0-state first and the CSS transition actually runs,
                  // instead of jumping straight to full opacity
                  setTimeout(() => { wedgeGroup.style("opacity", wedgeAlpha); }, 20);
                }
              });
            }
          }
        });

        setAnyWedgesVisible(willShowWedges);
        if (wedgeJobs.length > 0) {
          wedgeFrameRef.current = setTimeout(() => {
            wedgeJobs.forEach((job) => job());
            wedgeFrameRef.current = null;
          }, 0);
        }
      } else {
        setAnyWedgesVisible(false);
      }

      // Create all circles
      const interactionCircles = g.selectAll("circle.interaction-layer")
        .data(visiblePoints)
        .enter()
        .append("circle")
        .attr("class", "map-data-points map-data-points-hover interaction-layer")
        .attr("cx", (d) => projectPts(d.lon, d.lat)[0])
        .attr("cy", (d) => projectPts(d.lon, d.lat)[1])
        .attr("r", (d) => getDotSize(d))
        .style("pointer-events", "all")
        .attr("fill", (d) => getRingFill(d))
        .style("opacity", d => hasAnimated ? getDotOpacity(d) : 0)
        .on("mouseover", function (event, d) {
          if (!hasAnimated) return;
          // mouse hover debounce
          // if (mouseoutTimeout) {
          //   clearTimeout(mouseoutTimeout);
          //   mouseoutTimeout = null;
          // }
          // Debounce mouseover
          // mouseoverTimeout = setTimeout(() => {
          d3.select(this)
            .attr("fill", "url(#hover)")
            .attr("r", d => getDotSize(d) * 1.4);
          // skip the hover preview on mobile: touch devices synthesize this event on tap,
          // and it can race with (or replace) the click event, leaving the short preview
          // stuck instead of the full card
          if (!isMobile && focusedPt === null) getMapDetails(d);
          mouseoverTimeout = null;
          // }, HOVER_DELAY);
        })
        .on("click", function (e, d) {
          e.stopPropagation();
          if (hasAnimated) {
            const index = visiblePoints.indexOf(d);
            setFocusedPt(prev => prev === index ? null : index);
            getMapDetails(d, null, true);
          }
        })
        .on("mouseout", function (event, d) {
          if (!hasAnimated) return;
          d3.select(this)
            .transition()
            .duration(200)
            .attr("fill", getRingFill(d))
            .attr("r", d => getDotSize(d));
        });

      // move the bloom (coverage-area circle + wedge scatter) above the hover flare so
      // the flare doesn't sit on top of and obscure the fragments; the solid center dot
      // (created next) still ends up on top of everything, staying the clickable point
      g.select(".bloom-group").raise();

      const centerCircles = g.selectAll("circle.incident-point")
        .data(visiblePoints)
        .enter()
        .append("circle")
        .attr("class", "map-data-points incident-point")
        .attr("cx", (d) => projectPts(d.lon, d.lat)[0])
        .attr("cy", (d) => projectPts(d.lon, d.lat)[1])
        .attr("r", d => hasAnimated ? getDotSize(d) * 0.2 : 0)
        .attr("fill", d => getCenterFill(d))
        .attr("stroke", showSatellite ? "#2a0000" : "none")
        .attr("stroke-width", showSatellite ? 0.75 : 0)
        .style("opacity", (d) => hasAnimated ? getDotOpacity(d) : 0);

      // animate if we haven't animated before
      if (!hasAnimated) {
        visiblePoints.forEach((_, index) => {
          const timeout = setTimeout(() => {
            // interaction circle
            d3.select(interactionCircles.nodes()[index])
              .attr("r", getDotSize(1))
              .transition()
              .duration(200)
              .style("opacity", 1);

            // center circle
            d3.select(centerCircles.nodes()[index])
              .attr("r", mapZoom - 8)
              .transition()
              .duration(200)
              .style("opacity", 1);

            // If last dot, show border
            if (index === visiblePoints.length - 1) {
              clearAnimationTimeouts();
              borders.transition()
                .duration(BORDER_DELAY)
                .style("opacity", 1);
              setTimeout(() => {
                setHasAnimated(true);
                sessionStorage.setItem("mapDotsAnimated", "true");
              }, BORDER_DELAY);
            }
          }, index * DOT_ANIMATION_DELAY);
          animationTimeoutRef.current.push(timeout);
        }
        );
      }
    };

    // Load border data or use cached version
    if (borderDataRef.current) {
      renderMap(borderDataRef.current);
    } else {
      fetch("/data/LBN_extendedBorder.geojson")
        .then(res => res.json())
        .then(borderGeoJson => {
          borderDataRef.current = borderGeoJson; // Cache the data
          renderMap(borderGeoJson);
        })
        .catch(err => console.error("Failed to load border data:", err));
    }
  }, [
    mapZoom,
    leafletCenter,
    showSatellite,
    hasAnimated,
    visiblePoints,
    dimmedPoints,
    selectedYear,
    TypeWriterFinished,
    focusedPt,
    isMobile
  ]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearAnimationTimeouts();
      if (wedgeFrameRef.current) clearTimeout(wedgeFrameRef.current);
    };
  }, [clearAnimationTimeouts]);

  return (
    <div
      className={`fixed z-[1010] pointer-events-none transition-opacity duration-300 ${anyWedgesVisible ? "opacity-100" : "opacity-0"} ${isMobile ? "right-2 top-1/2 -translate-y-1/2" : "bottom-16"}`}
      style={isMobile ? undefined : { left: legendLeftBound !== null ? legendLeftBound / 2 : "50%", transform: "translateX(-50%)" }}
    >
      <div
        className={`flex border-white/15 bg-black/70 rounded ${isMobile ? "flex-col gap-3 border-l border-r px-2 py-3 max-w-[38vw]" : "items-center gap-7 border-t border-b px-6 py-2"}`}
        style={{ fontFamily: "Inconsolata, monospace" }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#ff5b3d" }} />
          <span className={`text-[0.7rem] text-white/70 ${isMobile ? "" : "whitespace-nowrap"}`}>incident marker</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
            style={{ border: "1.5px dashed #ff5b3d" }}
          />
          <span className={`text-[0.7rem] text-white/70 ${isMobile ? "" : "whitespace-nowrap"}`}>estimated coverage area — up to 190m across</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-[5px] h-[5px] rounded-full flex-shrink-0 bg-white" />
          <span className={`text-[0.7rem] text-white/70 ${isMobile ? "" : "whitespace-nowrap"}`}>one of 116 felt wedges (illustrative scatter)</span>
        </div>
      </div>
    </div>
  );
}