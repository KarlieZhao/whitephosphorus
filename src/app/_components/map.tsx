import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { geoDataProps } from "./datasource";
import { TypewriterProps } from "./header";
import { MONTHS } from "./datasource";
type VectorMapProps = geoDataProps & TypewriterProps & {
  getMapDetails: (point: any | null, arg?: any, clicked?: boolean) => void;
  mapZoom: number;
  leafletCenter: [number, number];
  mapInstance: any;
  showSatellite: boolean;
  TypeWriterFinished?: boolean;
};

const GRADIENTS = {
  residential: "residential",
  residential_hover: "residential_hover",

  cultivate: "cultivate",
  cultivate_hover: "cultivate_hover",

  nature: "nature",
  nature_hover: "nature_hover",

  bg: "bgGradient"
} as const;

const GRADIENT_CONFIGS = [
  // { id: GRADIENTS.residential, color: "#961E0699" },
  // { id: GRADIENTS.residential_hover, color: "#c42100" },

  // { id: GRADIENTS.cultivate, color: "#DFC6C266" },
  // { id: GRADIENTS.cultivate_hover, color: "#DFC6C299" },

  // { id: GRADIENTS.nature, color: "#4a4a4a99" },
  // { id: GRADIENTS.nature_hover, color: "#8D948277" },

  // { id: GRADIENTS.bg, color: "#444" }


  { id: GRADIENTS.residential, color: "#7777" },
  { id: GRADIENTS.residential_hover, color: "#7777" },

  { id: GRADIENTS.cultivate, color: "#7777" },
  { id: GRADIENTS.cultivate_hover, color: "#7777" },

  { id: GRADIENTS.nature, color: "#7777" },
  { id: GRADIENTS.nature_hover, color: "#7777" },

  { id: GRADIENTS.bg, color: "#333" }
];

const CENTER_FILL = {
  // residential: "#9A1A01",
  // residential_clicked: "#E6695B",

  // cultivate: "#999",
  // cultivate_clicked: "#DFC6C2",

  // nature: "#4a4a4a",
  // nature_clicked: "#8D9482"

  residential: "#ccc",
  residential_clicked: "#ff3333",

  cultivate: "#ccc",
  cultivate_clicked: "#ff3333",

  nature: "#ccc",
  nature_clicked: "#ff3333"
}

