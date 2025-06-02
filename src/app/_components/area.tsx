import * as d3 from "d3";
import React, { useRef, useState, useEffect } from "react";
import { geoDataProps } from "./datasource";

export default function Area({ geoData, selectedCity }: geoDataProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const width = 300;
    const height = 100;
    // const [dimensions, setDimensions] = useState({ width: 300, height: 440 });

    useEffect(() => {
        if (!geoData || geoData.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous content

        const margin = { top: 20, right: 20, bottom: 30, left: 30 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        //format time
        const gd = selectedCity === "" ? geoData : geoData.filter(item => item.name === selectedCity)
        const hours = gd.map(d => parseInt(d.time.slice(0, 2)));

        let hourlyCounts = new Array(25).fill(0);
        hours.forEach(hour => {
            if (hour >= 0 && hour < 25) hourlyCounts[hour]++;
        });

        const binnedCounts = [];
        for (let i = 0; i <= 24; i += 2) { //every two hours in a bin
            const binCount = i === 24 ? hourlyCounts[0] + hourlyCounts[1] : hourlyCounts[i] + hourlyCounts[i + 1];
            binnedCounts.push({
                time: i,
                count: binCount,
            });
        }
        const xScale = d3.scaleLinear()
            .domain([0, 24])
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
            .tickFormat((d) => {
                const h = +d; //coerce d to number to escape type error
                const period = (h < 12 || h === 24) ? 'AM' : 'PM';
                const hour = h % 12 === 0 ? 12 : h % 12;
                return `${hour}${period}`;
            });

        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll('text')
            .attr("fill", "#aaa")
            .attr('class', "chart-labels");

        // Y Axis
        const yAxis = d3.axisLeft(yScale).ticks(5);

        g.append('g').call(yAxis);

        // Area path
        g.append('path')
            .datum(binnedCounts)
            // .attr('fill', '#842E1E')
            .attr('fill', '#aaa')
            .attr('d', area);

    }, [geoData, width, height, selectedCity]);

    return <> <div className="chart-titles">WP shells by hour</div>
        <svg ref={svgRef} width={width} height={height} /></>;
}