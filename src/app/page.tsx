"use client"
import { Map } from "@/app/_components/mapembed";
import { Cyberspace } from "./_components/cyberspace";
import { Footer } from "./_components/footer";
import Header from "@/app/_components/header";
import Draggable from 'react-draggable';
import { VisualizeFootage } from "./_components/visualizeFootage";
import './globals.css'

export default function Index() {
  return (
    <div>
      <Header />
      <main className="flex-grow relative">
        <div className="relative z-0">
          <Map />
        </div>
      </main>
    </div>
  );
}