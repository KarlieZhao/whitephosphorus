"use client"
import Header from "@/app/_components/header";
import Footer from "@/app/_components/footer"
import '@/app/globals.css'

export default function Index() {
    return (
        <div>
            <Header TypeWriterFinished={true} />
            <main className="h-full flex-grow relative">
            </main>
           <Footer />
        </div>
    );
}