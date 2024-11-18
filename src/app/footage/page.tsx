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
    const [isTimelineVisible, setIsTimelineVisible] = useState(true);
    const [clickedCellData, setClickedCellData] = useState<CellClickData | null>(null);
    const [isContinueTagVisible, setIsContinueTagVisible] = useState(false);
    const [isFootageTagVisible, setIsFootageTagVisible] = useState(false);

    //fetch data
    const incidentData = processExcelData();

    const handleCellClick = (data: CellClickData) => {
        setIsFootageTagVisible(false);
        setClickedCellData(data); //store clicked cell data
    };

    const handleTranslateX = (translateX: number) => {
        if (translateX < -200) setIsContinueTagVisible(false);
    };

    useEffect(() => {
        setTimeout(() => {
            setIsContinueTagVisible(true);
        }, 4000);
        setTimeout(() => {
            setIsFootageTagVisible(true);
        }, 6000);
    }, []);

    return (
        <div className="footage-page">
            <Header />
            <main className="flex-grow relative h-auto overflow-hidden">
                {/* <div className="inner-backdrop"></div> */}

                <div className={`footage-timeline  ${isTimelineVisible ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div id="heatmap" className="min-w-max overflow-x-auto overflow-y-hidden hideScrollBar">
                        <HeatMapAnimation
                            data={incidentData}
                            onCellClick={handleCellClick}
                            onTranslateXChange={handleTranslateX}
                        />
                    </div>
                    <div className={`chart-continue-label ${isContinueTagVisible ? 'opacity-100' : 'opacity-0'}`}>
                        scroll for more
                        <svg
                            className="arrow-svg"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                        >
                            <path fill="red" d="M10 6l6 6-6 6V6z" />
                        </svg>
                    </div>

                    <div className={`click-label ${isFootageTagVisible ? 'opacity-100' : 'opacity-0'}`}>Click on each data point to view footages.</div>
                </div>

                {clickedCellData && (
                    <div className="footage-display">
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

            </main >
        </div >
    );
} 
