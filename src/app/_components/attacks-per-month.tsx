"use client"
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../globals.css";
import styles from './mapembed.module.css';
import { colorPalette } from "./color-palette";

export function AttacksPerMonth() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const ATTACK_DATA = './data/attackspermonth.csv';
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        function handleResize() {
            setDimensions({
                width: window.innerWidth / 3,
                height: 600
            });
        }

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        function BarChart(svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>, data: any, {
            x = (d: any) => d.Month,
            y = (d: any) => d.Attacks,
            marginTop = 30,
            marginRight = 20,
            marginBottom = 40,
            marginLeft = 40,
            width = dimensions.width,
            height = dimensions.height,
            xDomain,
            xRange = [marginLeft, width - marginRight],
            yType = d3.scaleLinear,
            yDomain,
            yRange = [height - marginBottom, marginTop],
            xPadding = 0.4,
            yFormat,
            yLabel
        } = {}) {
            // Compute values.
            const X = d3.map(data, x);
            const Y = d3.map(data, y);

            // custom color scale
            const customColors = [
                colorPalette().SECONDARY,
                "#ECA281", // Light Salmon
                "#FF6347", // Orange Red
                colorPalette().HIGHLIGHT  // Red
            ];

            const colorScale = d3.scaleQuantile<string>()
                .domain([0, d3.max(Y)])
                .range(customColors);

            // Compute default domains.
            if (xDomain === undefined) xDomain = X;
            if (yDomain === undefined) yDomain = [0, d3.max(Y)];

            // Construct scales and axes.
            const xScale = d3.scaleBand(xDomain, xRange).padding(xPadding);
            const yScale = yType(yDomain, yRange);
            const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
            const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);

            svg.attr("width", width)
                .attr("height", height)
                .attr("viewBox", [0, 0, width, height])
                .attr("style", "max-width: 100%; height: auto;");

            svg.selectAll("*").remove();

            //y-axis
            svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(yAxis)
                .call(g => g.select(".domain").remove())
                .call(g => g.selectAll(".tick line").clone()
                    .attr("x2", width - marginLeft - marginRight)
                    .attr("stroke-opacity", 0.1))
                .call(g => g.append("text")
                    .attr("x", -marginLeft)
                    .attr("y", marginTop-5)
                    .attr("text-anchor", "start")
                    .text(yLabel))
                .call((g: any) => {
                    g.selectAll("text")
                        .attr("fill", `${colorPalette().SILVER}`)
                        .style("font-family", "'Inconsolata',monospace")
                        .style("font-size", "1rem");
                });;

            svg.append("g")
                .attr("fill", colorPalette().HIGHLIGHT)
                .selectAll("rect")
                .data(data)
                .join("rect")
                .attr("x", d => xScale(d.Month))
                .attr("y", d => yScale(d.Attacks))
                .attr("height", d => yScale(0) - yScale(d.Attacks))
                .attr("width", xScale.bandwidth())
                .attr("fill", (d, i) => colorScale(Y[i]));

            //x-axis
            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(xAxis)
                .call((g: any) => {
                    g.selectAll("text")
                        .attr("fill", `${colorPalette().SILVER}`)
                        .style("font-family", "'Inconsolata',monospace")
                        .style("font-size", "1rem")

                        .attr("transform", "rotate(-60)") // Rotate text
                        .attr("y", 0)
                        .attr("x", -10)
                        .attr("dy", ".35em")
                        .style("text-anchor", "end");
                });;
        }

        async function fetchData() {
            const data = await d3.csv(ATTACK_DATA, (d: any) => {
                return {
                    Month: d.Month,
                    Attacks: +d.Attacks
                };
            });
            return data;
        }

        fetchData().then((data) => {
            if (data && svgRef.current) {
                // data.sort((a, b) => d3.ascending(a.Month, b.Month));

                const svg = d3.select(svgRef.current);
                BarChart(svg, data, {
                    x: d => d.Month,
                    y: d => d.Attacks,
                    yLabel: "↑ Number of Attacks",
                    width: dimensions.width,
                    height: dimensions.height,
                    marginLeft: 60
                });
            }
        });
    }, [dimensions]);

    return (
        <section className={`mb-20 mt-40 md:justify-between`}>
            <div className={`text-2xl tracking-wide ${styles.bright}`}>Attacks per Month</div>
            <br /><br />   <div className={`${styles.chartMinWidth}`}>
                <svg ref={svgRef} />
            </div>
        </section>
    );
}