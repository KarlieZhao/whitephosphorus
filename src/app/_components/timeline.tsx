import * as d3 from "d3";
import React, { useRef, useState, useEffect } from "react";
import { geoDataProps } from "./datasource";
import { width } from "./datasource";

export default function Timeline({ geoData, selectedCity, selectedDates, onTimelineDragged }: geoDataProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const startDateRef = useRef<Date | null>(null);
    const [hoverInfo, setHoverInfo] = useState<{ x: number; date: Date } | null>(null);
    const margin = { top: 10, right: 10, bottom: 5, left: 10 };
    const height = 55;
    // const [dimensions, setDimensions] = useState({ width: 300, height: 440 });

    const getTotalCounts = (data: typeof geoData) => {
        const counts = new Map<string, number>();
        data.forEach(d => {
            counts.set(d.date, (counts.get(d.date) ?? 0) + 1);
        });
        return counts;
    }

    function scaleColor(maxCount: number) {
        return d3.scaleSequential()
            .domain([0, maxCount + 1])
            .interpolator(d3.interpolateRgb("#2e1f1f", "#db2f0f"));
    }
    const highlightSelection = (rangeStart: Date, rangeEnd: Date, d: Date) => {
        return (d >= rangeStart && d <= rangeEnd) ? 1 : 0.5;
    }

    const parseDate = d3.timeParse('%Y-%m-%d'); //return Date 
    const formatDate = d3.timeFormat("%Y-%m-%d"); // return string
    const totalCounts = getTotalCounts(geoData);

    // full date range (unfiltered)
    const dates = Array.from(totalCounts.keys()).map(d => parseDate(d)!);
    const minDate = d3.min(dates)!
    const maxDate = d3.max(dates)!
    const allDates: Date[] = d3.timeDay.range(minDate, d3.timeDay.offset(maxDate, 1));

    const getFilteredCounts = (data: typeof geoData, city?: string) => {
        const filtered = city ? data.filter(d => d.name === city) : data;
        const counts = new Map<string, number>();
        filtered.forEach(d => {
            counts.set(d.date, (counts.get(d.date) ?? 0) + 1);
        });
        return counts;
    }

    useEffect(() => {
        if (!geoData || geoData.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous content

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const filteredCounts = getFilteredCounts(geoData, selectedCity);
        const maxCount = Math.max(...Array.from(filteredCounts.values()), 0);

        const countsByDate = allDates.map(date => ({
            date,
            count: filteredCounts.get(formatDate(date)) ?? 0
        }));

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // X Scale
        const xScale = d3.scaleBand<Date>()
            .domain(countsByDate.map(d => d.date))
            .range([0, innerWidth])
        // .padding(0.1);

        const RED_GRADIENT = scaleColor(maxCount);

        // Draw bars
        g.selectAll('rect')
            .data(countsByDate)
            .enter()
            .append('rect')
            .attr('x', d => xScale(d.date)!)
            .attr('y', 0)
            .attr('width', xScale.bandwidth())
            .attr('height', innerHeight)
            .attr('fill', d => RED_GRADIENT(d.count))
            .on('mouseover', function (e, d) {
                const x = (xScale(d.date) ?? 0) + margin.left + xScale.bandwidth() / 2;
                d3.select(this).attr("fill", "red");
                setHoverInfo({ x, date: d.date });
            })
            .on('mouseout', function (e, d) {
                setHoverInfo(null);
                d3.select(this).attr('fill', (d: any) => RED_GRADIENT(d.count))
            })
            .on('mousedown', function (e, d) {
                startDateRef.current = d.date;
            })
            .on('mousemove', function (e, d) {
                if (!startDateRef.current) return;
                const start = startDateRef.current;
                const current = d.date;
                const rangeStart = start < current ? start : current;
                const rangeEnd = start > current ? start : current;

                g.selectAll('rect')
                    .attr('opacity', (rectData: any) => {
                        if (!rectData || !rectData.date) { return 0.7; }
                        else return (rectData.date >= rangeStart && rectData.date <= rangeEnd ? 1 : 0.5)
                    });
            })
            .on('mouseup', function (e, d) {
                if (startDateRef.current) {
                    const start = startDateRef.current;
                    const end = d.date;

                    // normalize so start <= end
                    const rangeStart = start < end ? start : end;
                    const rangeEnd = start > end ? start : end;

                    const theDates: [string, string] = [formatDate(rangeStart), formatDate(rangeEnd)];
                    if (onTimelineDragged) onTimelineDragged(theDates);
                }
                // Reset startDateRef
                startDateRef.current = null;
            })

        if (selectedDates && selectedDates[0] && selectedDates[1]) {
            const start = parseDate(selectedDates[0])!;
            const end = parseDate(selectedDates[1])!;
            g.selectAll('rect')
                .attr('opacity', (rectData: any) => highlightSelection(start, end, rectData.date));
        } else {
            g.selectAll('rect').attr('opacity', 0.5);
        }


    }, [geoData, width, height, selectedDates, selectedCity]);

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