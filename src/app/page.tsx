"use client"
import { useEffect, useRef, useState, useCallback } from "react";
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
  const [mapHeight, setMapHeight] = useState(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);


  const updateOverlayHeight = useCallback(() => {
    if (overlayRef.current instanceof HTMLElement) {
      const element = overlayRef.current;
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      const marginTop = parseInt(computedStyle.marginTop, 10);
      const marginBottom = parseInt(computedStyle.marginBottom, 10);
      setOverlayHeight(rect.height + marginTop + marginBottom);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    updateOverlayHeight();
    const observer = new MutationObserver(updateOverlayHeight);
    if (overlayRef.current) {
      observer.observe(overlayRef.current, { childList: true, subtree: true });
    }
    window.addEventListener('resize', updateOverlayHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateOverlayHeight);
    };
  }, [isMounted, updateOverlayHeight]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const maxScroll = overlayHeight;
      const percentage = Math.min((Math.max(0, (scrollPosition - overlayHeight)) / maxScroll) * 150, 100);
      setScrollPercentage(percentage);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [overlayHeight]);

  const isMapFixed = scrollPosition <= overlayHeight;

  if (!isMounted) {
    return null; // or a loading placeholder
  }

  return (
    <>
      <div className="bg-black">
        <Header />
        <main className="bg-black relative min-h-screen">
          <div
            className={`fixed inset-0 z-0 h-screen overflow-hidden`}
            style={{
              transform: `translateY(-${scrollPercentage}%)`,
              transition: 'transform 0.1s linear'  // ease-out? 
            }}>
            <div className="h-screen">
              <Map />
            </div>
          </div>
          <div ref={overlayRef}>
            <Container>
              <AttacksPerArea />
              <AttacksPerMonth />
              <AttacksPerDay />
            </Container>
          </div>
          <div className="w-1/2  mt-20 z-10 overflow-scroll scrollbar-hide w-full">
            <Cyberspace />
          </div>
          {/* <div style={{ height: '200vh' }} /> */}
          {/* Space to allow scrolling */}
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

    </>
  );
}