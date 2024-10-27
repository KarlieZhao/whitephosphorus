"use client"
import { useState, useEffect } from "react";
import Header from "@/app/_components/header";
import ContentWindow from "../_components/window";
import '@/app/globals.css'

export default function Index() {
    const [isVisible, setIsVisible] = useState(false);
    const [isMethodVisible, setIsMethodVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        setTimeout(() => {
            setIsMethodVisible(true);
        }, 200);
    }, []);

    return (
        <div>
            {/* hide toxicity counter on this page */}
            <Header TypeWriterFinished={false} />

            <main className="about-page min-h-screen flex fixed overflow-hidden">
                <div className='inner-backdrop'></div>

                <div className={`h-full w-1/5 ml-10 mt-16 mb-10 transform transition-all duration-1000 ease-in-out 
                     ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <ContentWindow title="Team" >
                        <p className="mx-6 mt-6">
                            Team info here </p>
                    </ContentWindow>
                </div>

                <div className={`h-full w-4/5 mr-20 mt-16 ml-10 mb-10 transform transition-all duration-1000 ease-in-out 
                     ${isMethodVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <ContentWindow title="Methodology" customeClassNameWindow="flex flex-col h-full" >
                        <div className="mx-10 mt-20">
                            <h2>Methodology</h2>  <p>WhitePhosophrus.info is dedicated to exposing the use of white phosphorus in South Lebanon as a tool of environmental manipulation. Through spatial analysis and geolocation, we document how this toxic substance transforms landscapes into long-term hazards, challenging official narratives.
                            </p> </div>
                        <div className="mx-10 mt-20 w-2/3">
                            <h2>Clouds Atlas</h2>
                            <p>This gallery presents a visual taxonomy of cloud and plume shapes resulting from different types of military attacks. By studying these atmospheric patterns, the research distinguishes between various weaponry, with a focus on identifying the unique characteristics of white phosphorus.</p>
                            <p>These visual cues are critical for understanding and documenting the impact of different weapons in conflict zones, providing a crucial layer of analysis in the broader investigation of weaponized environments.
                            </p>
                        </div>
                        <div className="mx-10 mt-20 w-1/2 block ml-auto mr-10">
                            <h2>Geolocation</h2>
                            <p>This section delves into the geolocation methods used to verify the exact locations of white phosphorus attacks. By cross-referencing visual evidence with satellite imagery, we determine where these attacks occur, debunking IDF claims that White Phosphorus is only used in open or uninhabited areas. Our analysis shows that the chemical substance is being deployed over residential zones, directly impacting civilian lives and infrastructure.
                            </p>
                            <p>In response to a report by Channel 4 on Israel's use of White Phosphorus In Lebanon, the the Israel Defence Forces Issued the following statement:
                            </p>
                            <p>"Under IDF directives, White Phosphorus shells are not used for targeting or causing fire. IDF procedures require that such shells are not used in densely populated areas, with certain exceptions. This complies with and exceeds the requirements of INTERNATIONAL LAW, which do not specifically impose such restrictions. The accusation against the IDF of trying to depopulate Southern Lebanon, or to contaminate areas, are not based on facts and are completely false.”</p>
                        </div>
                        <div className="mx-10 mt-20 mb-20 w-2/3">
                            <h2>Spatial Analysis</h2>
                            <p>
                                In this section, we analyze the impact zones of white phosphorus detonations by applying dimensions to visual images. Using landmarks as reference points, we estimate the height of the detonation and the area affected. This approach allows me to accurately measure and visualize the extent of the damage, providing clear evidence that white phosphorus is being used in residential areas, contrary to claims that it’s only deployed in open spaces.
                            </p></div>

                    </ContentWindow>
                </div>
            </main>
            {/* <Footer /> */}
        </div>
    );
}