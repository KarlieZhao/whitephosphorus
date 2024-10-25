"use client";
import React, { useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import { useWindowHeight } from "@/lib/resize";
import { useWindowWidth } from "@/lib/resize";
import * as XLSX from 'xlsx';

type IncidentData = {
  date: string;
  area: string;
  count: number;
};

//entry data for D3
type CellData = { x: number; y: number; value: number };

const HeatMapAnimation = () => {
  const svgRef = useRef(null);
  const [frameWidth, setFrameWidth] = useState(5200);
  const frameHeight = useWindowHeight() * 1.4;
  const [data, setData] = React.useState<IncidentData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        //process Excel sheet
        const response = await fetch('/data/incidents.xlsx');
        const arrayBuffer = await response.arrayBuffer();

        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        const mappedData = rawData
          .map((row: any) => {
            const dateValue = XLSX.SSF.parse_date_code(row['Date']);
            const jsDate = new Date(dateValue.y, dateValue.m - 1, dateValue.d);
            const cellDate = jsDate.toISOString().split('T')[0];

            return {
              date: cellDate,
              area: row['Area'] || "",
              count: Number(row['number']) || 0
            }
          })
        setData(mappedData);
      } catch (error) {
        console.error('loading excel: ' + error);
      }
    };
    fetchData();
  }, []);

  const processData = () => {
    const uniqueDates = Array.from(new Set(data.map(d => d.date))).filter(Boolean);
    const uniqueAreas = Array.from(new Set(data.map(d => d.area))).filter(Boolean);

    // 2D array
    const processedData = uniqueAreas.map(area => {
      return uniqueDates.map(date => {
        const incident = data.find(d => d.date === date && d.area === area);
        return incident?.count || 0;
      });
    });

    return {
      xLabels: uniqueDates,
      yLabels: uniqueAreas,
      xLabelsVisibility: uniqueDates.map((_, i) => i % 1 === 0),
      processedData
    };
  }

  useEffect(() => {
    const { xLabels, yLabels, xLabelsVisibility, processedData } = processData();

    //format xLabels (dates) for label
    const xLabelsFormatted = xLabels.map((d, index) => {
      const [year, month, day] = d.split('-');
      const prevLabel = index > 0 ? xLabels[index - 1].split('-')[1] : null;
      if (!prevLabel || month !== prevLabel) {
        const monthName = new Date(`2023-${month}-28`).toLocaleString('en-US', { month: 'short' });
        return monthName + ", " + year;
      }
      return '';
    });


    //total incidents for each area
    const areaTotals = yLabels.map((area, index) => ({
      area,
      total: d3.sum(processedData[index])
    }));

    yLabels.sort((a, b) => {
      const totalA = areaTotals.find(t => t.area === a)?.total || 0;
      const totalB = areaTotals.find(t => t.area === b)?.total || 0;
      return totalA - totalB;
    });

    const yLabelIndices = yLabels.map(area => areaTotals.findIndex(t => t.area === area));

    const sortedProcessedData = yLabelIndices.map(index =>
      processedData[index]
    );

    //============ rendering SVG ==============
    //clean up SVG
    d3.select(svgRef.current).selectAll("*").remove();

    //set svg dimensions and margins
    const margin = { top: 40, right: 50, bottom: 60, left: 90 };
    const availableWidth = frameWidth - margin.left - margin.right;

    const numRows = yLabels.length; //areas
    const numCols = xLabels.length; //dates

    //calculate cell size to make cells square
    const cellSize = availableWidth / numCols;
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
          x: j, // Date index
          y: i, // Area index
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

    //x-axis labels (Dates)
    g.append("g")
      .attr("transform", `translate(-10, ${plotHeight + 10})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickFormat((i: number) => (xLabelsFormatted[i]))
      )
      .selectAll("text")
      .style("text-anchor", "start")
      .style("font-size", "12px")
      .style("fill", "#ccc")
      // .attr("transform", "rotate(-60)")
      .attr("dx", "0.5em")
      .attr("dy", "-0.2em");

    //y-axis labels (Areas)
    g.append("g")
      .call(
        d3.axisLeft(yScale)
          .tickFormat((_: any, i: number) => yLabels[i])
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .style("font-size", "12px")
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

    // Animation: fill in each column vertically
    const maxValue = d3.max(sortedProcessedData.flat());
    let currentCol = 0;
    function animateCol() {
      if (currentCol >= numCols) return;

      cells
        .filter((d: CellData) => d.x === currentCol)
        .transition()
        .duration(300)
        .attr("x", (d: CellData) => xScale(d.x) ?? 0)
        .attr("y", (d: CellData) => yScale(d.y) ?? 0)
        .style("fill", (d: CellData) => {
          let opacity = 1 - ((maxValue) - d.value) / (maxValue);
          opacity = opacity === 0 ? 0 : scale(opacity, 0, 1, 0.3, 1.0);
          return `rgba(255, ${85 + 10 * opacity}, 66, ${opacity})`;
        });

      currentCol++;
      setTimeout(animateCol, 50);
    }

    function scale(number: number, inMin: number, inMax: number, outMin: number, outMax: number) {
      return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    animateCol();

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
