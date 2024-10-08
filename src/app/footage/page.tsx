"use client"
import { DraggableWindow } from "../_components/window";
import FootageDisplay from "@/app/_components/footageDisplay";
import Header from "@/app/_components/header";
import dynamic from 'next/dynamic'
const HeatmapD3 = dynamic(() => import("@/app/_components/heatmapD3"), {
    ssr: false
});
import '@/app/globals.css'

export default function Index() {

    return (
        <div className='h-full overflow-hidden'>
            <Header />
            <main className="flex-grow relative">
                <div className='inner-backdrop'></div>
                <div className="flex z-10 pt-32 pb-32 scrollbar-hide w-full">
                    <div className='footage-1'>
                        <DraggableWindow title="Footage Catalog" customeClassNameInner="overflow-scroll">
                            <div id="heatmap">
                                <HeatmapD3 />
                            </div>
                        </DraggableWindow>
                    </div>
                    <div className='footage-2'>
                        <DraggableWindow title="Footage Details">     
                            <FootageDisplay />
                        </DraggableWindow>
                    </div>
                </div>
            </main>
        </div>
    );
}