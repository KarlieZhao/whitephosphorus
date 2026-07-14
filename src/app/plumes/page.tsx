"use client"
import Header from "@/app/_components/header";
import '@/app/globals.css'
import CloudLayout from "../_components/cloudsLayout";
import Footer from "../_components/footer";
export default function Index() {
    return (
        <div className='cloud-page h-full w-full'>
            <Header TypewriterFinished={false} />
            <main className="flex relative w-full">
                <div className='inner-backdrop'></div>
                <div className="flex justify-center scrollbar-hid pt-16 w-full h-[90vh] overflow-y-scroll">
                    <CloudLayout />
                </div>
            </main>
            <Footer />
        </div>
    );
}