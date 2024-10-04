import HeatMap from "react-heatmap-grid";
import { useWindowHeight } from "@/lib/resize"; // Adjust the import path as necessary

const xLabels = new Array(48).fill(0).map((_, i) => `${i}`);

// Display only even xlabels
const xLabelsVisibility = new Array(48)
    .fill(0)
    .map((_, i) => (i % 2 === 0 ? true : false));

const yLabels = [
    "El Merri",
    "Talet Irmis",
    "Dhaira",
    "Ramiye",
    "El Boustane",
    "Aita Ech Chaab",
    "Marouahine",
    "Meiss El Jabal",
    "Yaroun",
    "South Lebanon",
    "Markaba",
    "Mhaibib",
    "Blida",
    "Al Khiam",
    "Marjayoun",
    "Borj El Mlouk",
    "Kfar Kila",
    "Kfar Chouba",
    "Naqoura",
    "Alma Echaab",
    "El Hamames",
    "Aadaisse",
    "Houla",
    "Rmaysh",
    "Aitaroun",
    "Talloussa",
    "Chebaa",
    "Maroun Er Ras",
    "Deir Mimass",
    "Halta",
    "Abbassiye",
    "Rachaiya El Foukhar",
    "Yohmor",
    "Deir Sirian",
    "Taybeh"];
const data = new Array(yLabels.length)
    .fill(0)
    .map(() =>
        new Array(xLabels.length).fill(0).map(() => Math.floor(Math.random() * 100))
    );

export default function () {
    const frameHeight = useWindowHeight() * 0.7;

    return (
        <div className="content w-full mt-32">
            <div className="handle">
                <div className="control-box close-box"><a className="control-box-inner"></a></div>
                <div className="control-box zoom-box"><div className="control-box-inner"><div className="zoom-box-inner"></div></div></div>
                <div className="control-box windowshade-box"><div className="control-box-inner"><div className="windowshade-box-inner"></div></div></div>
                <h1 className="title text-2xl">Footage Catalog</h1>
            </div>
            <div className="overflow-hidden inner">
                <div className={` px-2 pt-10 flex flex-col items-center justify-center`}>
                    <section style={{ width: `60vw`, height: `${frameHeight}px` }}>
                        <HeatMap
                            xLabels={xLabels}
                            yLabels={yLabels}
                            xLabelsLocation={"bottom"}
                            xLabelsVisibility={xLabelsVisibility}
                            xLabelWidth={20}
                            yLabelWidth={120}
                            data={data}
                            height={18}
                            squares
                            onClick={(x: number, y: number) => {
                                // alert(`Clicked ${x}, ${y}`)
                            }}
                            cellStyle={(background: string, value: number, min: number, max: number, data: Array<number>, x: number, y: number) => ({
                                background: `rgba(244, 86, 66, ${1 - (max - value) / (max - min)})`,
                                fontSize: "0px",
                            })}
                            cellRender={(value: number) => value && `${value}%`}
                            title={(value: number, unit: string) => `${value}${unit}`}
                        />
                    </section>
                </div>
            </div>
        </div>
    )
}