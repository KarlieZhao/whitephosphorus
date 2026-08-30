import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { geoDataProps } from "./datasource";
import { TypewriterProps } from "./header";
import { MONTHS } from "./datasource";
import { isMobileDevice } from "./mobile-detector";
// MapLibre needs its own stylesheet to position the canvas; imported here rather than
// per page so it travels with the component that actually renders the basemap
import "maplibre-gl/dist/maplibre-gl.css";
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
  /**
   * Which basemap to draw under the dots. Defaults to OpenFreeMap's vector dark style,
   * rendered by MapLibre and handed to Leaflet as an ordinary tilePane layer, restyled
   * below for this map. The "carto" path is the raster basemap the site used until CARTO
   * began stamping "API KEY REQUIRED" across its free tiles; it is kept only as a
   * fallback and will show that watermark if used.
   */
  basemap?: BasemapId;
  /** ids from OVERLAYS that should currently be drawn; everything else stays hidden */
  overlayLayers?: string[];
};

export type BasemapId = "carto" | "openfreemap";

const CARTODB_TILES_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
const OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark"
const ENGLISH_LABEL: any = [
  "coalesce",
  ["get", "name:en"],
  ["get", "name:latin"],
  ["get", "name_en"],
  ["get", "name"],
];

/**
 * The road web and the regional boundaries fade in with zoom instead of sitting at full
 * strength everywhere. Wide out they are barely-there texture — enough that the dashed
 * district lines are not left hanging in empty space, but not enough to compete with the
 * strike markers — and they come up to full weight as the reader goes closer.
 *
 * This is a separate property from line-width, so it may carry its own zoom interpolate:
 * MapLibre's one-interpolate rule applies per expression, not per layer.
 *
 * The national border is deliberately left out of this — it is the one line that should
 * be legible at every zoom.
 */
const LINE_FADE_IN: any = ["interpolate", ["linear"], ["zoom"], 10, 0.6, 13, 0.85, 15, 1];
/**
 * Administrative lines get their own, much shallower fade. They are the only thing giving
 * the wide view any structure — roads and villages are deliberately held back until you
 * zoom in — so dimming them to 0.6 alongside the roads left the far view nearly empty.
 */
const BOUNDARY_FADE_IN: any = ["interpolate", ["linear"], ["zoom"], 10, 0.92, 13, 0.97, 15, 1];
const FADES_IN = (id: string) =>
  id.startsWith("highway_") || id.startsWith("railway") || id === "boundary_state";

/**
 * Layers added on top of the upstream style.
 *
 * The boundary source carries admin_level 2 through 8 here. 2 is the national border,
 * already drawn; 4 covers the governorates (South, Nabatieh) and 5-7 the districts —
 * Sour, Bint Jbeil, Marjaayoun, Nabatieh, Hasbaya. 8 is municipality level, too fine to
 * be anything but noise at these zooms, so it is left out. Note the tiles carry no names
 * on boundary features, so these are lines only; the districts cannot be labelled from
 * this source.
 */
/**
 * Optional reference layers, off by default and toggled from the control panel.
 *
 * Drawn as Leaflet GeoJSON rather than as MapLibre style layers. Through the Leaflet
 * plugin, maplibre-gl v6's introspection is unusable — getLayer() and getStyle() report
 * nothing for layers that are demonstrably on screen, and style._loaded stays false on a
 * map that is rendering — so there is no dependable way to add sources at the right moment
 * or to confirm a visibility toggle landed. Leaflet owns the map object outright, and
 * these are 55 features in total, so the cost of an SVG overlay is nil.
 *
 * Geometry is the project's own QGIS work, exported to GeoJSON under public/data/layers.
 */
