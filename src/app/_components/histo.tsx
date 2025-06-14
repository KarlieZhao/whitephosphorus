import * as d3 from "d3";
import React, { useRef, useState, useEffect } from "react";
import { geoDataProps } from "./datasource";
import { RED_GRADIENT } from "./datasource";
export function Histogram({ geoData, selectedCity, onBarClick }: geoDataProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [dimensions, setDimensions] = useState({ width: 300, height: 440 });
    let colorIndex = Array(30).fill(0);

    const highlightHovered = (event: MouseEvent, d: [string, number]) => {
        const target = event.currentTarget as SVGRectElement;
        const index = d3.select(svgRef.current).selectAll("rect.interaction").nodes().indexOf(target);
        d3.select(svgRef.current).selectAll("rect.render").filter((_, i) => i === index).attr("fill", "#cf705f");
        d3.select(svgRef.current).selectAll(".chart-labels")
            .filter((_, i) => i === index).attr("fill", "#eee");
    }

    const removeHighlight = (event: MouseEvent, d: [string, number]) => {
        if (d[0] === selectedCity) return;
        const target = event.currentTarget as SVGRectElement;
        const index = d3.selectAll("rect.interaction").nodes().indexOf(target);
        d3.select(svgRef.current).selectAll("rect.render").filter((_, i) => i === index).attr("fill", RED_GRADIENT[colorIndex[index]]);
        d3.select(svgRef.current).selectAll(".chart-labels").filter((_, i) => i === index).attr("fill", "#aaa");
    }

    const sortData = () => {
        if (!geoData || geoData.length === 0) return;
        let processedData: { [key: string]: number } = {};
        geoData.forEach((item) => {
            if (item.name) {
                processedData[item.name] = (processedData[item.name] || 0) + 1;
            }
        });
        return Object.entries(processedData).sort(([, a], [, b]) => b - a);
    }

    useEffect(() => {
        const sortedData = sortData();
        if (!sortedData) return;
        const names = sortedData.map((ele) => ele[0]);
        const counts = sortedData.map((ele) => ele[1]);
        let index = 0;

        colorIndex = counts.map((count, i) => {
            if (count != counts[i - 1]) {
                index++;
            }
            return index;
        });

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // clear previous render

        const margin = { top: 5, right: 30, bottom: 30, left: 100 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

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
            .domain([0, d3.max(counts) || 0])
            .nice()
            .range([0, width]);

        const y = d3
            .scaleBand()
            .domain(names)
            .range([0, height])
            .padding(0.2);

        const yAxis = d3.axisLeft(y);
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
            .attr("y", ([name]) => y(name)!)
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", ([, count]) => x(count))
            .attr("fill", ([], i) => RED_GRADIENT[colorIndex[i]]);

        //interaction bars
        g.selectAll("rect.interaction")
            .data(sortedData)
            .enter()
            .append("rect")
            .attr("class", "interaction")
            .attr("y", ([name]) => y(name)!)
            .attr("x", -100)
            .attr("height", y.bandwidth() + 5)
            .attr("width", ([]) => width + 100)
            .attr("fill", "transparent")
            .on('mouseover', (event, d) => {
                highlightHovered(event, d);
                // if (onBarClick) onBarClick(d);

            })
            .on("mouseout", (event, d) => {
                removeHighlight(event, d);
                // if (onBarClick) onBarClick(null);
            })
            .on('mousedown', (_, d) => {
                if (onBarClick) onBarClick(d);
            })

    }, [geoData, dimensions, selectedCity]);

    return <>
        <div className="chart-titles">WP shells by City</div>
        <svg ref={svgRef}></svg></>;
}