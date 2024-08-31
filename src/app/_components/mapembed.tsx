"use client";

import { CMS_NAME } from "@/lib/constants";
import { useWindowWidth } from "@/lib/resize"; // Adjust the import path as necessary
import { useWindowHeight } from "@/lib/resize"; // Adjust the import path as necessary
import styles from "./mapembed.module.css";

export function Map() {

  const windowWidth = useWindowWidth();
  const windowHeight = useWindowHeight();

  return (
    <section className={`${styles.embedContainer} flex-col items-center md:justify-between mb-16 md:mb-12`}>
      <iframe className="w-full border-0 block" width={windowWidth} height={windowHeight * 0.92} margin-height="0" margin-width="0" title="Test_Karlie" src="//tudelft.maps.arcgis.com/apps/Embed/index.html?webmap=e788f61aa7aa49dca367c8db8d934271&extent=34.6218,32.9125,36.4579,33.9451&zoom=true&previewImage=false&scale=true&disable_scroll=true&theme=light"
        loading="lazy"></iframe>
    </ section >
  );
}
