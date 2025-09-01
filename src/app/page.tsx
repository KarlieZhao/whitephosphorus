"use client"
import { useState, useEffect } from "react";
import { Map } from "@/app/_components/mapembed";
import DataSource from "./_components/datasource";
import Header from "@/app/_components/header";
import Typewriter from '@/app/_components/typewriter';
import '@/app/globals.css'
import { isMobileDevice } from "@/app/_components/mobile-detector";
import Footer from "./_components/footer";


export default function Index() {
  const textToType = ["is a platform for geolocating, verifying, and mapping white phosphorus incidents in Lebanon."];
  const [TypewriterFinished, setTypeWriterFinished] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPromptVisible, setIsPromptVisible] = useState<boolean>(false);
  const [forceStop, setForceStop] = useState<boolean>(false);

  const onFinish = () => {
    setTypeWriterFinished(true);
  };

  useEffect(() => {
    if (TypewriterFinished) {
      const showPromptTimeout = setTimeout(() => setIsPromptVisible(true), 4500);
      const hidePromptTimeout = setTimeout(() => setIsPromptVisible(false), 30000);

      return () => {
        clearTimeout(showPromptTimeout);
        clearTimeout(hidePromptTimeout);
      };
    }
  }, [TypewriterFinished]);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  })

  if (isMobile === null) return null;

  return (
    <div className="w-full h-[100vh]">
      <div className={`fixed w-full h-[100vh] main-page-block ${TypewriterFinished ? "opacity-0 invisible -z-50" : "opacity-100 visible z-10"}`}
        onClick={(e) => {
          e.preventDefault();
          setTypeWriterFinished(true);
          setForceStop(true)
        }}></div>
      <Header TypewriterFinished={TypewriterFinished} />
      <main className="relative">
        <div className="w-full text-5xl z-50 mt-4 fixed text-white ml-6">
          <Typewriter textLines={textToType} period={2000}
            speed={100} //lower value = faster typing
            onFinish={onFinish} // on finish, trigger the onFinish function
            forceStopped={forceStop}
          />
        </div>

        {/* {isMobile ? (<div className="fixed bottom-20 m-3 text-white text-sm">
          The map feature is optimized for desktop devices.<br /><br />
          On a mobile device, you can view the white phosphorus attacks timeline, the smoke plume catalog, and read more about this project through the navigation menu.
        </div>) : ( */}
        <div className={"relative z-0 h-screen " + (TypewriterFinished ? "fadeIn" : "opacity-0")}>
          <DataSource TypewriterFinished={TypewriterFinished} />
          {/* <div className={`z-50 fixed left-2 ml-1 bottom-5 bg-red-900 bg-opacity-60 text-sm text-white transition-all 
              ${isPromptVisible ? "opacity-100" : "opacity-0"}`}>
              Each red prism on the map represents a geolocated deployment of white phosphorus.</div> */}
          {/* <Map /> */}
        </div>
        {/* )} */}
      </main>
      <Footer />
    </div>
  );
}