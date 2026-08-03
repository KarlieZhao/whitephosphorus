import React, { useRef, useEffect } from "react";

interface CollapsibleProps {
    label: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

const Collapsible: React.FC<CollapsibleProps> = ({ label, children, isOpen, onToggle }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const content = contentRef.current;
        if (content) {
            content.style.maxHeight = isOpen ? `${content.scrollHeight}px` : "";
        }
    }, [isOpen]);

    return (
        <div className="collapsible-container">
            <button className={`collapsible ${isOpen ? "active" : ""}`} onClick={onToggle}>
                {label}
            </button>
            <div className="collapsible-content" ref={contentRef}>
                {children}
            </div>
        </div>
    );
};

export default Collapsible;