export const OVERLAYS: {
  id: string;
  label: string;
  note: string;
  files: { url: string; style: (feature: any) => any }[];
}[] = [
  {
    id: "security-zone",
    label: "Security zone",
    note: "Israeli-declared buffer zone inside southern Lebanon",
    files: [{
      url: "/data/layers/security-zone.geojson",
      style: () => ({
        // the zone covers most of the frame, so the fill has to stay far lighter than it
        // would need to be on a smaller shape — at 0.13 it swallowed the basemap whole
        color: "#e8563a", weight: 1, opacity: 0.8,
        fillColor: "#db2f0f", fillOpacity: 0.07,
      }),
    }],
  },
  {
    id: "blue-line",
    label: "Blue Line",
    note: "UN withdrawal line, 2000",
    files: [{
      url: "/data/layers/blue-line.geojson",
      style: () => ({ color: "#4aa3ff", weight: 1.8, opacity: 0.9, fill: false }),
    }],
  },
  {
    id: "rivers",
    label: "Rivers",
    note: "watercourses and Lake Qaraoun",
    files: [
      {
        url: "/data/layers/qaraoun.geojson",
        style: () => ({ color: "#3f88ad", weight: 0.8, opacity: 0.8, fillColor: "#2c5f7d", fillOpacity: 0.75 }),
      },
      {
        url: "/data/layers/rivers.geojson",
        // streams are the finer half of the set, so they stay a step under the rivers
        style: (f: any) => ({
          color: "#3f88ad",
          weight: f?.properties?.class === "stream" ? 0.8 : 1.5,
          opacity: 0.85,
          fill: false,
        }),
      },
    ],
  },
];

const EXTRA_LAYERS: any[] = [
  {
    // the Israel/Syria line across the Golan is tagged disputed=1 in the tiles; it is
    // drawn finely dotted to read as what it is rather than as a settled border
    id: "boundary_disputed",
    type: "line",
    source: "openmaptiles",
    "source-layer": "boundary",
    filter: [
      "all",
      ["==", ["get", "admin_level"], 2],
      ["==", ["get", "disputed"], 1],
      ["!=", ["get", "maritime"], 1],
    ],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      /**
       * Kept close to the district lines rather than to the national border. Matching the
       * national border's value made this the loudest thing on the map: the same grey
       * reads far stronger dashed than solid, because each dash has two bright ends
       * against the background instead of one continuous stroke. So it sits just above
       * the districts (17%) and well under the national border (29%), at about 60% of the
       * national border's width.
       */
      "line-color": [
        "interpolate", ["linear"], ["zoom"],
        10, "hsl(0,0%,26%)",
        13, "hsl(0,0%,21%)",
        15, "hsl(0,0%,19%)",
      ],
      "line-width": ["interpolate", ["exponential", 1.1], ["zoom"], 3, 0.36, 22, 3.4],
      "line-dasharray": [1, 2.5],
      "line-opacity": BOUNDARY_FADE_IN,
    },
  },
  {
    id: "boundary_district",
    type: "line",
    source: "openmaptiles",
    "source-layer": "boundary",
    filter: [
      "all",
      [">=", ["get", "admin_level"], 5],
      ["<=", ["get", "admin_level"], 7],
      ["!=", ["get", "maritime"], 1],
    ],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      /**
       * Lifted at the wide view only and eased back to the close-in values by z15, the same
       * shape as the national border above — zoomed in the districts are already legible
       * against everything else on screen, and only the empty far view needed the help.
       */
      "line-color": [
        "interpolate", ["linear"], ["zoom"],
        10, "hsl(0,0%,24%)",
        13, "hsl(0,0%,19%)",
        15, "hsl(0,0%,17%)",
      ],
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.05, 15, 0.9],
      "line-dasharray": [2, 3],
      "line-opacity": BOUNDARY_FADE_IN,
    },
  },
];

/**
 * Per-layer corrections applied on top of the kept set.
 *
 * The zoom thresholds thin the labels out when the whole front is in view and let them
 * back in as you go closer, so the far view is not a wall of village names. Note these
 * are MapLibre zooms, which the Leaflet plugin runs one level below Leaflet's own — the
 * map spans Leaflet 11-16, i.e. MapLibre 10-15.
 *
 * `dropMaxzoom` removes the style's upper cut-off on the label layers. Upstream it exists
 * because denser layers take over when you zoom in; we removed those, so without this a
 * name would vanish just as you zoomed close enough to want it.
 */
