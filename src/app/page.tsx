"use client"
import { useEffect, useRef, useState, useCallback } from "react";
import { ParallaxProvider, Parallax } from 'react-scroll-parallax';
import Container from "@/app/_components/container";
import { Map } from "@/app/_components/mapembed";
import { getAllPosts } from "@/lib/api";
import { Cyberspace } from "./_components/cyberspace";
import { AttacksPerArea } from "./_components/attacks-per-area";
import { AttacksPerMonth } from "./_components/attacks-per-month";
import { AttacksPerDay } from "./_components/attacksperday";
import { Footer } from "./_components/footer";
import Header from "@/app/_components/header";
import './globals.css'
import { useScrollPosition } from '../interfaces/scrollTracker';
import { useWindowHeight } from '../lib/resize';

export default function Index() {
  const scrollPosition = useScrollPosition();
  const windowHeight = useWindowHeight();
  const [overlayHeight, setOverlayHeight] = useState(0);
  const [mainHeight, setMainHeight] = useState(0);
  const [documentHeight, setDocumentHeight] = useState(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const updateHeights = useCallback(() => {
    if (overlayRef.current instanceof HTMLElement) {
      const element = overlayRef.current;
      const rect = element.getBoundingClientRect();
      setOverlayHeight(rect.height);
    }
    if (mainRef.current instanceof HTMLElement) {
      const mainElement = mainRef.current;
      const rect = mainElement.getBoundingClientRect();
      setMainHeight(rect.height);
    }
    setDocumentHeight(document.documentElement.scrollHeight);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    updateHeights();
    const observer = new MutationObserver(updateHeights);
    if (overlayRef.current) {
      observer.observe(overlayRef.current, { childList: true, subtree: true });
    }
    window.addEventListener('resize', updateHeights);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeights);
    };
  }, [isMounted, updateHeights]);

  if (!isMounted) {
    return null; // or a loading placeholder
  }
  const transY = - 100 * ((documentHeight - overlayHeight) / windowHeight-0.8);
  console.log(transY);

  return (
    <ParallaxProvider>
      <div className="bg-black">
        <Header />
        <main ref={mainRef} className="bg-black relative min-h-screen">
          <Parallax
            translateY={[0, transY]}
            startScroll={overlayHeight}
            endScroll={documentHeight - windowHeight}
            className="fixed inset-0 z-0 h-screen overflow-hidden"
            disabled={scrollPosition < overlayHeight}
          >
            <Map />
          </Parallax>
          <div ref={overlayRef}>
            <Container>
              <AttacksPerArea />
              <AttacksPerMonth />
              <AttacksPerDay />
            </Container>
          </div>
          <div className="w-1/2 relative -mt-10 z-10 overflow-scroll scrollbar-hide w-full">
            <Cyberspace />
            <Cyberspace />
          </div>
        </main>
        <Footer />
      </div>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

    </ParallaxProvider>
  );
}