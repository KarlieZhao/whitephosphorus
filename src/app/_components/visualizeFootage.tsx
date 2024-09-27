"use client";

import { CMS_NAME } from "@/lib/constants";
import { useWindowWidth } from "@/lib/resize"; // Adjust the import path as necessary
import { useWindowHeight } from "@/lib/resize"; // Adjust the import path as necessary
import styles from './mapembed.module.css';
import { colorPalette } from "./color-palette";

export function VisualizeFootage() {
    // const windowWidth = useWindowWidth();
    const frameHeight = useWindowHeight() * 0.85;

    function preventZoom(e: React.WheelEvent<HTMLIFrameElement>) {
        e.stopPropagation();
    }

    return (

        <div className="content w-full mt-24">
            <div className="handle">
                <div className="control-box close-box"><a className="control-box-inner"></a></div>
                <div className="control-box zoom-box"><div className="control-box-inner"><div className="zoom-box-inner"></div></div></div>
                <div className="control-box windowshade-box"><div className="control-box-inner"><div className="windowshade-box-inner"></div></div></div>
                <h1 className="title text-2xl">Footage Catalog</h1>
            </div>
            <div className="overflow-hidden inner">
                <div className={`px-5 flex flex-col items-center justify-center`}>
                    <section style={{ width: `60vw`, height: `${frameHeight}px` }}>
                        <iframe
                            height={`${frameHeight+50}px`}
                            className="mb-10 z-20 w-full mt-5 border-0 relative overflow-hidden"
                            src="https://observablehq.com/embed/d124043920a3d8a4?cells=animated_chart"></iframe>
                    </section>
                </div>
            </div>
        </div>
    );
}