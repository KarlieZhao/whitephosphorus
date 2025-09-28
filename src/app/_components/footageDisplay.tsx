import { useState } from 'react';
import "../globals.css";

type FootageDisplayProps = {
    srcLink: string;
    fileName: string;
    enlarge: boolean;
};

export default function FootageDisplay({ srcLink, fileName, enlarge }: FootageDisplayProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isEnlarged, setIsEnlarged] = useState(false);

    return (
        <div>
            <div className="text-white text-xl overflow-hidden p-0">
                <div
                    style={{ height: '23vh', minHeight: '140px', maxWidth: '26rem', cursor: 'pointer' }}
                    onMouseEnter={() => { if (enlarge) { setIsEnlarged(true); setIsHovered(true) } }}
                    onMouseLeave={() => {
                        if (enlarge) {
                            setIsEnlarged(false);
                            setIsHovered(false);
                        }
                    }}>
                    <a href={srcLink} target='_blank'>
                        <img
                            src={fileName}
                            className="video-footage object-cover"
                            alt={`${fileName}`}
                            style={{
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    </a>
                </div>
            </div>

            {/* overlay */}
            <div
                className={`overlay ${isEnlarged ? 'overlay-visible' : ''}`}
                onClick={() => setIsEnlarged(false)}>
                <img
                    src={fileName}
                    alt="image"
                    style={{
                        maxHeight: '57vh',
                        marginTop: '10vh',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                />
            </div>
        </div>
    );
}
