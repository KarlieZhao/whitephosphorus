"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import '@/app/globals.css';

type HeaderProps = {
  TypeWriterFinished?: boolean;
};

type ToxicityData = {
  land: number;
  air: number;
  water: number;
};

const Header = ({ TypeWriterFinished = true }: HeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<ToxicityData>({
    land: 87.2,
    air: 95.3,
    water: 88.9,
  });

  const isActive = (path: string) => pathname === path;

  const renderTab = (label: string, path: string, tabClass: string) => (
    <td
      className={`fixed command_button ${tabClass} w-1/4 cursor-pointer ${isActive(path) ? "tabIsActive" : ""}`}
      onClick={() => router.push(path)}
    >
      <div className="label">{label}</div>
    </td>
  );

  return (
    <header className="bg-black pt-2 pb-14 fixed top-0 left-0 right-0 z-50">
      <div className="relative w-full h-full header-backdrop">
        <div className="absolute top-12 h-20 left-0 right-0 bottom-0 bg-gradient-to-b from-red-900 to-transparent pointer-events-none" />
        <div className="absolute z-50 top-12 h-2 w-full redbar" />

        <div className="relative">
          {/* Navigation Tabs */}
          <table className="table1">
            <tbody className="h-14">
              <tr className="text-center mt-8 flex items-center">
                {renderTab("MAP", "/", "tab1")}
                {renderTab("FOOTAGE", "/footage", "tab2")}
                {renderTab("CLOUDS", "/clouds", "tab3")}
                {renderTab("ABOUT", "/about", "tab4")}
              </tr>
            </tbody>
          </table>

          {/* left section: Title + Toxity counter */}
          <table className="align-middle font-semibold tracking-wide relative text-center table2" style={{ color: "#FFDCD988" }}>
            <tbody>
              <tr className="relative">
                <td colSpan={3} className="h-full fixed left-0 command_button_unclickable">
                  <h3 className="mt-3 w-full text-left pl-5 z-50 handjet tracking-wider text-3xl">
                    WhitePhosophrus.info
                  </h3>
                </td>
              </tr>
              {TypeWriterFinished && (
                <tr className="toxicity-counter align-center relative top-16 pl-4 ml-2 mt-2 fadeSlideIn">
                  <td className="w-1/4 h-14 pr-5">
                    TOXICITY <br /> COUNTER
                  </td>
                  {["water", "land", "air"].map((type, index) => (
                    <td key={index} className="w-1/4 h-14 valign pr-4">
                      <span className="number headerData">{data[type as keyof ToxicityData]}</span>
                      <span className="unit text-xl">
                        {type === "water" ? " L" : type === "land" ? " KM²" : " KM³"}
                      </span>
                      <div className="text-xl">{type.toUpperCase()}</div>
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </header>
  );
};

export default Header;
