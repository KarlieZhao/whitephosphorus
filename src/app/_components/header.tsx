"use client";
import { useEffect, useState } from "react";
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import '@/app/globals.css';


const Header = ({ TypeWriterFinished = true }: { TypeWriterFinished?: boolean }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  //TODO: fetch real time data
  const [data, setData] = useState({
    land: 87.2,
    air: 95.3,
    water: 88.9,
  });
  useEffect(() => {
    if (TypeWriterFinished) {
      console.log("done")
    }
  }, [TypeWriterFinished]);
  return (
    <header className={`bg-black pt-2 pb-14 fixed top-0 left-0 right-0 z-50`}>
      <div className="relative w-full h-full header-backdrop">
        <div className="absolute top-12 h-20 left-0 right-0 bottom-0 bg-gradient-to-b from-red-900 to-transparent pointer-events-none"></div>
        <div className="absolute z-50 top-12 h-2 w-full redbar"></div>
        <div className="relative">
          <table className="table1">
            <tbody>
              <tr className="text-center leading-none tracking-tight mt-8 flex align-center items-center">

                <td className={`fixed command_button tab1 w-1/4 cursor-pointer align-center ${isActive('/') ? "tabIsActive" : ''}`}
                  onClick={() => router.push('/')}>
                  <div className="mt-3 mb-3 leading-none">
                    MAP
                  </div>
                </td>
                <td className={`fixed z-20 command_button tab2 w-1/4 cursor-pointer  ${isActive('/footage') ? "tabIsActive" : ''}`}
                  onClick={() => router.push('/footage')}>
                  <div className="mt-3 mb-3 leading-none">
                    FOOTAGE
                  </div>
                </td>
                <td className={`fixed command_button tab3 w-1/4 cursor-pointer flex  justify-center ${isActive('/clouds') ? "tabIsActive" : ''}`}
                  colSpan={3}
                  onClick={() => router.push('/clouds')}>
                  <div className="mt-3 mb-3 leading-none">
                    CLOUDS</div>
                </td>
                <td className={`fixed command_button w-1/4 cursor-pointer tab4 ${isActive('/about') ? "tabIsActive" : ''}`}
                  colSpan={3}
                  onClick={() => router.push('/about')}>
                  <div className="mt-3 mb-3  leading-none">
                    ABOUT</div>
                </td>
              </tr></tbody>
          </table>

          <table className={`align-middle font-semibold tracking-wide relative text-center table2`} style={{ color: "#FFDCD988" }}>
            <tbody>
              <tr className={`text-center relative align-center `}>
                <td colSpan={3} className="h-full fixed left-0 command_button_unclickable">
                  <h3 className="mt-3 w-full text-left pl-5 z-50 handjet tracking-wider text-3xl">
                    {/* TOXICITY COUNTER */}
                    WhitePhosophrus.info
                  </h3>
                </td>
              </tr>
              {
                TypeWriterFinished ?
                  <tr className={"toxicity-counter align-center relative top-16 pl-4 ml-2 mt-2 fadeSlideIn"} >
                    <td className={`w-1/4 h-14 pr-5`}>
                      TOXICITY <br />COUNTER
                    </td>
                    <td className={`w-1/4 h-14 valign pr-4`}>
                      <span className="number headerData" >
                        {data.water}
                      </span>
                      <span className="unit text-xl">
                        {" L"}
                      </span>
                      <div className="bg-blend-difference text-xl">WATER</div>
                    </td>
                    <td className={`w-1/4 h-14 valign pr-4`}>
                      <span className="number headerData" >
                        {data.land}
                      </span>
                      <span className="unit text-xl">
                        {" KM²"}
                      </span>
                      <div className="text-xl">LAND</div>
                    </td>
                    <td className={`w-1/4 h-14 valign`}>
                      <span className="number headerData" >
                        {data.air}
                      </span>
                      <span className="unit text-xl" >
                        {" KM³"}
                      </span>
                      <div className="text-xl">AIR</div>
                    </td>
                  </tr> : null
              }
              {/* <tr className="text-2xl relative top-14" >
                <td className={`w-1/3`}>WATER</td>
                <td className={`w-1/3`}>LAND</td>
                <td className={`w-1/3`}>AIR</td>
              </tr> */}
            </tbody>
          </table>
        </div>
      </div>
    </header >
  );
};

export default Header;
