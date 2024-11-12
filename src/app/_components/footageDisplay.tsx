import { useState } from 'react';
import "../globals.css";

type FootageDisplayProps = {
    srcLink: string;
};

export default function FootageDisplay({ srcLink }: FootageDisplayProps) {
    const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(srcLink);
    const isImage = /\.(jpg|webp|jpeg|png|gif|bmp|svg)$/i.test(srcLink);
    const [isHovered, setIsHovered] = useState(false);
    const [isEnlarged, setIsEnlarged] = useState(false);

    return (
        <div>
            <div className="text-white text-xl overflow-hidden p-0">
                <div
                    style={{ height: '11.9rem', maxWidth: '26rem', cursor: 'pointer' }}
                    onMouseEnter={() => { if (isImage) setIsEnlarged(true); setIsHovered(true) }}
                    onMouseLeave={() => {
                        if (isImage) setIsEnlarged(false);
                        setIsHovered(false)
                    }}
                // onClick={() => {
                // }} // Click to enlarge
                >
                    {isVideo ? (
                        <video
                            className="video-footage object-cover"
                            src={srcLink}
                            controls={isHovered} // Video controls only on hover
                            style={{
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    ) : isImage ? (
                        <img
                            src={srcLink}
                            className="video-footage object-cover"
                            alt={`${srcLink}`}
                            style={{
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    ) : (
                        <a
                            href={srcLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline"
                        >
                            open link
                        </a>
                    )}
                </div>
            </div>

            {/* overlay */}
            <div
                className={`overlay ${isEnlarged ? 'overlay-visible' : ''}`}
                onClick={() => setIsEnlarged(false)}
            >
                {isImage && (<img
                    src={srcLink}
                    alt="image"
                    style={{
                        maxHeight: '60vh',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                />)}
                {isVideo && (
                    <video
                        muted

                        src={srcLink}
                        style={{
                            maxHeight: '60vh',
                            objectFit: 'contain',
                        }}
                    />)}
            </div>

        </div>
    );
}
