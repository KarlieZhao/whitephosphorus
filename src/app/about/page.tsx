"use client"
import Header from "@/app/_components/header";
import Footer from "@/app/_components/footer";
import Container from "../_components/container";
import Draggable from "react-draggable";
import '@/app/globals.css'

export default function Index() {
    return (
        <div>
            <Header TypeWriterFinished={true} />
            <main className="inner-backdrop h-full flex flex-grow relative overflow-scroll ">
                <div className='w-1/3 mt-60'>
                    <Draggable handle=".handle">
                        <div className="draggable-container">
                            <div className="content w-full">
                                <div className="handle">
                                    <div className="control-box close-box"><a className="control-box-inner"></a></div>
                                    <div className="control-box zoom-box"><div className="control-box-inner"><div className="zoom-box-inner"></div></div></div>
                                    <div className="control-box windowshade-box"><div className="control-box-inner"><div className="windowshade-box-inner"></div></div></div>
                                    <h1 className="title text-2xl">About</h1>
                                </div>
                                <div className="inner">
                                    <div className={`mt-2 mb-5`}>
                                        <section>
                                            <div className=" px-6 text-xl">
                                                Morbi a purus sed turpis blandit consequat.<br />
                                                Nam dignissim luctus felis, eget semper mi interdum sit amet.<br /> Vestibulum maximus aliquet risus sed accumsan. <br />
                                                Donec auctor ante nisi, <br />ac efficitur eros mollis sit amet.
                                                <br />Suspendisse potenti. <br />
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                </div>

                <div className='w-3/5 mt-48 ml-10'>
                    <Draggable handle=".handle">
                        <div className="draggable-container">
                            <div className="content w-full">
                                <div className="handle">
                                    <div className="control-box close-box"><a className="control-box-inner"></a></div>
                                    <div className="control-box zoom-box"><div className="control-box-inner"><div className="zoom-box-inner"></div></div></div>
                                    <div className="control-box windowshade-box"><div className="control-box-inner"><div className="windowshade-box-inner"></div></div></div>
                                    <h1 className="title text-2xl">About</h1>
                                </div>
                                <div className="inner">
                                    <div className={`mt-2 mb-5`}>
                                        <section>
                                            <div className=" px-6 text-xl">
                                                Morbi a purus sed turpis blandit consequat.<br />
                                                Nam dignissim luctus felis, eget semper mi interdum sit amet.<br /> Vestibulum maximus aliquet risus sed accumsan. <br />
                                                Donec auctor ante nisi, <br />ac efficitur eros mollis sit amet.
                                                <br />Suspendisse potenti. <br />      </div>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Draggable>
                </div>
            </main>
            <Footer />
        </div>
    );
}