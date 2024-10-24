"use client"
import ContentWindow from "../_components/window";
import Header from "@/app/_components/header";
import '@/app/globals.css'
import CloudCatalog from '../_components/cloudCatalog';

export default function Index() {
    return (
        <div className='cloud-page h-full w-full fixed'>
            <Header TypeWriterFinished={false} />
            <main className="flex relative w-full">
                <div className='inner-backdrop '></div>
                <div className="flex justify-center z-10  scrollbar-hid pt-16 w-full">
                    <div className='w-full mr-10'>
                        <ContentWindow title="The Clouds Atlas" customeClassNameWindow="cloudCatalog">
                            <CloudCatalog />
                        </ContentWindow>
                    </div>
                </div>
            </main>
        </div>
    );
}