"use client";
import { useState } from "react";
import { useWindowHeight } from "@/lib/resize";

export function Map() {
  const [isPromptVisible, setIsPromptVisible] = useState<boolean>(false);
  // const windowWidth = useWindowWidth();
  const frameHeight = useWindowHeight() * 0.98;

  function preventZoom(e: React.WheelEvent<HTMLIFrameElement>) {
    e.stopPropagation();
  }
  const showPrompt = (): void => {
    setTimeout(() => {
      setIsPromptVisible(true);
    }, 3500);
  };


  return (
    <section className="z-10 fixed overflow-hidden overscroll-contain" style={{ width: `100vw`, height: `95%` }}>
      <iframe
        height={`${frameHeight}px`}
        title=""
        src="https://experience.arcgis.com/experience/98fc06b11b154cf1aa623c6de7b29405/"
        loading="lazy"
        className="bg-black overflow-hidden z-10 fixed mt-4 w-full border-0"
        onLoad={showPrompt}
      ></iframe>
      <div className={`z-50 absolute left-20 ml-1 bottom-6 text-sm text-white transition-opacity ${isPromptVisible ? "opacity-100" : "opacity-0"}`}>Adjust selected timestamp to view more.</div>
    </section>
  );
}