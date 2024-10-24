import '@/app/globals.css'
import { ReactNode } from 'react';

interface contentWindowProps {
    children: ReactNode;
    title?: string;
    customeClassNameWindow?: string;
    customeClassNameInner?: string;
}

export default function ({ children, title = "", customeClassNameWindow, customeClassNameInner }: contentWindowProps) {
    return (
        <div className={`draggable-container`}>
            <div className={`content w-full ${customeClassNameWindow}`}>
                <div className="handle no-select">
                    {/* <div className="control-box close-box"><a className="control-box-inner"></a></div>
                        <div className="control-box zoom-box"><div className="control-box-inner"><div className="zoom-box-inner"></div></div></div>
                        <div className="control-box windowshade-box"><div className="control-box-inner"><div className="windowshade-box-inner"></div></div></div> */}
                    <h4 className="title block">{title}</h4>
                </div>
                <div className={`inner h-full selectable ${customeClassNameInner}`}>
                    <div className={`mt-2`}>
                        <section>
                            {children}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}