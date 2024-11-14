"use client";
import React, { useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import { useWindowHeight } from "@/lib/resize";
import { useWindowWidth } from "@/lib/resize";

type IncidentData = {
  date: string;
  area: string;
  count: number;
  link: Array<string>;
};

type HeatMapProps = {
  data: IncidentData[];
  onCellClick: (data: {
    date: string;
    area: string;
    count: number;
    link: Array<string>
  }) => void;
  onTranslateXChange: (translateX: number) => void;
};

//entry data for D3
type CellData = { x: number; y: number; value: number };

const HeatMapAnimation: React.FC<HeatMapProps> = ({ data, onCellClick, onTranslateXChange }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameWidth = 7000;
  const frameHeight = useWindowHeight() * 0.7;
  const windowWidth = useWindowWidth();
  const majorEventDates = ["2023-10-08", "2023-11-24", "2023-12-31", "2024-01-02", "2024-09-17", "2024-09-20", "2024-09-27", "2024-10-01"];
  const majorEventNames = ["Hezbollah launches rockets into Israel", "Start of ceasefire", "End of ceasefire", "First Israeli assassinaion in Dahieh", "Hezbollah pager explosions", "IDF Airstrikes campaign commences on Lebanon", "The assassination of Hassan Nasrallah", " Israel invades South Lebanon"];
  const translateXRef = useRef<number>(0); // Accumulated translateX

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

    const targetIndex = yLabels.indexOf("To be geolocated in South Lebanon")
    if (targetIndex > -1) {
      yLabels.splice(targetIndex, 1);
      const targetData = sortedProcessedData.splice(targetIndex, 1)[0];

      yLabels.push("Unidentified");
      sortedProcessedData.push(targetData);
    }


    //============ rendering SVG ==============
    //clean up SVG
    d3.select(svgRef.current).selectAll("*").remove();

    //set svg dimensions and margins
    const margin = { top: 60, right: 120, bottom: 50, left: 90 };
    const availableWidth = frameWidth - margin.left - margin.right;
    const availableHeight = frameHeight - margin.top - margin.bottom;

    const numRows = yLabels.length; //areas
    const numCols = xLabels.length; //dates

    //calculate cell size to make cells square
    const cellSize = Math.min(availableWidth / numCols, (availableHeight - 60) / numRows);
    const plotWidth = cellSize / 1.5 * numCols;
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
      .attr("dx", "0.5em")
      .attr("dy", "-0.2em");

    // y-axis labels (Areas)
    // ========== Y-Axis Group for Labels ==========
    g.append("g")
      .call(
        d3.axisLeft(yScale)
          .tickFormat((_: any, i: number) => yLabels[i])
      )

      .attr("class", "y-axis-labels")  // add class here
      .selectAll("text")
      .style("text-anchor", "end")
      .style("font-size", "12px")
      .style("fill", "#ccc");

    //remove label lines
    g.selectAll(".tick line").style("display", "none");

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
      .style("stroke", "#333")

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
      .attr("class", "mousePointer")
      .on("mouseover", (event: MouseEvent, d: CellData) => {
        tooltip
          .style("opacity", 0.9)
          .html(`<table>
             <tr><td>${xLabels[d.x]}</td></tr>
            <tr><td>${yLabels[d.y] + (yLabels[d.y] === "Unidentified" ? " Areas" : "")}</td></tr>
            <tr><td>${d.value} Incidents</td></tr>
            </table>`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 30 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      })
      .on("click", (event: MouseEvent, d: CellData) => {
        const matchedEntry = data.find(
          (entry) => entry.date === xLabels[d.x] && entry.area === yLabels[d.y]
        );

        const clickedData = {
          count: d.value,
          date: yLabels[d.y],
          area: xLabels[d.x],
          link: matchedEntry?.link || []
        };
        onCellClick(clickedData);
      });

    //adding major event lines

    const majorEventIndices = majorEventDates.map(date => xLabels.indexOf(date));

    // // A: mouse hover display
    // majorEventIndices.forEach((value, index) => {
    //   // Add text annotation
    //   let ypos = -10;
    //   if (index === 3 || index === 5 || index === 7) {
    //     ypos = -25;
    //   }
    //   let textAnchorPos = index === 0 ? "start" : "middle";
    //   const annotation = g.append("text")
    //     .attr("x", xScale(value)!)
    //     .attr("y", ypos)
    //     .attr("text-anchor", textAnchorPos)
    //     .style("font-size", "14px")
    //     .style("fill", "#ccc")
    //     .style("opacity", 0)
    //     .text(majorEventNames[index]);

    //   g.append("line")
    //     .attr("x1", xScale(value)!)
    //     .attr("x2", xScale(value)!)
    //     .attr("class", "mousePointer")
    //     .attr("y1", 0)
    //     .attr("y2", plotHeight)
    //     .attr("stroke", "#FF000088")
    //     .attr("stroke-width", 2)
    //     .on("mouseover", (event: MouseEvent) => {
    //       // show top annotation
    //       annotation.transition().duration(20).style("opacity", 1);

    //     })
    //     .on("mouseout", () => {
    //       // hide top annotation (fade out 3s)
    //       annotation.transition().duration(5000).style("opacity", 0);
    //     });
    // })

    // Animation: fill in each column vertically
    const maxValue = d3.max(sortedProcessedData.flat());
    let currentCol = 0;
    const animateCol = () => {
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
        })

      // B: adjusting alignment
      // display annotations for the current column if it matches an event
      const eventIndex = majorEventIndices.indexOf(currentCol);
      if (eventIndex !== -1) {
        const value = majorEventIndices[eventIndex];
        let ypos = -10;
        if (eventIndex === 2) ypos = -25;
        else if (eventIndex == 4) ypos = -50;
        else if (eventIndex === 5) ypos = -35
        else if (eventIndex === 6) ypos = -20
        else if (eventIndex === 7) ypos = -5;

        // Add the line
        const lines = g.append("line")
          .attr("x1", xScale(value)!)
          .attr("x2", xScale(value)!)
          .attr("y1", ypos + 10)
          .attr("y2", plotHeight)
          .attr("stroke", "#FF0000")
          .attr("stroke-width", 1.5)
          .style("opacity", 0) // Initially hidden
          .transition()
          .duration(200)
          .style("opacity", 1); // Fade in with the cell animation

        const annotation = g.append("text")
          .attr("x", xScale(value)!)
          .attr("y", ypos)
          .attr("text-anchor", "start")
          .style("font-size", "12px")
          .style("fill", "#ccc")
          .style("opacity", 0) // Initially hidden
          .text(majorEventNames[eventIndex])
          .transition()
          .duration(200)
          .style("opacity", 1); // Fade in with the cell animation
      }

      currentCol++;
      setTimeout(animateCol, 20);
    }

    animateCol();

    const handleWheel = (event: WheelEvent) => {
      const svg = svgRef.current;
      if (!container || !svg) return;

      const scrollDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

      translateXRef.current = Math.min(0,
        Math.max(translateXRef.current - scrollDelta,
          (windowWidth - frameWidth) / 1.75));

      svg.style.transform = `translateX(${translateXRef.current}px)`;
      onTranslateXChange(translateXRef.current); // callback => chart continue label visibility
    };

    const container = containerRef.current;
    if (container) container.addEventListener("wheel", handleWheel);

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
      if (container) container.removeEventListener("wheel", handleWheel);

    };
  }, [frameHeight, windowWidth, data]);

  return (
    <div
      className="px-2 pt-2 scroll-behavior-none"
      ref={containerRef}
      style={{
        width: "100vw",
        height: `${frameHeight}px`,
        overflowY: "scroll",
        overflowX: "hidden"
      }}
    >
      <div className="relative" style={{ height: frameWidth - frameHeight - windowWidth }}>
        <svg style={{
          position: "sticky",
          top: 0,
        }} ref={svgRef} width={frameWidth} height={frameHeight}></svg>
      </div>
    </div>
  );
};

function scale(number: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

export default HeatMapAnimation;
