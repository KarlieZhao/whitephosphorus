"use client";

import { CMS_NAME } from "@/lib/constants";
import { useWindowWidth } from "@/lib/resize"; // Adjust the import path as necessary
import { useWindowHeight } from "@/lib/resize"; // Adjust the import path as necessary

export function Map() {
  // const windowWidth = useWindowWidth();
  const frameHeight = useWindowHeight() * 0.97;

  function preventZoom(e: React.WheelEvent<HTMLIFrameElement>) {
    e.stopPropagation();
  }

  return (
    <section style={{ width: `100vw`, height: `${frameHeight}px` }}>
      <iframe
        height={`${frameHeight}px`}
        title="Test_Karlie"
        src="https://experience.arcgis.com/experience/98fc06b11b154cf1aa623c6de7b29405/"
        //"https://tudelft.maps.arcgis.com/apps/Embed/index.html?webmap=e788f61aa7aa49dca367c8db8d934271&extent=34.6218,32.9125,36.4579,33.9451&zoom=true&previewImage=false&scale=true&disable_scroll=true&theme=light"
        //"https://tudelft.maps.arcgis.com/apps/instant/exhibit/index.html?appid=12679d3932ca414db83be414b7abf680&zoom=true&scale=true&disable_scroll=true"
        //"https://tudelft.maps.arcgis.com/apps/Embed/index.html?webmap=e788f61aa7aa49dca367c8db8d934271&extent=34.6218,32.9125,36.4579,33.9451&zoom=true&previewImage=false&scale=true&disable_scroll=true&theme=light"
        loading="lazy"
        className="bg-black overflow-hidden fixed z-20 mt-7 w-full border-0"
      ></iframe>
    </section>
  );
}