"use client";

import { useWindowWidth } from "@/lib/resize"; // Adjust the import path as necessary
import { useWindowHeight } from "@/lib/resize"; // Adjust the import path as necessary

export default function() {
    // const windowWidth = useWindowWidth();
    const frameHeight = useWindowHeight() * 0.75;

    function preventZoom(e: React.WheelEvent<HTMLIFrameElement>) {
        e.stopPropagation();
    }

    return (
        <div className="content w-full mt-32">
            <div className="handle">
                <div className="control-box close-box"><a className="control-box-inner"></a></div>
                <div className="control-box zoom-box"><div className="control-box-inner"><div className="zoom-box-inner"></div></div></div>
                <div className="control-box windowshade-box"><div className="control-box-inner"><div className="windowshade-box-inner"></div></div></div>
                <h1 className="title text-2xl">Footage Catalog</h1>
            </div>
            <div className="overflow-hidden inner">
                <div className={` px-2 flex flex-col items-center justify-center`}>
                    <section style={{ width: `60vw`, height: `${frameHeight}px` }}>
                        <iframe
                            height={`${frameHeight+50}px`}
                            className=" mb-5 z-20 w-full mt-1 border-0 relative"
                            src="https://observablehq.com/embed/d124043920a3d8a4?cells=animated_chart"></iframe>
                    </section>
                </div>
            </div>
        </div>
    );
}