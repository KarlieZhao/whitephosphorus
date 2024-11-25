"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import '@/app/globals.css';
import { isMobileDevice } from "./mobile-detector";

type HeaderProps = {
  TypeWriterFinished?: boolean;
};
type ToxicityData = Array<{ type: string; number: number; unit: string }>;

const Header = ({ TypeWriterFinished = true }: HeaderProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [animationClass, setAnimationClass] = useState("");

  const [data, setData] = useState<ToxicityData>(
    [{
      type: "INCIDENTS",
      number: 191,
      unit: " "
    }, {
      type: "LAND",
      number: 5.27,
      unit: "million m²"
    }, {
      type: "AIR",
      number: 527.16,
      unit: "million m³",
    }]
  );

  const altData: ToxicityData =
    [{
      type: "INCIDENTS",
      number: 191,
      unit: ""
    }, {
      type: "AREA",
      number: 720,
      unit: "soccer fields"
    }, {
      type: "VOLUME",
      number: 439,
      unit: "stadiums"
    }];

  useEffect(() => {
    setIsMobile(isMobileDevice());
    const interval = setInterval(() => {
      setAnimationClass("fadeOut");
      setTimeout(() => {
        setData((prev) => (prev[1].number === 5.27 ? altData : [
          { type: "INCIDENTS", number: 191, unit: "" },
          { type: "LAND", number: 5.27, unit: "million m²" },
          { type: "AIR", number: 527.16, unit: "million m³" },
        ]));
        setAnimationClass("fadeIn");
      }, 600);// Match the duration of fade-out animation
    }, 10000);

    return () => clearInterval(interval); // Cleanup on unmount
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

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  if (isMobile === null) return null;

  return (
    isMobile ? (
      //mobile env
      <header className="fixed top-0 t-50">
        <button
          className={`hamburger-menu ${isOpen ? "open" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </button>

        {isOpen && (
          <div className="menu-bar">
            <ul>
              <li onClick={() => router.push("/")}>MAP</li>
              <li onClick={() => router.push("/footage")}>TIMELINE</li>
              <li onClick={() => router.push("/clouds")}>PLUMES</li>
              <li onClick={() => router.push("/about")}>ABOUT</li>
            </ul>
          </div>
        )}

        <div className="fixed left-0 command_button_unclickable">
          <h3 className="mt-4 w-1/2 pl-4 text-xl">
            WhitePhosophrus.info
          </h3>
        </div>
      </header>
    ) : (
      //browser env
      <header className="bg-black pt-2 pb-14 fixed top-0 left-0 right-0 z-50">
        <div className="relative w-full h-full bg-black">
          <div className="absolute top-12 h-20 left-0 right-0 bottom-0 bg-gradient-to-b from-red-900 to-transparent pointer-events-none" />
          <div className="absolute z-50 top-12 h-2 w-full redbar" />

          <div className="relative">
            {/* Navigation Tabs */}
            <table className="table1">
              <tbody className="h-14">
                <tr className="text-center mt-8 flex items-center">
                  {renderTab("MAP", "/", "tab1")}
                  {renderTab("TIMELINE", "/footage", "tab2")}
                  {renderTab("PLUMES", "/clouds", "tab3")}
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
                  <div className="toxicity-counter relative pl-4 flex flex-row fadeSlideIn">
                    <div className="flex-initial basis-1/3 flex flex-col justify-center items-start">
                      <div>TOXICITY  COUNTER</div>
                      <div className="last-update">Last update: Nov/20/2024</div>
                    </div>
                    {data.map((obj) => {
                      return (
                        <div className={`flex-initial ${obj.type === "INCIDENTS" ? "basis-1/4" : "basis-1/3"}  ${animationClass} flex flex-col items-start`}>
                          <div> <span className="headerData">{obj.number}</span><span className="text-xl"> {obj.unit}</span></div>
                          <span className="text-xl">{obj.type}</span>
                        </div>)
                    })}
                  </div>
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
