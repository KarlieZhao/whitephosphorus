import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { geoDataProps } from "./datasource";
import { TypewriterProps } from "./header";
import { clear } from "console";

type VectorMapProps = geoDataProps & TypewriterProps & {
  getMapDetails: (point: any) => void;
  mapZoom: number;
  leafletCenter: [number, number];
  mapInstance: any;
  showSatellite: boolean;
  TypeWriterFinished?: boolean;
};

const DOT_ANIMATION_DELAY = 60;
const BORDER_DELAY = 800;
export const controlEnabledTimeout = DOT_ANIMATION_DELAY * 111 + BORDER_DELAY;

const GRADIENTS = {
  white: "whiteGradient",
  gray: "grayGradient",
  red: "redGradient",
  brightRed: "brightRedGradient"
} as const;

const GRADIENT_CONFIGS = [
  { id: GRADIENTS.white, color: "#eee" },
  { id: GRADIENTS.gray, color: "#999" },
  { id: GRADIENTS.red, color: "#ff0000" },
  { id: GRADIENTS.brightRed, color: "#ff4444" }
];

export function VectorMap({
  geoData,
  selectedCity,
  selectedDay,
  selectedDates,
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

      const date = new Date(pt.date);
      const day = (date.getDay() + 6) % 7;
      const matchesDay = selectedDay === -1 || day === selectedDay;

      let withinDateRange = true;
      if (selectedDates?.[0] && selectedDates[1]) {
        const start = new Date(selectedDates[0]);
        const end = new Date(selectedDates[1]);
        withinDateRange = date >= start && date <= end;
      }

      return matchesCity && matchesDay && withinDateRange;
    });

    // Sort by date chronologically for animation
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [geoData, selectedCity, selectedDay, selectedDates]);

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
        .attr("stop-opacity", 0.7);

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", config.color)
        .attr("stop-opacity", 0);
    });
  }, []);

  const getInteractionFill = useCallback((d: any) =>
    d.landscape === "b_up" ? `url(#${GRADIENTS.white})` : `url(#${GRADIENTS.gray})`, []);

  const getCenterFill = useCallback((d: any) => {
    if (showSatellite) {
      return d.landscape === "b_up" ? "#ff2212" : "#910a00";
    }
    return d.landscape === "b_up" ? "#fff" : "#999";
  }, [showSatellite]);

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

    // Render function
    const renderMap = (borderGeoJson: any) => {
      if (!visiblePoints || visiblePoints.length === 0 || !TypeWriterFinished) return;
      // Always create border elements
      const borders = g.selectAll("path.border")
        .data(borderGeoJson.features)
        .enter()
        .append("path")
        .attr("class", "border")
        .attr("d", geoPath as any)
        .attr("stroke", showSatellite ? "#e60f0000" : "#e60f0077")
        .attr("stroke-width", 5)
        .attr("fill", "none")
        .style("opacity", hasAnimated ? 1 : 0);

      // Create all circles
      const interactionCircles = g.selectAll("circle.interaction-layer")
        .data(visiblePoints)
        .enter()
        .append("circle")
        .attr("class", "map-data-points map-data-points-hover interaction-layer")
        .attr("cx", (d) => projectPts(d.lon, d.lat)[0])
        .attr("cy", (d) => projectPts(d.lon, d.lat)[1])
        .attr("r", hasAnimated ? 15 : 0)
        .style("pointer-events", "all")
        .attr("fill", getInteractionFill)
        .style("opacity", hasAnimated ? 1 : 0)
        .on("mouseover", function (event, d) {
          if (hasAnimated) {
            const index = visiblePoints.indexOf(d);
            d3.select(g.selectAll("circle.incident-point").nodes()[index])
              .classed("active", true);
            d3.select(this).attr("fill", `url(#${GRADIENTS.brightRed})`);
            getMapDetails(d);
          }
        })
        .on("mouseout", function (event, d) {
          if (hasAnimated) {
            const index = visiblePoints.indexOf(d);
            d3.select(g.selectAll("circle.incident-point").nodes()[index])
              .classed("active", false);
            d3.select(this).attr("fill", getInteractionFill);
          }
        });

      const centerCircles = g.selectAll("circle.incident-point")
        .data(visiblePoints)
        .enter()
        .append("circle")
        .attr("class", "map-data-points incident-point")
        .attr("cx", (d) => projectPts(d.lon, d.lat)[0])
        .attr("cy", (d) => projectPts(d.lon, d.lat)[1])
        .attr("r", hasAnimated ? Math.max(2, mapZoom - 8) : 0)
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
              .duration(300)
              .style("opacity", 1);

            // center circle
            d3.select(centerCircles.nodes()[index])
              .attr("r", mapZoom - 8)
              .transition()
              .duration(300)
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
      fetch("/data/LB_regions.geojson")
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