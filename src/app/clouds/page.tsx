"use client"
import ContentWindow from "../_components/window";
import Header from "@/app/_components/header";
import '@/app/globals.css'
import CloudLayout from "../_components/cloudsLayout";

export default function Index() {
    return (
        <div className='cloud-page h-full w-full overflow-scroll'>
            <Header TypeWriterFinished={false} />
            <main className="flex relative w-full">
                <div className='inner-backdrop '></div>
                <div className="flex justify-center z-10  scrollbar-hid pt-16 w-full">
                    <div className='w-full ml-3 mr-3'>
                        <CloudLayout />
                    </div>
                </div>
            </main>
        </div>
    );
}