"use client"
import { useEffect, useState } from "react";
import ContentWindow from "../_components/window";
import FootageDisplay from "@/app/_components/footageDisplay";
import Header from "@/app/_components/header";
import '@/app/globals.css'
import HeatMapAnimation from "../_components/heatMapHorizontal";

export default function Index() {
    const [isTimelineVisible, setIsTimelineVisible] = useState(false);
    const [isWindowVisible, setIsWindowVisible] = useState(false);

    const contentWindows = [
        { id: 1, title: "Footage 1" },
        { id: 2, title: "Footage 2" },
        { id: 3, title: "Footage 3" },
        { id: 4, title: "Footage 4" },
    ];

    useEffect(() => {
        setIsTimelineVisible(true);
        setTimeout(() => {
            setIsWindowVisible(true);
        }, 1000);
    }, []);

    return (
        <div className="overflow-hidden relative h-screen">
            <Header />
            <main className="flex-grow relative h-auto overflow-hidden">
                <div className="inner-backdrop"></div>

                <div className="footage-2">
                    <div className="flex gap-4 overflow-x-auto overflow-y-hidden h-full hideScrollBar">
                        {contentWindows.map((window) => (
                            <div
                                key={window.id}
                                className={`flex-none transform transition-all duration-1000 ease-in-out
                  ${isWindowVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                  snap-start`}
                            >
                                <ContentWindow title={window.title} customeClassNameInner="videoHeight">
                                    <FootageDisplay />
                                </ContentWindow>
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className={`footage-1 transform transition-all duration-1000 ease-out overflow-hidden h-[50vh]
            ${isTimelineVisible ? 'opacity-100 translate-y-0' : 'opacity-0'}`}
                >
                    <div className="overflow-x-auto overflow-y-hidden hideScrollBar h-full">
                        <div id="heatmap" className="min-w-max">
                            <HeatMapAnimation />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 
