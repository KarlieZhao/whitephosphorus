"use client";
import { useEffect, useState } from "react";

export function useWindowWidth() {
    const [windowWidth, setWindowWidth] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return windowWidth;
}


export function useWindowHeight() {
    const [height, setHeight] = useState(0);

    useEffect(() => {
        function updateHeight() {
            setHeight(window.innerHeight);
        }
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    return height;
}