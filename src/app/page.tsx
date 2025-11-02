"use client"
import { useState, useEffect } from "react";
import DataSource from "./_components/datasource";
import Header from "@/app/_components/header";
import Typewriter from '@/app/_components/typewriter';
import '@/app/globals.css'
import { isMobileDevice } from "@/app/_components/mobile-detector";
import Footer from "./_components/footer";


export default function Index() {
  const textToType = ["This platform documents 248 verified white phosphorus strikes in South Lebanon between October 2023 and November 2024.", " These strikes were identified and verified through spatial analysis and open-source investigation, with more than 650 images and videos. Each strike was geolocated, chronolocated, and cross-referenced to create a public spatial archive.", "Click anywhere to start."];
  const [TypewriterFinished, setTypeWriterFinished] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [forceStop, setForceStop] = useState<boolean>(false);

  const onFinish = () => {
    setTypeWriterFinished(true);
  };

  useEffect(() => {
    setIsMobile(isMobileDevice());
  })

  if (isMobile === null) return null;

  return (
    <div className="w-full h-[100vh] overflow-hidden">


      <div className={`fixed w-full h-[100vh] main-page-block ${TypewriterFinished ? "opacity-0 invisible -z-50" : "opacity-100 visible z-10"}`}
        onClick={(e) => {
          e.preventDefault();
          setTypeWriterFinished(true);
          setForceStop(true)
        }}></div>
      <Header TypewriterFinished={TypewriterFinished} />
      {isMobile ? (<div className="fixed top-48 m-3 text-white text-sm">
        The map is optimized for desktop devices.<br /><br />
        On a mobile device, you can view the white phosphorus strikes timeline, the plume catalog, and read more about this project. Use the navigation menu to start.
      </div>) : (
        <main className="relative">
          <div className="w-[44vw] min-w-20 z-50 mt-48 fixed text-white ml-5">
            <Typewriter textLines={textToType} period={500}
              speed={45} //lower value = faster typing
              onFinish={onFinish} // on finish, trigger the onFinish function
              forceStopped={forceStop}
            />
          </div>

          <div className={"relative z-0 h-screen overflow-hidden"}>
            <DataSource TypewriterFinished={TypewriterFinished} />
            {/* <div className={`z-50 fixed left-2 ml-1 bottom-5 bg-red-900 bg-opacity-60 text-sm text-white transition-all 
              ${isPromptVisible ? "opacity-100" : "opacity-0"}`}>
              Each red prism on the map represents a geolocated deployment of white phosphorus.</div> */}
            {/* <Map /> */}
          </div>
        </main>
      )}
      <Footer />
    </div>
  );
}