const BASEMAP_LAYER_TWEAKS: Record<string, {
  minzoom?: number;
  dropMaxzoom?: boolean;
  dropDisputed?: boolean;
  paint?: Record<string, any>;
}> = {
  // dashed rather than solid, and the disputed stretches — the Israel/Syria line across
  // the Golan, which the tiles flag with disputed=1 — get a finer dotted pattern
  /**
   * Solid. Checked against the tiles: the Lebanon/Israel line and the Lebanon/Syria line
   * both carry disputed=0, while the Israel/Syria line across the Golan carries
   * disputed=1 — so excluding disputed here leaves exactly the settled borders solid,
   * and the dashed treatment falls to the boundary_disputed layer alone.
   */
  /**
   * The one line that should carry at every zoom, and especially wide out — it is the
   * frame the whole dataset sits against. Both colour and width are pushed at low zoom
   * and ease back to the close-in values by z15, so the view you already have when
   * zoomed in is unchanged; only the wide view gains weight.
   *
   * Set here rather than upstream because tweak.paint is merged after the global width
   * scaling, so these values win outright.
   */
  "boundary_country_z5-": {
    dropDisputed: true,
    paint: {
      "line-color": [
        "interpolate", ["linear"], ["zoom"],
        10, "hsl(0,0%,40%)",
        13, "hsl(0,0%,33%)",
        15, "hsl(0,0%,29%)",
      ],
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2.15, 13, 2.5, 15, 2.7],
    },
  },
  /**
   * The casings are what the eye actually picks up — the inner fills are already near
   * black, so it is the pale outline either side that draws the road web. Dropped from
   * rgba(60,60,60,.8) to roughly half that.
   */
  highway_major_casing: { paint: { "line-color": "rgba(34,34,34,0.7)" } },
  highway_motorway_casing: { paint: { "line-color": "rgba(38,38,38,0.7)" } },
  highway_major_subtle: { paint: { "line-color": "#1c1c1c" } },
  highway_motorway_subtle: { paint: { "line-color": "#1c1c1c" } },
  highway_minor: { paint: { "line-color": "#141414" } },
  /**
   * Governorate boundaries, a step ABOVE the districts rather than below them.
   *
   * This is also why district outlines looked broken: where a district edge coincides with
   * a governorate edge the tiles carry the segment at admin_level 4 only (verified by
   * decoding the tiles — levels 4, 5 and 6 all appear side by side), so it is drawn here
   * and not by boundary_district. With this layer the fainter of the two, those shared
   * stretches dropped out and the district ring appeared to have gaps in it.
   */
  boundary_state: {
    paint: {
      "line-color": [
        "interpolate", ["linear"], ["zoom"],
        10, "hsl(0,0%,32%)",
        13, "hsl(0,0%,25%)",
        15, "hsl(0,0%,21%)",
      ],
      // 30% thinner than it was at the wide view; colour, not weight, is what puts this
      // above the districts there
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.88, 15, 1.05],
      "line-opacity": BOUNDARY_FADE_IN,
    },
  },
  place_city: { dropMaxzoom: true },
  place_town: { minzoom: 11, dropMaxzoom: true },
  place_village: { minzoom: 12, dropMaxzoom: true },
};

/**
 * Everything upstream draws is kept; what changes is WHEN it appears. Zoomed out the
 * front should read as border, water and a few city names, with roads, villages and land
 * cover arriving as the reader goes closer — rather than the whole road network competing
 * with the strike markers at every zoom.
 *
 * These are MapLibre zooms, which the Leaflet plugin runs one level below Leaflet's own:
 * the map spans Leaflet 11-16, i.e. MapLibre 10-15. So 10 is "always visible here" and 14
 * is "only right at the end". A layer's own minzoom is respected — these only ever push a
 * layer later, never earlier.
 */
const LAYER_MIN_ZOOM: Record<string, number> = {
  /**
   * The road network and the town names stay on at every zoom. They are drawn nearly
   * black upstream (#181818 on a rgb(12,12,12) ground), so they read as texture rather
   * than detail — and without them the dashed district boundaries hang in empty space
   * looking like broken fragments, which is what the wide view suffered from.
   *
   * What actually crowded the close-in view was the finer stuff below, so that is what
   * gets deferred.
   */
  place_village: 12,
  landcover_wood: 13,
  landuse_park: 13,
  landuse_residential: 13,
  water_name: 13,
  // only once you are down on a single place
  highway_path: 14,
  building: 14,
  railway: 14,
  railway_dashline: 14,
  railway_minor: 14,
  railway_minor_dashline: 14,
  railway_transit: 14,
  railway_transit_dashline: 14,
  highway_name_other: 14,
  highway_name_motorway: 14,
  road_oneway: 14,
  road_oneway_opposite: 14,
  place_suburb: 14,
  place_other: 14,
};

/**
 * Dropped outright rather than deferred: no airports or piers in this frame, no ice, and
 * the state labels only restate what the boundaries already show.
 */
