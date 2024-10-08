"use client";
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { useWindowHeight } from "@/lib/resize";

type dataT = {
  x: number;
  y: number;
  value: number;
};

const HeatMapAnimation = () => {
  const svgRef = useRef(null);
  const frameHeight = useWindowHeight() * 0.7;
  const xTotal = 43;

  const xLabels = new Array(xTotal).fill(0).map((_, i) => `${i}`);

  // Display only even xLabels
  const xLabelsVisibility = xLabels.map((_, i) => i % 2 === 0);

  // Define yLabels as per your list
  const yLabels = [
    "El Merri",
    "Talet Irmis",
    "Dhaira",
    "Ramiye",
    "El Boustane",
    "Aita Ech Chaab",
    "Marouahine",
    "Meiss El Jabal",
    "Yaroun",
    "South Lebanon",
    "Markaba",
    "Mhaibib",
    "Blida",
    "Al Khiam",
    "Marjayoun",
    "Borj El Mlouk",
    "Kfar Kila",
    "Kfar Chouba",
    "Naqoura",
    "Alma Echaab",
    "El Hamames",
    "Aadaisse",
    "Houla",
    "Rmaysh",
    "Aitaroun",
    "Talloussa",
    "Chebaa",
    "Maroun Er Ras",
    "Deir Mimass",
    "Halta",
    "Abbassiye",
    "Rachaiya El Foukhar",
    "Yohmor",
    "Deir Sirian",
    "Taybeh",
  ];

  // Generate random data for the heat map
  const data = yLabels.map(() =>
    xLabels.map(() => Math.floor(Math.random() * 100))
  );

  useEffect(() => {
    // Clear any existing content inside the SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Set dimensions and margins
    const margin = { top: 20, right: 20, bottom: 50, left: 150 };
    const availableWidth = 1000 - margin.left - margin.right; // edit the width of the heatmap
    const availableHeight = frameHeight - margin.top - margin.bottom;

    const numRows = yLabels.length;
    const numCols = xLabels.length;

    // Calculate cell size to make cells square
    const cellSize = Math.min(
      availableWidth / numCols,
      availableHeight / numRows
    );

    // Calculate the plot width and height based on cell size
    const plotWidth = cellSize * numCols;
    const plotHeight = cellSize * numRows;

    // Update actual SVG width and height
    const svgWidth = plotWidth + margin.left + margin.right;
    const svgHeight = plotHeight + margin.top + margin.bottom;

    // Flatten data for D3
    const flatData: dataT[] = [];
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        flatData.push({
          x: j,
          y: i,
          value: data[i][j],
        });
      }
    }

    // Create SVG container
    const svg = d3
      .select(svgRef.current)
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(d3.range(numCols))
      .range([0, plotWidth])
      .padding(0.05);

    const yScale = d3
      .scaleBand()
      .domain(d3.range(numRows))
      .range([0, plotHeight])
      .padding(0.05);

    // Add X-axis labels
    g.append("g")
      .attr("transform", `translate(0, ${plotHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickFormat((d: dataT, i: number) => (xLabelsVisibility[i] ? xLabels[i] : ""))
      )
      .selectAll("text")
      .style("text-anchor", "middle")
      .style("font-size", "10px");

    // Add Y-axis labels
    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat((d: dataT, i: number) => yLabels[i]))
      .selectAll("text")
      .style("text-anchor", "end")
      .style("font-size", "10px");

    // Bind data and create rectangles
    const cells = g
      .selectAll("rect")
      .data(flatData)
      .enter()
      .append("rect")
      .attr("x", (d: dataT) => xScale(d.x)!)
      .attr("y", (d: dataT) => yScale(d.y)!)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .style("fill", "#ffffff00")
      .style("stroke", "#ccc");

    // Tooltip for displaying values
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "5px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "3px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    cells
      .on("mouseover", (event: MouseEvent, d: dataT) => {
        tooltip
          .style("opacity", 0.85)
          .html(`<table>
            <tr><td>Time: ${d.x}</td></tr>
            <tr><td>Location: ${yLabels[d.y]} </td></tr>
            <tr><td>Footage: ${d.value}</td></tr>
            </table>`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      })
      .on("click", (event: MouseEvent, d: dataT) => {
        // displayFootageInsights(url_from_footage_index);
      });


    function displayFootageInsights(url: string) {

    }
    
    // Animation: fill in each column horizontally
    let currentColumn = 0;

    function animateColumn() {
      if (currentColumn >= numCols) return;

      cells
        .filter((d: dataT) => d.x === currentColumn)
        .transition()
        .duration(500)
        .style("fill", (d: dataT) => {
          const opacity = 1 - (100 - d.value) / 100;
          return `rgba(244, 86, 66, ${opacity})`;
        });

      currentColumn++;
      setTimeout(animateColumn, 100); // Delay before animating the next column
    }

    animateColumn();

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [frameHeight]);

  return (
    <div className="px-2 pt-10 flex flex-col items-center justify-center">
      <section style={{ width: `60vw`, height: `${frameHeight}px` }}>
        <svg ref={svgRef}></svg>
      </section>
    </div>
  );
};

export default HeatMapAnimation;
