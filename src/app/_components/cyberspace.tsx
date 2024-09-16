"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "../globals.css";
import styles from './mapembed.module.css';
import { colorPalette } from "./color-palette";

type DataPoint = {
    date: Date | null;
    value: number;
};

export function Cyberspace() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const URL_TWITTERDATA = './data/aapl.csv';

    useEffect(() => {
        async function fetchData(): Promise<DataPoint[]> {
            const data = await d3.csv(URL_TWITTERDATA, (d: d3.DSVRowString<string>) => {
                return {
                    date: d3.timeParse("%Y-%m-%d")(d.Date) || null,
                    value: +d.Close
                } as DataPoint;
            });
            return data;
        }

        fetchData().then((data) => {
            if (!data || !svgRef.current) return;

            // Set up chart dimensions
            const margin = { top: 20, right: 30, bottom: 20, left: 40 };
            const width = 1100 - margin.left - margin.right;
            const height = 900 - margin.top - margin.bottom;

            // Create scales
            const x = d3
                .scaleTime()
                .domain(d3.extent(data, (d: DataPoint) => d.date) as [Date, Date])
                .range([margin.left, width - margin.right]);

            const y = d3
                .scaleLinear()
                .domain([0, d3.max(data, (d: DataPoint) => d.value)] as [number, number])
                .nice()
                .range([height - margin.bottom, margin.top]);

            // Create axes
            const xAxis = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
                g
                    .attr("transform", `translate(0,${height - margin.bottom})`)
                    .call(d3.axisBottom(x)
                        .ticks(width / 80)
                        .tickSizeOuter(0))
                    .call((g) => {
                        g.selectAll("text")
                            .attr("fill", `${colorPalette().BRIGHT}`)
                            .style("font-family", "'Courier New', Courier, monospace")
                            .style("font-size", "14px");
                        g.selectAll("line")
                            .style("stroke-width", "0.5px");
                        g.select(".domain")
                            .style("stroke-width", "0.5px");
                    });

            const yAxis = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
                g
                    .attr("transform", `translate(${margin.left},0)`)
                    .call(d3.axisLeft(y)
                        .ticks(14))
                    .call((g) => g.select(".domain").remove())
                    .call((g) => {
                        g.selectAll("text")
                            .attr("fill", `${colorPalette().BRIGHT}`)
                            .style("font-family", "'Courier New', Courier, monospace")
                            .style("font-size", "14px");
                        g.selectAll("line")
                            .style("stroke-width", "0.5px");
                    });

            // Add grid lines
            const xGrid = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
                g
                    .attr("stroke", `${colorPalette().BRIGHT}`)
                    .attr("stroke-opacity", 0.1)
                    .call((g) =>
                        g
                            .append("g")
                            .selectAll("line")
                            .data(x.ticks(20))
                            .join("line")
                            .attr("x1", (d) => 0.5 + (x(d) ?? 0))
                            .attr("x2", (d) => 0.5 + (x(d) ?? 0))
                            .attr("y1", margin.top)
                            .attr("y2", height - margin.bottom)
                            .attr("stroke-dasharray", "4")
                    );

            const yGrid = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
                g
                    .attr("stroke", `${colorPalette().BRIGHT}`)
                    .attr("stroke-opacity", 0.1)
                    .call((g) =>
                        g
                            .append("g")
                            .selectAll("line")
                            .data(y.ticks())
                            .join("line")
                            .attr("y1", (d) => 0.5 + y(d))
                            .attr("y2", (d) => 0.5 + y(d))
                            .attr("x1", margin.left)
                            .attr("x2", width - margin.right)
                            .attr("stroke-dasharray", "4")
                    );

            // Line generator
            const line = d3.line()
                .defined((d: DataPoint) => d.date !== null && !isNaN(d.value))
                .x((d: DataPoint) => x(d.date as Date))
                .y((d: DataPoint) => y(d.value));
                
            // Create the SVG element
            const svg = d3
                .select(svgRef.current)
                .attr("viewBox", [0, 0, width, height].join(" "))
                .append("g");

            svg.append("g").call(xGrid);
            svg.append("g").call(yGrid);
            svg.append("g").call(xAxis);
            svg.append("g").call(yAxis);

            // Create the path element
            const path = svg
                .append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", `${colorPalette().HIGHLIGHT}`)
                .attr("stroke-width", 1)
                .attr("d", line);

            // Animate the line drawing
            const totalLength = path.node()?.getTotalLength() || 0;

            path
                .attr("stroke-dasharray", `${totalLength},${totalLength}`)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(7500)
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0);
        });
    }, []);

    return (
        <section className="mb-80 mt-32 md:justify-between bg-black">
            <div className={`tracking-wide ${styles.bright} text-2xl`}>TWITTER TREND</div>
            <div className={`${styles.chartMinWidth} overflow-x-auto`}>
                <svg ref={svgRef} />
            </div>
        </section>
    );
}
