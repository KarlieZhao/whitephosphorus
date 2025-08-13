import { useEffect } from "react";
import * as d3 from "d3";
import { geoDataProps } from "./datasource";
import { TypewriterProps } from "./header";

type VectorMapProps = geoDataProps & TypewriterProps & {
  getMapDetails: (point: any) => void;
  mapZoom: number;
  leafletCenter: [number, number];
  mapInstance: any;
};

export function VectorMap({
  geoData,
  selectedCity,
  selectedDay,
  selectedDates,
  TypeWriterFinished = true,
  getMapDetails,
  mapZoom,
  leafletCenter,
  mapInstance
}: VectorMapProps) {

  useEffect(() => {
    const svg = document.querySelector("#map .leaflet-overlay-pane svg") as SVGSVGElement;
    if (!svg) return;

    let g: d3.Selection<SVGGElement, unknown, null, undefined> = d3.select(svg).select<SVGGElement>("g");
    if (g.empty()) {
      g = d3.select(svg).append("g");
    } else {
      g.selectAll("*").remove(); // Clear previous
    }

    let defs: d3.Selection<SVGGElement, unknown, null, undefined> = d3.select(svg).select<SVGGElement>("defs");
    if (defs.empty()) {
      defs = d3.select(svg).append("defs");
    } else {
      defs.selectAll("#pointGlow").remove();
    }

    // radial gradient for glow
    const whiteGradient = defs.append("radialGradient")
      .attr("id", "whiteGradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%")
      .attr("fx", "50%")
      .attr("fy", "50%");

    whiteGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#eee") // center
      .attr("stop-opacity", 0.7);

    whiteGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#eee")// edge
      .attr("stop-opacity", 0);


    const redGradient = defs.append("radialGradient")
      .attr("id", "redGradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%")
      .attr("fx", "50%")
      .attr("fy", "50%");

    redGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#ff0000") // center
      .attr("stop-opacity", 0.7);

    redGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ff0000")// edge
      .attr("stop-opacity", 0);

    // Projection using Leaflet's latLngToLayerPoint
    const L = require("leaflet");
    const projectPoint = (lon: number, lat: number) => {
      if (!mapInstance) return [0, 0];
      const point = mapInstance.latLngToLayerPoint([lat, lon]);
      return [point.x, point.y];
    };

    const leafletProjection = {
      stream: (stream: any) => {
        return {
          point: (x: number, y: number) => {
            const [px, py] = projectPoint(x, y);
            stream.point(px, py);
          },
          sphere: () => stream.sphere?.(),
          lineStart: () => stream.lineStart?.(),
          lineEnd: () => stream.lineEnd?.(),
          polygonStart: () => stream.polygonStart?.(),
          polygonEnd: () => stream.polygonEnd?.(),
        };
      },
    };

    const geoPath = d3.geoPath().projection(leafletProjection as any);

    // filter by selected city/day
    const visiblePoints = geoData.filter(pt => {
      const matchesCity = selectedCity === "" || pt.name === selectedCity;
      const date = new Date(pt.date);
      const day = (date.getDay() + 6) % 7;
      const matchesDay = selectedDay === -1 ? true : day === selectedDay;
      let withinDateRange = true;
      if (selectedDates && selectedDates[0] && selectedDates[1]) {
        const start = new Date(selectedDates[0]);
        const end = new Date(selectedDates[1]);
        withinDateRange = date >= start && date <= end;
      }

      return matchesCity && matchesDay && withinDateRange;
    });

    // draw border
    fetch("/data/LB_regions.geojson")
      .then((res) => res.json())
      .then((borderGeoJson) => {
        g.selectAll("path")
          .data(borderGeoJson.features)
          .enter()
          .append("path")
          .attr("d", geoPath as any)
          .attr("stroke", "#451111")
          .attr("stroke-width", 3)
          .attr("fill", "none");

        // radial gradient glow
        g.selectAll("circle.interaction-layer")
          .data(visiblePoints)
          .enter()
          .append("circle")
          .attr("class", "map-data-points map-data-points-hover interaction-layer")
          .attr("cx", (d) => projectPoint(d.lon, d.lat)[0])
          .attr("cy", (d) => projectPoint(d.lon, d.lat)[1])
          .attr("r", 15)
          .style("pointer-events", "all")
          .attr("fill", "url(#whiteGradient)")
          .on("mouseover", function (event, d) {
            d3.select(
              g.selectAll("circle.incident-point").nodes()[visiblePoints.indexOf(d)]
            ).classed("active", true);
            d3.select(this).attr("fill", "url(#redGradient)");
            getMapDetails(d);
          })
          .on("mouseout", function (event, d) {
            d3.select(
              g.selectAll("circle.incident-point").nodes()[visiblePoints.indexOf(d)]
            ).classed("active", false);
            d3.select(this).attr("fill", "url(#whiteGradient)");
          });


        // center circle
        g.selectAll("circle.incident-point")
          .data(visiblePoints)
          .enter()
          .append("circle")
          .attr("class", "map-data-points incident-point")
          .attr("cx", (d) => projectPoint(d.lon, d.lat)[0])
          .attr("cy", (d) => projectPoint(d.lon, d.lat)[1])
          .attr("r", 3.5)
          .attr("fill", "#ffffff")


      });
  }, [geoData, selectedCity, selectedDates, selectedDay, mapZoom, leafletCenter]);

  return null;
}
