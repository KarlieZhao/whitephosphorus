import * as d3 from "d3";
import React, { useEffect, useState } from "react";
import { VectorMap } from "./map";
import { Histogram } from "./histo";
import Timeline from "./timeline";
import Area from "./area";
import Segment from "./segment";
import { TypewriterProps } from "./header";
import SatelliteMap from "./satellite-map";
// export const RED_GRADIENT = ["#db2f0f", "#C03117", "#A5331E", "#8A3525", "#6E362C", "#7C3629", "#6E362C"]
// export const RED_GRADIENT = ["#cfcfcf", "#aaa", "#909090", "#858585", "#777", "#666", "#606060"]
export const RED_GRADIENT = d3.quantize(d3.interpolateRgb("#db2f0f", "#2e1f1f"), 8);
export const width = 350;
export type geoDataProps = {
    geoData: any[];
    selectedCity?: string;
    selectedDay?: number;
    selectedDates?: [string, string];
    onBarClick?: (data: [string, number] | null) => void;
    onSegmentClick?: (data: number | null) => void;
    onTimelineDragged?: (data: [string, string] | null) => void;
};


// TODO
// a chart by month
// interactive segment chart
// interactive area chart
// satellite images tiling? => new component, toggle
// responsive chart sizing 

export default function DataSource({ TypeWriterFinished = true }: TypewriterProps) {
    const [geoData, setGeoData] = useState<any[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedDay, setselectedDay] = useState<number>(-1);
    const [selectedDates, setSelectedDates] = useState<[string, string]>(["", ""]);

    const [areaXaxis, setAreaXaxis] = useState<"hour" | "month">("month");

    const [showSatelliteMap, setShowSatelliteMap] = useState<boolean>(false);
    const [details, updateDetails] = useState<any[]>([]);
    const [showOverview, setshowOverview] = useState(true);

    const [mapZoom, setMapZoom] = useState(11.2);
    const [leafletCenter, setLeafletCenter] = useState<[number, number]>([35.57, 33.2]);
    const [mapInstance, setMapInstance] = useState<any | null>(null);


    useEffect(() => {
        fetch("/data/geoData.json")
            .then((res) => res.json())
            .then((data) => {
                const sortedData = data.sort((a: any, b: any) => {
                    const dateA = new Date(`${a.date}T${a.time}`);
                    const dateB = new Date(`${b.date}T${b.time}`);
                    return dateA.getTime() - dateB.getTime();
                });
                setGeoData(sortedData);
            })
            .catch((err) => console.error("Failed to load geoData:", err));
    }, []);


    const getDetails = (pt: any, arg?: any) => {
        let readout1, readout2, readout3, readout4, readout5 = "";
        if (arg != undefined) {
            //multi point array
            if (pt.length === 0 || !Array.isArray(pt)) {
                updateDetails([readout1, readout2, readout3, readout4, readout5]);
                return;
            }
            if (typeof arg === "string") {
                const dates = pt.map(p => {
                    const dateTimeString = `${p.date}T${p.time}`;
                    const date = new Date(dateTimeString);
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: 'numeric' });
                    // const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s(am|pm)/, (match) => match.toUpperCase());;
                })

                if (pt.length > 1) {
                    readout1 = <>Between <span className="text-2xl text-white">{dates[0]}</span> and  <span className="text-2xl text-white">{dates[dates.length - 1]}</span>,</>
                    readout2 = <><span className="text-2xl text-white">{pt.length} </span>white phosphorus shells were deployed to <span className="text-2xl text-white">{pt[0].name}</span>.</>
                } else {
                    readout1 = <>On <span className="text-2xl text-white">{dates[0]}</span>,</>
                    readout2 = <>{pt.length} white phosphorus shell was deployed to <span className="text-2xl text-white">{pt[0].name}</span>.</>
                }
            } else if (typeof arg === 'number') {
                const date = new Date(pt[0].date);
                let day = date.getDay();
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                readout1 = <>Among 195 white phosophorus incidents, </>
                readout2 = <>{pt.length} happened on {days[day]}s.</>
            } else {
                readout1 = <></>
                readout2 = <></>
            }
        } else {
            //single point
            const dateTimeString = `${pt.date}T${pt.time}`;
            const date = new Date(dateTimeString);
            const formattedDate = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: 'numeric' });
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s(am|pm)/, (match) => match.toUpperCase());;
            readout1 = <>On <span className="text-2xl text-white">{formattedDate}</span>, at <span className="text-2xl text-white">{formattedTime}</span>,</>;
            readout2 = <>1 white phosphorus shell was deployed to <span className="text-2xl text-white">{pt.name}</span>.</>
            readout3 = `Latitude: ${pt.lat}`;
            readout4 = `Longitude: ${pt.lon}`;

            const random = Math.random();
            let siteType = "civilian";
            if (random < 0.2) {
                siteType = "agricultural"
            } else if (random < 0.4) {
                siteType = "rural"
            } else if (random < 0.6) {
                siteType = "forest"
            }
            readout5 = `${siteType} area`;
        }
        updateDetails([readout1, readout2, readout3, readout4, readout5]);
    }


    return (<>
        <div className="satellite-toggle-container mb-4 z-50 absolute bottom-16 left-3">
            <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium ${!showSatelliteMap ? 'text-white' : 'text-gray-400'}`}>
                    Vector
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showSatelliteMap}
                        onChange={(e) => {
                            setShowSatelliteMap(e.target.checked)
                        }}
                        className="sr-only"
                    />
                    <div className="w-10 h-4 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className={`text-sm font-medium ${showSatelliteMap ? 'text-white' : 'text-gray-400'}`}>
                    Satellite
                </span>
            </div>
        </div>

        <div onClick={() => {
            if (selectedCity != "") {
                setSelectedCity("");
            }
            if (selectedDay != -1) {
                setselectedDay(-1);
            }
            if (selectedDates[0] != "" || selectedDates[1] != "") {
                setSelectedDates(["", ""])
            }
            getDetails([], "clear");
        }}>

            <SatelliteMap
                onZoomChange={setMapZoom}
                onCenterChange={setLeafletCenter}
                setMapInstance={setMapInstance}
                showSatellite={showSatelliteMap}
            />

            <VectorMap
                geoData={geoData}
                selectedCity={selectedCity}
                selectedDates={selectedDates}
                selectedDay={selectedDay}
                TypeWriterFinished={TypeWriterFinished}
                getMapDetails={getDetails}
                leafletCenter={leafletCenter}
                mapZoom={mapZoom}
                mapInstance={mapInstance}
            />

            {/* <SatelliteViewer /> */}
        </div >
        <div className={`map-readout ${showOverview ? 'opacity-100' : "opacity-0"}`}>
            {/* <p>Between Oct. 10, 2023 and Oct. 02, 2024, <br />
          195 white phosphorus shells were deployed to south Lebanon.</p> */}

            <div className="dynamic-readout">{details.map((line, idx) => (
                <div key={idx}>{line}</div>
            ))}
            </div>
        </div>

        <div className="map-legend block">
            <div className="flex"><div className="map-legend-points rural"></div>agriculture, forest, or rural area</div>
            <div className="flex"><div className="map-legend-points civilian"></div>urban area</div>
        </div>

        <div className="fixed right-3 top-28 z-50 side-bar">
            <div className="mt-2">
                <Timeline geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    onTimelineDragged={(data) => {
                        if (!data) return;
                        setSelectedDates([data[0], data[1]]);
                        //filter 
                    }} />
            </div>

            <div className="mt-5">
                <div className="chart-titles">WP shells by&nbsp;<span onClick={() => setAreaXaxis("month")} className={`button ${areaXaxis === "month" ? 'underline' : ''}`}> month</span>&nbsp;/&nbsp;<span className={`button ${areaXaxis === "hour" ? 'underline' : ''}`} onClick={() => setAreaXaxis("hour")}>hour</span>
                </div>
                <Area geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    x_unit={areaXaxis} />
            </div>

            <div className="mt-8">
                <Segment
                    geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    selectedDay={selectedDay}
                    onSegmentClick={(day) => {
                        if (day === null) return;
                        const newDay = selectedDay === day ? -1 : day; //if clicked again, reset
                        setselectedDay(newDay);

                        const pts = geoData.filter((p: any) => {
                            const date = new Date(p.date);
                            return date.getDay() === newDay
                        });
                        getDetails(pts, newDay);
                        //reset city to avoid confusion
                        setSelectedCity("");
                    }}
                />
            </div>
            <div className="mt-9 histogram">
                <Histogram
                    geoData={geoData}
                    selectedCity={selectedCity}
                    selectedDates={selectedDates}
                    onBarClick={(data) => {
                        if (!data) return;
                        const newCity = data[0] === selectedCity ? "" : data[0];
                        // const newCity = data === null ? "" : data[0]
                        setSelectedCity(newCity);

                        // reset day to avoid confusion  
                        setselectedDay(-1);
                        const pts = geoData.filter((p: any) => p.name === newCity);
                        getDetails(pts, newCity);
                    }} />
            </div>
        </div>


    </>);
}
