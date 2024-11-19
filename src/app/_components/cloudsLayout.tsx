import React from 'react';
import { useRef, useEffect, useState } from 'react';

interface DataInputRow {
  name: string;
  name_ar: string;
  text: string;
  images: string[];
}
interface CloudRow {
  name: string;
  name_ar: string;
  video: string;
  text: string;
  images: string[];
}

const inputData: DataInputRow[] = [
  {
    name: "White Phosphorus",
    name_ar: "",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam et pretium dui. Phasellus aliquet, leo vitae venenatis lobortis, neque nulla suscipit nunc.",
    images: Array(8).fill('/api/placeholder/200/200')
  },
  {
    name: "Smoke Bomb M150",
    name_ar: "",
    text: "Suspendisse et gravida augue. Sed eleifend posuere ex id interdum. Proin feugiat interdum sem, eget tincidunt justo pellentesque quis.",
    images: Array(4).fill('/api/placeholder/200/200')
  },
  {
    name: "Flare",
    name_ar: "",
    text: "Suspendisse et gravida augue. Sed eleifend posuere ex id interdum. Proin feugiat interdum sem, eget tincidunt justo pellentesque quis.",
    images: Array(4).fill('/api/placeholder/200/200')
  },
  {
    name: "Artillery Shelling",
    name_ar: "",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam et pretium dui. Phasellus aliquet, leo vitae venenatis lobortis, neque nulla suscipit nunc.",
    images: Array(4).fill('/api/placeholder/200/200')
  },
  {
    name: "Contrails",
    name_ar: "",
    text: "Integer non scelerisque magna. Donec eu accumsan dui, vitae condimentum sem. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac.",
    images: Array(2).fill('/api/placeholder/200/200')
  },
  {
    name: "Trails of Iron Dome Interceptors",
    name_ar: "",
    text: "Suspendisse et gravida augue. Sed eleifend posuere ex id interdum. Proin feugiat interdum sem, eget tincidunt justo pellentesque quis.",
    images: Array(4).fill('/api/placeholder/200/200')
  },
  {
    name: "Rocket Launches",
    name_ar: "",
    text: "Suspendisse et gravida augue. Sed eleifend posuere ex id interdum. Proin feugiat interdum sem, eget tincidunt justo pellentesque quis.",
    images: Array(4).fill('/api/placeholder/200/200')
  },
  {
    name: "Unmanned Aerial Vehicle Downing",
    name_ar: "",
    text: "Suspendisse et gravida augue. Sed eleifend posuere ex id interdum. Proin feugiat interdum sem, eget tincidunt justo pellentesque quis.",
    images: Array(4).fill('/api/placeholder/200/200')
  },
  {
    name: "Unmanned Aerial Vehicle Strike",
    name_ar: "",
    text: "Suspendisse et gravida augue. Sed eleifend posuere ex id interdum. Proin feugiat interdum sem, eget tincidunt justo pellentesque quis.",
    images: Array(4).fill('/api/placeholder/200/200')
  }
];

const generateMP4Link = (inputArray: DataInputRow[]): CloudRow[] => {
  return inputArray.map((item) => ({
    ...item,
    video: `${process.env.NEXT_PUBLIC_CDN_URL}/cloud_videos/${item.name
      .replace(/ /g, "")}.mp4`, // Generate video path
  }));
};
const cloudData = generateMP4Link(inputData);

const VideoPlayer = ({ src, name }: { src: string; name: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!videoRef.current) return;

        if (entry.isIntersecting) {
          //pre-load videos
          videoRef.current.load();
          videoRef.current.play().catch(err => console.log('Playback failed:', err));
        } else {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
          setIsVideoReady(false);
        }
      });
    }, options);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleVideoLoad = () => {
    //wait a frame to avoid flickering
    requestAnimationFrame(() => {
      setIsVideoReady(true);
    });
  };

  return (
    <div ref={containerRef} className="dark-bg p-4">
      <div className="relative w-full pt-[100%]  max-h-[300px]">
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          {/*poster image */}
          <img
            src={`/cloud_thumb/${name.replace(/ /g, "")}.jpg`}
            alt={`${name} placeholder`}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: 1,
            }}
          />

          {/*video*/}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoLoad}
            style={{
              opacity: isVideoReady ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
          >
            <source src={src} type="video/mp4" />
            <span className="text-white">{name} Video</span>
          </video>
        </div>
      </div>
    </div>
  );
};

export default function CloudLayout() {
  const [visibleRows, setVisibleRows] = useState<boolean[]>(Array(cloudData.length).fill(false));

  useEffect(() => {
    cloudData.forEach((_, index) => {
      setTimeout(() => {
        setVisibleRows((prev) => {
          const newVisibleRows = [...prev];
          newVisibleRows[index] = true;
          return newVisibleRows;
        });
      }, index * 50); // 100ms delay for each row
    });
  }, []);

  return (
    <div className="w-full h-full min-h-screen bg-transparent text-white p-4">
      <div className="flex flex-col gap-2">
        {cloudData.map((row, rowIndex) => (
          <div key={rowIndex}
            className={`grid grid-cols-1 md:grid-cols-[300px,0.5fr,1fr] gap-2 max-h-[300px]  transition-all duration-700 ease-in-out transform 
            ${visibleRows[rowIndex] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <VideoPlayer src={row.video} name={row.name} />
            {/* Text Column */}
            <div className="dark-bg p-6 flex items-center justify-center max-h-[300px]">
              <div className="text-left">
                <h3 className="text-white mb-4">{row.name}</h3>
                {row.text}
              </div>
            </div>

            {/* Image Grid Column */}
            <div className="dark-bg p-4 flex items-center justify-center  max-h-[300px]">
              <div className="w-full h-full aspect-video flex items-center justify-center">
                <div className={`grid grid-cols-4 grid-rows-2 gap-2 w-full h-full p-2`}>
                  {row.images.slice(0, 8).map((image, index) => (
                    <div
                      key={index}
                      className="w-full h-full relative"
                    >
                      <img
                        src={image}
                        alt={`${row.name} Cloud ${index + 1}`}
                        className="w-full h-full object-cover rounded absolute inset-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
