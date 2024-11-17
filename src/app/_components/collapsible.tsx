import React, { useRef, useState } from "react";

interface CollapsibleProps {
    label: string;
    children: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({ label, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const toggleCollapsible = () => {
        setIsOpen((prev) => !prev);

        const content = contentRef.current;
        if (content) {
            if (isOpen) {
                // Close the collapsible
                content.style.maxHeight = "";
            } else {
                // Open the collapsible
                content.style.maxHeight = `${content.scrollHeight}px`;
            }
        }
    };

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