export function VectorMap({
  geoData,
  selectedCity,
  selectedDay,
  selectedDates,
  selectedAreaType,
  selectedMonth,
  TypeWriterFinished,
  getMapDetails,
  mapZoom,
  leafletCenter,
  mapInstance,
  showSatellite,
}: VectorMapProps) {
  const borderDataRef = useRef<any>(null);
  const cartodbLayerRef = useRef<any>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout[]>([]);
  const [hasAnimated, setHasAnimated] = useState(false);

  const DOT_ANIMATION_DELAY = TypeWriterFinished ? 20 : 60;
  const BORDER_DELAY = 500;
  const focusedPtRef = useRef<number | null>(null);

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
      return matchesCity && matchesDay && matchesAreaType && mathcesMonth && withinDateRange;
    });

    // Sort by date chronologically for animation
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [geoData, selectedCity, selectedDay, selectedDates, selectedAreaType, selectedMonth]);

  const clearAnimationTimeouts = useCallback(() => {
    animationTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    animationTimeoutRef.current = [];
  }, []);

  const createGradients = useCallback((defs: d3.Selection<SVGDefsElement, unknown, null, undefined>) => {
    // Clear existing gradients
    GRADIENT_CONFIGS.forEach(config => {
      defs.select(`#${config.id}`).remove();
    });

    GRADIENT_CONFIGS.forEach(config => {
      const gradient = defs.append("radialGradient")
        .attr("id", config.id)
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%")
        .attr("fx", "50%")
        .attr("fy", "50%");

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", config.color)
        .attr("stop-opacity", 0.8);

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", config.color)
        .attr("stop-opacity", 0);
    });
  }, []);

  const getRingFill = useCallback((d: any) =>
    d.landscape === "b_up" ? `url(#${GRADIENTS.residential})` : d.landscape === "cultivate" ? `url(#${GRADIENTS.cultivate})` : `url(#${GRADIENTS.nature})`, []);

  const getRingFillHover = useCallback((d: any) =>
    d.landscape === "b_up" ? `url(#${GRADIENTS.residential_hover})` : d.landscape === "cultivate" ? `url(#${GRADIENTS.cultivate_hover})` : `url(#${GRADIENTS.nature_hover})`, []);

  const getCenterFill = useCallback((d: any) => {
    return d.landscape === "b_up" ? CENTER_FILL.residential : d.landscape === "cultivate" ? CENTER_FILL.cultivate : CENTER_FILL.nature;
  }, []);

  const getCenterFillClicked = useCallback((d: any) => {
    return d.landscape === "b_up" ? CENTER_FILL.residential_clicked : d.landscape === "cultivate" ? CENTER_FILL.cultivate_clicked : CENTER_FILL.nature_clicked;
  }, []);

  // CartoDB layer
  useEffect(() => {
    if (!mapInstance) return;

    const handleCartoDBLayer = () => {
      if (!TypeWriterFinished || !mapInstance || !mapInstance.getPane) return;

      // Remove existing CartoDB layer
      if (cartodbLayerRef.current) {
        mapInstance.removeLayer(cartodbLayerRef.current);
        cartodbLayerRef.current = null;
      }

      cartodbLayerRef.current = (window as any).L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CartoDB</a>',
          minZoom: 0,
          maxZoom: 18
        }
      );
      if (mapInstance.getPane("tilePane")) {
        cartodbLayerRef.current.addTo(mapInstance);
      }

    };

    handleCartoDBLayer();

    return () => {
      if (cartodbLayerRef.current && mapInstance.hasLayer(cartodbLayerRef.current)) {
        mapInstance.removeLayer(cartodbLayerRef.current);
      }
    };
  }, [mapInstance]);

  // Main map
  useEffect(() => {
    const svg = document.querySelector("#map .leaflet-overlay-pane svg") as SVGSVGElement;
    if (!svg) return;

    // Setup SVG groups
    let g: d3.Selection<SVGGElement, unknown, null, undefined> = d3.select(svg).select<SVGGElement>("g");
    if (g.empty()) {
      g = d3.select(svg).append("g");
    } else {
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
    const dotsize = Math.max(4, 4 * (mapZoom - 8.5)) ? 15 : 0;

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
          focusedPtRef.current = null;
          getMapDetails(null)
          //reset circles 
          d3.selectAll("circle.interaction-layer")
            .classed("active", false)
            .transition()
            .duration(200)
            .attr("fill-opacity", 1.0)
            .attr("fill", d => getRingFill(d))
            .attr("r", dotsize);

          d3.selectAll("circle.incident-point")
            .attr("fill", d => getCenterFill(d))
            .transition()
            .duration(200)
            .attr("fill-opacity", 1.0)
            .attr("r", Math.max(2, mapZoom - 8.5));
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
        .attr("stroke", "#9994") // showSatellite ? "#e60f0000" : "#e60f0077"
        .attr("stroke-width", TypeWriterFinished ? 0 : 2.3)
        .attr("fill", "none")
        .style("opacity", hasAnimated ? 1 : 0);

      if (!visiblePoints || visiblePoints.length === 0) return;

      // Create all circles
      const interactionCircles = g.selectAll("circle.interaction-layer")
        .data(visiblePoints)
        .enter()
        .append("circle")
        .attr("class", "map-data-points map-data-points-hover interaction-layer")
        .attr("cx", (d) => projectPts(d.lon, d.lat)[0])
        .attr("cy", (d) => projectPts(d.lon, d.lat)[1])
        .attr("r", (d) => visiblePoints.indexOf(d) === focusedPtRef.current ? dotsize * 2 : dotsize)
        .style("pointer-events", "all")
        .attr("fill", (d) => getRingFill(d))
        .attr("fill-opacity", 1.0)
        .style("opacity", hasAnimated ? 1 : 0)
        .on("mouseover", function (event, d) {
          if (!hasAnimated || focusedPtRef.current != null) return;
          // mouse hover debounce
          if (mouseoutTimeout) {
            clearTimeout(mouseoutTimeout);
            mouseoutTimeout = null;
          }

          if (mouseoverTimeout) {
            clearTimeout(mouseoverTimeout);
          }
          // Debounce mouseover
          mouseoverTimeout = setTimeout(() => {
            d3.select(this)
              .attr("fill", d => getRingFillHover(d))
              .attr("r", 1.3 * dotsize);


            getMapDetails(d);
            mouseoverTimeout = null;
          }, HOVER_DELAY);
        })
        .on("click", function (e, d) {
          e.stopPropagation();
          if (hasAnimated) {
            const index = visiblePoints.indexOf(d);
            focusedPtRef.current = index;
            //push everything to the background
            d3.selectAll("circle.interaction-layer")
              .transition()
              .duration(200)
              .attr("fill-opacity", 0.5)
              .attr("fill", d => getRingFill(d))
              .attr("r", dotsize);

            centerCircles
              .transition()
              .duration(200)
              .attr("fill-opacity", 0.3)
              .attr("fill", d => getCenterFill(d))
              .attr("r", Math.max(2, mapZoom - 8.5));

            // lock in this point
            d3.select(this).raise()
              .transition()
              .duration(200)
              .attr("fill-opacity", 1.0)
              .attr("fill", d => getRingFillHover(d))
              .attr("r", 1.3 * dotsize);

            centerCircles
              .filter(cd => cd === d)
              .transition()
              .duration(200)
              .attr("fill-opacity", 1.0)
              .attr("fill", d => getCenterFillClicked(d))
              .attr("r", Math.max(2, mapZoom - 8.5) * 1.5);

            getMapDetails(d, null, true);
          }
        })
        .on("mouseout", function (event, d) {
          if (!hasAnimated) return;
          if (focusedPtRef.current != visiblePoints.indexOf(d)) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("fill", d => focusedPtRef.current === null ? getRingFill(d) : `url(#${GRADIENTS.bg})`)
              .attr("r", dotsize);
          }
        });

      const centerCircles = g.selectAll("circle.incident-point")
        .data(visiblePoints)
        .enter()
        .append("circle")
        .attr("class", "map-data-points incident-point")
        .attr("cx", (d) => projectPts(d.lon, d.lat)[0])
        .attr("cy", (d) => projectPts(d.lon, d.lat)[1])
        .attr("r", hasAnimated ? Math.max(2, mapZoom - 8.5) : 0)
        .attr("fill", getCenterFill)
        .style("opacity", hasAnimated ? 1 : 0);

      // animate if we haven't animated before
      if (!hasAnimated) {
        visiblePoints.forEach((_, index) => {
          const timeout = setTimeout(() => {
            // interaction circle
            d3.select(interactionCircles.nodes()[index])
              .attr("r", 15)
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
    TypeWriterFinished
  ]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearAnimationTimeouts();
    };
  }, [clearAnimationTimeouts]);

  return null;
}