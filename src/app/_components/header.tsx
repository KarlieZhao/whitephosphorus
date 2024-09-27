"use client";
import { useState } from "react";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './mapembed.module.css';
import '../globals.css';
import { colorPalette } from "./color-palette";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  //TODO: fetch real time data
  const [data, setData] = useState({
    land: 87.2,
    air: 95.3,
    water: 88.9,
  });


  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-black "`}>
      <div className="control-box windowshade-box"><div className="control-box-inner"><div className="windowshade-box-inner"></div></div></div>
      <div className="inner relative w-full h-full">
        <div className="absolute top-0 h-40 left-0 right-0 bottom-0 bg-gradient-to-b from-black to-transparent pointer-events-none"></div>

        <div className="relative z-10">
          <table className={`${styles.table1}`}>
            <tbody>
              <tr className="text-center leading-none tracking-tight flex items-center">
                <td className={`command_button w-1/4  cursor-pointer w-1/2 align-top items-center ${styles.withBorder}  ${isActive('/') ? "tabIsActive" : ''}`}
                  onClick={() => router.push('/')}>
                  <div className="mt-2  leading-none">
                    MAP
                  </div>
                </td>
                <td className={`command_button w-1/4  cursor-pointer w-1/2 align-top items-center ${isActive('/footage') ? "tabIsActive" : ''} ${styles.withBorder}`}
                  onClick={() => router.push('/footage')}>
                  <div className="mt-2  leading-none">
                    FOOTAGES
                  </div>
                </td>
                <td className={`command_button w-1/4   cursor-pointer w-1/4 align-top ${styles.withBorder}  ${isActive('/clouds') ? "tabIsActive" : ''}`}
                  colSpan={3}
                  onClick={() => router.push('/clouds')}>
                  <div className="mt-2 leading-none">
                    CLOUDS</div>
                </td>
                <td className={`command_button w-1/4 cursor-pointer w-1/4 align-top ${styles.withBorder}   ${isActive('/about') ? "tabIsActive" : ''}`}
                  colSpan={3}
                  onClick={() => router.push('/')}>
                  <div className="mt-2 leading-none">
                    ABOUT</div>
                </td>
              </tr></tbody>
          </table>

          <table className={`text-center ${styles.table2}`} style={{ color: "#dedede" }}>
            <tbody>
              <tr className={`text-center align-center`}>
                <td colSpan={3} className="h-full command_button_unclickable">
                  <h3 className=" w-full tracking-widest text-center">
                    TOXICITY COUNTER
                  </h3>
                </td>
              </tr>
              <tr className="text-xl" >
                <td className={`w-1/3 h-14 ${styles.valign}`}>
                  <span className="number text-6xl" style={{ color: colorPalette().HIGHLIGHT, fontWeight: 'bold' }}>
                    {data.water}
                  </span>
                  <span className="unit text-xl">
                    {" L"}
                  </span>
                </td>
                <td className={`w-1/3 h-14 ${styles.valign}`}>
                  <span className="number text-6xl" style={{ color: colorPalette().HIGHLIGHT, fontWeight: 'bold' }}>
                    {data.land}
                  </span>
                  <span className="unit text-xl">
                    {" KM²"}
                  </span>
                </td>
                <td className={`w-1/3 h-14 ${styles.valign}`}>
                  <span className="number text-6xl" style={{ color: colorPalette().HIGHLIGHT, fontWeight: 'bold' }}>
                    {data.air}
                  </span>
                  <span className="unit text-xl" >
                    {" KM³"}
                  </span>
                </td>
              </tr>
              <tr className="text-2xl" >
                <td className={`w-1/3`}>WATER</td>
                <td className={`w-1/3`}>LAND</td>
                <td className={`w-1/3`}>AIR</td>
              </tr>
            </tbody>
          </table>
        </div></div>
    </header >
  );
};

export default Header;
