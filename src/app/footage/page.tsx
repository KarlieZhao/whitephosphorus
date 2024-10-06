"use client"
import Draggable from 'react-draggable';
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
            <Header TypeWriterFinished={true} />
            <main className="flex-grow relative">
                <div className='inner-backdrop'></div>
                <div className="flex z-10  scrollbar-hide w-full">
                    <div className='footage-1'>
                        <Draggable handle=".handle">
                            <div className="draggable-container" id="heatmap">
                                <HeatmapD3 />
                            </div>
                        </Draggable>
                    </div>
                    <div className='footage-2'>
                        <Draggable handle=".handle">
                            <div className="draggable-container">
                                <FootageDisplay />
                            </div>
                        </Draggable>
                    </div>
                </div>
            </main>
        </div>
    );
}