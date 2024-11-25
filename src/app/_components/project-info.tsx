import Collapsible from "../_components/collapsible";
import NavBar from "../_components/select-display-bar";
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

    return (
        <div className={`${data.lang}`}>
            {/* abstract */}
            <p dangerouslySetInnerHTML={{ __html: data.abstract }} />

            {/* q & a */}
            <div className="Q-n-A">
                {data.qna.map((item, index) => (
                    <div key={index}>
                        <Collapsible label={item.question} reset={reset}>
                            {typeof item.answer === 'string' ? (
                                <p dangerouslySetInnerHTML={{ __html: item.answer }} />
                            ) : Array.isArray(item.answer) ? (
                                <ul className="en">
                                    {item.answer.map((entry, idx) => (
                                        <li key={idx}><a href={`${Object.values(entry)[0]}`} target="_blank">{Object.keys(entry)[0]}</a></li>
                                    ))}
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
            <div className="mb-20 mt-10"><p dangerouslySetInnerHTML={{ __html: data.reachout }} /><br /><br />
                {/* methodology */}
                <a href="/" target="_blank"><span dangerouslySetInnerHTML={{ __html: data.method }} /></a></div>
        </div >
    );
};

export default ProjectInfo;
