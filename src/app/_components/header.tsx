"use client";
import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import * as d3 from "d3";
import styles from './mapembed.module.css';
import { colorPalette } from "./color-palette";

const Header = () => {
  // Sample data;
  const data = {
    land: 87.2,
    air: 95.3,
    water: 88.9,
  };
  const router = useRouter();
  useEffect(() => {
    d3.select("#land-value-number").text(data.land).style("color", colorPalette().HIGHLIGHT).style("font-weight", "bold");
    d3.select("#land-value-unit").text(" KM²").style("color", colorPalette().BRIGHT);
    d3.select("#air-value-number").text(data.air).style("color", colorPalette().HIGHLIGHT).style("font-weight", "bold");
    d3.select("#air-value-unit").text(" KM³").style("color", colorPalette().BRIGHT);;
    d3.select("#water-value-number").text(data.water).style("color", colorPalette().HIGHLIGHT).style("font-weight", "bold");
    d3.select("#water-value-unit").text(" L").style("color", colorPalette().BRIGHT);;
  }, [data]);

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
      <table className={`text-center ${styles.table1}`}>
        <tr>
          <div className=" leading-none text-2xl tracking-tight flex items-center">
            <td className={`hover:bg-white hover:text-black transition cursor-pointer w-1/2 align-top" items-center colSpan={3} ${styles.withBorder}`} onClick={mainClicked}>
              <div className="mt-3  leading-none">
                WHITEPHOSPHORUS.INFO
              </div>
            </td>
            <td className={`hover:bg-white hover:text-black transition cursor-pointer w-1/4 align-top" colSpan={3} ${styles.withBorder}`} onClick={cloudClicked}>
              <div className="mt-3 leading-none">
                CLOUDS</div>
            </td>
            <td className={`hover:bg-white hover:text-black transition cursor-pointer w-1/4 align-top" colSpan={3} ${styles.withBorder}`} onClick={aboutClicked}>
              <div className="mt-3 leading-none">
                ABOUT  </div>
            </td>
          </div>
        </tr>
      </table>
      <table className={`text-center ${styles.table2}`}>
        <tr className={`${styles.withBorder2} text-center align-center items-center`}>
          <td className="align-top" colSpan={3}>
            <h3 className="mb-2 tracking-widest text-center align-center items-center text-lg md:text-xl mx-5 mt-2">
              TOXICITY COUNTER
            </h3>
          </td>
        </tr>
        <tr className="text-xl">
          <td className={`w-1/3 h-14 ${styles.valign}`}>
            <span id="water-value-number" className="number text-6xl"></span>
            <span id="water-value-unit" className="unit text-xl"></span>
          </td>
          <td className={`w-1/3  ${styles.valign}`}>
            <span id="land-value-number" className="number text-6xl"></span>
            <span id="land-value-unit" className="unit text-xl"></span>
          </td>
          <td className={`w-1/3  ${styles.valign}`}>
            <span id="air-value-number" className="number text-6xl"></span>
            <span id="air-value-unit" className="unit text-xl"></span>
          </td>
        </tr>
        <tr className="text-xl">
          <td className={`w-1/3 ${styles.bright}`} id="water-label">WATER</td>
          <td className={`w-1/3 ${styles.bright}`} id="land-label">LAND</td>
          <td className={`w-1/3 ${styles.bright}`} id="air-label">AIR</td>
        </tr>
      </table>
    </div>
  );
};

export default Header;
