import Draggable from "react-draggable";
import '@/app/globals.css'
import { ReactNode } from 'react';

interface DraggableWindowProps {
    children: ReactNode;
    title?: string;
    customeClassNameWindow?: string;
    customeClassNameInner?: string;
}

export function DraggableWindow({ children, title = "", customeClassNameWindow, customeClassNameInner }: DraggableWindowProps) {
    return (
        <Draggable handle=".handle" enableUserSelectHack={false}>
            <div className={`draggable-container`}>
                <div className={`content w-full ${customeClassNameWindow}`}>
                    <div className="handle no-select">
                        <div className="control-box close-box"><a className="control-box-inner"></a></div>
                        <div className="control-box zoom-box"><div className="control-box-inner"><div className="zoom-box-inner"></div></div></div>
                        <div className="control-box windowshade-box"><div className="control-box-inner"><div className="windowshade-box-inner"></div></div></div>
                        <h1 className="title text-2xl">{title}</h1>
                    </div>
                    <div className={`inner h-full selectable ${customeClassNameInner}`}>
                        <div className={`mt-2 mb-5`}>
                            <section>
                                {children}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </Draggable>
    );
}