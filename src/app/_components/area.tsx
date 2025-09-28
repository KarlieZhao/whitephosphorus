import * as d3 from "d3";
import React, { useRef, useState, useEffect } from "react";
import { geoDataProps, RED_GRADIENT } from "./datasource";
import { width } from "./datasource";

interface AreaProps extends geoDataProps {
    x_unit: "hour" | "month";
}


export default function Area({ geoData, selectedCity, selectedDates, x_unit }: AreaProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const height = 80;
    // const [dimensions, setDimensions] = useState({ width: 300, height: 440 });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    useEffect(() => {
        if (!geoData || geoData.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous content

        const margin = { top: 10, right: 5, bottom: 20, left: 30 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        //format time
        const gd = selectedCity === "" ? geoData : geoData.filter(item => item.town === selectedCity)

        // ========= DATA AGGREGATION =========
        let binnedCounts: { time: number; count: number }[] = [];
        let monthLabels: string[] = [];
        if (x_unit === "hour") {
            const hours = gd.map(d => parseInt(d.time.slice(0, 2), 10));
            const hourlyCounts = new Array(25).fill(0);
            hours.forEach(hour => {
                if (hour >= 0 && hour < 25) hourlyCounts[hour]++;
            });
            for (let i = 0; i <= 24; i += 2) {
                const binCount = i === 24 ? hourlyCounts[0] + hourlyCounts[1] : hourlyCounts[i] + hourlyCounts[i + 1];
                binnedCounts.push({ time: i, count: binCount });
            }
        }
        else if (x_unit === "month") {
            // group by month (YYYY-MM)
            const parseDate = d3.timeParse("%Y-%m-%d");
            const monthCounts = new Map<string, number>(); // month index (0–11) as key

            gd.forEach(d => {
                const dateObj = parseDate(d.date);
                if (dateObj) {
                    const year = dateObj.getFullYear();
                    const month = dateObj.getMonth(); // 0–11
                    const key = `${year}-${month}`;
                    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
                }
            });
            const sortedKeys = Array.from(monthCounts.keys()).sort((a, b) => {
                const [ay, am] = a.split("-").map(Number);
                const [by, bm] = b.split("-").map(Number);
                return ay === by ? am - bm : ay - by;
            });

            binnedCounts = sortedKeys.map((key, i) => ({
                time: i, // sequential index
                count: monthCounts.get(key) ?? 0,
            }));

            monthLabels = sortedKeys.map((k, i) => {
                const [y, m] = k.split("-").map(Number);
                if (i > 0) {
                    let [ly, lm] = sortedKeys[i - 1].split("-").map(Number);
                    if (ly === y) return months[m];
                }
                return y + ""
            });
        }

        const xDomain = x_unit === "hour" ? [0, 24] : [0, binnedCounts.length - 1]

        const xScale = d3.scaleLinear()
            .domain(xDomain)
            .range([0, innerWidth]);

        const yMax = Math.max(...binnedCounts.map(d => d.count));
        const yScale = d3.scaleLinear()
            .domain([0, yMax])
            .nice()
            .range([innerHeight, 0]);

        const area = d3.area<{ time: number; count: number }>()
            .x(d => xScale(d.time))
            .y0(innerHeight)
            .y1(d => yScale(d.count))
            .curve(d3.curveMonotoneX);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // X Axis
        const xAxis = x_unit === "hour"
            ? d3.axisBottom(xScale)
                .ticks(7)
                .tickSize(5)
                .tickFormat((d) => {
                    const h = +d;
                    const period = (h < 12 || h === 24) ? 'AM' : 'PM';
                    const hour = h % 12 === 0 ? 12 : h % 12;
                    return `${hour}${period}`;
                })
            : d3.axisBottom(xScale)
                .tickSize(5)
                .ticks(binnedCounts.length)
                .tickFormat((d: d3.NumberValue) => monthLabels[+d] || "");

        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)

        // Y Axis
        const yAxis = d3.axisLeft(yScale).ticks(5).tickSize(4);
        g.append('g').call(yAxis);

        //style them
        g.selectAll('.tick')
            .select('line')
            .attr("stroke", "#aaa");

        g.selectAll('.tick')
            .select('text')
            .attr("fill", "#aaa")
            .attr('class', "chart-labels");

        // Area path
        g.append('path')
            .datum(binnedCounts)
            // .attr('fill', '#842E1E')
            .attr('fill', RED_GRADIENT[5])
            .attr('d', area);

    }, [geoData, width, height, selectedCity, x_unit]);

    return <>
        <svg ref={svgRef} width={width} height={height} /></>;
}