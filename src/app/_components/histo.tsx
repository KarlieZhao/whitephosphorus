import * as d3 from "d3";
import React, { useRef, useState, useEffect } from "react";
import { geoDataProps } from "./datasource";
import { width } from "./datasource";
const RED_GRADIENT = d3.quantize(d3.interpolateRgb("#db2f0f", "#2e1f1f"), 16);

export const parseDate = d3.timeParse('%Y-%m-%d'); //return Date 

export function Histogram({ geoData, selectedCity, selectedDates, selectedDay, selectedAreaType, onBarClick }: geoDataProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [dimensions, setDimensions] = useState({ width: width, height: 480 });
    const colorIndexRef = useRef<number[]>(Array(30).fill(0));
    const hasSorted = useRef(false);
    const [allCityNames, setAllCityNames] = useState<string[]>([]);

    const highlightHovered = (event: MouseEvent, d: { name: string, count: number }) => {
        const target = event.currentTarget as SVGRectElement;
        const index = d3.select(svgRef.current).selectAll("rect.interaction").nodes().indexOf(target);
        d3.select(svgRef.current).selectAll("rect.render").filter((_, i) => i === index).attr("fill", "#cf705f");
        d3.select(svgRef.current).selectAll(".chart-labels")
            .filter((_, i) => i === index).attr("fill", "#eee");
    }

    const removeHighlight = (event: MouseEvent, d: { name: string, count: number }) => {
        if (d.name === selectedCity) return;
        const target = event.currentTarget as SVGRectElement;
        const index = d3.select(svgRef.current).selectAll("rect.interaction").nodes().indexOf(target);
        d3.select(svgRef.current).selectAll("rect.render").filter((_, i) => i === index).attr("fill", RED_GRADIENT[colorIndexRef.current[index]]);
        d3.select(svgRef.current).selectAll(".chart-labels").filter((_, i) => i === index).attr("fill", "#aaa");
    }


    const getAllTownNames = (data: any[]): string[] => {
        const sorted = formatData(data);
        const towns = sorted.map(item => item.name)
        return Array.from(new Set(towns));
    }

    const formatData = (dataset: any[]) => {
        let processedData: { [key: string]: number } = {};
        dataset.forEach((item) => {
            if (item.town) {
                processedData[item.town] =
                    (processedData[item.town] || 0) + item.shell_count;
            }
        });
        const outgoing = Object.entries(processedData)
            .map(([name, count]) => ({ name, count }))

        if (hasSorted.current && allCityNames.length > 0) {
            return outgoing.sort(
                (a, b) =>
                    allCityNames.indexOf(a.name) - allCityNames.indexOf(b.name)
            );
        } else {
            // initial rendering: sort by count
            return outgoing.sort((a, b) => b.count - a.count);
        }
    };

    useEffect(() => {
        if (!geoData || geoData.length === 0) return;
        const newAllCityNames = getAllTownNames(geoData);
        if (JSON.stringify(newAllCityNames) !== JSON.stringify(allCityNames)) {
            setAllCityNames(newAllCityNames);
        }
    }, [geoData]);

    useEffect(() => {
        if (!geoData || geoData.length === 0) return;
        if (allCityNames.length <= 1) return;

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
        }
        // only sort on initial load
        let sortedData = formatData(filteredData);
        if (!hasSorted.current) {
            hasSorted.current = true;
        }

        const counts_ydomain = formatData(geoData).map((ele) => ele.count);
        const counts = sortedData.map((ele) => ele.count);
        let index = 0;

        colorIndexRef.current = counts.map((count, i) => {
            if (count !== counts[i - 1]) {
                index++;
            }
            return Math.min(index, RED_GRADIENT.length - 1);
        });

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // clear previous render

        const margin = { top: 5, right: 30, bottom: 5, left: 100 };
        const chartWidth = dimensions.width - margin.left - margin.right;
        const chartHeight = dimensions.height - margin.top - margin.bottom;

        const g = svg
            .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("width", dimensions.width)
            .attr("height", dimensions.height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        //scales
        const x = d3
            .scaleLinear()
            .domain([0, d3.max(counts_ydomain) || 0])
            .nice()
            .range([0, chartWidth]);

        const y = d3
            .scaleBand()
            .domain(allCityNames)
            .range([0, chartHeight])
            .padding(0.2);

        const yAxis = d3.axisLeft(y).tickSize(3);
        g.append("g")
            .call(yAxis)
            .selectAll("text")
            .attr('class', 'chart-labels')
            .attr('fill', "#aaa");

        // color bars
        g.selectAll("rect.render")
            .data(sortedData)
            .enter()
            .append("rect")
            .attr("class", "render")
            .attr("y", (d) => y(d.name) || 0)
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", (d) => x(d.count))
            .attr("fill", (d, i) => RED_GRADIENT[colorIndexRef.current[i] || 0]);

        //interaction bars
        g.selectAll("rect.interaction")
            .data(sortedData)
            .enter()
            .append("rect")
            .attr("class", "interaction")
            .attr("y", (d) => y(d.name) || 0)
            .attr("x", -100)
            .attr("height", y.bandwidth() + 5)
            .attr("width", (d) => x(d.count) + 100)
            .attr("fill", "transparent")
            .style("cursor", "pointer")
            .on('mouseover', (event, d) => {
                highlightHovered(event, d);
            })
            .on("mouseout", (event, d) => {
                removeHighlight(event, d);
            })
            .on('click', (_, d) => {
                if (onBarClick) onBarClick([d.name, d.count]);
            })

    }, [geoData, dimensions, selectedCity, selectedDates, selectedDay, selectedAreaType, allCityNames]);

    return <>
        <div className="chart-titles">By City</div>
        <svg ref={svgRef}></svg>
    </>;
}