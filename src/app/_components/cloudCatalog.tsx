"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "../globals.css";

export default function () {
    return (
        <div className="text-white">
            <img className="mt-2 ml-2" src="../assets/img/clouds/WP.png" />
            <div className={`h-52 overflow-scroll mt-2 mb-5`}>
                <section>
                    <div className=" px-6 text-xl">
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
