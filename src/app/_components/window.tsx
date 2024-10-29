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
                    <h4 className="title block">{title}</h4>
                </div>
                <div className={`inner flex-1 overflow-auto selectable ${customeClassNameInner} `}>
                    <div className={`mt-1`}>
                        <section >
                            {children}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}