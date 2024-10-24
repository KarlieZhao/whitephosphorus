"use client"
import Header from "@/app/_components/header";
import ContentWindow from "../_components/window";
import '@/app/globals.css'

export default function Index() {
    return (
        <div>
            <Header />
            <main className="about-page min-h-screen flex flex-grow relative overflow-scroll">
                <div className='inner-backdrop'></div>
                <div className='w-1/5 ml-10 mt-36 mb-20'>
                    <ContentWindow title="Team" >
                        <p className="px-4 mt-4">
                            This doctoral project is dedicated to exposing the use of white phosphorus in South Lebanon as a tool of environmental manipulation. Through spatial analysis and geolocation, we document how this toxic substance transforms landscapes into long-term hazards, challenging official narratives.
                        </p>
                        <p className="px-4 mt-4">
                            Team info here </p>
                        <p className="mt-96 px-4"></p>
                    </ContentWindow>
                </div>
                <div className='w-2/3 mt-36 ml-10 mb-20'>
                    <ContentWindow title="About WhitePhosphorus.info" >
                        <div className="mt-6 flex justify-center flex">
                            <div className="mx-4">
                                <h2>Clouds Atlas</h2>
                                <p>This gallery presents a visual taxonomy of cloud and plume shapes resulting from different types of military attacks. By studying these atmospheric patterns, the research distinguishes between various weaponry, with a focus on identifying the unique characteristics of white phosphorus.</p>
                                <p>These visual cues are critical for understanding and documenting the impact of different weapons in conflict zones, providing a crucial layer of analysis in the broader investigation of weaponized environments.
                                </p>
                            </div>
                            <div className="mx-4">
                                <h2>Geolocation</h2>
                                <p>This section delves into the geolocation methods used to verify the exact locations of white phosphorus attacks. By cross-referencing visual evidence with satellite imagery, we determine where these attacks occur, debunking IDF claims that White Phosphorus is only used in open or uninhabited areas. Our analysis shows that the chemical substance is being deployed over residential zones, directly impacting civilian lives and infrastructure.
                                </p>
                                <p>In response to a report by Channel 4 on Israel's use of White Phosphorus In Lebanon, the the Israel Defence Forces Issued the following statement:
                                </p>
                                <p>"Under IDF directives, White Phosphorus shells are not used for targeting or causing fire. IDF procedures require that such shells are not used in densely populated areas, with certain exceptions. This complies with and exceeds the requirements of INTERNATIONAL LAW, which do not specifically impose such restrictions. The accusation against the IDF of trying to depopulate Southern Lebanon, or to contaminate areas, are not based on facts and are completely false.”</p>
                            </div>
                            <div className="mx-4">
                                <h2>Spatial Analysis</h2>
                                <p>
                                    In this section, we analyze the impact zones of white phosphorus detonations by applying dimensions to visual images. Using landmarks as reference points, we estimate the height of the detonation and the area affected. This approach allows me to accurately measure and visualize the extent of the damage, providing clear evidence that white phosphorus is being used in residential areas, contrary to claims that it’s only deployed in open spaces.
                                </p></div>
                        </div>
                    </ContentWindow>
                </div>
            </main>
            {/* <Footer /> */}
        </div>
    );
}