"use client"
import { useEffect, useState } from "react";
import ContentWindow from "../_components/window";
import FootageDisplay from "@/app/_components/footageDisplay";
import Header from "@/app/_components/header";
import '@/app/globals.css'
import HeatMapAnimation from "../_components/heatMap";

export default function Index() {
    const [isTimelineVisible, setIsTimelineVisible] = useState(false);
    const [isWindowVisible, setIsWindowVisible] = useState(false);

    useEffect(() => {
        setIsTimelineVisible(true);
        setTimeout(() => {
            setIsWindowVisible(true);
        }, 4500);
    }, []);

    return (
        <div className='overflow-hidden relative'>
            <Header />
            <main className="flex-grow relative">
                <div className='inner-backdrop'></div>
                <div className="fixed flex w-full">
                    <div className={`footage-1 pt-20 pb-0 mb-10 overflow-x-hidden overflow-y-scroll transform transition-all duration-1000 ease-out
              ${isTimelineVisible ? 'opacity-100 translate-y-0' : 'opacity-0'}`}>
                        <div id="heatmap">
                            <HeatMapAnimation />
                        </div>
                    </div>
                    <div className={`footage-2 pt-28 transform transition-all duration-1000 ease-in-out
              ${isWindowVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <ContentWindow title="Footage Insights">
                            <FootageDisplay />
                        </ContentWindow>
                    </div>
                </div>
            </main>
        </div>);
}