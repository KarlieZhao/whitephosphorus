"use client";
import { useEffect, useState } from "react";
import Header from "@/app/_components/header";
import { isMobileDevice } from "../_components/mobile-detector";
import '@/app/globals.css';
import ProjectInfo from "../_components/project-info";

type QnaItem = {
    question: string;
    answer: string | { [key: string]: string } | string[];
};

type Data = {
    lang: string;
    abstract: string;
    qna: QnaItem[];
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
                <div className="inner-backdrop"></div>

                <div className={`project-info`}>
                    <div className="z-50 text-xl mb-6 cursor-pointer">
                        <span
                            className={`transition-colors ${language === "en" ? "text-white underline" : "text-gray-400 no-underline"}`}
                            onClick={() => { setLanguage("en") }}
                        >
                            English
                        </span>
                        &nbsp;/&nbsp;
                        <span
                            className={`transition-colors ${language === "ar" ? "text-white underline" : "text-gray-400 no-underline"}`}
                            onClick={() => { setLanguage("ar"); }}
                        >
                            اَلْعَرَبِيَّةُ
                        </span>
                    </div>
                    {/* <ProjectInfo  */}
                    <ProjectInfo data={data} reset={reset} />

                    <div className="mb-20 mt-10">If you have additional footage you would like to share with us, please reach out to us at phosphorusfinder@gmail.com.<br /><br /><a href="" target="_blank" className="underline">Click here to learn more about our project's methodology.</a></div>
                </div>

                <div className={`team-info`}>
                    <div>
                        Ahmad Baydoun is an architect and OSINT researcher whose work delves into the transformation of environments into tools of power. He is currently pursuing his PhD at the Technical University of Delft, with his dissertation titled “Weaponized Environments.” His research exposes the strategic manipulation of natural landscapes in modern warfare. He has worked on the AirPressure.info project, which archives and visualizes Israeli violations over Lebanese airspace. Baydoun's work has been recognized and cited by Amnesty International, L'Orient Le Jour, PBS, Al Jazeera, Arab News, and the American University of Beirut.
                        <br />Email: <span className="text-white">a.b.baydoun@tudelft.nl</span>
                        <br />Website: <a href="https://ahmadbeydoun.com" target="_blank">ahmadbeydoun.com</a>
                    </div><br />
                    <div className="contribution">
                        Team<br />
                        <a href="https://ahmadbeydoun.com" target="_blank">Ahmad Baydoun</a>, Principal Investigator<br />
                        Khodor Joujou, Research Assistant<br />
                        <br />
                        Collaborators:<br />
                        Special thanks to <a href="https://greensoutherners.org" target="_blank">Green Southerners</a> for their assistance in data collection and geolocation processes, which have been invaluable to the accuracy and integrity of our project.<br />
                        <br />
                        Website designed and developed by <a href="https://portfolio.theunthoughts.com/" target="_blank">Karlie Zhao</a>.<br />
                        <br />
                        Special thanks to:<br />
                        Marc Schoonderbeek, Aleksandar Stancic, Chris Oseik, Wim Zwijnenburg, Hisham Younes, Ali Sleiman, Usama Farhat, Karlie Zhao, Abbas Baalbaki, Ramzi Kais, Anno Nemo, Justin Salhani, Mona Fawaz, Seyran Khadimi, Maria Molijn, William Christou, Alias: [@Easybakeovensz, @NemoAnno, @TedNoNumbers.]
                    </div>
                </div>
            </main >
        </div >
    );
}
