"use client"
import { useEffect, useRef, useState } from "react";
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

export default function Index() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // or a loading placeholder
  }

  return (
    <>
      <Header />
      <main className="relative min-h-screen">
        <div className="fixed inset-0 z-0 h-screen overflow-hidden">
          <Map />
        </div>
        <Container>
          <AttacksPerArea />
          <AttacksPerMonth />
          <AttacksPerDay />
        </Container>
        <div className="relative w-1/2 z-10 mt-80 overflow-scroll scrollbar-hide w-full">
          <Cyberspace />
          <Cyberspace />
        </div>
      </main>
      <Footer />

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