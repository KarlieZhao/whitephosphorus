"use client";
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { useWindowHeight } from "@/lib/resize";
import { useWindowWidth } from "@/lib/resize";
import { isMobileDevice } from "./mobile-detector";

export type IncidentData = {
  code: string;
  date: string;
  area: string;
  count: number;
  links: string[];
  filename: string[];
};

type HeatMapProps = {
  data: IncidentData[];
  onCellClick: (data: {
    code: string;
    date: string;
    area: string;
    count: number;
    links: string[];
    filename: string[];
  }) => void;
  scrollButtonVisible: boolean;
};

type CellData = { code: string; x: number; y: number; value: number };

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const HeatMapAnimation: React.FC<HeatMapProps> = ({ data, onCellClick, scrollButtonVisible }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="w-[100vw] h-[70vh] flex items-center justify-center text-gray-500">Loading data...</div>;
  }

  const svgRef = useRef<SVGSVGElement | null>(null);
  const yAxisRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRequest = useRef<number | null>(null);
  const translateXRef = useRef<number>(0);

  const frameWidth = 7000;
  const [plotWidthGlobal, setPlotWidthGlobal] = useState<number>(frameWidth);

  const frameHeight = useWindowHeight() * 0.64;
  const windowWidth = useWindowWidth();

  const majorEventDates = [
    "2023-10-08", "2023-11-24", "2023-11-30",
    "2024-05-01", "2024-09-17",
    "2024-11-27"
  ];

  const majorEventNames = [
    "Hezbollah launches rockets into Israel",
    "Ceasefire synchronized with Gaza Truce", "",
    "Low-Intensity Cross-Border Strikes",
    "Israel detonates communication devices across Lebanon",
    "Ceasefire Agreement Signed",
  ];

  // Memoized data processing
  const processedChartData = useMemo(() => {
    const minDate = new Date("2023-10-07");
    const maxDate = new Date("2024-11-30");

    const uniqueDates = getDateRange(
      minDate.toISOString().slice(0, 10),
      maxDate.toISOString().slice(0, 10)
    );

    const uniqueAreas = Array.from(new Set(data.map(d => d.area))).filter(Boolean);

    // Build lookup map for (date+area)
    const incidentMap = new Map(data.map(d => {
      const dateKey = d.date.slice(0, 10);
      return [`${dateKey}-${d.area}`, d.count];
    }));

    // Fill in 0s for missing dates
    const processedData = uniqueAreas.map(area => {
      return uniqueDates.map(date => incidentMap.get(`${date}-${area}`) || 0);
    });

    return {
      xLabels: uniqueDates,
      yLabels: uniqueAreas,
      xLabelsVisibility: uniqueDates.map((_, i) => i % 1 === 0),
      processedData
    };
  }, [data]);

  function getDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    let current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  const cleanup = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.remove();
      tooltipRef.current = null;
    }
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
    if (scrollRequest.current) {
      cancelAnimationFrame(scrollRequest.current);
      scrollRequest.current = null;
    }
  }, []);

  useEffect(() => {
    const { xLabels, yLabels, processedData } = processedChartData;
    // Format xLabels (dates) for display
    const xLabelsFormatted = xLabels.map((d, index) => {
      const [year, month] = d.split('-');
      const prevLabel = index > 0 ? xLabels[index - 1].split('-')[1] : null;
      if (!prevLabel || month !== prevLabel) {
        const monthName = months[parseInt(month, 10) - 1];
        return `${monthName}, ${year}`;
      }
      return '';
    });

    // Calculate total incidents for each area
    const areaTotals = yLabels.map((area, index) => ({
      area,
      total: d3.sum(processedData[index])
    }));

    // Sort areas by total incidents (ascending)
    const sortedAreas = [...yLabels].sort((a, b) => {
      const totalA = areaTotals.find(t => t.area === a)?.total || 0;
      const totalB = areaTotals.find(t => t.area === b)?.total || 0;
      return totalA - totalB;
    });

    const yLabelIndices = sortedAreas.map(area =>
      yLabels.findIndex(label => label === area)
    );

    const sortedProcessedData = yLabelIndices.map(index => processedData[index]);

    // Clean up existing SVG
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(yAxisRef.current).selectAll("*").remove();

    const margin = {
      top: 60,
      right: 170,
      bottom: 50,
      left: isMobileDevice() ? 75 : 100
    };

    const availableWidth = frameWidth - margin.left - margin.right;
    const availableHeight = frameHeight - margin.top - margin.bottom;

    const numRows = sortedAreas.length;
    const numCols = xLabels.length;

    // Calculate cell size to make cells square
    let cellSize = Math.min(availableWidth / numCols, (availableHeight - 60) / numRows);
    // cellSize *= 0.85;
    const plotWidth = cellSize * numCols;
    setPlotWidthGlobal(plotWidth);
    const plotHeight = cellSize * numRows;

    // Update actual SVG dimensions
    const svgWidth = plotWidth + margin.left + margin.right;
    const svgHeight = plotHeight + margin.top + margin.bottom;

    // Flatten data for D3
    const flatData: CellData[] = [];
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        // Find the original data entry for this cell to get the code
        const originalEntry = data.find(d => d.date.slice(0, 10) === xLabels[j] && d.area === sortedAreas[i]);
        flatData.push({
          x: j,
          y: i,
          value: sortedProcessedData[i][j],
          code: originalEntry?.code || ''
        });
      }
    }

    // Create main SVG container
    const svg = d3
      .select(svgRef.current)
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left + 10},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleBand<number>()
      .domain(d3.range(numCols))
      .range([0, plotWidth])
      .padding(0.05);

    const yScale = d3
      .scaleBand<number>()
      .domain(d3.range(numRows))
      .range([0, plotHeight])
      .padding(0.05);

    // X-axis labels (Dates)
    const tickIndices = xLabelsFormatted
      .map((label, i) => (label !== '' ? i : null))
      .filter((i): i is number => i !== null);

    g.append("g")
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(tickIndices)
          .tickFormat((i: number) => xLabelsFormatted[i])
          .tickSize(-6)
      )
      .selectAll("text")
      .attr("transform", `translate(-10, ${plotHeight + 20})`)
      .style("text-anchor", "start")
      .style("font-size", `${cellSize / 1.2}px`)
      .style("fill", "#ccc")
      .attr("dx", "0.5em")
      .attr("dy", "-0.2em");

    g.selectAll(".tick line")
      .attr("transform", `translate(0, ${plotHeight + 6})`)
      .style("stroke", "#ccc")
      .style("stroke-width", "1px");

    // Y-Axis Labels (Areas)
    const yAxisSvg = d3
      .select(yAxisRef.current)
      .attr("width", margin.left)
      .attr("height", plotHeight + margin.top + margin.bottom);

    const yAxisG = yAxisSvg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    yAxisG
      .call(
        d3.axisLeft(yScale)
          .tickFormat((_, i: number) => sortedAreas[i])
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .style("font-size", `${cellSize / 1.3}px`)
      .style("fill", "#ccc");

    // Create tooltip
    if (!tooltipRef.current) {
      tooltipRef.current = d3
        .select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "4px 10px")
        // .style("border", "1px solid #ccc")
        .style("border-radius", "2px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-size", `${cellSize}px`)
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
        .style("z-index", "1000");
    }

    // Create cells
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
      .style("stroke-width", "0.5px");

    // Add interactions only to cells with data
    cells.filter((d: CellData) => d.value > 0)
      .style("cursor", "pointer")
      .on("mouseover", (event: MouseEvent, d: CellData) => {
        if (tooltipRef.current) {
          tooltipRef.current
            .style("opacity", 0.85)
            .html(`
              <div style="font-weight: bold;">${xLabels[d.x]}</div>
              <div>${sortedAreas[d.y]}</div>
              <div>${d.value} Incident${d.value !== 1 ? 's' : ''}</div>
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 30) + "px");
        }
      })
      .on("mouseout", () => {
        if (tooltipRef.current) {
          tooltipRef.current.style("opacity", 0);
        }
      })
      .on("click", (event: MouseEvent, d: CellData) => {
        const matchedEntry = data.find(
          (entry) => entry.date === xLabels[d.x] && entry.area === sortedAreas[d.y]
        );

        const clickedData = {
          code: matchedEntry?.code || d.code,
          count: d.value,
          date: xLabels[d.x], // Fixed: was incorrectly swapped
          area: sortedAreas[d.y], // Fixed: was incorrectly swapped  
          links: matchedEntry?.links || [],
          filename: matchedEntry?.filename || []
        };
        onCellClick(clickedData);
      });

    // Get major event indices
    const majorEventIndices = majorEventDates
      .map(date => xLabels.indexOf(date))
      .filter(index => index !== -1);

    // Animation
    const maxValue = d3.max(sortedProcessedData.flat()) ?? 0;
    let currentCol = 0;

    const animateCol = () => {
      if (currentCol >= numCols) return;

      cells
        .filter((d: CellData) => d.x === currentCol)
        .transition()
        .duration(200)
        .style("fill", (d: CellData) => {
          if (d.value === 0) return "#ffffff00";

          let opacity = 1 - ((maxValue - d.value) / maxValue);
          opacity = opacity === 0 ? 0 : scale(opacity, 0, 1, 0.3, 1.0);
          return `rgba(255, ${Math.floor(85 + 10 * opacity)}, 66, ${opacity})`;
        });

      // Add event annotations
      const eventIndex = majorEventIndices.indexOf(currentCol);
      if (eventIndex !== -1) {
        // console.log(eventIndex, majorEventIndices[eventIndex], majorEventNames[eventIndex], majorEventDates[eventIndex]);
        const xPos = xScale(currentCol)!;
        let yPos = -10;
        let labelxOffset = 0;
        if (eventIndex === 1) labelxOffset = -60;
        // else if ([1].includes(eventIndex)) yPos = -40;
        // else if ([2, 4].includes(eventIndex)) yPos = -25;

        // Add event line
        g.append("line")
          .attr("x1", xPos)
          .attr("x2", xPos)
          .attr("y1", yPos + 10)
          .attr("y2", plotHeight)
          .attr("stroke", "#FF0000")
          .attr("stroke-width", 1.5)
          .style("opacity", 0)
          .transition()
          .duration(200)
          .style("opacity", 1);

        // Add event label
        g.append("text")
          .attr("x", xPos + labelxOffset)
          .attr("y", yPos)
          .attr("text-anchor", "start")
          .style("font-size", "0.8rem")
          .style("fill", "#ccc")
          .style("opacity", 0)
          .text(majorEventNames[eventIndex])
          .transition()
          .duration(200)
          .style("opacity", 1);
      }

      currentCol++;
      animationRef.current = setTimeout(animateCol, 20);
    };

    animateCol();

    // Scroll handlers
    const container = containerRef.current;
    const svgElement = svgRef.current;

    const handleWheel = (event: WheelEvent) => {
      if (!container || !svgElement) return;

      event.preventDefault();
      const scrollDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      translateXRef.current = Math.min(0,
        Math.max(translateXRef.current - scrollDelta, windowWidth - plotWidth - 260));

      svgElement.style.transform = `translateX(${translateXRef.current}px)`;
    };

    // Touch handlers for mobile
    const handleTouch = () => {
      let startX = 0;
      let currentTranslateX = translateXRef.current;

      if (!container || !svgElement) return () => { };

      const handleTouchStart = (event: TouchEvent) => {
        startX = event.touches[0].clientX;
      };

      const handleTouchMove = (event: TouchEvent) => {
        if (!container || !svgElement) return;

        const touchX = event.touches[0].clientX;
        const deltaX = touchX - startX;

        translateXRef.current = Math.min(
          0,
          Math.max(
            currentTranslateX + deltaX,
            windowWidth - plotWidth - 260
          )
        );

        svgElement.style.transform = `translateX(${translateXRef.current}px)`;
      };

      const handleTouchEnd = () => {
        currentTranslateX = translateXRef.current;
      };

      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
      container.addEventListener('touchend', handleTouchEnd);

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    };

    let touchCleanup: (() => void) | null = null;
    if (isMobileDevice()) {
      touchCleanup = handleTouch();
    }

    if (container && !isMobileDevice()) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    // Cleanup function
    return () => {
      cleanup();
      if (container && !isMobileDevice()) {
        container.removeEventListener("wheel", handleWheel);
      }
      if (touchCleanup) {
        touchCleanup();
      }
    };
  }, [frameHeight, windowWidth, processedChartData, cleanup, data]);

  // Button handlers with proper event handling
  const moveChart = useCallback((direction: "left" | "right") => {
    const svg = svgRef.current;
    if (!containerRef.current || !svg) return;

    const scrollDelta = direction === "right" ? -5 : 5; // Increased for smoother scrolling
    translateXRef.current = Math.min(
      0,
      Math.max(
        translateXRef.current + scrollDelta,
        windowWidth - plotWidthGlobal - 260
      )
    );

    svg.style.transform = `translateX(${translateXRef.current}px)`;

    if (scrollRequest.current) {
      scrollRequest.current = requestAnimationFrame(() => moveChart(direction));
    }
  }, [windowWidth, plotWidthGlobal]);

  const handleButtonDown = useCallback((direction: "left" | "right") =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      scrollRequest.current = requestAnimationFrame(() => moveChart(direction));
    }, [moveChart]);

  const handleButtonUp = useCallback(() => {
    if (scrollRequest.current) {
      cancelAnimationFrame(scrollRequest.current);
      scrollRequest.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div
      className="pt-2 scroll-behavior-none hideScrollBar"
      ref={containerRef}
      style={{
        width: "100vw",
        height: `${frameHeight}px`,
        overflowY: "scroll",
        overflowX: "hidden"
      }}
    >
      <div className="fixed" style={{ zIndex: 100, backgroundColor: "#000", paddingLeft: "9px" }}>
        <svg ref={yAxisRef} style={{ left: 0 }} />
      </div>

      <div className="relative" style={{ height: frameWidth - frameHeight - windowWidth }}>
        <svg
          style={{
            position: "sticky",
            top: 0,
          }}
          ref={svgRef}
          width={frameWidth}
          height={frameHeight}
        />
      </div>

      {!isMobileDevice() && (
        <div className={`chart-continue-label ${scrollButtonVisible ? 'opacity-100' : 'opacity-0'}`}>
          Scroll to View More
        </div>
      )}
    </div>
  );
};

function scale(number: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

export default HeatMapAnimation;