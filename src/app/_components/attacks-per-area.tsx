"use client"
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import "../globals.css";
import styles from './mapembed.module.css';
import { colorPalette } from "./color-palette";

export function AttacksPerArea() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const ATTACK_DATA = './data/attacksperarea.csv';

    useEffect(() => {
        function BarChart(svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>, data: any, {
            x = (d: any) => d.Attacks,
            y = (d: any) => d.Area,
            marginTop = 20,
            marginRight = 20,
            marginBottom = 30,
            marginLeft = 100,
            width = 640,
            height = 400,
            xDomain,
            xRange = [marginLeft, width - marginRight],
            yDomain,
            yRange = [marginTop, height - marginBottom],
            xFormat,
            yPadding = 0.3,
            xLabel,
            color = `${colorPalette().HIGHLIGHT}`
        } = {}) {
            // Compute values.
            const X = d3.map(data, x);
            const Y = d3.map(data, y);

            // custom color scale
            const customColors = [
                colorPalette().SECONDARY,
                "#ECA281", // Light Salmon
                "#F69169", // Coral
                "#FF6347", // Orange Red
                colorPalette().HIGHLIGHT  // Red
            ];
            const colorScale = d3.scaleQuantile<string>()
                .domain([0, d3.max(X)])
                .range(customColors);
            // const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            //     .domain([0, d3.max(X)]);

            // Compute default domains, and unique the y-domain.
            if (xDomain === undefined) xDomain = [0, d3.max(X)];
            if (yDomain === undefined) yDomain = Y;
            yDomain = new d3.InternSet(yDomain);

            // Omit any data not present in the y-domain.
            const I = d3.range(X.length).filter(i => yDomain.has(Y[i]));

            // Construct scales and axes.
            const xScale = d3.scaleLinear(xDomain, xRange);
            const yScale = d3.scaleBand(yDomain, yRange).padding(yPadding);
            const xAxis = d3.axisBottom(xScale).ticks(width / 40, xFormat);
            const yAxis = d3.axisLeft(yScale).tickSizeOuter(0);

            // Clear existing content
            svg.selectAll("*").remove();

            svg.attr("width", width)
                .attr("height", height)
                .attr("viewBox", [0, 0, width, height])
                .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

            //x-grid
            svg.append("g")
                .attr("class", "grid")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(d3.axisBottom(xScale)
                    .tickSize(-(height - yPadding - marginTop - marginBottom))
                    .tickFormat("" as any))
                .call(g => g.select(".domain").remove())
                .call(g => g.selectAll(".tick line")
                    .attr("stroke", `${colorPalette().SILVER}`)
                    .attr("stroke-opacity", 0.3)
                    .attr("stroke-dasharray", "4"));

            //x-axis
            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(xAxis)
                // .call(g => g.select(".domain").remove())
                .call(g => g.append("text")
                    .attr("x", width - marginRight)
                    .attr("y", -4)
                    .attr("text-anchor", "end")
                    .text(xLabel))
                .call((g: any) => {
                    g.selectAll("text")
                        .attr("fill", `${colorPalette().BRIGHT}`)
                        .style("font-family", "'Inconsolata',monospace")
                        .style("font-size", "14px");
                });

            //y-grid
            // svg.append("g")
            //     .attr("class", "grid y-grid")
            //     .attr("transform", `translate(${marginLeft},0)`)
            //     .call(d3.axisLeft(yScale)
            //         .tickSize(-(width - marginLeft - marginRight))
            //         .tickFormat("" as any)
            //     )
            //     .call(g => g.select(".domain").remove())
            //     .call(g => g.selectAll(".tick line")
            //         .attr("stroke", `${colorPalette().BRIGHT}`)
            //         .attr("stroke-opacity", 0.3)
            //         .attr("stroke-dasharray", "4"));

            //y-axis
            const yAxisG = svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(yAxis)
            // .call(g => g.select(".domain").remove());

            // Add background rectangles
            // yAxisG.selectAll(".tick")
            //     .insert("rect", "text") // Insert rect before text
            //     .attr("x", -marginLeft)
            //     .attr("y", -yScale.bandwidth() / 2)
            //     .attr("width", marginLeft - 10)
            //     .attr("height", yScale.bandwidth())
            //     .attr("fill", (d, i) => d3.color(colorScale(X[i])).darker(1).copy({opacity: 0.5}));

            // Style the text
            yAxisG.selectAll(".tick text")
                .attr("x", -10)
                .attr("dy", "0.32em")
                .attr("text-anchor", "end")
                .attr("fill", `${colorPalette().SILVER}`)
                .style("font-family", "'Inconsolata',monospace")
                .style("font-size", "14px");

            svg.append("g")
                // .attr("fill", color)
                .selectAll("rect")
                .data(I)
                .join("rect")
                .attr("x", xScale(0))
                .attr("y", i => yScale(Y[i]))
                .attr("width", i => xScale(X[i]) - xScale(0))
                .attr("height", yScale.bandwidth())
                .attr("fill", i => colorScale(X[i]));;
        }

        async function fetchData() {
            const data = await d3.csv(ATTACK_DATA, (d: any) => {
                return {
                    Area: d.Area,
                    Attacks: +d.Attacks
                };
            });
            return data;
        }

        fetchData().then((data) => {
            if (data && svgRef.current) {
                data.sort((a, b) => b.Attacks - a.Attacks);
                const margin = { top: 20, right: 30, bottom: 30, left: 100 };
                const width = window.innerWidth / 2 - margin.left - margin.right;
                const height = 800 - margin.top - margin.bottom;

                const svg = d3.select(svgRef.current);
                BarChart(svg, data, {
                    x: d => d.Attacks,
                    y: d => d.Area,
                    yDomain: d3.groupSort(data, ([d]) => -d.Attacks, d => d.Area),
                    xFormat: "",
                    xLabel: "→ Number of Attacks",
                    width,
                    height,
                    color: `${colorPalette().HIGHLIGHT}`,
                    marginLeft: 100
                });
            }
        });
    }, []);

    return (
        <section className="mb-20 mt-40 md:justify-between">
            <div className={`text-2xl tracking-wide ${styles.bright}`}>Attacks per Area</div>
            <div className={`${styles.chartMinWidth}`}>
                <svg ref={svgRef} />
            </div>
        </section>
    );
}