import React, { useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import { geoDataProps } from "./datasource";
import { width } from "./datasource";

const RED_GRADIENT = d3.quantize(d3.interpolateRgb("#db2f0f", "#2e1f1f"), 7);

export default function Segment({ geoData, selectedCity, selectedDay, selectedDates, onSegmentClick }: geoDataProps) {
    const height = 120;
    // const [dimensions, setDimensions] = useState({ width: 300, height: 440 });
    const [counts, setCounts] = useState<number[]>([]);
    const bins = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    useEffect(() => {
        if (!geoData || geoData.length === 0) return;
        const dayCount = Array(7).fill(0);
        const gd = selectedCity === "" ? geoData : geoData.filter(item => item.town === selectedCity)
        gd.forEach(data => {
            const date = new Date(data.date);
            let day = date.getDay();
            dayCount[day]++;
        })
        const widthFactor = (width - 20) / gd.length;
        setCounts(dayCount.map(count => count *= widthFactor));
    }, [geoData, selectedCity])

    return (<>
        <div className="chart-titles mb-3">WP shells by days of week</div>
        <div className="flex gap-1 cursor-pointer" style={{ width: width }}>
            {(() => {
                const sorted = [...counts].sort((a, b) => b - a);
                return counts.map((count, i) => {
                    if (count === 0) return null;
                    return (
                        <div
                            key={i}
                            style={{
                                width: `${count}px`,
                                height: '10px',
                                background: selectedDay === i ? "#CF705F" : RED_GRADIENT[sorted.indexOf(count)]
                            }}
                            onClick={() => {
                                if (onSegmentClick) onSegmentClick(i);
                            }}
                        ></div>
                    );
                });
            })()}
        </div>

        <div className="flex gap-1" style={{ width }}>
            {bins.map((day, i) => {
                if (counts[i] === 0) return;
                return <div key={i} className="chart-labels flex justify-center " style={{ color: "#aaa", width: `${counts[i]}px`, height: `${height / 10}px` }}>{day}</div>
            })}
        </div>
    </>)
}