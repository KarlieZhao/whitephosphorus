"use client";
import { useState, useEffect } from "react";
import Header from "@/app/_components/header";
import Mailto from "react-mailto-link";
import Icon from 'react-native-ionicons'
import Collapsible from '@/app/_components/collapsible'
import NavBar from "../_components/select-display-bar";
import '@/app/globals.css';

export default function Index() {
    const [isVisible, setIsVisible] = useState(false);
    const [isMethodVisible, setIsMethodVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        setTimeout(() => setIsMethodVisible(true), 200);
    }, []);

    return (
        <div>
            <Header TypeWriterFinished={false} />
            <main className="about-page min-h-screen flex mt-48">
                <div className="inner-backdrop"></div>
                <div
                    className={`fixed w-1/5 ml-12 mb-10 transform transition-all duration-1000 ease-in-out 
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                >
                    <p className="team-info">
                        <span className="text-white">Ahmad Baydoun</span> is an architect and OSINT researcher whose work delves into the transformation of environments into tools of power. He is currently pursuing his PhD at the Technical University of Delft, with his dissertation titled “Weaponized Environments.” His research exposes the strategic manipulation of natural landscapes in modern warfare. He has worked on the AirPressure.info project, which archives and visualizes Israeli violations over Lebanese airspace. Baydoun's work has been recognized and cited by Amnesty International, L'Orient Le Jour, PBS, Al Jazeera, Arab News, and the American University of Beirut.
                        <br /><br />email: <span className="text-white">a.b.baydoun@tudelft.nl</span>
                        <br />website: <a href="https://ahmadbeydoun.com" target="_blank">ahmadbeydoun.com</a>
                    </p>
                    <p className="team-info"><br />

                        Team<br />
                        <a href="https://ahmadbeydoun.com" target="_blank">Ahmad Baydoun</a><br />
                        Khodor Joujou<br />
                        <br />
                        Collaborators:<br />
                        Special thanks to <span className="text-white">Green Southerners</span> for their assistance in data collection and geolocation processes, which have been invaluable to the accuracy and integrity of our project.<br />
                        <br />
                        Website designed and developed by <a href="https://portfolio.theunthoughts.com/" target="_blank">Karlie Zhao</a>.<br />

                    </p>
                </div>
                <div
                    className={`project-info mr-20 display-block mb-10 transform transition-all duration-1000 ease-in-out 
                    ${isMethodVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                >
                    <div className="mx-10">
                        <h2>WhitePhosphorus.info</h2>
                        <p>
                            Over the past year, we have verified and geolocated 191 incidents of white phosphorus deployment by Israel in South Lebanon. Our website now hosts an interactive cartographic display that organizes this data chronologically and spatially, providing insights into the patterns of deployment. This project aims to serve as a comprehensive, real-time database tracking the deployment of white phosphorus munitions in South Lebanon.</p>
                        <p>  Our mission is to expose the systematic use of white phosphorus—an incendiary weapon whose use in populated areas is restricted under international law due to its severe and often fatal consequences. By collecting, verifying, and mapping instances of white phosphorus use, we seek to increase transparency and accountability in warfare. Furthermore, we aim to inform residents whose lands have been exposed to white phosphorus, preparing for the post-war recovery by collaborating with local municipalities to mark affected territory and work with specialized teams to detoxify these areas. Our efforts are dedicated to ensuring that communities can safely rehabilitate and reclaim their environment once hostilities have ceased.
                        </p>
                    </div>
                    <div className="mx-10 mt-20">
                        <Collapsible label="What is white phosphorus?">
                            White phosphorus is a highly reactive chemical used in military operations, primarily for creating smoke screens and as an incendiary weapon. It ignites easily, producing a thick white smoke that can conceal troop movements. However, its use carries significant consequences, especially when deployed in populated areas. Contact with white phosphorus can cause severe burns, and its effects are often severe and potentially fatal. International law restricts its use due to these harmful impacts on human health and safety.</Collapsible>
                        <Collapsible label="How does the toxicity counter work?">
                            Our website features a toxicity counter that quantifies the impact of white phosphorus through three key metrics, each providing crucial information over a specific period:
                            <br /><br /> <ul>
                                <li>Incidents (191): Represents the total number of verified and geolocated white phosphorus incidents recorded from October 7, 2023, to October 7, 2024. This metric highlights the frequency and distribution of these incidents.</li>
                                <li>Land (87.2 m²): To calculate the total land area affected by white phosphorus, we estimated the average area contaminated per incident. Assuming each incident affects approximately 0.456 m² of land, we multiply this figure by the total number of incidents:
                                    <div style={{ lineHeight: "3rem" }}>  [INSERT FORMULA HERE]. </div>
                                    This metric emphasizes the cumulative environmental footprint, capturing the extent of land directly contaminated.</li>
                                <li>Air (95.3 m³): Similarly, to estimate the total volume of air contaminated by white phosphorus smoke, we calculated the average volume of air affected per incident. If each incident contaminates approximately 0.499 m³ of air, multiplying this by the total number of incidents gives:<div style={{ lineHeight: "3rem" }}>[INSERT FORMULA HERE]. </div>This metric underlines the reach of air pollution, indicating the volume of air likely impacted by the toxic fumes.</li>
                            </ul>
                        </Collapsible>
                        <Collapsible label="Selected Facts and figures">
                            Maiss Al Jabal has been the most severely hit town in south Lebanon, taking in about a quarter of all attacks. February is the least month and July is the most month over that year.
                        </Collapsible>
                    </div>
                    <div className="methodology mx-10 mt-20">
                        <h2>Methodology</h2>
                        <NavBar />
                    </div>
                </div>
            </main >
        </div >
    );
}
