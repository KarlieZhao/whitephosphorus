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
            <Header TypeWriterFinished={false} />
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
                        <a href="https://ahmadbeydoun.com" target="_blank">Ahmad Baydoun</a> is an architect and OSINT researcher whose work delves into the transformation of environments into tools of power. He is currently pursuing his PhD at the Technical University of Delft, with his dissertation titled "Weaponized Environments." His research exposes the strategic manipulation of natural landscapes in modern warfare. He has worked on the award-winning "AirPressure.info" project, which archives and visualizes Israeli violations over Lebanese airspace. Baydoun's work has been recognized and cited by Amnesty International, L'Orient Le Jour, PBS, Al Jazeera, Arab News, and the American University of Beirut.
                        <br />Email: <span className="text-white">a.b.baydoun@tudelft.nl</span>
                        <br />Website: <a href="https://ahmadbeydoun.com" target="_blank">ahmadbeydoun.com</a>
                    </div><br />
                    <div className="contribution">
                        Team<br />
                        Ahmad Baydoun, Principal Investigator<br />
                        Khodor Joujou, Research Assistant<br />
                        <br />
                        Field Support: <br />
                        <a href="https://greensoutherners.org" target="_blank">Green Southerners</a> provided field-level support in the form of data collection, verification, and geolocation.
                        <br /> <br />
                        Website designed and built by <a href="https://portfolio.theunthoughts.com/" target="_blank">Karlie Zhao</a>.<br />
                        <br />
                        Special thanks to:<br />
                        Marc Schoonderbeek, Aleksandar Stancic, Chris Osieck, Wim Zwijnenburg, Hisham Younes, Tarek Ali Ahmad, Ali Slayman, Usama Farhat, Karlie Zhao, Abbas Baalbaki, Ramzi Kaiss, Justin Salhani, Cosette Molijn, William Christou, Alex Spoerndli, Jake Tacchi, Georges Sopwith, X:@Easybakeovensz, X:@NemoAnno.
                        <br />
                        <div className="mt-10 mb-16">Follow us on <a href="https://x.com/Phosphor_Abyad" target="_blank">Twitter</a> and <a href="https://bsky.app/profile/whitephosphorus.info" target="_blank">BlueSky</a>.</div>
                    </div>
                </div>
            </main >
            <Footer />
        </div >
    );
}