/**
 * Every line from the upstream style is drawn at a fraction of its designed width. The
 * style's widths are tuned for a map that is the whole point of the page; here the
 * basemap sits under the strike markers, so at full width the roads and borders compete
 * with them.
 *
 * The fraction shrinks as you zoom in, because the underlying curves climb steeply toward
 * zoom 20 — the country border alone reaches ~9px at our maximum zoom, and a flat
 * multiplier left it heavy exactly where it was worst. Tapering the scale holds every
 * line at roughly two to three pixels across the whole range, while still scaling the
 * expression rather than replacing it, so each layer keeps its relative weighting.
 */
/**
 * Line widths, set per zoom rather than by scaling the style's own curve.
 *
 * The curves upstream are pinned at stops like z3 and z20, far outside the range this map
 * uses (Leaflet 11-16, i.e. MapLibre 10-15), so adjusting their stop values gave almost
 * no control over what actually appears on screen. These are evaluated at each zoom the
 * map can be at, scaled there, and re-emitted as one linear interpolate — which also
 * keeps it to the single zoom-based interpolate MapLibre permits per expression.
 *
 * The scale climbs with zoom: wide out, the whole road web is in view at once and needs
 * to stay faint; zoomed in only a few roads are visible and can hold their weight.
 */
const MAP_ZOOMS = [10, 11, 12, 13, 14, 15];
const widthScaleAt = (z: number) => {
  const t = Math.max(0, Math.min(1, (z - 10) / 5));
  return 0.22 + (0.34 - 0.22) * t;
};

/** evaluate a zoom "interpolate" width expression at one zoom, or null if unreadable */
const evalWidthAt = (w: any, z: number): number | null => {
  if (typeof w === "number") return w;
  if (!Array.isArray(w) || w[0] !== "interpolate") return null;
  const interp = w[1];
  const base = Array.isArray(interp) && interp[0] === "exponential" ? Number(interp[1]) : 1;
  const stops: [number, number][] = [];
  for (let i = 3; i < w.length; i += 2) {
    if (typeof w[i] !== "number" || typeof w[i + 1] !== "number") return null;
    stops.push([w[i], w[i + 1]]);
  }
  if (!stops.length) return null;
  if (z <= stops[0][0]) return stops[0][1];
  if (z >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [z0, v0] = stops[i];
    const [z1, v1] = stops[i + 1];
    if (z >= z0 && z <= z1) {
      const t =
        base === 1
          ? (z - z0) / (z1 - z0)
          : (Math.pow(base, z - z0) - 1) / (Math.pow(base, z1 - z0) - 1);
      return v0 + (v1 - v0) * t;
    }
  }
  return null;
};

const scaleLineWidth = (w: any): any => {
  const stops: number[] = [];
  for (const z of MAP_ZOOMS) {
    const v = evalWidthAt(w, z);
    // anything whose curve cannot be read is left exactly as the style had it
    if (v === null) return w;
    stops.push(z, Number((v * widthScaleAt(z)).toFixed(3)));
  }
  return ["interpolate", ["linear"], ["zoom"], ...stops];
};

const HIDDEN_LAYERS = new Set([
  // rivers are off for now — worth revisiting as a toggle in the control panel rather
  // than as something always on
  "waterway",
  "aeroway-taxiway",
  "aeroway-runway-casing",
  "aeroway-runway",
  "aeroway-area",
  "road_pier",
  "road_area_pier",
  "landcover_ice_shelf",
  "landcover_glacier",
  "place_state",
]);
const CARTO_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://carto.com/attribution">CartoDB</a> | Imagery ©️ Planet Labs PBC, 27 September 2025 &copy;'
/**
 * The full credit, registered by hand.
 *
 * The plugin will also volunteer the basemap's own attribution, but only if the style
 * happens to have loaded by the time Leaflet asks — so it appeared sometimes and not
 * others, and printed twice when it did. The layer is therefore created with
 * attributionControl:false, which silences the plugin entirely, and this single string
 * carries everything: OpenMapTiles and OpenStreetMap are required, the OpenFreeMap credit
 * is requested, and Planet Labs covers the satellite imagery no source knows about.
 */
