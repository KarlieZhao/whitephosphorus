"use client"
import Draggable from 'react-draggable';
import FootageDisplay from "@/app/_components/footageDisplay";
import { Footer } from "@/app/_components/footer";
import Header from "@/app/_components/header";
import HeatmapD3 from "@/app/_components/heatmapD3";
import '@/app/globals.css'

export default function Index() {

    return (
        <div className='h-full overflow-hidden'>
            <Header />
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
            {/* <Footer /> */}
        </div>
    );
}