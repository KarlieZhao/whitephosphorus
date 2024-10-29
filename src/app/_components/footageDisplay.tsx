"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "../globals.css";
import { colorPalette } from "./color-palette";

//ON HOLD: TWITTER DATA VISUALIZATION
type DataPoint = {
    date: Date | null;
    value: number;
};
export default function ({ srcLink }: { srcLink: string }) {
    return (
        <div>
            <div className="text-white text-xl video-footage-wrapper">
                <img
                    src={srcLink}
                    className="video-footage object-cover"
                    alt=""
                />
            </div>
        </div>
    );
}
