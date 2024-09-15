"use client"
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { ScaleQuantile, scaleQuantile } from 'd3-scale';
import "../globals.css";
import styles from './mapembed.module.css';
import { colorPalette } from "./color-palette";

interface DataPoint {
    Area: string;
    Attacks: number;
}

export function AttacksPerArea() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const ATTACK_DATA = './data/attacksperarea.csv';

    useEffect(() => {
        function BarChart(
            svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
            data: DataPoint[],
            {
                x = (d: DataPoint) => d.Attacks,
                y = (d: DataPoint) => d.Area,
                marginTop = 20,
                marginRight = 20,
                marginBottom = 30,
                marginLeft = 100,
                width = 640,
                height = 400,
                xDomain,
                xRange = [marginLeft, width - marginRight] as [number, number],
                yDomain,
                yRange = [marginTop, height - marginBottom] as [number, number],
                xFormat,
                yPadding = 0.3,
                xLabel,
                color = `${colorPalette().HIGHLIGHT}`
            }: {
                x?: (d: DataPoint) => number;
                y?: (d: DataPoint) => string;
                marginTop?: number;
                marginRight?: number;
                marginBottom?: number;
                marginLeft?: number;
                width?: number;
                height?: number;
                xDomain?: [number, number];
                xRange?: [number, number];
                yDomain?: string[];
                yRange?: [number, number];
                xFormat?: string;
                yPadding?: number;
                xLabel?: string;
                color?: string;
            } = {}
        ) {
            // Compute values.
            const X = data.map(x);
            const Y = data.map(y);

            // Custom color scale
            const customColors = [
                colorPalette().SECONDARY,
                "#ECA281",
                "#F69169",
                "#FF6347",
                colorPalette().HIGHLIGHT
            ];
            const colorScale: ScaleQuantile<string, never> = scaleQuantile<string>()
                .domain([0, d3.max(X) ?? 0])
                .range(customColors);

            // Compute default domains, and unique the y-domain.
            if (xDomain === undefined) xDomain = [0, d3.max(X) ?? 0];
            if (yDomain === undefined) yDomain = Array.from(new Set(Y));

            // Omit any data not present in the y-domain.
            const I = d3.range(X.length).filter((i: number) => yDomain.includes(Y[i]));
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

            // x-grid
            svg.append("g")
                .attr("class", "grid")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(
                    d3.axisBottom(xScale)
                        .tickSize(-(height - yPadding - marginTop - marginBottom))
                        .tickFormat(() => '')
                )
                .call(g => g.select(".domain").remove())
                .call(g => g.selectAll(".tick line")
                    .attr("stroke", `${colorPalette().SILVER}`)
                    .attr("stroke-opacity", 0.3)
                    .attr("stroke-dasharray", "4"));

            // x-axis
            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(xAxis)
                .call(g => g.append("text")
                    .attr("x", width - marginRight)
                    .attr("y", -4)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "end")
                    .text(xLabel ?? null))
                .call(g => {
                    g.selectAll("text")
                        .attr("fill", `${colorPalette().BRIGHT}`)
                        .style("font-family", "'Inconsolata',monospace")
                        .style("font-size", "14px");
                });

            // y-axis
            const yAxisG = svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(yAxis);

            // Style the text
            yAxisG.selectAll(".tick text")
                .attr("x", -10)
                .attr("dy", "0.32em")
                .attr("text-anchor", "end")
                .attr("fill", `${colorPalette().SILVER}`)
                .style("font-family", "'Inconsolata',monospace")
                .style("font-size", "14px");

            svg.append("g")
                .selectAll<SVGRectElement, number>("rect")
                .data<number>(I)
                .join("rect")
                .attr("x", xScale(0))
                .attr("y", (d: number) => yScale(Y[d]) ?? 0)
                .attr("width", (d: number) => xScale(X[d]) - xScale(0))
                .attr("height", yScale.bandwidth())
                .attr("fill", (d: number) => colorScale(X[d]));

        }

        async function fetchData(): Promise<DataPoint[]> {
            const data = await d3.csv(ATTACK_DATA, (d: DataPoint): DataPoint => ({
                Area: d.Area,
                Attacks: +d.Attacks
            }));
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
                    yDomain: d3.groupSort(data, ([d]: [DataPoint]) => -d.Attacks, (d: DataPoint) => d.Area),
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