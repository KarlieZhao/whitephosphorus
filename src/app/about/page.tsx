"use client";
import { useState, useEffect } from "react";
import Header from "@/app/_components/header";
import ContentWindow from "../_components/window";
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
            <main className="about-page min-h-screen flex mt-52">
                <div className="inner-backdrop"></div>
                <div
                    className={`w-1/5 ml-10 mb-10 transform transition-all duration-1000 ease-in-out 
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                >
                    <p className="team-info">
                        Author, Credits, etc.<br />
                        Curabitur ac neque sed tortor convallis ultricies.
                        Suspendisse accumsan sed elit quis bibendum. <br />Donec nec purus vestibulum, facilisis erat <br />in, hendrerit tortor. Morbi pulvinar risus suscipit felis fermentum, <br />vel blandit quam fringilla.<br /><br />  </p>

                    <p className="team-info">Bio<br />
                        Proin euismod nec nulla eu ornare. Sed id tincidunt mauris. Pellentesque vel est vitae sem convallis rhoncus sit amet vel est. Etiam tincidunt, sem in rhoncus porttitor, dui urna luctus sem, vitae bibendum elit felis rhoncus ex. Curabitur tellus libero, posuere quis dui nec, maximus tincidunt dolor. Sed interdum non ante non rhoncus. Integer eleifend, lorem at posuere elementum, libero est auctor urna, vitae ullamcorper ipsum est ac ante.  </p>   </div>

                <div
                    className={`methodology text-white mr-20 display-block ml-auto mb-10 transform transition-all duration-1000 ease-in-out 
                    ${isMethodVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                >
                    <div className="mx-10">
                        {/* <h2>Methodology</h2> */}
                        <p>
                            WhitePhosophrus.info is dedicated to exposing the use of white phosphorus in South Lebanon as a tool of environmental manipulation. Through spatial analysis and geolocation, we document how this toxic substance transforms landscapes into long-term hazards, challenging official narratives.
                        </p>
                    </div>
                    <div className="mx-10 mt-20 w-2/3">
                        <h2>Clouds Atlas</h2>
                        <p>
                            This gallery presents a visual taxonomy of cloud and plume shapes resulting from different types of military attacks. By studying these atmospheric patterns, the research distinguishes between various weaponry, with a focus on identifying the unique characteristics of white phosphorus.
                        </p>
                        <p>
                            These visual cues are critical for understanding and documenting the impact of different weapons in conflict zones, providing a crucial layer of analysis in the broader investigation of weaponized environments.
                        </p>
                    </div>
                    {/* <div className="mx-10 mt-20 w-1/2 ml-auto mr-10"> */}
                    <div className="mx-10 mt-20 w-2/3">
                        <h2>Geolocation</h2>
                        <p>
                            This section delves into the geolocation methods used to verify the exact locations of white phosphorus attacks. By cross-referencing visual evidence with satellite imagery, we determine where these attacks occur, debunking IDF claims that White Phosphorus is only used in open or uninhabited areas. Our analysis shows that the chemical substance is being deployed over residential zones, directly impacting civilian lives and infrastructure.
                        </p>
                        <p>
                            In response to a report by Channel 4 on Israel's use of White Phosphorus in Lebanon, the Israel Defence Forces issued the following statement:
                        </p>
                        <p>
                            "Under IDF directives, White Phosphorus shells are not used for targeting or causing fire. IDF procedures require that such shells are not used in densely populated areas, with certain exceptions. This complies with and exceeds the requirements of INTERNATIONAL LAW, which do not specifically impose such restrictions. The accusation against the IDF of trying to depopulate Southern Lebanon, or to contaminate areas, are not based on facts and are completely false."
                        </p>
                    </div>
                    <div className="mx-10 mt-20 mb-20 w-2/3">
                        <h2>Spatial Analysis</h2>
                        <p>
                            In this section, we analyze the impact zones of white phosphorus detonations by applying dimensions to visual images. Using landmarks as reference points, we estimate the height of the detonation and the area affected. This approach allows for accurate measurement and visualization of the extent of the damage, providing clear evidence that white phosphorus is being used in residential areas, contrary to claims that it’s only deployed in open spaces.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
