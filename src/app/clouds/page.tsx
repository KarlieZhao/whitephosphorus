"use client"
import ContentWindow from "../_components/window";
import Header from "@/app/_components/header";
import '@/app/globals.css'
import CloudCatalog from '../_components/cloudCatalog';

export default function Index() {
    return (
        <div className='h-full'>
            <Header />
            <main className="flex-grow relative">
                <div className='inner-backdrop '></div>
                <div className="flex justify-center z-10  scrollbar-hid pt-32 w-full">
                    <div className='w-2/3'>
                        <ContentWindow title="The Clouds Atlas" customeClassNameWindow="cloudCatalog">
                            <CloudCatalog />
                        </ContentWindow>
                    </div>
                </div>
            </main>
        </div>
    );
}