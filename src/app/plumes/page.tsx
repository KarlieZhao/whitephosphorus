"use client"
import Header from "@/app/_components/header";
import '@/app/globals.css'
import CloudLayout from "../_components/cloudsLayout";
import Footer from "../_components/footer";
export default function Index() {
    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
    };
    return (
        <div onContextMenu={handleContextMenu} className='cloud-page h-full w-full overflow-scroll'>
            <Header TypewriterFinished={false} />
            <main className="flex relative w-full">
                <div className='inner-backdrop'></div>
                <div className="flex justify-center scrollbar-hid pt-16 w-full">
                    <CloudLayout />
                </div>
            </main>
            <Footer />
        </div>
    );
}