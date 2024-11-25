"use client";
"use strict";
exports.__esModule = true;
var mapembed_1 = require("@/app/_components/mapembed");
var react_1 = require("react");
var header_1 = require("@/app/_components/header");
var typewriter_1 = require("@/app/_components/typewriter");
require("./globals.css");
var mobile_detector_1 = require("./_components/mobile-detector");
function Index() {
    var textToType = ["is a platform for geolocating, verifying, and mapping white phosphorus incidents in Lebanon to promote accountability."];
    var _a = react_1.useState(false), TypeWriterFinished = _a[0], setTypeWriterFinished = _a[1];
    var _b = react_1.useState(false), isMobile = _b[0], setIsMobile = _b[1];
    var _c = react_1.useState(false), isPromptVisible = _c[0], setIsPromptVisible = _c[1];
    var onFinish = function () {
        setTypeWriterFinished(true);
        showPrompt();
    };
    var showPrompt = function () {
        var showprompt = setTimeout(function () {
            setIsPromptVisible(true);
        }, 4500);
        var hideprompt = setTimeout(function () {
            setIsPromptVisible(false);
        }, 15000);
        return function () {
            clearTimeout(showprompt);
            clearTimeout(hideprompt);
        }; // Cleanup on unmount
    };
    react_1.useEffect(function () {
        setIsMobile(mobile_detector_1.isMobileDevice());
    });
    if (isMobile === null)
        return null;
    return (React.createElement("div", null,
        React.createElement(header_1["default"], { TypeWriterFinished: TypeWriterFinished }),
        React.createElement("main", { className: "relative" },
            React.createElement("div", { className: "w-full text-5xl z-50 mt-4 fixed text-white ml-6" },
                React.createElement(typewriter_1["default"], { textLines: textToType, period: 2000, speed: 100, onFinish: onFinish })),
            isMobile ? (React.createElement("div", { className: "fixed bottom-20 m-3 text-white text-sm" },
                "The map feature is optimized for desktop devices.",
                React.createElement("br", null),
                React.createElement("br", null),
                "On a mobile device, you can view the white phosphorus attacks timeline, the smoke plume catalog, and read more about this project through the navigation menu.")) : (React.createElement("div", { className: "relative z-0 " + (TypeWriterFinished ? "fadeIn" : "opacity-0") },
                React.createElement("div", { className: "z-50 fixed left-12 ml-1 bottom-[19vh] text-sm text-white transition-opacity " + (isPromptVisible ? "opacity-100" : "opacity-0") }, "Adjust selected timestamp to view more."),
                React.createElement(mapembed_1.Map, null))))));
}
exports["default"] = Index;
