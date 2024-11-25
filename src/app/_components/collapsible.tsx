import React, { useRef, useState, useEffect } from "react";

interface CollapsibleProps {
    label: string;
    children: React.ReactNode;
    reset: boolean;
}

const Collapsible: React.FC<CollapsibleProps> = ({ label, children, reset }) => {
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const toggleCollapsible = () => {
        setIsOpen((prev) => !prev);

        const content = contentRef.current;
        if (content) {
            if (isOpen) {
                content.style.maxHeight = "";
            } else {
                content.style.maxHeight = `${content.scrollHeight}px`;
            }
        }
    };

    // Close collapsible when switch language
    useEffect(() => {
        if (reset && isOpen) {
            setIsOpen(false);
            const content = contentRef.current;
            if (content) {
                content.style.maxHeight = "";
            }
        }
    }, [reset]);

    return (
        <div className="collapsible-container">
            <button className={`collapsible ${isOpen ? "active" : ""}`} onClick={toggleCollapsible}>
                {label}
            </button>
            <div className="collapsible-content" ref={contentRef}>
                {children}
            </div>
        </div>
    );
};

export default Collapsible;
