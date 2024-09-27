"use client"
import Draggable from 'react-draggable';
import { Cyberspace } from "@/app/_components/cyberspace";
import Header from "@/app/_components/header";
import { VisualizeFootage } from "@/app/_components/visualizeFootage";
import '@/app/globals.css'

export default function Index() {
    return (
        <div className='h-full'>
            <Header />
            <main className="flex-grow relative">
                <div className="flex z-10  scrollbar-hide w-full">
                    
                    <div className='w-1/3'>
                        <Draggable handle=".handle">
                            <div className="draggable-container">
                                <Cyberspace />
                            </div>
                        </Draggable>
                    </div>
                </div>
            </main>
            {/* <Footer /> */}
        </div>
    );
}