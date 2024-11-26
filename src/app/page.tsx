"use client"
import { useState, useEffect } from "react";
import { Map } from "@/app/_components/mapembed";
import Header from "@/app/_components/header";
import Typewriter from '@/app/_components/typewriter';
import '@/app/globals.css'
import { isMobileDevice } from "@/app/_components/mobile-detector";

export default function Index() {
  const textToType = ["is a platform for geolocating, verifying, and mapping white phosphorus incidents in Lebanon."];

  const [TypeWriterFinished, setTypeWriterFinished] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPromptVisible, setIsPromptVisible] = useState<boolean>(false);

  const onFinish = () => {
    if (!TypeWriterFinished) showPrompt();
    setTypeWriterFinished(true);
  };

  const showPrompt = () => {
    const showprompt = setTimeout(() => {
      setIsPromptVisible(true);
    }, 4500);
    const hideprompt = setTimeout(() => {
      setIsPromptVisible(false);
    }, 15000);

    return () => {
      clearTimeout(showprompt);
      clearTimeout(hideprompt)
    }; // Cleanup on unmount
  }

  useEffect(() => {
    setIsMobile(isMobileDevice());
  })

  if (isMobile === null) return null;

  return (
    <div>
      <Header TypeWriterFinished={TypeWriterFinished} />
      <main className="relative">
        <div className="w-full text-5xl z-50 mt-4 fixed text-white ml-6">
          <Typewriter textLines={textToType} period={2000}
            speed={100} //lower value = faster typing
            onFinish={onFinish} // on finish, trigger the onFinish function
          />
        </div>

        {isMobile ? (<div className="fixed bottom-20 m-3 text-white text-sm">
          The map feature is optimized for desktop devices.<br /><br />
          On a mobile device, you can view the white phosphorus attacks timeline, the smoke plume catalog, and read more about this project through the navigation menu.
        </div>) : (
          <div className={"relative z-0 " + (TypeWriterFinished ? "fadeIn" : "opacity-0")}>
            {/* fade in if typewriter is finished; if not, hide */}
            <div className={`z-50 fixed left-12 ml-1 bottom-[10vw] bg-red-900 bg-opacity-60 text-sm text-white transition-all 
              ${isPromptVisible ? "opacity-100" : "opacity-0"}`}>
              Drag the ends of the red bar to set time range.</div>
            <Map />
          </div>
        )}
      </main>
    </div>
  );
}