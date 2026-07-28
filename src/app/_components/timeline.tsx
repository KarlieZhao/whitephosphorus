import React, { useEffect, useMemo, useState } from "react";
import { geoDataProps } from "./datasource";

export default function Timeline({ geoData, selectedDates, onTimelineDragged }: geoDataProps) {
    const [startDate, setStartDate] = useState<string>(selectedDates?.[0] ?? "");
    const [endDate, setEndDate] = useState<string>(selectedDates?.[1] ?? "");

    // keep local inputs in sync when another filter resets selectedDates
    useEffect(() => {
        setStartDate(selectedDates?.[0] ?? "");
        setEndDate(selectedDates?.[1] ?? "");
    }, [selectedDates]);

    const { minDate, maxDate } = useMemo(() => {
        const dates = geoData.map((d) => d.date).filter(Boolean).sort();
        return { minDate: dates[0] ?? "", maxDate: dates[dates.length - 1] ?? "" };
    }, [geoData]);

    const fireChange = (start: string, end: string) => {
        if (start && end && start <= end && onTimelineDragged) {
            onTimelineDragged([start, end]);
        }
    };

    return (
        <>
            <div className="chart-titles items-baseline">Select Date Range</div>
            <div className="flex gap-3 items-end justify-center mt-3 date-range-inputs">
                <div className="flex flex-col gap-1">
                    <label className="chart-labels" style={{ color: "#bbb" }}>Start date</label>
                    <input
                        type="date"
                        className="date-range-input"
                        value={startDate}
                        min={minDate}
                        max={endDate || maxDate}
                        onChange={(e) => {
                            const value = e.target.value;
                            setStartDate(value);
                            fireChange(value, endDate);
                        }}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="chart-labels" style={{ color: "#bbb" }}>End date</label>
                    <input
                        type="date"
                        className="date-range-input"
                        value={endDate}
                        min={startDate || minDate}
                        max={maxDate}
                        onChange={(e) => {
                            const value = e.target.value;
                            setEndDate(value);
                            fireChange(startDate, value);
                        }}
                    />
                </div>
            </div>
        </>
    );
}
