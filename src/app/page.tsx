"use client"
import { Map } from "@/app/_components/mapembed";
import { Footer } from "./_components/footer";
import Header from "@/app/_components/header";
import Typewriter from '@/app/_components/typewriter';
import './globals.css'

export default function Index() {

  const textToType = [
    "is a catalog and data visualization of evidences of \nIsrael's white phosphorus attacks on southern Lebanon. "
  ];

  return (
    <div>
      <Header />
      <main className="flex-grow relative">
        <div className="text-5xl z-50 mt-6 fixed text-white ml-8">
          <Typewriter textLines={textToType} period={2000}
            speed={100} //lower value = faster typing
          />
        </div>
        <div className="relative z-0">
          <Map />
        </div>
      </main>
    </div>
  );
}