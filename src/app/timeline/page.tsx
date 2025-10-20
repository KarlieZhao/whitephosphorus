"use client"
import { useEffect, useState, useCallback, useMemo } from "react";
import ContentWindow from "../_components/window";
import FootageDisplay from "@/app/_components/footageDisplay";
import Header from "@/app/_components/header";
import '@/app/globals.css'
import HeatMapAnimation from "../_components/heatMapHorizontal";
import Footer from "../_components/footer";
import { isMobileDevice } from "../_components/mobile-detector";
import { IncidentData } from "../_components/heatMapHorizontal";

type RawIncident = {
    code: string;
    date: string;
    time: string;
    town: string;
    country: string;
    geolocated_by: string;
    lat: number | null;
    lon: number | null;
    landscape: string | null;
    sourced_by: string;
    shell_count: number;
    links: string[];
    filename: string[];
};

// Constants
const TIMING = {
    CONTINUE_TAG_DELAY: 4000,
    FOOTAGE_TAG_DELAY: 6000,
} as const;

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

// Memoized mapping function
const mapData = (raw: RawIncident[]): IncidentData[] => {
    return raw.map(d => ({
        code: d.code,
        date: d.date,
        area: d.town || d.country || "Unknown",
        count: d.shell_count ?? 0,
        links: d.links ?? [],
        filename: d.filename ?? []
    }));
};

export default function Index() {
    const [clickedCellData, setClickedCellData] = useState<IncidentData | null>(null);
    const [isFootageTagVisible, setIsFootageTagVisible] = useState(false);
    const [isContinueTagVisible, setIsContinueTagVisible] = useState(false);
    const [data, setData] = useState<IncidentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Memoize mobile detection
    const isMobile = useMemo(() => isMobileDevice(), []);

    // Memoized cell click handler
    const handleCellClick = useCallback((data: IncidentData) => {
        setIsFootageTagVisible(false);
        setClickedCellData(data);
    }, []);

    // Memoized context menu handler
    const handleContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
    }, []);

    // Data fetching
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch("/data/geoData.json");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const rawData = await response.json();
                if (isMounted) {
                    const mappedData = mapData(rawData);
                    setData(mappedData);
                }
            } catch (err) {
                if (isMounted) {
                    const errorMessage = err instanceof Error ? err.message : "Failed to load geoData";
                    console.error("Failed to load geoData:", err);
                    setError(errorMessage);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();
        return () => {
            isMounted = false;
        };
    }, []);

    // UI timing
    useEffect(() => {
        const continueTimer = setTimeout(() => {
            setIsContinueTagVisible(true);
        }, TIMING.CONTINUE_TAG_DELAY);

        const footageTimer = setTimeout(() => {
            setIsFootageTagVisible(true);
        }, TIMING.FOOTAGE_TAG_DELAY);

        return () => {
            clearTimeout(continueTimer);
            clearTimeout(footageTimer);
        };
    }, []);

    // Memoized footage items to prevent unnecessary re-renders
    const footageItems = useMemo(() => {
        if (!clickedCellData || isMobile) return null;
        return Array.from({ length: clickedCellData.filename.length }).map((_, index) => (
            <div key={`${clickedCellData.area}-${clickedCellData.date}-${index}`} className="flex-none snap-start">
                <ContentWindow title="">
                    <FootageDisplay
                        srcLink={`${clickedCellData.links[index]}`}
                        fileName={`/media/${clickedCellData.code}/${clickedCellData.filename[index]}.jpg`}
                        enlarge={true}
                    />
                </ContentWindow>
            </div>
        ));
    }, [clickedCellData, isMobile]);

    // Error state
    if (error) {
        return (
            <div className="footage-page">
                <Header />
                <main className="flex-grow relative h-auto overflow-hidden">
                    <div className="flex items-center justify-center h-64">
                        <p className="text-red-500">Error loading data: {error}</p>
                    </div>
                </main>
                {!isMobile && <Footer />}
            </div>
        );
    }

    return (
        <div onContextMenu={handleContextMenu} className="footage-page">
            <Header />
            <main className="flex-grow relative h-auto overflow-hidden">
                <div className="footage-timeline">
                    <div id="heatmap" className="min-w-max overflow-x-auto overflow-y-hidden hideScrollBar">
                        <HeatMapAnimation
                            key="heatmap-main"
                            data={data}
                            onCellClick={handleCellClick}
                            scrollButtonVisible={isContinueTagVisible}
                        />
                    </div>

                    <div className={`click-label transition-opacity duration-300 ${(isFootageTagVisible && !isMobile) ? 'opacity-100' : 'opacity-0'
                        }`}>
                        Click on each data point to view the footage.
                    </div>

                    <div className={`click-label transition-opacity duration-300 ${isMobile ? 'opacity-100' : 'opacity-0'
                        }`}>
                        Footage media can be viewed on desktops.
                    </div>
                </div>

                {clickedCellData && (
                    <div className="footage-display showScrollBar">
                        <div id="metadata-bar" className="fixed">
                            <div className="content">
                                <h4 className="title">
                                    {clickedCellData.area} | {clickedCellData.date}
                                </h4>
                            </div>
                        </div>

                        {!isMobile && (
                            <div className="flex gap-1 h-full flex-nowrap w-full">
                                {footageItems}
                            </div>
                        )}
                    </div>
                )}
            </main>
            {!isMobile && <Footer />}
        </div>
    );
}