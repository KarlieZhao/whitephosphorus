import * as d3 from "d3";
import React, { useEffect, useState } from "react";
import { VectorMap } from "./map";
import { Histogram } from "./histo";
import Timeline from "./timeline";
import Area from "./area";
import { TypewriterProps } from "./header";
import SatelliteMap from "./satellite-map";
import LandscapeHisto from "./histo_landscape";
import LandscapeBar from "./landscape-bar";

// export const RED_GRADIENT = ["#db2f0f", "#C03117", "#A5331E", "#8A3525", "#6E362C", "#7C3629", "#6E362C"]
// export const RED_GRADIENT = ["#cfcfcf", "#aaa", "#909090", "#858585", "#777", "#666", "#606060"]

export const MONTHS = ["2023-10", "2023-11", "2023-12", "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06",
    "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05",
    "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05"];
export const MONTHS_CONVERT = ["2023-9", "2023-10", "2023-11", "2024-0", "2024-1", "2024-2", "2024-3", "2024-4", "2024-5", "2024-6",
    "2024-7", "2024-8", "2024-9", "2024-10", "2024-11", "2025-0", "2025-1", "2025-2", "2025-3", "2025-4",
    "2025-5", "2025-6", "2025-7", "2025-8", "2025-9", "2025-10", "2025-11", "2026-0", "2026-1", "2026-2", "2026-3", "2026-4"];
const MONTHS_PRINT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TOTAL_STRIKES_BY_YEAR: { [year: string]: number } = {
    "2023": 118,
    "2024": 132,
    "2025": 1,
    "2026": 35,
}
const PENDING_GEOLOCATION_BY_YEAR: { [year: string]: number } = {
    "2023": 7,
    "2024": 20,
    "2025": 0,
    "2026": 7,
}
const DISCORD_INVITE_URL = "https://discord.gg/YxZNEKWfQT";
const geoSource: { [key: string]: String } = {
    "AB": "Ahmad Baydoun",
    "AN": "X: AnnoNemo",
    "AUB": "American University of Beirut",
    "GS": "Green Southerners",
    "AS": "Alex Spoerndli",
    "MM": "Maria Molijn",
    "HRW": "Human Rights Watch"
}
export const RED_GRADIENT = d3.quantize(d3.interpolateRgb("#db2f0f", "#2e1f1f"), 8);
export const width = 350;
export type geoDataProps = {
    geoData: any[];
    selectedCity?: string;
    selectedDay?: number;
    selectedDates?: [string, string];
    selectedAreaType?: string | null;
    selectedMonth?: number | null;
    selectedYear?: string | null;
    onBarClick?: (data: [string, number] | null) => void;
    onMonthClick?: (data: [string, number] | null) => void;
    onSegmentClick?: (data: number | null) => void;
    onTimelineDragged?: (data: [string, string] | null) => void;
    onAreaTypeClicked?: (data: string | null) => void;
};
interface landscape_mapping_prop {
    resident: string;
    bare: string;
    agri: string
}

