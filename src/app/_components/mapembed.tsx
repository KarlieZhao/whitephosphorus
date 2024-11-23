"use client";
import { CMS_NAME } from "@/lib/constants";
import { useWindowHeight } from "@/lib/resize";

export function Map() {
  // const windowWidth = useWindowWidth();
  const frameHeight = useWindowHeight() * 0.98;

  function preventZoom(e: React.WheelEvent<HTMLIFrameElement>) {
    e.stopPropagation();
  }

  return (
    <section className="z-10 fixed overflow-hidden overscroll-contain" style={{ width: `100vw`, height: `95%` }}>
      <iframe
        height={`${frameHeight}px`}
        title=""
        src="https://experience.arcgis.com/experience/98fc06b11b154cf1aa623c6de7b29405/"
        loading="lazy"
        className="bg-black overflow-hidden z-10 fixed mt-4 w-full border-0"
      ></iframe>
      <div className="z-50 absolute left-20 ml-1 bottom-8 text-sm text-white">Adjust the selected timestamp to view more.</div>
    </section>
  );
}