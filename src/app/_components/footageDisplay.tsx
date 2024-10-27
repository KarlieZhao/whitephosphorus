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

export default function () {
    return (<div>
        {/* <img src="../assets/img/testimg.jpeg" /> */}
        <div className={` overflow-scroll mt-2 mb-5`}>
            <section>
                <div className="text-white px-6 text-xl">
                    Morbi a purus sed turpis blandit consequat.<br />
                    Nam dignissim luctus felis, eget semper mi interdum sit amet.<br /> Vestibulum maximus aliquet risus sed accumsan. <br />
                    Donec auctor ante nisi, <br />ac efficitur eros mollis sit amet.
                    <br />Suspendisse potenti. <br />
                </div>
            </section>
        </div>
    </div>
    );
}
