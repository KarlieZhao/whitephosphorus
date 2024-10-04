"use client";
import { useState } from "react";
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import styles from './mapembed.module.css';
import '../globals.css';

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
    <header className={`mt-2 fixed top-0 left-0 right-0 z-10`}>
      <div className="relative w-full h-full header-backdrop">
        <div className="absolute top-12 h-32 left-0 right-0 bottom-0 bg-gradient-to-b from-red-900 to-transparent pointer-events-none"></div>
        
        <div className="absolute z-50 top-12 h-3 w-full redbar"></div>
        <div className="relative">
          <table className={`${styles.table1}`}>
            <tbody>
              <tr className="text-center leading-none tracking-tight mt-8 flex items-center">
                <td className={`fixed z-30 command_button tab1 w-1/4  cursor-pointer  items-center ${isActive('/') ? "tabIsActive" : ''}`}
                  onClick={() => router.push('/')}>
                  <div className="mt-2 mb-3 leading-none">
                    MAP
                  </div>
                </td>
                <td className={`fixed z-20 command_button tab2 w-1/4  cursor-pointer items-center ${isActive('/footage') ? "tabIsActive" : ''}`}
                  onClick={() => router.push('/footage')}>
                  <div className="mt-2 mb-3 leading-none">
                    FOOTAGE
                  </div>
                </td>
                <td className={`fixed command_button tab3 w-1/4 cursor-pointer flex items-center justify-center ${isActive('/clouds') ? "tabIsActive" : ''}`}
                  colSpan={3}
                  onClick={() => router.push('/clouds')}>
                  <div className="mt-2 mb-3 leading-none">
                    CLOUDS</div>
                </td>
                <td className={`fixed command_button w-1/4 cursor-pointer tab4 items-center ${isActive('/about') ? "tabIsActive" : ''}`}
                  colSpan={3}
                  onClick={() => router.push('/')}>
                  <div className="mt-2 mb-3  leading-none">
                    ABOUT</div>
                </td>
              </tr></tbody>
          </table>

          <table className={`font-semibold tracking-wide relative text-center ${styles.table2}`} style={{ color: "#FFDCD988" }}>
            <tbody>
              <tr className={`text-center relative align-center `}>
                <td colSpan={3} className="h-full fixed left-0 command_button_unclickable">
                  <h3 className="mb-2 mt-1 w-full tracking-widest text-left pl-5">
                    {/* TOXICITY COUNTER */}
                    WhitePhosophrus.info
                  </h3>
                </td>
              </tr>
              <tr className="toxicity-counter text-xl align-center relative top-16 pl-2" >
               <td className={`text-xl w-1/4 h-14 pr-5`}>
                 TOXICITY <br/>COUNTER
                </td>
                <td className={`w-1/4 h-14 ${styles.valign} pr-4`}>
                  <span className="number headerData" >
                    {data.water}
                  </span>
                  <span className="unit text-xl">
                    {" L"}
                  </span>
                  <div className="bg-blend-difference text-xl">WATER</div>
                </td>
                <td className={`w-1/4 h-14 ${styles.valign} pr-4`}>
                  <span className="number headerData" >
                    {data.land}
                  </span>
                  <span className="unit text-xl">
                    {" KM²"}
                  </span>
                  <div className="text-xl">LAND</div>
                </td>
                <td className={`w-1/4 h-14 ${styles.valign}` }>
                  <span className="number headerData" >
                    {data.air}
                  </span>
                  <span className="unit text-xl" >
                    {" KM³"}
                  </span>
                  <div className="text-xl">AIR</div>
                </td> 
              </tr>
              {/* <tr className="text-2xl relative top-14" >
                <td className={`w-1/3`}>WATER</td>
                <td className={`w-1/3`}>LAND</td>
                <td className={`w-1/3`}>AIR</td>
              </tr> */}
            </tbody>
          </table>
        </div></div>
    </header >
  );
};

export default Header;
