"use client";
"use strict";
exports.__esModule = true;
exports.Map = void 0;
var resize_1 = require("@/lib/resize");
function Map() {
    // const windowWidth = useWindowWidth();
    var frameHeight = resize_1.useWindowHeight() * 0.98;
    function preventZoom(e) {
        e.stopPropagation();
    }
    return (React.createElement("section", { className: "z-10 fixed overflow-hidden overscroll-contain", style: { width: "100vw", height: "95%" } },
        React.createElement("iframe", { height: frameHeight + "px", title: "", src: "https://experience.arcgis.com/experience/98fc06b11b154cf1aa623c6de7b29405/", loading: "lazy", className: "bg-black overflow-hidden z-10 fixed mt-4 w-full border-0" })));
}
exports.Map = Map;
