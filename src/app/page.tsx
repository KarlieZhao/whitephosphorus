"use client"
import { Map } from "@/app/_components/mapembed";
import Header from "@/app/_components/header";
import Typewriter from '@/app/_components/typewriter';
import './globals.css'
import { useState } from "react";

export default function Index() {
  const textToType = [
    "is a catalog and data visualization of \nIsrael's white phosphorus attacks in southern Lebanon. "
  ];

  const [TypeWriterFinished, setTypeWriterFinished] = useState(false);

  const onFinish = () => {
    setTypeWriterFinished(true);
  };

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

        <div className={"relative z-0" +
          " " + // padding
          (TypeWriterFinished ? "fadeIn" : "opacity-0")  // fade in if typewriter is finished if not, hide
        }>
          <Map />
        </div>
      </main>
    </div>
  );
}