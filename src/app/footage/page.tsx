"use client"
import ContentWindow from "../_components/window";
import FootageDisplay from "@/app/_components/footageDisplay";
import Header from "@/app/_components/header";
import '@/app/globals.css'
import HeatMapAnimation from "../_components/heatMap";

export default function Index() {
    return (
        <div className='overflow-hidden relative'>
            <Header />
            <main className="flex-grow relative">
                <div className='inner-backdrop'></div>
                <div className="fixed flex w-full">
                    <div className='footage-1 pt-20 pb-0 mb-10 overflow-scroll'>
                        <div id="heatmap">
                            < HeatMapAnimation />
                        </div>
                    </div>

                    <div className='footage-2 pt-28'>
                        <ContentWindow title="Footage Insights">
                            <FootageDisplay />
                        </ContentWindow>
                    </div>
                </div>
            </main>
        </div>
    );
}