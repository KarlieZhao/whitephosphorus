"use client"
 import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "../globals.css";
import styles from './mapembed.module.css';
import { colorPalette } from "./color-palette";
  
export function Cyberspace() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const URL_TWITTERDATA = './data/aapl.csv';

    useEffect(() => {
        async function fetchData() {
            const data = await d3.csv(URL_TWITTERDATA, d => {
                return {
                    date: d3.timeParse("%Y-%m-%d")(d.Date),
                    value: +d.Close
                };
            });
            return data;
        }

        fetchData().then((data) => {
            // Set up chart dimensions
            const margin = { top: 20, right: 30, bottom: 20, left: 40 };
            const width = 800 - margin.left - margin.right;
            const height = 400 - margin.top - margin.bottom;

            // Create scales
            const x = d3
                .scaleTime()
                .domain(d3.extent(data, (d) => d.date) as [Date, Date])
                .range([margin.left, width - margin.right]);

            const y = d3
                .scaleLinear()
                .domain([0, d3.max(data, (d) => d.value)] as [number, number])
                .nice()
                .range([height - margin.bottom, margin.top]);

            // Create axes
            const xAxis = (g: any) =>
                g
                    .attr("transform", `translate(0,${height - margin.bottom})`)
                    .call(d3.axisBottom(x)
                        .ticks(width / 40)
                        .tickSizeOuter(0))
                    .call((g: any) => {
                        g.selectAll("text")
                            .attr("fill", `${colorPalette().BRIGHT}`)
                            .style("font-family", "'Courier New', Courier, monospace")
                            .style("font-size", "7px");
                        g.selectAll("line")
                            .style("stroke-width", "0.5px");
                        g.select(".domain")
                            .style("stroke-width", "0.5px");
                    });

            const yAxis = (g: any) =>
                g
                    .attr("transform", `translate(${margin.left},0)`)
                    .call(d3.axisLeft(y)
                        .ticks(14)
                    )
                    .call((g: any) => g.select(".domain").remove())
                    .call((g: any) => {
                        g.selectAll("text")
                        .attr("fill", `${colorPalette().BRIGHT}`)
                        .style("font-family", "'Courier New', Courier, monospace")
                        .style("font-size", "7px");
                        g.selectAll("line")
                            .style("stroke-width", "0.5px");
                        g.select(".domain")
                            .style("stroke-width", "0.5px");
                    });

            // Add grid lines
            const xGrid = (g: any) =>
                g
                    .attr("stroke",`${colorPalette().BRIGHT}`)
                    .attr("stroke-opacity", 0.1)
                    .call((g: any) =>
                        g
                            .append("g")
                            .selectAll("line")
                            .data(x.ticks(20))
                            .join("line")
                            .attr("x1", (d: any) => 0.5 + x(d))
                            .attr("x2", (d: any) => 0.5 + x(d))
                            .attr("y1", margin.top)
                            .attr("y2", height - margin.bottom)
                            .attr("stroke-dasharray", "4")
                    );

            const yGrid = (g: any) =>
                g
                    .attr("stroke",`${colorPalette().BRIGHT}`)
                    .attr("stroke-opacity", 0.1)
                    .call((g: any) =>
                        g
                            .append("g")
                            .selectAll("line")
                            .data(y.ticks())
                            .join("line")
                            .attr("y1", (d: any) => 0.5 + y(d))
                            .attr("y2", (d: any) => 0.5 + y(d))
                            .attr("x1", margin.left)
                            .attr("x2", width - margin.right)
                            .attr("stroke-dasharray", "4")
                    );

            // Line generator
            const line = d3
                .line()
                .defined((d: any) => !isNaN(d.value))
                .x((d: any) => x(d.date))
                .y((d: any) => y(d.value));

            // Create the SVG element
            const svg = d3
                .select(svgRef.current)
                .attr("viewBox", [0, 0, width, height].join(" "));

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
            const totalLength = path.node()?.getTotalLength();

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
        <section className="mb-20 mt-40 md:justify-between">
            <h1 className={`text-7xl tracking-wide ${styles.bright}`}>CYBERSPACE</h1>
            {/* <div className={` ${styles.bright} w-7/12 text-md mb-5`}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.  */}
            {/* </div> */}
            <div className={`${styles.chartMinWidth}`}>  < svg ref={svgRef} /></div>
        </section>
    );
};
