"use client";

import { CMS_NAME } from "@/lib/constants";
import { useWindowWidth } from "@/lib/resize"; // Adjust the import path as necessary
import { useWindowHeight } from "@/lib/resize"; // Adjust the import path as necessary
import styles from "./mapembed.module.css";

export function Map() {
  const windowWidth = useWindowWidth();
  const windowHeight = useWindowHeight();

  return (
    <section className="h-full w-full">
      <iframe 
        className="w-full h-full border-0" 
        title="Test_Karlie" 
        src="//tudelft.maps.arcgis.com/apps/Embed/index.html?webmap=e788f61aa7aa49dca367c8db8d934271&extent=34.6218,32.9125,36.4579,33.9451&zoom=true&previewImage=false&scale=true&disable_scroll=true&theme=light"
        loading="lazy"
      ></iframe>
    </section>
  );
}