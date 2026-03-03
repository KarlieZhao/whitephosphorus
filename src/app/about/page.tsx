"use client";
import { useEffect, useState } from "react";
import Header from "@/app/_components/header";
import { isMobileDevice } from "../_components/mobile-detector";
import '@/app/globals.css';
import ProjectInfo from "../_components/project-info";
import Footer from "../_components/footer";

type QnaItem = {
    question: string;
    answer: string | { [key: string]: string } | string[];
};

type Data = {
    lang: string;
    abstract: string;
    qna: QnaItem[];
    reachout: string;
    method: string;
};

export default function Index() {
    const [data, setData] = useState<Data | null>(null);
    const [language, setLanguage] = useState("en");
    const [reset, setReset] = useState(false);

    useEffect(() => {
        setReset(true);
        const fetchData = async () => {
            const res = await fetch(`/about/${language}.json`);
            const jsonData = await res.json();
            setData(jsonData);
        };
        fetchData();
        setTimeout(() => {
            setReset(false);
        }, 10);

    }, [language]);

    if (!data) return <div>Loading...</div>;

    return (
        <div>
            <Header TypewriterFinished={false} />
            <main className={`min-h-screen ${isMobileDevice() ? "block mt-20" : "flex"}`}>
                <div className={` ${isMobileDevice() ? null : "inner-backdrop"}`}></div>
                <div className={`project-info`}>
                    <div className="z-50 text-xl mb-6 cursor-pointer">
                        <span role="button"
                            className={`transition-colors ${language === "en" ? "text-white underline" : "text-gray-400 no-underline"}`}
                            onClick={() => { setLanguage("en") }
                            }
                        >
                            English
                        </span>
                        &nbsp;/&nbsp;
                        <span role="button"
                            className={`transition-colors ${language === "ar" ? "text-white underline" : "text-gray-400 no-underline"}`}
                            onClick={() => { setLanguage("ar"); }}
                        >
                            العربية
                        </span>
                    </div>
                    {/* <ProjectInfo  */}
                    <ProjectInfo data={data} reset={reset} />

                </div>

                <div className={`team-info`}>
                    <div>
                        <a href="https://ahmadbeydoun.com" target="_blank">Ahmad Baydoun</a> is an architect and PhD researcher at TU Delft working on the spatial and environmental impacts of warfare. His research focuses on the use of white phosphorus in South Lebanon, combining open source intelligence, satellite imagery, and architectural analysis. He has contributed forensic and geospatial analysis to investigations with BBC World Service, France 24, Amnesty International, NRC, PBS NewsHour, and Al Jazeera.
                        <br /><br />Email: <span className="text-white">a.b.baydoun@tudelft.nl</span>
                        <br />Website: <a href="https://baydoun.nl" target="_blank">baydoun.nl</a>
                    </div><br />
                    Website designed and built by <a href="https://portfolio.theunthoughts.com/" target="_blank">Karlie Zhao</a>. Karlie is a Beijing-born, Boston-based artist and creative technologist. <br />
                    <br />
                    <div className="contribution">
                        <span className="text-gray-100">Field Support: </span> <br />
                        <a href="https://greensoutherners.org" target="_blank">Green Southerners</a> provided on-the-ground support, contributing footage and assisting with geolocation.
                        <br /> <br />
                        <span className="text-gray-100">Special thanks to:</span><br />
                        Marc Schoonderbeek, Aleksandar Stancic, Chris Osieck, Wim Zwijnenburg, Hisham Younes, Tarek Ali Ahmad, Khodor Joujou, Ali Slayman, Karlie Zhao, Abbas Baalbaki, Ramzi Kaiss, Justin Salhani, Cosette Molijn, Carmen Joukhadar, William Christou, Alex Spoerndli, X:@Easybakeovensz, X:@NemoAnno.
                        <div className="mt-8">Satellite imagery provided by Planet Labs PBC under an educational license.</div>
                        <div className="mt-10 mb-16">Follow us on <a href="https://x.com/Phosphor_Abyad" target="_blank">Twitter</a> and <a href="https://bsky.app/profile/whitephosphorus.info" target="_blank">BlueSky</a>.</div>
                    </div>
                </div>
            </main >
            <Footer />
        </div >
    );
}
