import * as d3 from "d3";
import React, { useRef, useEffect, useState } from "react";
import { geoDataProps, RED_GRADIENT } from "./datasource";
import { width } from "./datasource";
import { MONTHS_CONVERT } from "./datasource";
export default function LandscapeHisto({
    geoData,
    selectedCity,
    selectedAreaType,
    selectedMonth,
    onMonthClick
}: geoDataProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const height = 80;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const parseDate = d3.timeParse("%Y-%m-%d");

    useEffect(() => {
        if (!geoData || geoData.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 12, right: 5, bottom: 20, left: 5 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;


        // ========= DATA FILTERING =========
        let filteredData = geoData;
        if (selectedAreaType) {
            filteredData = filteredData.filter((d) => d.landscape === selectedAreaType);
        } else if (selectedCity) {
            filteredData = filteredData.filter((d) => d.town === selectedCity);
        }
        // ========= GROUP BY MONTH (with full month range) =========
        const monthCounts = new Map<string, number>();
        filteredData.forEach((d) => {
            const dateObj = parseDate(d.date);
            if (dateObj) {
                const year = dateObj.getFullYear();
                const month = dateObj.getMonth(); // 0–11
                const key = `${year}-${month}`;
                monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
            }
        });

        const binnedCounts = MONTHS_CONVERT.map((key) => ({
            key,
            count: monthCounts.get(key) ?? 0,
        }));

        // ========= SCALES =========
        const xScale = d3
            .scaleBand()
            .domain(binnedCounts.map((d) => d.key))
            .range([margin.left, margin.left + innerWidth])
            .padding(0.1);

        const yScale = d3
            .scaleLinear()
            .domain([0, d3.max(binnedCounts, (d) => d.count)!])
            .nice()
            .range([margin.top + innerHeight, margin.top]);

        // ========= DRAW BARS =========
        svg
            .selectAll<SVGRectElement, typeof binnedCounts[0]>("rect.colored")
            .data(binnedCounts)
            .join("rect")
            .attr("x", (d) => xScale(d.key)!)
            .attr("y", (d) => yScale(d.count))
            .attr("width", xScale.bandwidth())
            .attr("height", (d) => margin.top + innerHeight - yScale(d.count))
            .attr("fill", d => (selectedMonth != null && d.key === MONTHS_CONVERT[selectedMonth]) ? RED_GRADIENT[1] : RED_GRADIENT[4])
            .attr("class", "landscape-histo-colored");

        svg
            .selectAll<SVGRectElement, typeof binnedCounts[0]>("rect.transparent")
            .data(binnedCounts)
            .join("rect")
            .attr("x", (d) => xScale(d.key)!)
            .attr("y", (d) => 0)
            .attr("width", xScale.bandwidth())
            .attr("height", margin.top + innerHeight)
            .attr("fill", "transparent")
            .attr("class", "landscape-histo-transparent")
            .on('click', (_, d) => {
                if (selectedMonth) MONTHS_CONVERT[selectedMonth]
                if (onMonthClick) {
                    if (selectedMonth != null && MONTHS_CONVERT[selectedMonth] === d.key) {
                        onMonthClick(null);
                    } else {
                        onMonthClick([d.key, d.count]);
                    }
                }
            })
            .on('mouseover', function (this: SVGRectElement, event, d) {
                d3.selectAll<SVGRectElement, typeof binnedCounts[0]>(".landscape-histo-colored")
                    .filter(barData => barData.key === d.key)
                    .attr("fill", RED_GRADIENT[2]);
                svg
                    .append("text")
                    .attr("class", "bar-label")
                    .attr("x", xScale(d.key)! + xScale.bandwidth() / 2)
                    .attr("y", yScale(d.count) - 6)
                    .attr("text-anchor", "middle")
                    .attr("fill", "#bbb")
                    .attr("font-size", 11)
                    .text(d.count);

            })
            .on('mouseout', function (this: SVGRectElement) {
                d3.selectAll<SVGRectElement, typeof binnedCounts[0]>(".landscape-histo-colored")
                    .attr("fill", (r) =>
                        r.key === (selectedMonth != null ? MONTHS_CONVERT[selectedMonth] : undefined)
                            ? RED_GRADIENT[2]
                            : RED_GRADIENT[4]
                    );
                svg.selectAll(".bar-label").remove();
            });

        // ========= DRAW AXIS / LABELS =========
        let lastYear: number = 0;

        svg
            .selectAll(".month-label")
            .data(MONTHS_CONVERT)
            .join("text")
            .attr("class", "chart-labels")
            .attr("x", (key) => (xScale(key)! + xScale.bandwidth() / 2))
            .attr("y", height - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "0.75rem")
            .attr("fill", "#bbb")
            .each(function (key, i) {
                const [year, monthIndex] = key.split("-").map(Number);
                const text = d3.select(this);
                text.selectAll("tspan").remove(); // clear previous tspans

                // month
                if (i % 3 === 0) {
                    text
                        .append("tspan")
                        .attr("x", xScale(key)! + xScale.bandwidth() / 2)
                        .attr("dy", "0")
                        .text((lastYear === year ? months[monthIndex] : (months[monthIndex] + "'" + year.toString().slice(2))
                        ));
                }

                if (lastYear != year) lastYear = year;
            });

    }, [geoData, selectedCity, selectedAreaType, selectedMonth]);

    return <svg ref={svgRef} width={width} height={height} />;
}
