"use client"
import { useEffect, useState } from "react";
import ContentWindow from "../_components/window";
import FootageDisplay from "@/app/_components/footageDisplay";
import Header from "@/app/_components/header";
import '@/app/globals.css'
import HeatMapAnimation from "../_components/heatMapHorizontal";
import { processExcelData } from "@/app/_components/dataParser"
import Footer from "../_components/footer";
import { isMobileDevice } from "../_components/mobile-detector";

type CellClickData = {
    count: number;
    date: string;
    area: string;
    link: Array<string>;
};

export default function Index() {
    const [clickedCellData, setClickedCellData] = useState<CellClickData | null>(null);
    const [isFootageTagVisible, setIsFootageTagVisible] = useState(false);
    const [isContinueTagVisible, setIsContinueTagVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    //fetch data
    const incidentData = processExcelData();

    const handleCellClick = (data: CellClickData) => {
        setIsFootageTagVisible(false);
        setClickedCellData(data); //store clicked cell data
    };

    useEffect(() => {
        setIsMobile(isMobileDevice());
        setTimeout(() => {
            setIsContinueTagVisible(true);
        }, 4000);
        setTimeout(() => {
            setIsFootageTagVisible(true);
        }, 6000);

        setTimeout(() => {
            setIsFootageTagVisible(true);
        }, 20000);


    }, []);

    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
    };

    return (
        <div onContextMenu={handleContextMenu} className="footage-page">
            <Header />
            <main className="flex-grow relative h-auto overflow-hidden">
                {/* <div className="inner-backdrop"></div> */}

                <div className={`footage-timeline`}
                >
                    <div id="heatmap" className="min-w-max overflow-x-auto overflow-y-hidden hideScrollBar">
                        <HeatMapAnimation
                            data={incidentData}
                            onCellClick={handleCellClick}
                            scrollButtonVisible={isContinueTagVisible}
                        />
                    </div>

                    <div className={`click-label ${(isFootageTagVisible && !isMobile) ? 'opacity-100' : 'opacity-0'}`}>Click on each data point to view footages.</div>
                    <div className={`click-label ${isMobile ? 'opacity-100' : 'opacity-0'}`}>Footage media can be viewed on desktops.</div>
                </div>

                {clickedCellData && (
                    <div className="footage-display showScrollBar">
                        <div id={`metadata-bar`} className="fixed">
                            <div className={`content`}>
                                <h4 className="title">{`${clickedCellData.area} | ${clickedCellData.date} `}</h4>
                            </div>
                        </div>
                        {!isMobile && (<div className="flex gap-1 h-full flex-nowrap w-full">
                            {Array.from({ length: clickedCellData.link.length }).map((_, index) => (
                                <div key={index} className="flex-none snap-start">
                                    <ContentWindow title={``} >
                                        {/* ${clickedCellData.area} | ${clickedCellData.date} |  */}
                                        <FootageDisplay srcLink={`${process.env.NEXT_PUBLIC_CDN_URL}/WPdata/${clickedCellData.link[index]}`} enlarge={true} />
                                    </ContentWindow>
                                </div>
                            ))}
                        </div>)}
                    </div>
                )}
            </main >
            {!isMobile && (<Footer />)}
        </div >
    );
} 
