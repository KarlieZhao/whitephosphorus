"use client";
"use strict";
exports.__esModule = true;
var react_1 = require("react");
var navigation_1 = require("next/navigation");
require("@/app/globals.css");
var mobile_detector_1 = require("./mobile-detector");
var Header = function (_a) {
    var _b = _a.TypeWriterFinished, TypeWriterFinished = _b === void 0 ? true : _b;
    var _c = react_1.useState(false), isMobile = _c[0], setIsMobile = _c[1];
    var router = navigation_1.useRouter();
    var pathname = navigation_1.usePathname();
    var _d = react_1.useState(false), isOpen = _d[0], setIsOpen = _d[1];
    var _e = react_1.useState(""), animationClass = _e[0], setAnimationClass = _e[1];
    var _f = react_1.useState([{
            type: "Incidents",
            number: "191",
            unit: " "
        }, {
            type: "Land Area",
            number: "900",
            unit: "Hectars"
        }, {
            type: "Air Volume",
            number: "89.98",
            unit: "million m3"
        }]), data = _f[0], setData = _f[1];
    var altData = [{
            type: "Incidents",
            number: "191",
            unit: ""
        }, {
            type: "Land Area",
            number: "1261 ",
            unit: "soccer fields"
        }, {
            type: "Air Volume",
            number: "198",
            unit: "stadiums"
        }];
    react_1.useEffect(function () {
        setIsMobile(mobile_detector_1.isMobileDevice());
        var interval = setInterval(function () {
            setAnimationClass("fadeOut");
            setTimeout(function () {
                setData(function (prev) { return (prev[1].number === "900" ? altData : [{
                        type: "Incidents",
                        number: "191",
                        unit: " "
                    }, {
                        type: "Land Area",
                        number: "900",
                        unit: "Hectars"
                    }, {
                        type: "Air Volume",
                        number: "89.98",
                        unit: "million m3"
                    }]); });
                setAnimationClass("fadeIn");
            }, 600); // Match the duration of fade-out animation
        }, 10000);
        return function () { return clearInterval(interval); }; // Cleanup on unmount
    });
    var isActive = function (path) { return pathname === path; };
    var renderTab = function (label, path, tabClass) { return (React.createElement("td", { className: "fixed command_button " + tabClass + " w-1/4 cursor-pointer " + (isActive(path) ? "tabIsActive" : ""), onClick: function () { return router.push(path); } },
        React.createElement("div", { className: "label" }, label))); };
    var toggleMenu = function () {
        setIsOpen(function (prev) { return !prev; });
    };
    if (isMobile === null)
        return null;
    return (isMobile ? (
    //mobile env
    React.createElement("header", { className: "fixed top-0 t-50" },
        React.createElement("button", { className: "hamburger-menu " + (isOpen ? "open" : ""), onClick: toggleMenu, "aria-label": "Toggle menu" },
            React.createElement("div", { className: "bar" }),
            React.createElement("div", { className: "bar" }),
            React.createElement("div", { className: "bar" })),
        isOpen && (React.createElement("div", { className: "menu-bar" },
            React.createElement("ul", null,
                React.createElement("li", { onClick: function () { return router.push("/"); } }, "MAP"),
                React.createElement("li", { onClick: function () { return router.push("/footage"); } }, "TIMELINE"),
                React.createElement("li", { onClick: function () { return router.push("/clouds"); } }, "PLUMES"),
                React.createElement("li", { onClick: function () { return router.push("/about"); } }, "ABOUT")))),
        React.createElement("div", { className: "fixed left-0 command_button_unclickable" },
            React.createElement("h3", { className: "mt-4 w-1/2 pl-4 text-xl" }, "WhitePhosophrus.info")))) : (
    //browser env
    React.createElement("header", { className: "bg-black pt-2 pb-14 fixed top-0 left-0 right-0 z-50" },
        React.createElement("div", { className: "relative w-full h-full bg-black" },
            React.createElement("div", { className: "absolute top-12 h-20 left-0 right-0 bottom-0 bg-gradient-to-b from-red-900 to-transparent pointer-events-none" }),
            React.createElement("div", { className: "absolute z-50 top-12 h-2 w-full redbar" }),
            React.createElement("div", { className: "relative" },
                React.createElement("table", { className: "table1" },
                    React.createElement("tbody", { className: "h-14" },
                        React.createElement("tr", { className: "text-center mt-8 flex items-center" },
                            renderTab("MAP", "/", "tab1"),
                            renderTab("TIMELINE", "/footage", "tab2"),
                            renderTab("PLUMES", "/clouds", "tab3"),
                            renderTab("ABOUT", "/about", "tab4")))),
                React.createElement("table", { className: "align-middle font-semibold tracking-wide relative table2", style: { color: "#FFDCD988" } },
                    React.createElement("tbody", null,
                        React.createElement("tr", { className: "relative" },
                            React.createElement("td", { colSpan: 3, className: "h-full fixed left-0 command_button_unclickable" },
                                React.createElement("h3", { className: "mt-3 w-full text-left pl-5 z-50 tracking-wider text-2xl" }, "WhitePhosophrus.info"))),
                        TypeWriterFinished && (React.createElement("div", { className: "toxicity-counter relative pl-4 flex flex-row fadeSlideIn" },
                            React.createElement("div", { className: "flex-initial basis-1/3 flex flex-col justify-center items-start" },
                                React.createElement("div", null, "TOXICITY  COUNTER"),
                                React.createElement("div", { className: "last-update" }, "Last update: Oct/07/2024")),
                            data.map(function (obj, index) {
                                return (React.createElement("div", { key: obj.type || index, className: "flex-initial " + (obj.type === "Incidents" ? "basis-1/4" : "basis-1/3") + " flex flex-col items-start" },
                                    React.createElement("div", { className: "" + (obj.type === "Incidents" ? null : animationClass) },
                                        React.createElement("span", { className: "" + (obj.number === "1261 " || obj.number === "198"
                                                ? "opacity-100 inline-block"
                                                : "opacity-0 hidden") }, "\u2248"),
                                        React.createElement("span", { className: "headerData" }, obj.number),
                                        React.createElement("span", { className: "text-xl" },
                                            " ",
                                            obj.unit)),
                                    React.createElement("div", { className: "text-xl" }, obj.type)));
                            }))))))))));
};
exports["default"] = Header;
