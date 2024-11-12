"use client"
import { useEffect, useState } from "react";
import ContentWindow from "../_components/window";
import FootageDisplay from "@/app/_components/footageDisplay";
import Header from "@/app/_components/header";
import '@/app/globals.css'
import HeatMapAnimation from "../_components/heatMapHorizontal";
import { processExcelData } from "@/app/_components/dataParser"

type CellClickData = {
    count: number;
    date: string;
    area: string;
    link: Array<string>;
};

export default function Index() {
    const [isTimelineVisible, setIsTimelineVisible] = useState(false);
    const [isWindowVisible, setIsWindowVisible] = useState(false);
    const [clickedCellData, setClickedCellData] = useState<CellClickData | null>(null);
    //fetch data
    const incidentData = processExcelData();

    const handleCellClick = (data: CellClickData) => {
        setClickedCellData(data); //store clicked cell data
    };

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

                <div
                    className={`footage-timeline transform transition-all duration-1000 ease-out overflow-hidden h-[50vh]
                        ${isTimelineVisible ? 'opacity-100 translate-y-0' : 'opacity-0'}`}
                >
                    <div className="overflow-x-auto overflow-y-hidden hideScrollBar h-full">
                        <div id="heatmap" className="min-w-max">
                            <HeatMapAnimation data={incidentData} onCellClick={handleCellClick} />
                        </div>
                    </div>
                </div>

                {clickedCellData && (
                    <div className="footage-display overflow-x-scroll overflow-y-hidden h-full hideScrollBar whitespace-nowrap">
                        <div id={`metadata-bar`}>
                            <div className={`content`}>
                                <h4 className="title">{`${clickedCellData.area} | ${clickedCellData.date} `}</h4>
                            </div>
                        </div>
                        <div className="flex gap-1 h-full flex-nowrap w-full">
                            {Array.from({ length: clickedCellData.link.length }).map((_, index) => (
                                <div key={index} className="flex-none snap-start">
                                    <ContentWindow title={``}>
                                        {/* ${clickedCellData.area} | ${clickedCellData.date} |  */}
                                        <FootageDisplay srcLink={`${process.env.NEXT_PUBLIC_CDN_URL}/WPdata/${clickedCellData.link[index]}`} />
                                    </ContentWindow>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
} 
