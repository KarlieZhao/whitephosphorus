import React, { useMemo } from "react";
import { geoDataProps } from "./datasource";
import { parseDate } from "./histo";
import { MONTHS } from "./datasource";

export default function Area({ geoData, selectedCity, selectedDates, selectedDay, selectedAreaType, selectedMonth, selectedYear }: geoDataProps) {
    const { dayPct, nightPct } = useMemo(() => {
        if (!geoData || geoData.length === 0) return { dayPct: 0, nightPct: 0 };

        let filteredData = geoData;
        if (selectedDates && selectedDates[0] && selectedDates[1]) {
            filteredData = filteredData.filter(d => {
                const date = parseDate(d.date);
                const start = parseDate(selectedDates[0]);
                const end = parseDate(selectedDates[1]);
                if (!date || !start || !end) return true;
                return date >= start && date <= end;
            })
        } else if (selectedDay !== undefined && selectedDay > -1) {
            filteredData = filteredData.filter(d => {
                const date = new Date(d.date);
                const day = date.getDay();
                return day === selectedDay
            })
        } else if (selectedAreaType) {
            filteredData = filteredData.filter(d => {
                return d.landscape === selectedAreaType;
            })
        } else if (selectedCity) {
            filteredData = filteredData.filter(d => {
                return d.town === selectedCity
            })
        } else if (selectedMonth != null) {
            filteredData = filteredData.filter(d => {
                return d.date.slice(0, 7) === MONTHS[selectedMonth];
            })
        } else if (selectedYear) {
            filteredData = filteredData.filter(d => {
                return d.date.slice(0, 4) === selectedYear;
            })
        }

        let dayCount = 0;
        let nightCount = 0;
        filteredData.forEach(d => {
            const hour = parseInt(d.time.slice(0, 2), 10);
            const isDaytime = hour >= 6 && hour < 18;
            if (isDaytime) dayCount += d.shell_count;
            else nightCount += d.shell_count;
        });

        const total = dayCount + nightCount;
        if (total === 0) return { dayPct: 0, nightPct: 0 };

        return {
            dayPct: Math.round((dayCount / total) * 100),
            nightPct: Math.round((nightCount / total) * 100),
        };
    }, [geoData, selectedCity, selectedDates, selectedDay, selectedAreaType, selectedMonth, selectedYear]);

    return (
        <div className="day-night-container">
            <div className="day-night-bar">
                <div className="day-night-segment day-segment" style={{ width: `${dayPct}%` }} />
                <div className="day-night-segment night-segment" style={{ width: `${nightPct}%` }} />
            </div>
            <div className="day-night-labels chart-labels">
                <span>☀ Day {dayPct}%</span>
                <span>☾ Night {nightPct}%</span>
            </div>
        </div>
    );
}
