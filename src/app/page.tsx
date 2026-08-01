"use client"
import { useState, useEffect } from "react";
import DataSource from "./_components/datasource";
import Header from "@/app/_components/header";
import Typewriter from '@/app/_components/typewriter';
import '@/app/globals.css'
import { isMobileDevice } from "@/app/_components/mobile-detector";
import Footer from "./_components/footer";


export default function Index() {
  const textToType = ["This public archive documents 285 white phosphorus strikes in South Lebanon and one in northern Israel between October 2023 and May 2026.", "Through open source tools, more than 700 images and videos were collected and verified as evidence of white phosphorus use, the majority of which were geolocated and chronolocated.", "Click anywhere to start."];
  const [TypewriterFinished, setTypeWriterFinished] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [forceStop, setForceStop] = useState<boolean>(false);
  const [showMobileBanner, setShowMobileBanner] = useState(true);

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
      <main className="relative">
        <div className={`${isMobile ? "w-[90vw] mt-24 ml-3" : "w-[44vw] mt-48 ml-5"} min-w-20 z-50 fixed text-white`}>
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

        {isMobile && TypewriterFinished && showMobileBanner && (
          <div className="fixed z-40 top-36 left-1/2 -translate-x-1/2 w-[88vw] flex items-center justify-between gap-3 bg-red-950/90 border border-red-500/50 rounded-lg px-4 py-3 text-sm text-white shadow-lg backdrop-blur-sm">
            <span>For the full experience, open this site on desktop.</span>
            <button
              aria-label="Dismiss"
              className="shrink-0 text-white/70 text-lg leading-none px-1"
              onClick={() => setShowMobileBanner(false)}
            >
              ✕
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}