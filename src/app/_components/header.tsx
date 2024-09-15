"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import styles from './mapembed.module.css';
import { colorPalette } from "./color-palette";

const Header = () => {
  const router = useRouter();
  //TODO: fetch real time data
  const [data, setData] = useState({
    land: 87.2,
    air: 95.3,
    water: 88.9,
  });

  const mainClicked = () => {
    router.push('/');
  };
  const cloudClicked = () => {
    router.push('/');
  };
  const aboutClicked = () => {
    router.push('/')
  };

  return (
    <div className={`z-10 sticky top-0 h-64 overflow-hidden bg-gradient-to-b from-black to-transparent text-white`}>
      <table className={`${styles.table1}`}>
        <tbody> <tr className="text-center leading-none text-2xl tracking-tight flex items-center">
          <td className={`hover:bg-white hover:text-black transition cursor-pointer w-1/2 align-top" items-center colSpan={3} ${styles.withBorder}`}
            colSpan={3}
            onClick={mainClicked}>
            <div className="mt-3  leading-none">
              WHITEPHOSPHORUS.INFO
            </div>
          </td>
          <td className={`hover:bg-white hover:text-black transition cursor-pointer w-1/4 align-top" colSpan={3} ${styles.withBorder}`}
            colSpan={3}
            onClick={cloudClicked}>
            <div className="mt-3 leading-none">
              CLOUDS</div>
          </td>
          <td className={`hover:bg-white hover:text-black transition cursor-pointer w-1/4 align-top" colSpan={3} ${styles.withBorder}`} colSpan={3}
            onClick={aboutClicked}>
            <div className="mt-3 leading-none">
              ABOUT</div>
          </td>
        </tr></tbody>
      </table>

      <table className={`text-center ${styles.table2}`}>
        <tbody>
          <tr className={`${styles.withBorder2} text-center align-center`}>
            <td colSpan={3}>
              <h3 className="mb-2 tracking-widest text-center text-lg md:text-xl mx-5 mt-2">
                TOXICITY COUNTER
              </h3>
            </td>
          </tr>
          <tr className="text-xl">
            <td className={`w-1/3 h-14 ${styles.valign}`}>
              <span className="number text-6xl" style={{ color: colorPalette().HIGHLIGHT, fontWeight: 'bold' }}>
                {data.water}
              </span>
              <span className="unit text-xl" style={{ color: colorPalette().BRIGHT }}>
                {" L"}
              </span>
            </td>
            <td className={`w-1/3 h-14 ${styles.valign}`}>
              <span className="number text-6xl" style={{ color: colorPalette().HIGHLIGHT, fontWeight: 'bold' }}>
                {data.land}
              </span>
              <span className="unit text-xl" style={{ color: colorPalette().BRIGHT }}>
                {" KM²"}
              </span>
            </td>
            <td className={`w-1/3 h-14 ${styles.valign}`}>
              <span className="number text-6xl" style={{ color: colorPalette().HIGHLIGHT, fontWeight: 'bold' }}>
                {data.air}
              </span>
              <span className="unit text-xl" style={{ color: colorPalette().BRIGHT }}>
                {" KM³"}
              </span>
            </td>
          </tr>
          <tr className="text-xl">
            <td className={`w-1/3 ${styles.bright}`}>WATER</td>
            <td className={`w-1/3 ${styles.bright}`}>LAND</td>
            <td className={`w-1/3 ${styles.bright}`}>AIR</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Header;
