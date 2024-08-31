"use client";
import { useEffect, useState } from "react";

export function useWindowWidth() {
    const [windowWidth, setWindowWidth] = useState(0);

    useEffect(() => {
        // Function to update the state with the window width
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        // Set initial width
        handleResize();

        // Add event listener to update the width on resize
        window.addEventListener("resize", handleResize);

        // Clean up event listener on component unmount
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return windowWidth;
}


export function useWindowHeight() {
    const [windowHeight, setWindowHeight] = useState(0);

    useEffect(() => {
        // Function to update the state with the window width
        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        };

        // Set initial width
        handleResize();

        // Add event listener to update the width on resize
        window.addEventListener("resize", handleResize);

        // Clean up event listener on component unmount
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return windowHeight;
}