const MAP_ATTRIBUTION = '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | Imagery ©️ Planet Labs PBC, 27 September 2025 &copy;'


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
  basemap = "openfreemap",
  overlayLayers,
}: VectorMapProps) {
  const borderDataRef = useRef<any>(null);
  const cartodbLayerRef = useRef<any>(null);
  // read inside the effect's async block, which may resolve after another toggle
  const overlayLayersRef = useRef<string[] | undefined>(overlayLayers);
  overlayLayersRef.current = overlayLayers;
  /** GeoJSON already fetched, so toggling a layer off and on again costs nothing */
  const overlayDataRef = useRef<Record<string, any>>({});
  /** the Leaflet layers currently on the map, by overlay id */
  const overlayLayerRef = useRef<Record<string, any[]>>({});

  /**
   * Reference overlays live in their own Leaflet pane between the basemap and the dots, so
   * they never cover an incident and are never covered by the basemap's own labels.
   */
  useEffect(() => {
    if (!mapInstance) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default as any;
      if (cancelled || !mapInstance.getPane) return;
      if (!mapInstance.getPane("wpOverlays")) {
        const pane = mapInstance.createPane("wpOverlays");
        // between tilePane (200) and overlayPane (400), where the incident dots are drawn
        pane.style.zIndex = "250";
        pane.style.pointerEvents = "none";
      }

      for (const o of OVERLAYS) {
        const wanted = !!overlayLayers?.includes(o.id);
        const present = !!overlayLayerRef.current[o.id];
        if (wanted === present) continue;

        if (!wanted) {
          for (const lyr of overlayLayerRef.current[o.id]) mapInstance.removeLayer(lyr);
          delete overlayLayerRef.current[o.id];
          continue;
        }

        const added: any[] = [];
        for (const file of o.files) {
          if (!overlayDataRef.current[file.url]) {
            overlayDataRef.current[file.url] = await fetch(file.url)
              .then((r) => r.json())
              .catch((e) => { console.error("[map] overlay failed to load", file.url, e); return null; });
          }
          const data = overlayDataRef.current[file.url];
          if (cancelled || !data) continue;
          const lyr = L.geoJSON(data, {
            pane: "wpOverlays",
            interactive: false,
            style: file.style,
          });
          lyr.addTo(mapInstance);
          added.push(lyr);
        }
        // a toggle-off during the await would otherwise leave the layer stranded on the map
        if (cancelled || !overlayLayersRef.current?.includes(o.id)) {
          for (const lyr of added) mapInstance.removeLayer(lyr);
          continue;
        }
        overlayLayerRef.current[o.id] = added;
      }
    })();

    return () => { cancelled = true; };
  }, [mapInstance, overlayLayers]);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);
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
      const matchesCity = !selectedCity?.length || selectedCity.includes(pt.town);
      const matchesAreaType = !selectedAreaType?.length || selectedAreaType.includes(pt.landscape);
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

  /**
   * Everything the current filters exclude, shown as a faint backdrop instead of vanishing.
   *
   * This used to key off the year alone, so filtering by year left the other years showing
   * faintly while filtering by landscape or town made the excluded points disappear
   * outright — the same action giving two different answers. It is now the complement of
   * whatever the map is drawing, whichever filters produced it.
   */
  const dimmedPoints = useMemo(() => {
    const anyFilter =
      !!selectedYear ||
      !!selectedCity?.length ||
      !!selectedAreaType?.length ||
      selectedMonth != null ||
      selectedDay !== -1 ||
      !!(selectedDates?.[0] && selectedDates?.[1]);
    if (!anyFilter) return [];
    const shown = new Set(visiblePoints);
    // the not-yet-geolocated entries carry no coordinates and cannot be placed
    return geoData.filter(pt => !shown.has(pt) && pt.lat != null && pt.lon != null);
  }, [geoData, visiblePoints, selectedYear, selectedCity, selectedAreaType, selectedMonth, selectedDay, selectedDates]);

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

  // Basemap layer, drawn under the dots
  useEffect(() => {
    if (!mapInstance) return;

    if (!TypeWriterFinished || !mapInstance || !mapInstance.getPane) return;

    // Remove existing basemap layer
    if (cartodbLayerRef.current) {
      mapInstance.removeLayer(cartodbLayerRef.current);
      cartodbLayerRef.current = null;
    }

    let cancelled = false;

    if (basemap === "openfreemap") {
      /**
       * Loaded dynamically for two reasons: maplibre-gl v6 ships ESM only, so the
       * plugin's CommonJS build cannot require it; and this keeps the whole vector
       * renderer out of the bundle for any page still on the raster basemap.
       */
      Promise.all([
        import("maplibre-gl"),
        import("@maplibre/maplibre-gl-leaflet"),
        fetch(OPENFREEMAP_STYLE_URL)
          .then((r) => r.json())
          .then((style) => {
            const kept = style.layers
              .filter((l: any) => !HIDDEN_LAYERS.has(l.id))
              .map((l: any) => {
                const deferTo = LAYER_MIN_ZOOM[l.id];
                const tweak = BASEMAP_LAYER_TWEAKS[l.id];
                const out = { ...l };
                // every label in English, whatever the upstream style asked for
                if (out.layout && out.layout["text-field"]) {
                  out.layout = { ...out.layout, "text-field": ENGLISH_LABEL };
                }
                /**
                 * No boundary layer draws its offshore half. Every admin level carries a
                 * maritime extent — the country lines, but the governorates too — and out
                 * at sea they read as a dotted line floating with nothing attached to it.
                 * Done here for the whole source rather than layer by layer, because
                 * doing it per layer is exactly how boundary_state was missed.
                 */
                if (out["source-layer"] === "boundary") {
                  out.filter = ["all", out.filter, ["!=", ["get", "maritime"], 1]];
                }
                // only ever push a layer later than the style already had it
                if (deferTo !== undefined) out.minzoom = Math.max(out.minzoom ?? 0, deferTo);
                if (out.type === "line" && out.paint && out.paint["line-width"] !== undefined) {
                  out.paint = {
                    ...out.paint,
                    "line-width": scaleLineWidth(out.paint["line-width"]),
                  };
                }
                if (out.type === "line" && FADES_IN(out.id)) {
                  out.paint = { ...out.paint, "line-opacity": LINE_FADE_IN };
                }
                if (!tweak) return out;
                if (tweak.minzoom !== undefined) out.minzoom = Math.max(out.minzoom ?? 0, tweak.minzoom);
                if (tweak.dropMaxzoom) delete out.maxzoom;
                if (tweak.dropDisputed) {
                  out.filter = ["all", out.filter, ["!=", ["get", "disputed"], 1]];
                }
                if (tweak.paint) out.paint = { ...out.paint, ...tweak.paint };
                return out;
              });

            /**
             * Draw order matters: the added lines and river names go in ahead of the
             * place labels, so a settlement name is never overdrawn by a boundary.
             */
            const firstLabel = kept.findIndex((l: any) => l.id.startsWith("place_"));
            const at = firstLabel === -1 ? kept.length : firstLabel;
            return {
              ...style,
              layers: [...kept.slice(0, at), ...EXTRA_LAYERS, ...kept.slice(at)],
            };
          })
          // if the style cannot be fetched, fall back to the full one by url
          .catch(() => OPENFREEMAP_STYLE_URL),
      ])
        .then(([maplibre, mod, styleSpec]) => {
          if (cancelled || !mapInstance.getPane || !mapInstance.getPane("tilePane")) return;
          /**
           * MapLibre finds its web worker from `import.meta.url`. Inside a Next bundle
           * that is not an http(s) url, so its locator returns an empty string and
           * `new Worker("")` resolves to the page itself — the browser then refuses it
           * ("disallowed MIME type text/html") and, since the worker does all vector-tile
           * parsing, the map renders nothing at all. Pointing it at a copy served from
           * /public fixes it; package.json refreshes that copy on dev and build so it
           * cannot drift from the installed version.
           */
          if (typeof (maplibre as any).setWorkerUrl === "function") {
            (maplibre as any).setWorkerUrl("/maplibre-gl-worker.mjs");
          }
          const maplibreGL = (mod as any).default ?? (mod as any).maplibreGL;
          const layer = maplibreGL({
            style: styleSpec,
            // the dots are drawn by d3 into Leaflet's overlay pane, so the basemap has to
            // stay in the tile pane beneath them
            pane: "tilePane",
            interactive: false,
            // silences the plugin's own, race-dependent attribution; see MAP_ATTRIBUTION
            attributionControl: false,
          });
          cartodbLayerRef.current = layer;
          layer.addTo(mapInstance);
          /**
           * Registered straight with Leaflet's control, which does not depend on the
           * plugin honouring anything or on the style having loaded yet.
           */
          if (mapInstance.attributionControl) {
            mapInstance.attributionControl.addAttribution(MAP_ATTRIBUTION);
          }

          /**
           * The plugin sizes its container exactly once, in _initContainer, from Leaflet's
           * map size — and thereafter only on Leaflet "resize"/"zoomend" events. If the
           * page has not laid out when the layer is added, that first measurement is 0x0
           * and the container stays collapsed forever, so MapLibre renders into nothing
           * and the map is simply black. Raster tiles never hit this: they position
           * themselves per-tile and never consult the map size.
           *
           * invalidateSize() alone is not enough — it is a no-op when Leaflet's cached
           * size already matches the container — so a collapsed layer is re-measured
           * directly. A ResizeObserver drives it because the collapse is a race: the
           * container can read zero one frame and be correct the next.
           */
          const syncLayerSize = () => {
            const el = mapInstance.getContainer ? mapInstance.getContainer() : null;
            if (!el || !el.clientWidth || !el.clientHeight) return false;
            mapInstance.invalidateSize({ animate: false, pan: false });
            const lyr: any = cartodbLayerRef.current;
            if (lyr && lyr._container && parseInt(lyr._container.style.width || "0", 10) <= 0) {
              if (typeof lyr._resizeContainer === "function") lyr._resizeContainer();
              if (typeof lyr._update === "function") lyr._update();
            }
            return true;
          };

          syncLayerSize();
          const el = mapInstance.getContainer ? mapInstance.getContainer() : null;
          if (el && typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(() => syncLayerSize());
            ro.observe(el);
            resizeObserverRef.current = ro;
          }
        })
        .catch((e) => console.error("[map] vector basemap failed to load", e));
      return () => {
        cancelled = true;
        if (mapInstance.attributionControl) {
          mapInstance.attributionControl.removeAttribution(MAP_ATTRIBUTION);
        }
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
        }
        if (cartodbLayerRef.current && mapInstance.hasLayer(cartodbLayerRef.current)) {
          mapInstance.removeLayer(cartodbLayerRef.current);
        }
      };
    }

    {
      cartodbLayerRef.current = (window as any).L.tileLayer(CARTODB_TILES_URL, {
        attribution: CARTO_ATTRIBUTION,
        minZoom: 0,
        maxZoom: 18,
      });
    }

    if (mapInstance.getPane("tilePane")) {
      cartodbLayerRef.current.addTo(mapInstance);
    }

    return () => {
      if (cartodbLayerRef.current && mapInstance.hasLayer(cartodbLayerRef.current)) {
        mapInstance.removeLayer(cartodbLayerRef.current);
      }
    };
  }, [mapInstance, basemap]);

  useEffect(() => {
    if (!mapInstance) return
    const tileEle = mapInstance.getPane('tilePane').children[0]
    if (!tileEle) return;
    const layer = cartodbLayerRef.current;
    if (!layer) return;
    if (basemap === "openfreemap") {
      // blanking the url is a raster trick and has no equivalent here, so the whole
      // canvas is hidden instead while the satellite imagery shows through
      const el = typeof layer.getContainer === "function" ? layer.getContainer() : null;
      if (el) el.style.display = showSatellite ? "none" : "";
    } else if (showSatellite) {
      layer.setUrl('');
    } else {
      layer.setUrl(CARTODB_TILES_URL);
    }
  }, [showSatellite, basemap])

  //===== DOTS ======
  useEffect(() => {
    const svg = document.querySelector("#map .leaflet-overlay-pane svg") as SVGSVGElement;
    if (!svg) return;

    // mobile screens are smaller and zoomed further out on average, so the bloom feature
    // (coverage circle + felt-wedge scatter) is tuned to appear one zoom level earlier
    // there (14) than on desktop (15) — see BLOOM_PX_THRESHOLD's comment for how the
    // px-radius-per-zoom values were derived
    const bloomPxThreshold = isMobile ? 8 : BLOOM_PX_THRESHOLD;
    const bloomTransitionPx = isMobile ? 3 : BLOOM_TRANSITION_PX;

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
          if (r <= bloomPxThreshold) continue;
          const t = Math.min(1, (r - bloomPxThreshold) / bloomTransitionPx);
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
          if (burstRadiusPx <= bloomPxThreshold) return;

          const bloomT = Math.min(1, (burstRadiusPx - bloomPxThreshold) / bloomTransitionPx);
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
      className={`fixed z-[1010] pointer-events-none transition-opacity duration-300 ${anyWedgesVisible ? "opacity-100" : "opacity-0"} ${isMobile ? "right-2 bottom-24" : "bottom-16"}`}
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