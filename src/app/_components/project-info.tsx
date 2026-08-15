import { useEffect, useState } from "react";
import Collapsible from "../_components/collapsible";
import { isMobileDevice } from "./mobile-detector";

type QnaItem = {
    question: string;
    answer: string | { [key: string]: string } | string[];
};

type ProjectInfoProps = {
    data: {
        lang: string;
        abstract: string;
        qna: QnaItem[];
        reachout: string;
        method: string;
    };
    reset: boolean
};

const ProjectInfo: React.FC<ProjectInfoProps> = ({ data, reset }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    // Close whichever answer is open when switching language
    useEffect(() => {
        if (reset) setOpenIndex(null);
    }, [reset]);

    return (
        <div className={`${data.lang}`}>
            {/* abstract */}
            <p dangerouslySetInnerHTML={{ __html: data.abstract }} />

            <p className="my-8"><a href="/method"><span dangerouslySetInnerHTML={{ __html: data.method }} /></a></p>

            {/* q & a */}
            <div className="Q-n-A">
                {data.qna.map((item, index) => (
                    <div key={index}>
                        <Collapsible
                            label={item.question}
                            isOpen={openIndex === index}
                            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                        >
                            {typeof item.answer === 'string' ? (
                                <p dangerouslySetInnerHTML={{ __html: item.answer }} />
                            ) : Array.isArray(item.answer) ? (
                                <ul className="en">
                                    {item.answer.map((entry, idx) => {
                                        const label = Object.keys(entry)[0];
                                        const url = Object.values(entry)[0];
                                        const match = label.match(/^(.+?)\s+([-–—])\s+(.+)$/);
                                        return (
                                            <li key={idx}>
                                                <a href={`${url}`} target="_blank">
                                                    {match ? (
                                                        <>
                                                            <span className="font-bold text-white">{match[1]}</span> {match[2]} {match[3]}
                                                        </>
                                                    ) : label}
                                                </a>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div>
                                    {item?.answer && Object.entries(item.answer).map(([key, value]) => (
                                        < p key={key} >
                                            <span dangerouslySetInnerHTML={{ __html: value }} />
                                        </p>
                                    ))}
                                </div>
                            )} </Collapsible>
                    </div>
                ))
                }
            </div >
            {/* same 2rem step as the methodology link above it, so the run of blocks
                keeps one rhythm instead of opening a gap before the last one */}
            <div className="mb-20 mt-8">
                <p dangerouslySetInnerHTML={{ __html: data.reachout }} />
            </div>
        </div >
    );
};

export default ProjectInfo;
