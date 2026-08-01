"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import '@/app/globals.css';
import { isMobileDevice } from "./mobile-detector";

export type TypewriterProps = {
  TypewriterFinished?: boolean;
};
type ToxicityData = Array<{ type: string; number: string; unit: string }>;

const Header = ({ TypewriterFinished = true }: TypewriterProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const data: ToxicityData = [{
    type: "Strikes",
    number: "286",
    unit: " "
  }, {
    type: "Land Area",
    number: "429",
    unit: "Hectares"
  }, {
    type: "Felt Wedges",
    number: "33,176",
    unit: "",
  }]

  useEffect(() => {
    setIsMobile(isMobileDevice());
  })

  const isActive = (path: string) => pathname === path;
  const renderTab = (label: string, path: string, tabClass: string) => (
    <div
      className={`command_button ${tabClass} cursor-pointer ${isActive(path) ? "tabIsActive" : ""}`}
      onClick={() => router.push(path)}
    >
      <div className="label">{label}</div>
    </div>
  );

  if (isMobile === null) return null;

  return (
    isMobile ? (
      //mobile env
      <header className="fixed top-0 left-0 right-0 t-50 mobile-header">
        <div className="mobile-header-content">
          <h3 className="mobile-header-title" onClick={() => router.push("/")}>
            WhitePhosphorus.info
          </h3>
          <button
            className="info-button"
            onClick={() => router.push("/about")}
            aria-label="About"
          >
            i
          </button>
        </div>

        {TypewriterFinished && (
          <div className="mobile-counter-bar">
            <div className="toxicity-counter relative flex flex-row fadeSlideIn">
              <div className="counter-label flex-initial flex flex-col justify-center items-start mr-3">
                <div>TOXICITY COUNTER</div>
              </div>
              {data.map((obj, index) => {
                return (
                  <div
                    key={obj.type || index} // Use a unique identifier (e.g., obj.type) or index as a fallback
                    className={`flex-initial ${obj.type === "Incidents" ? "w-[3.8rem]" : "w-[8rem]"} flex flex-col items-start`}
                  >
                    <div>
                      <span
                        className={`${obj.number === "1261 " || obj.number === "198"
                          ? "opacity-100 inline-block"
                          : "opacity-0 hidden"
                          }`}
                      >
                        ≈
                      </span>
                      <span className="headerData">{obj.number}</span>
                      {obj.type !== "Land Area" && (
                        <span className="text-xl"> {obj.unit}</span>
                      )}
                    </div>
                    <div className="text-xl">{obj.type === "Land Area" ? obj.unit : obj.type}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>
    ) : (
      //browser env
      <header className="bg-black pt-2 pb-14 fixed top-0 left-0 right-0 z-50">
        <div className="relative w-full h-full bg-black">
          <div className="absolute top-12 h-20 left-0 right-0 bottom-0 bg-gradient-to-b from-red-900 to-transparent pointer-events-none" />
          <div className="absolute z-50 top-[2.85rem] h-[0.4rem] w-full redbar" />

          <div className="relative">
            {/* Navigation Tabs */}
            <div className="fixed right-0 top-5 flex items-center">
              {renderTab("MAP", "/", "tab1")}
              {renderTab("TIMELINE", "/timeline", "tab2")}
              {renderTab("PLUMES", "/plumes", "tab3")}
              {renderTab("ABOUT", "/about", "tab4")}
            </div>


            {/* left section: Title + Toxity counter */}
            <table className="align-middle font-semibold tracking-wide relative table2" style={{ color: "#FFDCD988" }}>
              <tbody>
                <tr className="relative">
                  <td colSpan={3} className="h-full fixed left-0 command_button_unclickable">
                    <h3 className="mt-3 w-full text-left pl-5 z-50 tracking-wider text-[1.2rem] font-light">
                      WhitePhosphorus.info
                    </h3>
                  </td>
                </tr>
              </tbody>
            </table>
            {TypewriterFinished && (
              <div className="toxicity-counter relative pl-4 flex flex-row fadeSlideIn [&>div:nth-child(2)]:basis-1/4">
                <div className="flex-initial basis-1/3 flex flex-col justify-center items-start text-xl">
                  <div>Toxicity  Counter</div>
                  <div className="last-update">Last update: Jul/28/2026</div>
                </div>
                {data.map((obj, index) => {
                  return (
                    <div
                      key={obj.type || index} // Use a unique identifier (e.g., obj.type) or index as a fallback
                      className={`flex-initial ${obj.type === "Incidents" ? "basis-1/4" : "basis-1/3"} flex flex-col items-start`}
                    >
                      <div>
                        <span
                          className={`${obj.number === "1261 " || obj.number === "198"
                            ? "opacity-100 inline-block"
                            : "opacity-0 hidden"
                            }`}
                        >
                          ≈
                        </span>
                        <span className="headerData">{obj.number}</span>
                        <span className="text-xl"> {obj.unit}</span>
                      </div>
                      <div className="text-xl">{obj.type}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header >
    )
  );
};

export default Header;
