import * as d3 from "d3";
import React, { useEffect, useState } from "react";
import { VectorMap } from "./map";
import { Histogram } from "./histo";
import Timeline from "./timeline";
import Area from "./area";
import Segment from "./segment";
import { TypewriterProps } from "./header";
import SatelliteMap from "./satellite-map";
import LandscapeHisto from "./histo_landscape";

// export const RED_GRADIENT = ["#db2f0f", "#C03117", "#A5331E", "#8A3525", "#6E362C", "#7C3629", "#6E362C"]
// export const RED_GRADIENT = ["#cfcfcf", "#aaa", "#909090", "#858585", "#777", "#666", "#606060"]

export const MONTHS = ["2023-10", "2023-11", "2023-12", "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06",
    "2024-07", "2024-08", "2024-09", "2024-10", "2024-11"];
export const MONTHS_CONVERT = ["2023-9", "2023-10", "2023-11", "2024-0", "2024-1", "2024-2", "2024-3", "2024-4", "2024-5", "2024-6",
    "2024-7", "2024-8", "2024-9", "2024-10"];
const MONTHS_PRINT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const RED_GRADIENT = d3.quantize(d3.interpolateRgb("#db2f0f", "#2e1f1f"), 8);
export const width = 350;
export type geoDataProps = {
    geoData: any[];
    selectedCity?: string;
    selectedDay?: number;
    selectedDates?: [string, string];
    selectedAreaType?: string | null;
    selectedMonth?: number | null;
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

    const [showMonth, setShowMonth] = useState(true);

    const [showSatelliteMap, setShowSatelliteMap] = useState<boolean>(false);
    const [details, updateDetails] = useState<any[]>([]);
    const [showOverview, setshowOverview] = useState(true);
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
        let readout1, readout2, readout3, readout4, readout5, readout6 = "";
        let thumbnails: string[] = [];
        let ext_link: string[] = [];

        if (!pt) {
            updateDetails([readout1, readout2, readout3, readout4, readout5, readout6, thumbnails, ext_link]);
            return;
        }
        if (arg != undefined) {
            //multi point array
            if (pt.length === 0 || !Array.isArray(pt)) {
                updateDetails([readout1, readout2, readout3, readout4, readout5, readout6, thumbnails, ext_link]);
                return;
            }
            if (typeof arg === "string") {
                if (arg.indexOf("-") > 0) {
                    readout1 = <>Of the 248 white phosophorus incidents, </>
                    readout2 = <><span className="text-2xl text-white">{pt.length}&nbsp;&nbsp;({(100 * pt.length / 248).toFixed(1)}%)</span> of them happended in <span className="text-2xl text-white">{monthParser(arg)}</span>.</>

                } else if (Object.keys(landscape_map).includes(arg)) {
                    const key = arg as keyof landscape_mapping_prop;
                    const counts = pt.filter(p => p.landscape === arg).length
                    readout1 = <>Of the 248 white phosophorus incidents, </>
                    readout2 = <><span className="text-2xl text-white">{counts}&nbsp;&nbsp;({(100 * counts / 248).toFixed(1)}%)</span> of them stroke <span className="text-2xl text-white">{landscape_map[key]}</span> areas.</>
                } else {
                    let shellCount = 0;
                    const dates = pt.map(p => {
                        const dateTimeString = `${p.date}T${p.time}`;
                        const date = new Date(dateTimeString);
                        shellCount += p.shell_count;
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: 'numeric' });
                        // const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s(am|pm)/, (match) => match.toUpperCase());;
                    })

                    if (pt.length > 1) { //filtered by town
                        readout1 = <>Between <span className="text-2xl text-white">{dates[0]}</span> and  <span className="text-2xl text-white">{dates[dates.length - 1]}</span>,</>
                        readout2 = <><span className="text-2xl text-white">{shellCount} </span>wp shells were deployed to <span className="text-2xl text-white">{pt[0].town}</span> across {pt.length} attacks.</>
                    } else {
                        readout1 = <>On <span className="text-2xl text-white">{dates[0]}</span>,</>
                        readout2 = <>{shellCount} white phosphorus shell was deployed to <span className="text-2xl text-white">{pt[0].town}</span>.</>
                    }
                }
            } else if (typeof arg === 'number') { //filtered by day of week
                const date = new Date(pt[0].date);
                let day = date.getDay();
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                readout1 = <>Of the 248 white phosophorus incidents, </>
                readout2 = <><span className="text-2xl text-white">{pt.length}&nbsp;&nbsp;({(100 * pt.length / 248).toFixed(1)}%)</span> of them happened on <span className="text-2xl text-white">{days[day]}s</span>.</>
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
            readout2 = <>{pt.shell_count} white phosphorus shell was deployed to <span className="text-2xl text-white">{pt.town}</span>.</>
            //only on click
            if (clicked) {
                readout3 = `Latitude: ${pt.lat}`;
                readout4 = `Longitude: ${pt.lon}`;
                readout5 = `Code: ${pt.code}`
                if (pt.landscape) {
                    readout6 = `${landscape_map[pt.landscape as keyof typeof landscape_map]} area`;
                } else readout6 = "Landscape type is not yet unidentified."

                thumbnails = pt.filename.map((name: string) => `/media/${pt.code}/${name}.jpg`)
                ext_link = [...pt.links]
            } else {
                readout3 = "";
                readout4 = "";
                readout5 = "";
                readout6 = "";
                thumbnails = []
                ext_link = []
            }
        }
        updateDetails([readout1, readout2, readout3, readout4, readout5, readout6, thumbnails, ext_link]);
    }


    return (<>
        <div className={`${showOverlay ? "" : "hidden"} map-overlay`}>
            <img src={`${overlayImage}`} alt="" className="max-w-[50vw] max-h-[70vh]" />
        </div>
        {/* <div className="satellite-toggle-container mb-4 ml-12 z-50 absolute bottom-16 left-3">
            <div className={`flex items-center space-x-3 ${TypewriterFinished ? "" : "hidden"}`}>
                <span className={`text-sm font-medium ${!showSatelliteMap ? 'text-white' : 'text-gray-500'}`}>
                    Vector
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showSatelliteMap}
                        onChange={(e) => setShowSatelliteMap(e.target.checked)}
                        className="sr-only"
                    />
                    <div className="w-8 h-3 bg-red-900 rounded-sm transition-colors relative">
                        <span className={`absolute w-3 h-3 bg-gray-300 rounded-sm shadow transition-transform ${showSatelliteMap ? 'translate-x-5' : ''}`}></span>
                    </div>
                </label>
                <span className={`text-sm font-medium ${showSatelliteMap ? 'text-white' : 'text-gray-500'}`}>
                    Satellite
                </span>
            </div>
        </div> */}

        <div onClick={() => {
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
                TypewriterFinished={TypewriterFinished}
                getMapDetails={getDetails}
                leafletCenter={leafletCenter}
                mapZoom={mapZoom}
                mapInstance={mapInstance}
                showSatellite={showSatelliteMap}
                TypeWriterFinished={TypewriterFinished}
            />

            {/* <SatelliteViewer /> */}
        </div >
        <div className={`map-readout ${showOverview ? 'opacity-100' : "opacity-0"}`}>
            {/* <p>Between Oct. 10, 2023 and Oct. 02, 2024, <br />
          248 white phosphorus shells were deployed to south Lebanon.</p> */}

            <div className="dynamic-readout">
                {details.slice(0, 5).map((line, idx) => (<div key={idx}>{line}</div>))}
            </div>
            <div className="dynamic-thumbnails overflow-y-auto">
                <p className="flex gap-4 flex-wrap max-w-[30vw] h-auto">
                    {details[6]?.map((line: string, idx: number) =>
                    (<a href={details[7][idx]} key={idx} target="_blank">
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
            <div className="mt-2">
                <Timeline geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    selectedDay={selectedDay}
                    selectedAreaType={selectedAreaType}
                    selectedMonth={selectedMonth}
                    onTimelineDragged={(data) => {
                        if (!data) return;
                        //reset other params
                        setSelectedDates([data[0], data[1]]);
                        setselectedDay(-1);
                        setSelectedAreaType(null);
                        setSelectedMonth(null)
                        getDetails(null)
                    }} />
            </div>

            <div className="mt-5">
                <div className="chart-titles">Incidents by&nbsp;
                    <span onClick={() => setShowMonth(true)} className={`button ${showMonth ? 'underline' : ''}`}> month</span>
                    &nbsp;/&nbsp;
                    <span className={`button ${!showMonth ? 'underline' : ''}`} onClick={() => setShowMonth(false)}>hour</span>
                </div>
                <div className={`${showMonth ? '' : "hidden"}`}>
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
                                console.log(realMonthinData)
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
                        }}
                    />
                </div>
                <div className={`${!showMonth ? '' : "hidden"}`}>
                    <Area geoData={geoData}
                        selectedCity={selectedCity}
                        selectedDates={selectedDates}
                        selectedDay={selectedDay}
                        selectedAreaType={selectedAreaType}
                        selectedMonth={selectedMonth}
                    /></div>
            </div>
            <div className="mt-7">
                <Segment geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    selectedDay={selectedDay}
                    selectedAreaType={selectedAreaType}
                    selectedMonth={selectedMonth}
                    onSegmentClick={(day) => {
                        if (day === null) return;
                        const newDay = selectedDay === day ? -1 : day; //if clicked again, reset
                        setselectedDay(newDay);

                        const pts = geoData.filter((p: any) => {
                            const date = new Date(p.date);
                            return date.getDay() === newDay
                        });
                        getDetails(pts, newDay);
                        //reset other params
                        setSelectedCity("");
                        setSelectedDates(["", ""]);
                        setSelectedAreaType(null);
                        setSelectedMonth(null)
                    }}
                />
            </div>

            <div className={`mt-8`}>
                <div className="chart-titles">Catogorized by Landscape</div>
                <div className="flex gap-3 justify-center mt-3">
                    <div className={`chart-titles area-type-legend 
                    ${selectedAreaType === "resident" ? "area-type-legend-active" : ""}`}
                        onClick={() => {
                            const pts = geoData.filter((p: any) => {
                                return p.landscape === "resident"
                            });
                            setSelectedAreaType("resident");
                            getDetails(pts, "resident");
                            //reset other params
                            setSelectedCity("");
                            setSelectedDates(["", ""]);
                            setselectedDay(-1);
                            setSelectedMonth(null)
                        }}>{landscape_map.resident}</div>
                    <div className={`chart-titles area-type-legend 
                    ${selectedAreaType === "agri" ? "area-type-legend-active" : ""}`}
                        onClick={() => {
                            const pts = geoData.filter((p: any) => {
                                return p.landscape === "agri"
                            });
                            setSelectedAreaType("agri");
                            getDetails(pts, "agri");
                            //reset other params
                            setSelectedCity("");
                            setSelectedDates(["", ""]);
                            setselectedDay(-1);
                            setSelectedMonth(null)
                        }}>{landscape_map.agri}</div>
                    <div className={`chart-titles area-type-legend 
                    ${selectedAreaType === "bare" ? "area-type-legend-active" : ""}`}
                        onClick={() => {
                            const pts = geoData.filter((p: any) => {
                                return p.landscape === "bare"
                            });
                            setSelectedAreaType("bare");
                            getDetails(pts, "bare");
                            //reset other params
                            setSelectedCity("");
                            setSelectedDates(["", ""]);
                            setselectedDay(-1);
                            setSelectedMonth(null)
                        }}>{landscape_map.bare}</div>
                </div>
            </div>

            <div className="mt-6 histogram">
                <Histogram
                    geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    selectedDay={selectedDay}
                    selectedAreaType={selectedAreaType}
                    selectedMonth={selectedMonth}
                    onBarClick={(data) => {
                        if (!data) return;
                        const newCity = data[0] === selectedCity ? "" : data[0];
                        // const newCity = data === null ? "" : data[0]
                        setSelectedCity(newCity);

                        //reset other params
                        setselectedDay(-1);
                        setSelectedAreaType(null);
                        const pts = geoData.filter((p: any) => p.town === newCity);
                        getDetails(pts, newCity);
                        setSelectedMonth(null)
                    }} />
            </div>
        </div>
    </>);
}
