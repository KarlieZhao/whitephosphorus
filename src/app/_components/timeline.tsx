import * as d3 from "d3";
import React, { useRef, useState, useEffect } from "react";
import { geoDataProps } from "./datasource";
const RED_GRADIENT = d3.quantize(d3.interpolateRgb("#db2f0f", "#2e1f1f"), 5);

export default function Timeline({ geoData, selectedCity }: geoDataProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [hoverInfo, setHoverInfo] = useState<{ x: number; date: Date } | null>(null);
    const margin = { top: 10, right: 10, bottom: 5, left: 10 };

    const width = 300;
    const height = 55;
    // const [dimensions, setDimensions] = useState({ width: 300, height: 440 });

    useEffect(() => {
        if (!geoData || geoData.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous content

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const parseDate = d3.timeParse('%Y-%m-%d');
        const countsMap = new Map<string, number>();

        geoData.forEach(d => {
            countsMap.set(d.date, (countsMap.get(d.date) ?? 0) + 1);
        });

        // Create a full date range from min to max
        const dateStrings = Array.from(countsMap.keys());
        const dates = dateStrings.map(d => parseDate(d)!);
        const minDate = d3.min(dates)!;
        const maxDate = d3.max(dates)!;

        const allDates: Date[] = d3.timeDay.range(minDate, d3.timeDay.offset(maxDate, 1)); // include maxDate
        const countsByDate = allDates.map(date => ({
            date,
            count: countsMap.get(d3.timeFormat('%Y-%m-%d')(date)) ?? 0
        }));


        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // X Scale
        const xScale = d3.scaleBand<Date>()
            .domain(countsByDate.map(d => d.date))
            .range([0, innerWidth])
        // .padding(0.1);

        // for color
        const maxCount = d3.max(countsByDate, d => d.count) ?? 1;

        // Draw bars
        g.selectAll('rect')
            .data(countsByDate)
            .enter()
            .append('rect')
            .attr('x', d => xScale(d.date)!)
            .attr('y', 0)
            .attr('width', xScale.bandwidth())
            .attr('height', innerHeight)
            .attr('fill', d => RED_GRADIENT[maxCount - d.count])
            .on('mouseover', function (e, d) {
                const x = (xScale(d.date) ?? 0) + margin.left + xScale.bandwidth() / 2;
                setHoverInfo({ x, date: d.date });
            })
            .on('mouseout', () => {
                setHoverInfo(null);
            });

    }, [geoData, width, height, selectedCity]);

    return <> <div className="chart-titles">WP shells by day</div>
        <svg ref={svgRef} width={width} height={height} />
        {hoverInfo && (
            <div className="timeline-xaxis"
                style={{
                    position: 'absolute',
                    left: hoverInfo.x,
                    top: height + margin.top + margin.bottom + 40
                }}
            >
                {d3.timeFormat('%b %d')(hoverInfo.date)}
            </div>
        )}</>

}