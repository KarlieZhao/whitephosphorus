import * as d3 from "d3";
import React, { useRef, useEffect } from "react";
import { geoDataProps, RED_GRADIENT } from "./datasource";
import { width } from "./datasource";
import { parseDate } from "./histo";
import { MONTHS } from "./datasource";
export default function Area({ geoData, selectedCity, selectedDates, selectedDay, selectedAreaType, selectedMonth }: geoDataProps) {
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
        }

        // ========= DATA AGGREGATION =========
        let binnedCounts: { time: number; count: number }[] = [];
        let monthLabels: string[] = [];

        const hours = filteredData.map(d => parseInt(d.time.slice(0, 2), 10));
        const hourlyCounts = new Array(25).fill(0);
        hours.forEach((hour: number) => {
            if (hour >= 0 && hour < 25) hourlyCounts[hour]++;
        });
        for (let i = 0; i <= 24; i += 2) {
            const binCount = i === 24 ? hourlyCounts[0] + hourlyCounts[1] : hourlyCounts[i] + hourlyCounts[i + 1];
            binnedCounts.push({ time: i, count: binCount });
        }

        const xDomain = [0, 24]

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
        const xAxis = d3.axisBottom(xScale)
            .ticks(7)
            .tickSize(5)
            .tickFormat((d) => {
                const h = +d;
                const period = (h < 12 || h === 24) ? 'AM' : 'PM';
                const hour = h % 12 === 0 ? 12 : h % 12;
                return `${hour}${period}`;
            })

        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)

        // Y Axis
        const yAxis = d3.axisLeft(yScale).ticks(5).tickSize(4);
        g.append('g').call(yAxis);

        //style them
        g.selectAll('.tick')
            .select('line')
            .attr("stroke", "#bbb");

        g.selectAll('.tick')
            .select('text')
            .attr("fill", "#bbb")
            .attr('class', "chart-labels");

        // Area path
        g.append('path')
            .datum(binnedCounts)
            // .attr('fill', '#842E1E')
            .attr('fill', RED_GRADIENT[4])
            .attr('d', area);

    }, [geoData, width, height, selectedCity, selectedDates, selectedDay, selectedAreaType]);

    return <>
        <svg ref={svgRef} width={width} height={height} /></>;
}