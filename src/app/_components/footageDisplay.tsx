import { useState } from 'react';
import "../globals.css";

type FootageDisplayProps = {
    srcLink: string;
};

export default function FootageDisplay({ srcLink }: FootageDisplayProps) {
    //check file type
    const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(srcLink);
    const isImage = /\.(jpg|webp|jpeg|png|gif|bmp|svg)$/i.test(srcLink);

    const [isHovered, setIsHovered] = useState(false);
    const [footageDimensions, setFootageDimensions] = useState({ width: 340, height: 190 }); // Default to 16:9 aspect ratio

    const handleLoadedMetadata = (event: any) => {
        const footage = event.target;
        if (isVideo) {
            setFootageDimensions({
                width: footage.videoWidth,
                height: footage.videoHeight
            });
        } else if (isImage) {
            setFootageDimensions({
                width: footage.width,
                height: footage.height
            });
        }
    };

    return (
        <div>
            <div className="text-white text-xl overflow-hidden p-0">
                <div
                    style={{ height: `11.9rem`, maxWidth: '22rem' }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                //add enlarge function
                >
                    {isVideo ? (
                        <video
                            className="video-footage object-cover"
                            src={srcLink}
                            controls={isHovered}
                            style={{
                                height: '100%',
                                objectFit: 'contain'
                            }}
                            onLoadedMetadata={handleLoadedMetadata}
                        />
                    ) : isImage ? (
                        <img
                            src={srcLink}
                            className="video-footage object-cover"
                            alt={`${srcLink}`}
                            style={{
                                objectFit: 'contain'
                            }}
                            onLoadedMetadata={handleLoadedMetadata}
                        />
                    ) : (
                        <a
                            href={srcLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline"
                        >
                            Open Document
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
