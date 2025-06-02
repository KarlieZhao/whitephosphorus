import { useWindowWidth, useWindowHeight } from "@/lib/resize";
import React, { useState, useEffect, useMemo } from "react";
import * as d3 from "d3";
import { geoDataProps } from "./datasource";
import { TypewriterProps } from "./header";
type VectorMapProps = geoDataProps & TypewriterProps & {
  getMapDetails: (point: any) => void;
};

export function VectorMap({
  geoData,
  selectedCity,
  selectedDay,
  TypeWriterFinished = true,
  getMapDetails
}: VectorMapProps) {
  const [hoverEnabled, enableHover] = useState<boolean>(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<Number | null>(null);
  const [visiblePoints, setVisiblePoints] = useState<any[]>([]);
  const [borderGeoJson, setBorderGeoJson] = useState<any | null>(null);
  const [borderOpacity, setBorderOpacity] = useState(0);

  const [showOverview, setShowOverview] = useState<boolean>(false);

  const frameHeight = useWindowHeight() * 0.85;
  const frameWidth = useWindowWidth() * 0.95;

  const [scale, setScale] = useState(110000);

  useEffect(() => {
    // Fetch border data once on mount
    fetch("/data/LBN_geoBoundaries_clipped.geojson")
      .then((res) => res.json())
      .then((data) => {
        setBorderGeoJson(data);
      })
      .catch((err) => console.error("Failed to load geoData:", err));
  }, []);

  const projection = d3.geoMercator()
    .center([35.54, 33.22])
    .scale(scale)
    .translate([frameWidth / 2, frameHeight / 2]);

  const pathGenerator = d3.geoPath().projection(projection);

  const projectedPoints = useMemo(() => {
    return geoData.map((d) => {
      const projected = projection([d.lon, d.lat]);
      if (!projected) return { ...d, x: 0, y: 0 };
      const [x, y] = projected;
      return { ...d, x, y };
    });
  }, [geoData, projection]);

  //user clicking on city || resize window
  useEffect(() => {
    const filteredList = projectedPoints.filter(pt => {
      const matchesCity = selectedCity === "" || pt.name === selectedCity;
      // const date = new Date(pt.date);
      // const day = (date.getDay() + 6) % 7;
      // const matchesDay = selectedDay === -1 ? true : day === selectedDay;
      return matchesCity;
    });

    setVisiblePoints(filteredList);
  }, [selectedCity, selectedDay, frameHeight, frameWidth])


  //dots emerge animation
  useEffect(() => {
    if (!TypeWriterFinished || projectedPoints.length === 0) return;

    if (geoData.length > 0) {
      if (sessionStorage.getItem('visited') != "true") {
        sessionStorage.setItem('visited', "true");
        let i = 0;
        const interval = setInterval(() => {
          if (i >= projectedPoints.length) {
            clearInterval(interval);
            setBorderOpacity(1);
            setShowOverview(true);
            enableHover(true);
            return;
          }
          const point = projectedPoints[i];
          i++;
          setVisiblePoints((prev) => [...prev, point]);
        }, 50);
      } else {
        setVisiblePoints(projectedPoints);
        setBorderOpacity(1);
        setShowOverview(true);
        enableHover(true);
      }
    }
  }, [geoData, TypeWriterFinished])

  // TODO
  // ZOOM: set scale and translate projection
  // interactive area chart (class)
  // interactive segment chart
  // timeline => right side small panel
  // satellite images tiling? => new component, toggle
  // mouse drag


  return (
    <section className="z-10 top-20 fixed overflow-hidden overscroll-contain" style={{ width: `100vw`, height: `91%` }}    >

      <div className="absolute left-[30%] top-[45%] country-legal" style={{ opacity: borderOpacity }}>Lebanon</div>
      <div className="absolute left-[58%] top-[60%] country-legal" style={{ opacity: borderOpacity }}>Israel</div>
      {/* SVG border */}
      <svg
        className="absolute top-2 left-4 z-0 border-path"
        width={frameWidth}
        height={frameHeight}
        style={{ pointerEvents: "none" }}
        opacity={borderOpacity}
      >
        {borderGeoJson && borderGeoJson.features.map((feature: any, i: number) => {
          return <path
            key={i}
            d={pathGenerator(feature) || undefined}
            stroke="#451111"
            strokeWidth={3}
            fill="none"
          />
        })}
      </svg>

      {/* map projection  */}
      {visiblePoints.map((pt, i) => {
        return (
          <div className="interaction-layer"
            key={i}
            style={{
              left: `${pt.x}px`,
              top: `${pt.y}px`,
            }}
            onMouseOver={() => {
              if (hoverEnabled) {
                setHoveredPointIndex(i);
                getMapDetails(pt)
              }
            }}
          // onMouseOut={() => setHoveredPointIndex(null)}
          >
            <div
              key={i}
              id={`data-point${pt.name}`}
              className={`map-data-points ${hoveredPointIndex === i ? 'active' : ''}`}
            />
          </div>
        )
      })}
    </section>
  );
}