export default function DataSource({ TypewriterFinished = false }: TypewriterProps) {
    const [geoData, setGeoData] = useState<any[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedDay, setselectedDay] = useState<number>(-1);
    const [selectedAreaType, setSelectedAreaType] = useState<string | null>(null);
    const [selectedDates, setSelectedDates] = useState<[string, string]>(["", ""]);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
    const [selectedYear, setSelectedYear] = useState<string | null>(null)

    const [showSatelliteMap, setShowSatelliteMap] = useState<boolean>(false);
    const [details, updateDetails] = useState<any[]>([]);
    const [showPanels, setShowPanels] = useState(false);

    const [mapZoom, setMapZoom] = useState(11.2);
    const [leafletCenter, setLeafletCenter] = useState<[number, number]>([35.57, 33.2]);
    const [mapInstance, setMapInstance] = useState<any | null>(null);

    const [showOverlay, setShowOverlay] = useState<boolean>(false);
    const [overlayImage, setOverlayImage] = useState<String | null>(null);


    const landscape_map: landscape_mapping_prop = {
        "resident": "residential",
        "agri": "agricultural",
        "bare": "forested/open terrain"
    }

    const controlEnabledTimeout = 500;

    useEffect(() => {
        if (!TypewriterFinished) return;
        setTimeout(() => {
            setShowPanels(true);
        }, controlEnabledTimeout);
    }, [TypewriterFinished])

    useEffect(() => {
        fetch("/data/geoData.json")
            .then((res) => res.json())
            .then((data) => {
                console.log("data loaded. Total", data.length, "entries.")
                const sortedData = data.sort((a: any, b: any) => {
                    const dateA = new Date(`${a.date}T${a.time}`);
                    const dateB = new Date(`${b.date}T${b.time}`);
                    return dateA.getTime() - dateB.getTime();
                });
                setGeoData(sortedData);
            })
            .catch((err) => console.error("Failed to load geoData:", err));
    }, []);

    const monthParser = (input: string) => {
        const [year, month] = input.split("-")
        return MONTHS_PRINT[parseInt(month) - 1] + " " + year;
    }


    const getDetails = (pt?: any, arg?: any, clicked?: boolean) => {
        let readout1, readout2, readout3, readout4, readout5, readout6, readout7, readout8 = "";
        let thumbnails: string[] = [];
        let ext_link: string[] = [];

        if (!pt) {
            updateDetails([readout1, readout2, readout3, readout4, readout5, readout6, readout7, readout8, thumbnails, ext_link]);
            return;
        }
        if (arg != undefined) {
            //multi point array
            if (pt.length === 0 || !Array.isArray(pt)) {
                updateDetails([readout1, readout2, readout3, readout4, readout5, readout6, readout7, readout8, thumbnails, ext_link]);
                return;
            }
            const shellCount = pt.reduce((sum, p) => sum + p.shell_count, 0)
            if (typeof arg === "string") {

                if (arg.indexOf("-") > 0) {
                    //month
                    readout1 = <><span className="text-2xl text-white">{shellCount}</span> white phosphorus strike{shellCount > 1 ? "s" : ""} happened in <span className="text-2xl text-white">{monthParser(arg)}</span>.<br /><span className="text-2xl text-white">{(100 * shellCount / 286).toFixed(1)}%</span> of total strikes.</>
                    readout2 = <></>
                } else if (Object.keys(landscape_map).includes(arg)) {
                    //landscape
                    const key = arg as keyof landscape_mapping_prop;
                    const subset = pt.filter(p => p.landscape === arg);
                    readout1 = <><span className="text-2xl text-white">{shellCount}</span> white phosphorus shells struck  <span className="text-2xl text-white">{landscape_map[key]}</span> areas.<br /><span className="text-2xl text-white">{(100 * shellCount / 286).toFixed(1)}%</span> of total strikes.</>
                    readout2 = <></>
                } else if (/^\d{4}$/.test(arg)) {
                    //year
                    const pendingCount = PENDING_GEOLOCATION_BY_YEAR[arg] ?? 0;
                    const totalCount = TOTAL_STRIKES_BY_YEAR[arg] ?? shellCount;
                    readout1 = <><span className="text-2xl text-white">{totalCount}</span> white phosphorus strike{totalCount > 1 ? "s" : ""} happened in <span className="text-2xl text-white">{arg}</span>
                        {pendingCount > 0 && <>,<br /><span className="text-2xl text-white">{pendingCount}</span> of which {pendingCount > 1 ? "are" : "is"} verified but not yet geolocated</>}
                        .</>
                    readout2 = pendingCount > 0
                        ? <div style={{ marginTop: "0.6rem" }}>Want to help? <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="underline text-white">Join our Discord</a>.</div>
                        : <></>
                }
                else {
                    let shellCount = 0;
                    const dates = pt.map(p => {
                        const dateTimeString = `${p.date}T${p.time}`;
                        const date = new Date(dateTimeString);
                        shellCount += p.shell_count;
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: 'numeric' });
                        // const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s(am|pm)/, (match) => match.toUpperCase());;
                    })

                    if (pt.length > 1) {
                        // city/town
                        readout1 = <>Between <span className="text-2xl text-white">{dates[0]}</span> and  <span className="text-2xl text-white">{dates[dates.length - 1]}</span>,</>
                        readout2 = <><span className="text-2xl text-white">{shellCount} </span>white phosphorus shell{shellCount > 1 ? "s" : ""} struck
                            <span className="text-2xl text-white"> {pt[0].town}</span>.</>
                    } else {
                        readout1 = <>On <span className="text-2xl text-white">{dates[0]}</span>,</>
                        readout2 = <>{shellCount} white phosphorus shell{shellCount > 1 ? "s" : ""} struck <span className="text-2xl text-white">{pt[0].town}</span>.</>
                    }
                }
            } else if (Array.isArray(arg)) {
                //clicked on timeline
                const townCount = new Set(pt.map(p => p.town));
                const date1 = new Date(arg[0]);
                const date_start = date1.toLocaleDateString("en-US", { month: "short", day: "numeric", year: 'numeric' });
                const date2 = new Date(arg[1]);
                const date_end = date2.toLocaleDateString("en-US", { month: "short", day: "numeric", year: 'numeric' });
                readout1 = <>Between <span className="text-2xl text-white">{date_start}</span> and <span className="text-2xl text-white">{date_end}</span>,</>
                readout2 = <><span className="text-2xl text-white">{shellCount} </span>white phosphorus shell{shellCount > 1 ? "s" : ""}  struck <span className="text-2xl text-white">{townCount.size}</span> cities/towns.</>
            }
            else if (typeof arg === 'number') { //filtered by day of week
                const date = new Date(pt[0].date);
                let day = date.getDay();
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                readout2 = <></>
                readout1 = <><span className="text-2xl text-white">{shellCount}</span> white phosphorus strike{shellCount > 1 ? "s" : ""} happened on <span className="text-2xl text-white">{days[day]}s</span>.<br /><span className="text-2xl text-white">{(100 * shellCount / 286).toFixed(1)}%</span> of total strikes.</>
            } else {
                readout1 = <></>
                readout2 = <></>
            }
            thumbnails = [];
        } else {
            //single point
            const dateTimeString = `${pt.date}T${pt.time}`;
            const date = new Date(dateTimeString);
            const formattedDate = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: 'numeric' });
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s(am|pm)/, (match) => match.toUpperCase());;
            readout1 = <>On <span className="text-2xl text-white">{formattedDate}</span>, at <span className="text-2xl text-white">{formattedTime}</span>,</>;
            readout2 = <><span className="text-2xl text-white">{pt.shell_count}</span> white phosphorus shell{pt.shell_count > 1 ? "s" : ""} struck <span className="text-2xl text-white">{pt.town}</span>.</>
            //only on click
            if (clicked) {
                readout3 = `Latitude: ${pt.lat}`;
                readout4 = `Longitude: ${pt.lon}`;
                readout5 = `Code: ${pt.code}`
                if (pt.landscape) {
                    const lands = landscape_map[pt.landscape as keyof typeof landscape_map];
                    readout6 = `${lands.slice(0, 1).toUpperCase() + lands.slice(1)} area`;
                } else readout6 = "Landscape type is not yet unidentified."
                const geolocator = pt.by.map((person: string) => geoSource[person] ?? "/").join(", ")
                readout7 = `Geolocated by: ${geolocator}`
                readout8 = pt.source ? `Photo credit: ${pt.source}` : "";

                thumbnails = pt.filename.map((name: string) => `/media/${pt.code}/${/\.\w+$/.test(name) ? name : `${name}.jpg`}`)
                ext_link = [...pt.links]
            } else {
                readout3 = "";
                readout4 = "";
                readout5 = "";
                readout6 = "";
                readout8 = "";
                thumbnails = []
                ext_link = []
            }
        }
        updateDetails([readout1, readout2, readout3, readout4, readout5, readout6, readout7, readout8, thumbnails, ext_link]);
    }


    return (<>
        <div className={`${showOverlay ? "" : "hidden"} map-overlay`}>
            <img src={`${overlayImage}`} alt="" className="max-w-[50vw] max-h-[70vh]" />
        </div>


        <div onClick={() => {
            //reset all
            if (selectedCity != "") {
                setSelectedCity("");
            }
            if (selectedDay != -1) {
                setselectedDay(-1);
            }
            if (selectedAreaType) {
                setSelectedAreaType(null);
            }
            if (selectedDates[0] != "" || selectedDates[1] != "") {
                setSelectedDates(["", ""])
            }
            if (selectedMonth != null) {
                setSelectedMonth(null)
            }
            if (selectedYear != null) {
                setSelectedYear(null)
            }
            // getDetails([], "clear");
        }}>

            <SatelliteMap
                onZoomChange={setMapZoom}
                onCenterChange={setLeafletCenter}
                setMapInstance={setMapInstance}
                showSatellite={showSatelliteMap}
                TypewriterFinished={TypewriterFinished}
            />

            <VectorMap
                geoData={geoData}
                selectedCity={selectedCity}
                selectedDates={selectedDates}
                selectedDay={selectedDay}
                selectedAreaType={selectedAreaType}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                TypewriterFinished={TypewriterFinished}
                getMapDetails={getDetails}
                leafletCenter={leafletCenter}
                mapZoom={mapZoom}
                mapInstance={mapInstance}
                showSatellite={showSatelliteMap}
                TypeWriterFinished={TypewriterFinished}
            />
        </div >
        <div className={`map-readout opacity-100`}>
            <div className="dynamic-readout">
                {details.slice(0, 8).map((line, idx) => (
                    <div key={idx}>{line}</div>
                ))}
            </div>

            <div className="dynamic-thumbnails overflow-y-auto">
                <p className="flex gap-4 flex-wrap max-w-[30vw] h-auto">
                    {details[8]?.map((line: string, idx: number) =>
                    (<a href={details[9][idx]} key={idx} target="_blank">
                        <img src={`${line}`} className="max-w-24 max-h-20" key={idx} alt=""
                            onMouseOver={() => {
                                setOverlayImage(line);
                                setShowOverlay(true);
                            }}
                            onMouseOut={() => {
                                setShowOverlay(false);
                            }}
                        />
                    </a>)
                    )}
                </p>
            </div>
        </div>

        <div
            className={`fixed right-3 top-28 z-50 side-bar transition-opacity duration-500 ease-in-out ${showPanels ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} >
            <div className="satellite-toggle-container relative mt-1">
                <div className={`map-toggle-group ${TypewriterFinished ? "pointer-events-auto" : "pointer-events-none"}`}>
                    <div
                        className={`map-toggle-option ${!showSatelliteMap ? "map-toggle-option-active" : ""}`}
                        onClick={() => setShowSatelliteMap(false)}
                    >
                        Vector Map
                    </div>
                    <div
                        className={`map-toggle-option ${showSatelliteMap ? "map-toggle-option-active" : ""}`}
                        onClick={() => setShowSatelliteMap(true)}
                    >
                        Satellite Image
                    </div>
                </div>
            </div>


            <div className="mt-5">
                <div className="chart-titles">Filter by Year</div>
                <div className="flex gap-3 justify-center mt-3">
                    {["All", "2023", "2024", "2025", "2026"].map((year) => (
                        <div
                            key={year}
                            className={`chart-titles area-type-legend year-filter-pill ${(year === "All" && selectedYear === null) || selectedYear === year ? "area-type-legend-active" : ""}`}
                            onClick={() => {
                                //reset other params
                                setSelectedCity("");
                                setSelectedDates(["", ""]);
                                setselectedDay(-1);
                                setSelectedAreaType(null);
                                setSelectedMonth(null);

                                if (year === "All") {
                                    setSelectedYear(null);
                                    getDetails(null);
                                } else {
                                    setSelectedYear(year);
                                    const pts = geoData.filter((p: any) => p.date.slice(0, 4) === year);
                                    getDetails(pts, year);
                                }
                            }}>{year}</div>
                    ))}
                </div>
            </div>

            <div className="mt-5">
                <Timeline geoData={geoData}
                    selectedDates={selectedDates}
                    onTimelineDragged={(data) => {
                        if (!data) return;
                        setSelectedDates([data[0], data[1]]);
                        //reset other params
                        setselectedDay(-1);
                        setSelectedAreaType(null);
                        setSelectedMonth(null)
                        setSelectedYear(null)
                        const pts = geoData.filter((p: any) => { return p.date <= data[1] && p.date >= data[0] })
                        getDetails(pts, [data[0], data[1]])
                    }} />
            </div>

            <div className="mt-5">
                <div className="chart-titles">Strikes by Month</div>
                <LandscapeHisto geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    selectedDay={selectedDay}
                    selectedAreaType={selectedAreaType}
                    selectedMonth={selectedMonth}
                    onMonthClick={(d: ([string, number] | null)) => { //[d.key, d.count]
                        if (d) {
                            const [year, month] = d[0].split("-");
                            const realMonth = year + "-" + (parseInt(month))
                            setSelectedMonth(MONTHS_CONVERT.indexOf(realMonth));
                            const realMonthinData = MONTHS[MONTHS_CONVERT.indexOf(realMonth)];
                            const pts = geoData.filter((p: any) => { return p.date.slice(0, 7) === realMonthinData })
                            getDetails(pts, realMonthinData);

                            // console.log("selected month is ", MONTHS_CONVERT.indexOf(realMonth))
                            // console.log(realMonth, d[1])
                        } else {
                            setSelectedMonth(null);
                        }
                        //reset others
                        setSelectedCity("");
                        setSelectedDates(["", ""]);
                        setSelectedAreaType(null);
                        setselectedDay(-1)
                        setSelectedYear(null)
                    }}
                />
            </div>
            <div className="mt-4 ">
                <div className="chart-titles">Strikes by Hour</div>
                <Area geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    selectedDay={selectedDay}
                    selectedAreaType={selectedAreaType}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                />
            </div>
            <div className={`mt-8`}>
                <div className="chart-titles">Catogorized by Landscape</div>
                <LandscapeBar
                    geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    selectedDay={selectedDay}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    selectedAreaType={selectedAreaType}
                    onAreaTypeClicked={(type) => {
                        setSelectedAreaType(type);
                        if (type) {
                            const pts = geoData.filter((p: any) => p.landscape === type);
                            getDetails(pts, type);
                        } else {
                            getDetails(null);
                        }
                        //reset other params
                        setSelectedCity("");
                        setSelectedDates(["", ""]);
                        setselectedDay(-1);
                        setSelectedMonth(null);
                        setSelectedYear(null);
                    }}
                />
            </div>



            <div className="mt-4 histogram">
                <Histogram
                    geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    selectedDay={selectedDay}
                    selectedAreaType={selectedAreaType}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onBarClick={(data) => {
                        if (!data) return;
                        const newCity = data[0] === selectedCity ? "" : data[0];
                        // const newCity = data === null ? "" : data[0]
                        setSelectedCity(newCity);

                        //reset other params
                        setselectedDay(-1);
                        setSelectedAreaType(null);
                        setSelectedDates(["", ""])
                        const pts = geoData.filter((p: any) => p.town === newCity);
                        getDetails(pts, newCity);
                        setSelectedMonth(null)
                        setSelectedYear(null)
                    }} />
            </div>
        </div>
    </>);
}
