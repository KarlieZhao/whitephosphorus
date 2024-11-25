"use client"
import { Map } from "@/app/_components/mapembed";
import { useEffect } from "react";
import Header from "@/app/_components/header";
import Typewriter from '@/app/_components/typewriter';
import './globals.css'
import { useState } from "react";
import { isMobileDevice } from "./_components/mobile-detector";

export default function Index() {
  const textToType = ["documents and visualizes Israel's white phosphorus attacks in southern Lebanon."];

  const [TypeWriterFinished, setTypeWriterFinished] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const onFinish = () => {
    setTypeWriterFinished(true);
  };

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
          <div className={"relative z-0" +
            " " + // padding
            (TypeWriterFinished ? "fadeIn" : "opacity-0")
            // fade in if typewriter is finished if not, hide
          }>
            <Map />
          </div>
        )
        }
      </main>
    </div>
  );
}