"use client"
import { Map } from "@/app/_components/mapembed";
import { useEffect } from "react";
import Header from "@/app/_components/header";
import Typewriter from '@/app/_components/typewriter';
import './globals.css'
import { useState } from "react";
import { isMobileDevice } from "./_components/mobile-detector";

export default function Index() {
  const textToType = [
    "is a catalog and data visualization of \nIsrael's white phosphorus attacks in southern Lebanon. "
  ];

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
        <div className="w-full text-5xl z-50 mt-6 fixed text-white ml-8">
          <Typewriter textLines={textToType} period={2000}
            speed={100} //lower value = faster typing
            onFinish={onFinish} // on finish, trigger the onFinish function
          />
        </div>

        {isMobile ? (<div className="fixed top-20 m-5 text-white text-sm">
          Please visit with a desktop device to interact with the map.<br /><br /><br />
          On a mobile device, you can view the white phosphorus attacks timeline, the cloud catalog, and read more about this project by navigating through the menu.
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