import '@/app/globals.css'
import { ReactNode } from 'react';

interface contentWindowProps {
    children: ReactNode;
    title?: string;
    customeClassNameWindow?: string;
    customeClassNameInner?: string;
}

export default function ({ children, title = "", customeClassNameWindow = "", customeClassNameInner = "" }: contentWindowProps) {
    return (
        <div className={`draggable-container`}>
            <div className={`content ${customeClassNameWindow}`}>
                <h4 className="title block">{title}</h4>
                <div className={`inner overflow-hide ${customeClassNameInner}`}>
                    <section >
                        {children}
                    </section>

                </div>
            </div>
        </div>
    );
}