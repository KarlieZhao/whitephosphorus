"use client"
import Draggable from 'react-draggable';
import FootageDisplay from "@/app/_components/footageDisplay";
import Header from "@/app/_components/header";
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