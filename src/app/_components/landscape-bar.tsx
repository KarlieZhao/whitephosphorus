import React, { useMemo } from "react";
import { geoDataProps, MONTHS } from "./datasource";

const LANDSCAPE_COLORS: { [key: string]: string } = {
    resident: "#cf3d2e",
    agri: "#8f2418",
    bare: "#4a4a4a",
};

const LANDSCAPE_LABELS: { [key: string]: string } = {
    resident: "Residential",
    agri: "Agricultural",
    bare: "Forested/open terrain",
};

const ORDER = ["resident", "agri", "bare"];

export default function LandscapeBar({
    geoData,
    selectedCity,
    selectedDates,
    selectedDay,
    selectedMonth,
    selectedYear,
    selectedAreaType,
    onAreaTypeClicked,
}: geoDataProps) {
    const percentages = useMemo(() => {
        const empty = { resident: 0, agri: 0, bare: 0 };
        if (!geoData || geoData.length === 0) return empty;

        let filteredData = geoData;
        if (selectedDates && selectedDates[0] && selectedDates[1]) {
            filteredData = filteredData.filter(d => d.date >= selectedDates[0] && d.date <= selectedDates[1]);
        } else if (selectedDay !== undefined && selectedDay > -1) {
            filteredData = filteredData.filter(d => new Date(d.date).getDay() === selectedDay);
        } else if (selectedCity) {
            filteredData = filteredData.filter(d => d.town === selectedCity);
        } else if (selectedMonth != null) {
            filteredData = filteredData.filter(d => d.date.slice(0, 7) === MONTHS[selectedMonth]);
        } else if (selectedYear) {
            filteredData = filteredData.filter(d => d.date.slice(0, 4) === selectedYear);
        }

        const counts: { [key: string]: number } = { resident: 0, agri: 0, bare: 0 };
        filteredData.forEach(d => {
            if (d.landscape && counts[d.landscape] !== undefined) {
                counts[d.landscape] += d.shell_count;
            }
        });
        const total = ORDER.reduce((sum, key) => sum + counts[key], 0);
        if (total === 0) return empty;

        return {
            resident: Math.round((counts.resident / total) * 100),
            agri: Math.round((counts.agri / total) * 100),
            bare: Math.round((counts.bare / total) * 100),
        };
    }, [geoData, selectedCity, selectedDates, selectedDay, selectedMonth, selectedYear]);

    const handleClick = (key: string) => {
        if (onAreaTypeClicked) onAreaTypeClicked(selectedAreaType === key ? null : key);
    };

    return (
        <div className="landscape-bar-container">
            <div className="landscape-bar">
                {ORDER.map(key => (
                    (percentages as any)[key] > 0 && (
                        <div
                            key={key}
                            className="landscape-bar-segment"
                            style={{
                                width: `${(percentages as any)[key]}%`,
                                backgroundColor: LANDSCAPE_COLORS[key],
                                opacity: !selectedAreaType || selectedAreaType === key ? 1 : 0.35,
                            }}
                            onClick={() => handleClick(key)}
                        />
                    )
                ))}
            </div>
            <div className="day-night-labels landscape-bar-labels">
                {ORDER.map(key => (
                    <span
                        key={key}
                        className={`landscape-legend-item ${selectedAreaType === key ? "landscape-legend-item-active" : ""}`}
                        onClick={() => handleClick(key)}
                    >
                        <span className="landscape-legend-swatch" style={{ backgroundColor: LANDSCAPE_COLORS[key] }}></span>
                        {LANDSCAPE_LABELS[key]} {(percentages as any)[key]}%
                    </span>
                ))}
            </div>
        </div>
    );
}
