"use client";
import React, { useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import { useWindowHeight } from "@/lib/resize";

type IncidentData = {
  date: string;
  area: string;
  count: number;
};

type HeatMapProps = {
  data: IncidentData[];
};

//entry data for D3
type CellData = { x: number; y: number; value: number };

const HeatMapAnimation: React.FC<HeatMapProps> = ({ data }) => {
  const svgRef = useRef(null);
  const [frameWidth, setFrameWidth] = useState(5000);
  const frameHeight = useWindowHeight() * 13;

  const processData = () => {
    const uniqueDates = Array.from(new Set(data.map(d => d.date))).filter(Boolean);
    const uniqueAreas = Array.from(new Set(data.map(d => d.area))).filter(Boolean);

    // 2D array
    // dates === rows 
    // areas === columns
    const processedData = uniqueDates.map(date => {
      return uniqueAreas.map(area => {
        const incident = data.find(d => d.date === date && d.area === area);
        return incident?.count || 0;
      });
    });

    return {
      xLabels: uniqueAreas,
      yLabels: uniqueDates,
      yLabelsVisibility: uniqueDates.map((_, i) => i % 1 === 0),
      processedData
    };
  }

  useEffect(() => {
    const { xLabels, yLabels, yLabelsVisibility, processedData } = processData();

    //format yLabels (dates) for label
    const yLabelsFormatted = yLabels.map(d => {
      const [year, month, day] = d.split('-');
      return `${month}-${day}`; // Format as "MM-DD"
    });

    //total incidents for each area
    const areaTotals = xLabels.map((area, index) => ({
      area,
      total: d3.sum(processedData.map(row => row[index]))
    }));

    xLabels.sort((a, b) => {
      const totalA = areaTotals.find(t => t.area === a)?.total || 0;
      const totalB = areaTotals.find(t => t.area === b)?.total || 0;
      return totalB - totalA;
    });

    const xLabelIndices = xLabels.map(area => areaTotals.findIndex(t => t.area === area));

    const sortedProcessedData = processedData.map(row =>
      xLabelIndices.map(index => row[index])
    );

    //============ rendering SVG ==============
    //clean up SVG
    d3.select(svgRef.current).selectAll("*").remove();

    //set svg dimensions and margins
    const margin = { top: 100, right: 50, bottom: 40, left: 55 };
    const availableHeight = frameHeight - margin.top - margin.bottom;

    const numRows = yLabels.length; //dates
    const numCols = xLabels.length; //areas

    //calculate cell size to make cells square
    const cellSize = availableHeight / numRows;
    // setFrameWidth(numCols * cellSize * 1.6 + 100);
    const plotWidth = cellSize * numCols;
    const plotHeight = cellSize * numRows;

    // Update actual SVG width and height
    const svgWidth = plotWidth + margin.left + margin.right;
    const svgHeight = plotHeight + margin.top + margin.bottom;

    // Flatten data for D3
    const flatData = [];
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        flatData.push({
          x: j, // Area index
          y: i, // Date index
          value: sortedProcessedData[i][j],
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

    //x-axis labels (Areas)
    g.append("g")
      .attr("transform", `translate(0, 0)`)
      .call(
        d3
          .axisTop(xScale)
          .tickFormat((i: number) => (xLabels[i]))
      )
      .selectAll("text")
      .style("text-anchor", "start")
      .style("font-size", "12px")
      .style("fill", "#ccc")
      .attr("transform", "rotate(-60)")
      .attr("dx", "0.5em")
      .attr("dy", "-0.2em");

    //y-axis labels (Dates)
    g.append("g")
      .call(
        d3.axisLeft(yScale)
          .tickFormat((_: any, i: number) => yLabelsVisibility[i] ? yLabelsFormatted[i] : "")
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .style("font-size", "10px")
      .style("fill", "#ccc")
      ;

    // Bind data
    const cells = g
      .selectAll("rect")
      .data(flatData)
      .enter()
      .append("rect")
      .attr("x", (d: CellData) => xScale(d.x)!)
      .attr("y", (d: CellData) => yScale(d.y)!)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .style("fill", "#ffffff00")
      .style("stroke", "#333");

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

    cells.filter((d: CellData) => d.value > 0)
      .attr("class", "activeCells")
      .on("mouseover", (event: MouseEvent, d: CellData) => {
        tooltip
          .style("opacity", 0.9)
          .html(`<table>
            <tr><td>${yLabels[d.y]}</td></tr>
            <tr><td>${xLabels[d.x]}</td></tr>
            <tr><td>${d.value} Incidents</td></tr>
            </table>`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 30 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      })
      .on("click", (event: MouseEvent, d: CellData) => {
      });


    // Animation: fill in each row vertically
    const maxValue = d3.max(sortedProcessedData.flat());
    let currentRow = 0;
    function animateRow() {
      if (currentRow >= numRows) return;

      cells
        .filter((d: CellData) => d.y === currentRow)
        .transition()
        .duration(300)
        .attr("x", (d: CellData) => xScale(d.x) ?? 0)
        .attr("y", (d: CellData) => yScale(d.y) ?? 0)
        .style("fill", (d: CellData) => {
          let opacity = 1 - ((maxValue) - d.value) / (maxValue);
          opacity = opacity === 0 ? 0 : scale(opacity, 0, 1, 0.3, 1.0);
          return `rgba(255, ${85 + 10 * opacity}, 66, ${opacity})`;
        });

      currentRow++;
      setTimeout(animateRow, 50);
    }

    function scale(number: number, inMin: number, inMax: number, outMin: number, outMax: number) {
      return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    animateRow();

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [frameHeight, data]);

  return (
    <div className="px-2 pt-2">
      <section style={{ width: `${frameWidth}px`, height: `${frameHeight - 30}px` }}>
        <svg ref={svgRef}></svg>
      </section>
    </div>
  );
};

export default HeatMapAnimation;
