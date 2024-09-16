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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const cyberspaceSectionRef = useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = useState("100vh");

  return (
    <>
      <Header />
      <main>
        <div className="map-container" ref={mapContainerRef}>
          <Map />
        </div>
        <div className="content-container">
          <div className="overlay-container">
            <Container>
              <AttacksPerArea />
              <AttacksPerMonth />
              <AttacksPerDay />
            </Container>
          </div>
          <div className="non-overlay-content" ref={cyberspaceSectionRef}>
            <Cyberspace />
            <Footer />
          </div>
        </div>
      </main>
    </>
  );
}