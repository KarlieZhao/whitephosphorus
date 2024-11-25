"use client";
"use strict";
exports.__esModule = true;
var react_1 = require("react");
var d3 = require("d3");
var resize_1 = require("@/lib/resize");
var resize_2 = require("@/lib/resize");
var mobile_detector_1 = require("./mobile-detector");
var HeatMapAnimation = function (_a) {
    var data = _a.data, onCellClick = _a.onCellClick, onTranslateXChange = _a.onTranslateXChange;
    var svgRef = react_1.useRef(null);
    var yAxisRef = react_1.useRef(null);
    var containerRef = react_1.useRef(null);
    var frameWidth = 7000;
    var frameHeight = resize_1.useWindowHeight() * 0.7;
    var windowWidth = resize_2.useWindowWidth();
    var majorEventDates = ["2023-10-08", "2023-11-24", "2023-12-31", "2024-01-02", "2024-10-01"];
    var majorEventNames = ["Hezbollah launches rockets into Israel", "Start of ceasefire", "End of ceasefire", "First Israeli assassinaion in Dahieh", " Israel invades South Lebanon"];
    var translateXRef = react_1.useRef(0); // Accumulated translateX
    var processData = function () {
        var uniqueDates = Array.from(new Set(data.map(function (d) { return d.date; }))).filter(Boolean);
        var uniqueAreas = Array.from(new Set(data.map(function (d) { return d.area; }))).filter(Boolean);
        // 2D array
        var incidentMap = new Map(data.map(function (d) { return [d.date + "-" + d.area, d.count]; }));
        var processedData = uniqueAreas.map(function (area) {
            return uniqueDates.map(function (date) { return incidentMap.get(date + "-" + area) || 0; });
        });
        return {
            xLabels: uniqueDates,
            yLabels: uniqueAreas,
            xLabelsVisibility: uniqueDates.map(function (_, i) { return i % 1 === 0; }),
            processedData: processedData
        };
    };
    react_1.useEffect(function () {
        var _a;
        var _b = processData(), xLabels = _b.xLabels, yLabels = _b.yLabels, xLabelsVisibility = _b.xLabelsVisibility, processedData = _b.processedData;
        //format xLabels (dates) for label
        var xLabelsFormatted = xLabels.map(function (d, index) {
            var _a = d.split('-'), year = _a[0], month = _a[1], day = _a[2];
            var prevLabel = index > 0 ? xLabels[index - 1].split('-')[1] : null;
            if (!prevLabel || month !== prevLabel) {
                var monthName = new Date("2023-" + month + "-28").toLocaleString('en-US', { month: 'short' });
                return monthName + ", " + year;
            }
            return '';
        });
        //total incidents for each area
        var areaTotals = yLabels.map(function (area, index) { return ({
            area: area,
            total: d3.sum(processedData[index])
        }); });
        yLabels.sort(function (a, b) {
            var _a, _b;
            var totalA = ((_a = areaTotals.find(function (t) { return t.area === a; })) === null || _a === void 0 ? void 0 : _a.total) || 0;
            var totalB = ((_b = areaTotals.find(function (t) { return t.area === b; })) === null || _b === void 0 ? void 0 : _b.total) || 0;
            return totalA - totalB;
        });
        var yLabelIndices = yLabels.map(function (area) { return areaTotals.findIndex(function (t) { return t.area === area; }); });
        var sortedProcessedData = yLabelIndices.map(function (index) {
            return processedData[index];
        });
        var targetIndex = yLabels.indexOf("To be geolocated in South Lebanon");
        if (targetIndex > -1) {
            yLabels.splice(targetIndex, 1);
            var targetData = sortedProcessedData.splice(targetIndex, 1)[0];
            yLabels.push("To be geolocated in South Lebanon");
            sortedProcessedData.push(targetData);
        }
        //============ rendering SVG ==============
        //clean up SVG
        d3.select(svgRef.current).selectAll("*").remove();
        //set svg dimensions and margins
        var margin = { top: 60, right: 150, bottom: 50, left: 100 };
        var availableWidth = frameWidth - margin.left - margin.right;
        var availableHeight = frameHeight - margin.top - margin.bottom;
        var numRows = yLabels.length; //areas
        var numCols = xLabels.length; //dates
        //calculate cell size to make cells square
        var cellSize = Math.min(availableWidth / numCols, (availableHeight - 60) / numRows);
        var plotWidth = cellSize / 1.5 * numCols;
        var plotHeight = cellSize * numRows;
        // Update actual SVG width and height
        var svgWidth = plotWidth + margin.left + margin.right;
        var svgHeight = plotHeight + margin.top + margin.bottom;
        // Flatten data for D3
        var flatData = [];
        for (var i = 0; i < numRows; i++) {
            for (var j = 0; j < numCols; j++) {
                flatData.push({
                    x: j,
                    y: i,
                    value: sortedProcessedData[i][j]
                });
            }
        }
        // Create SVG container
        var svg = d3
            .select(svgRef.current)
            .attr("width", svgWidth)
            .attr("height", svgHeight);
        var g = svg
            .append("g")
            .attr("transform", "translate(" + (margin.left + 10) + "," + margin.top + ")");
        // Create scales
        var xScale = d3
            .scaleBand()
            .domain(d3.range(numCols))
            .range([0, plotWidth])
            .padding(0.05);
        var yScale = d3
            .scaleBand()
            .domain(d3.range(numRows))
            .range([0, plotHeight])
            .padding(0.05);
        //x-axis labels (Dates)
        var tickIndices = xLabelsFormatted
            .map(function (label, i) { return (label !== '' ? i : null); }) // Mark indices with non-empty labels
            .filter(function (i) { return i !== null; }); // Remove null values
        g.append("g")
            .call(d3
            .axisBottom(xScale)
            .tickValues(tickIndices)
            .tickFormat(function (i) { return (xLabelsFormatted[i]); })
            .tickSize(-6))
            .selectAll("text")
            .attr("transform", "translate(-10, " + (plotHeight + 20) + ")")
            .style("text-anchor", "start")
            .style("font-size", "12px")
            .style("fill", "#ccc")
            .attr("dx", "0.5em")
            .attr("dy", "-0.2em");
        g.selectAll(".tick line")
            .attr("transform", "translate(0, " + (plotHeight + 6) + ")")
            .style("stroke", "#ccc")
            .style("stroke-width", "1px");
        //remove label lines
        //g.selectAll(".tick line").style("display", "none");
        // ========== Y-Axis Labels (Areas) ==========
        var yAxisSvg = d3
            .select(yAxisRef.current)
            .attr("width", margin.left)
            .attr("height", plotHeight + margin.top + margin.bottom);
        yAxisSvg.selectAll("*").remove();
        var yAxisG = yAxisSvg
            .append("g")
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
        yAxisG
            .call(d3.axisLeft(yScale)
            .tickFormat(function (_, i) {
            if (yLabels[i] === "To be geolocated in South Lebanon") {
                return "To be geolocated";
            }
            return yLabels[i];
        }))
            .selectAll("text")
            .style("text-anchor", "end")
            .style("font-size", "12px")
            .style("fill", "#ccc");
        // Bind data
        var cells = g
            .selectAll("rect")
            .data(flatData)
            .enter()
            .append("rect")
            .attr("x", function (d) { return xScale(d.x); })
            .attr("y", function (d) { return yScale(d.y); })
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .style("fill", "#ffffff00")
            .style("stroke", "#333");
        // Tooltip for displaying values
        var tooltip = d3
            .select("body")
            .append("div")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("padding", "5px")
            .style("border", "1px solid #ccc")
            .style("border-radius", "3px")
            .style("pointer-events", "none")
            .style("opacity", 0);
        cells.filter(function (d) { return d.value > 0; })
            .attr("class", "mousePointer")
            .on("mouseover", function (event, d) {
            tooltip
                .style("opacity", 0.9)
                .html("<table>\n             <tr><td>" + xLabels[d.x] + "</td></tr>\n            <tr><td>" + (yLabels[d.y] === "To be geolocated in South Lebanon" ? "To be geolocated" : yLabels[d.y]) + "</td></tr>\n            <tr><td>" + d.value + " Incidents</td></tr>\n            </table>")
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 30 + "px");
        })
            .on("mouseout", function () {
            tooltip.style("opacity", 0);
        })
            .on("click", function (event, d) {
            var matchedEntry = data.find(function (entry) { return entry.date === xLabels[d.x] && entry.area === yLabels[d.y]; });
            var clickedData = {
                count: d.value,
                date: yLabels[d.y],
                area: xLabels[d.x],
                link: (matchedEntry === null || matchedEntry === void 0 ? void 0 : matchedEntry.link) || []
            };
            onCellClick(clickedData);
        });
        //adding major event lines
        var majorEventIndices = majorEventDates.map(function (date) { return xLabels.indexOf(date); });
        // mouse hover display
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
        var maxValue = (_a = d3.max(sortedProcessedData.flat())) !== null && _a !== void 0 ? _a : 0;
        var currentCol = 0;
        var animateCol = function () {
            if (currentCol >= numCols)
                return;
            cells
                .filter(function (d) { return d.x === currentCol; })
                .transition()
                .duration(300)
                .attr("x", function (d) { var _a; return (_a = xScale(d.x)) !== null && _a !== void 0 ? _a : 0; })
                .attr("y", function (d) { var _a; return (_a = yScale(d.y)) !== null && _a !== void 0 ? _a : 0; })
                .style("fill", function (d) {
                var opacity = 1 - ((maxValue) - d.value) / (maxValue);
                opacity = opacity === 0 ? 0 : scale(opacity, 0, 1, 0.3, 1.0);
                return "rgba(255, " + (85 + 10 * opacity) + ", 66, " + opacity + ")";
            });
            // display annotations for the current column if it matches an event
            var eventIndex = majorEventIndices.indexOf(currentCol);
            if (eventIndex !== -1) {
                var value = majorEventIndices[eventIndex];
                var ypos = -10;
                if (eventIndex === 2)
                    ypos = -25;
                // Add the line
                var lines = g.append("line")
                    .attr("x1", xScale(value))
                    .attr("x2", xScale(value))
                    .attr("y1", ypos + 10)
                    .attr("y2", plotHeight)
                    .attr("stroke", "#FF0000")
                    .attr("stroke-width", 1.5)
                    .style("opacity", 0) // Initially hidden
                    .transition()
                    .duration(200)
                    .style("opacity", 1); // Fade in with the cell animation
                var annotation = g.append("text")
                    .attr("x", xScale(value))
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
        };
        animateCol();
        var container = containerRef.current;
        var handleWheel = function (event) {
            var svg = svgRef.current;
            if (!container || !svg)
                return;
            var scrollDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
            translateXRef.current = Math.min(0, Math.max(translateXRef.current - scrollDelta, (windowWidth - plotWidth - 260)));
            svg.style.transform = "translateX(" + translateXRef.current + "px)";
            onTranslateXChange(translateXRef.current); // callback => chart continue label visibility
        };
        //for mobile
        var handleTouch = function () {
            var startX = 0; // Tracks the starting touch X position
            var currentTranslateX = translateXRef.current;
            if (!container || !svg) {
                return function () { };
            }
            var handleTouchStart = function (event) {
                startX = event.touches[0].clientX; // Record the initial touch point
            };
            var handleTouchMove = function (event) {
                var svg = svgRef.current;
                if (!container || !svg)
                    return;
                var touchX = event.touches[0].clientX; // Current touch point
                var deltaX = touchX - startX; // Change in X from starting touch point
                translateXRef.current = Math.min(0, Math.max(currentTranslateX + deltaX, // Adjust translation based on touch movement
                windowWidth - plotWidth - 210 // Ensure it doesn't scroll beyond bounds
                ));
                svg.style.transform = "translateX(" + translateXRef.current + "px)";
                onTranslateXChange(translateXRef.current); // Callback to update label visibility
            };
            var handleTouchEnd = function () {
                currentTranslateX = translateXRef.current;
            };
            container.addEventListener('touchstart', handleTouchStart, { passive: true });
            container.addEventListener('touchmove', handleTouchMove, { passive: true });
            container.addEventListener('touchend', handleTouchEnd);
            return function () {
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('touchmove', handleTouchMove);
                container.removeEventListener('touchend', handleTouchEnd);
            };
        };
        if (mobile_detector_1.isMobileDevice()) {
            handleTouch();
        }
        if (container)
            container.addEventListener("wheel", handleWheel);
        // Cleanup tooltip on unmount
        return function () {
            tooltip.remove();
            if (container)
                container.removeEventListener("wheel", handleWheel);
        };
    }, [frameHeight, windowWidth, data]);
    return (react_1["default"].createElement("div", { className: " pt-2 scroll-behavior-none hideScrollBar", ref: containerRef, style: {
            width: "100vw",
            height: frameHeight + "px",
            overflowY: "scroll",
            overflowX: "hidden"
        } },
        react_1["default"].createElement("div", { className: "fixed", style: { zIndex: 100, backgroundColor: "#000", paddingLeft: "9px" } },
            react_1["default"].createElement("svg", { ref: yAxisRef, style: { left: 0 } })),
        react_1["default"].createElement("div", { className: "relative", style: { height: frameWidth - frameHeight - windowWidth } },
            react_1["default"].createElement("svg", { style: {
                    position: "sticky",
                    top: 0
                }, ref: svgRef, width: frameWidth, height: frameHeight }))));
};
function scale(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}
exports["default"] = HeatMapAnimation;
