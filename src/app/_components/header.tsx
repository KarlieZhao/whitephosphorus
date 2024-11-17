"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import '@/app/globals.css';
import { isMobileDevice } from "./mobile-detector";

type HeaderProps = {
  TypeWriterFinished?: boolean;
};

type ToxicityData = {
  land: number;
  air: number;
  incidents: number;
};

const Header = ({ TypeWriterFinished = true }: HeaderProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<ToxicityData>({
    land: 87.2,
    air: 95.3,
    incidents: 191,
  });

  useEffect(() => {
    setIsMobile(isMobileDevice());
  })

  const isActive = (path: string) => pathname === path;

  const renderTab = (label: string, path: string, tabClass: string) => (
    <td
      className={`fixed command_button ${tabClass} w-1/4 cursor-pointer ${isActive(path) ? "tabIsActive" : ""}`}
      onClick={() => router.push(path)}
    >
      <div className="label">{label}</div>
    </td>
  );
  if (isMobile === null) {
    return null;
  }
  return (
    isMobile ? (
      //mobile env
      <div>

      </div>) : (
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
                  {renderTab("TIMELINE", "/footage", "tab2")}
                  {renderTab("CLOUDS", "/clouds", "tab3")}
                  {renderTab("ABOUT", "/about", "tab4")}
                </tr>
              </tbody>
            </table>

            {/* left section: Title + Toxity counter */}
            <table className="align-middle font-semibold tracking-wide relative table2" style={{ color: "#FFDCD988" }}>
              <tbody>
                <tr className="relative">
                  <td colSpan={3} className="h-full fixed left-0 command_button_unclickable">
                    <h3 className="mt-3 w-full text-left pl-5 z-50 tracking-wider text-2xl">
                      WhitePhosophrus.info
                    </h3>
                  </td>
                </tr>
                {TypeWriterFinished && (
                  <tr className="toxicity-counter relative pl-4 fadeSlideIn">
                    <td className="w-1/4 h-10 pr-5  text-center header-bold">
                      TOXICITY <br /> COUNTER
                    </td>
                    {["incidents", "land", "air"].map((type, index) => (
                      <td key={index} className="w-1/4 h-10 valign pr-4">
                        <span className="number headerData">{data[type as keyof ToxicityData]}</span>
                        <span className="unit text-xl">
                          {type === "air" ? "KM³" : type === "land" ? " KM²" : ""}
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
      </header >
    )
  );
};

export default Header;
