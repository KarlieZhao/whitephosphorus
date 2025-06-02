import React, { useEffect, useState } from "react";
import { VectorMap } from "./map";
import { Histogram } from "./histo";
import Area from "./area";
import Segment from "./segment";
import { TypewriterProps } from "./header";
// export const RED_GRADIENT = ["#db2f0f", "#C03117", "#A5331E", "#8A3525", "#6E362C", "#7C3629", "#6E362C"]
export const RED_GRADIENT = ["#ccc", "#aaa", "#888", "#777", "#666", "#555", "#444"]

export type geoDataProps = {
    geoData: any[];
    selectedCity?: string;
    selectedDay?: number;
    onBarClick?: (data: [string, number] | null) => void;
    onSegmentClick?: (data: number | null) => void;
};

export default function DataSource({ TypeWriterFinished = true }: TypewriterProps) {
    const [geoData, setGeoData] = useState<any[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedDay, setselectedDay] = useState<number>(-1);

    const [details, updateDetails] = useState<any[]>([]);
    const [showOverview, setshowOverview] = useState(true)
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


    const getDetails = (pt: any) => {
        //selected city => multi point
        let readout1, readout2, readout3, readout4, readout5 = "";
        if (Array.isArray(pt)) {
            if (pt.length === 0) {
                updateDetails([readout1, readout2, readout3, readout4, readout5]);
                return;
            }
            const dates = pt.map(p => {
                const dateTimeString = `${p.date}T${p.time}`;
                const date = new Date(dateTimeString);
                return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: 'numeric' });
                // const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s(am|pm)/, (match) => match.toUpperCase());;
            })

            if (pt.length > 1) {
                readout1 = <>Between {dates[0]} and {dates[dates.length - 1]}</>
                readout2 = <>{pt.length} white phosphorus shells were deployed to <span className="highlight">{pt[0].name}</span></>
            } else {
                readout1 = <>On {dates[0]}</>
                readout2 = <>{pt.length} white phosphorus shell was deployed to <span className="highlight">{pt[0].name}</span></>
            }
        } else if (typeof pt === "object") {

            //single point
            const dateTimeString = `${pt.date}T${pt.time}`;
            const date = new Date(dateTimeString);
            const formattedDate = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: 'numeric' });
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s(am|pm)/, (match) => match.toUpperCase());;
            readout1 = <>On <span className="highlight">{formattedDate}</span>, at <span className="highlight">{formattedTime}</span>,</>;
            readout2 = <>1 white phosphorus shell was deployed to <span className="highlight">{pt.name}</span>.</>
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
            readout5 = `Classified as: ${siteType} area`;
        }
        updateDetails([readout1, readout2, readout3, readout4, readout5]);
    };


    return (<>
        <div onClick={() => {
            if (selectedCity != "") {
                setSelectedCity("");
                getDetails([]);
                setselectedDay(-1);
            }
        }}>
            <VectorMap geoData={geoData} selectedCity={selectedCity} selectedDay={selectedDay} TypeWriterFinished={TypeWriterFinished}
                getMapDetails={getDetails} />
        </div>
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

        <div className="fixed right-10 top-32 z-50">
            <div className="mt-8 histogram">
                <Histogram
                    geoData={geoData}
                    selectedCity={selectedCity}
                    onBarClick={(data) => {
                        if (!data) return;
                        const newCity = data[0] === selectedCity ? "" : data[0];
                        // const newCity = data === null ? "" : data[0]
                        setSelectedCity(newCity);

                        const pts = geoData.filter((p: any) => p.name === newCity);
                        getDetails(pts);
                    }} />
            </div>
            <div className="mb-5"><Area geoData={geoData} selectedCity={selectedCity} /></div>
            <div className="mt-6 mb-7"><Segment geoData={geoData} selectedCity={selectedCity}
            //    disabled for now 
            //   onSegmentClick={(day) => {
            //     if (day === null) return;
            //     const newDay = selectedDay === day ? -1 : day;
            //     setselectedDay(newDay);
            // }}
            /> </div>

        </div>

    </>);
}
