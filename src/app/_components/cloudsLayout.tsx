import React from 'react';
import { useRef, useEffect, useState } from 'react';
import $ from 'jquery';
import { isMobileDevice } from './mobile-detector';

interface CloudRow {
  name: string;
  name_ar: string;
  text: string;
  text_ar: string;
  video: string;
  filenames: Array<string>;
  links: Array<string>;
}

export interface DataInputRow {
  name: string;
  name_ar: string;
  text: string;
  text_ar: string;
}

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
        <div className="absolute inset-0 overflow-hidden">
          {/*poster image */}
          <img
            src={`/cloud_thumb/${name.replace(/ /g, "")}.jpg`}
            alt={`${name}`}
            loading="lazy"
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
  const [lang, setLang] = useState<string>("en");
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [cloudData, setCloudData] = useState<CloudRow[] | null>(null);
  const [visibleRows, setVisibleRows] = useState<boolean[]>(Array(8).fill(false));

  useEffect(() => {
    fetch("/data/plume.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("plume media config loaded.")
        setCloudData(data);
      })
      .catch((err) => console.error("Failed to load plumae data:", err));
  }, []);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    // onload effect
    if (cloudData) {
      cloudData.forEach((_, index) => {
        setTimeout(() => {
          setVisibleRows((prev) => {
            const newVisibleRows = [...prev];
            newVisibleRows[index] = true;
            return newVisibleRows;
          });
        }, index * 50); // 100ms delay for each row
      });
    }
  }, [cloudData]);

  useEffect(() => {
    // Open overlay on image or video click
    $('.img-container img').on('click', function () {
      const overlay = $('#media-overlay');
      const overlayContent = $('#overlay-content');
      const source = $('#overlay-source');
      // Clear previous content
      overlayContent.empty();
      const imgSrc = $(this).attr('src');
      const link = $(this).attr('alt');
      overlayContent.append(`<img src="${imgSrc}" alt="" class="w-full h-full object-contain" />`);
      source.empty();
      source.append(`<a href="${link}" target='_blank'>Click here to view source.<a>`)
      overlay.removeClass('fade-out').addClass('fade-in');
    });

    $('#close-overlay, #media-overlay').on('click', function (e) {
      if (e.target.id === 'media-overlay' || e.target.id === 'close-overlay') {
        const videoElement = $('#overlay-content video')[0] as HTMLVideoElement;
        if (videoElement) {
          videoElement.pause();
          videoElement.currentTime = 0;
        }
        $('#media-overlay').removeClass('fade-in').addClass('fade-out');
      }
    });

    return () => {
      $('.img-container img').off('click');
      $('#close-overlay, #media-overlay').off('click');
    };
  }, [cloudData]);

  if (isMobile === null) return null;

  return (
    <div className="w-full h-full min-h-screen bg-transparent text-white p-4">

      {/* media overlay */}
      <div id="media-overlay" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div id="overlay-content" className="border-2 flex justify-center items-center"></div>
        <div id="overlay-source"></div>
      </div>

      <div className='fixed top-20 left-8 z-100 text-white cursor-pointer'>
        <span
          className={`transition-colors ${lang === "en" ? "text-white underline" : "text-gray-400 no-underline"}`}
          onClick={() => { setLang("en") }}
        >English </span>
        &nbsp;/&nbsp;
        <span
          className={`transition-colors ${lang === "ar" ? "text-white underline" : "text-gray-400 no-underline"}`}
          onClick={() => { setLang("ar"); }}
        >   العربية</span></div>

      <div className="flex flex-col gap-2">

        {cloudData?.map((row, rowIndex) => (
          <div key={rowIndex}
            className={`grid grid-cols-1 md:grid-cols-[260px,0.7fr,1fr] gap-2 max-h-[300px] transition-all duration-700 ease-in-out transform 
            ${visibleRows[rowIndex] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

            <VideoPlayer src={row.video} name={row.name} />

            {/* Text Column */}
            <div className={`${isMobile ? "absolute" : "dark-bg"} p-0 flex justify-center items-center max-h-[330px] overflow-hidden`}>
              <div className="text-left plumes-description relative">
                <section className={`absolute top-0 left-0 w-full transition-all ${lang === "en" ? "opacity-1 fadeIn" : "fadeOut opacity-0"}`}>
                  <h3 className="en mb-2 font-bold plume-name">{row.name === "White Phosphorus" ? row.name + " (WP)" : row.name === "Fighter Jets" ? row.name + " & UAVs" : row.name}</h3>
                  <p className="en">{row.text}</p>
                </section>

                <section className={`transition-all ${lang === "ar" ? "opacity-1 fadeIn" : "fadeOut opacity-0"}`}>
                  <h3 className="ar mb-2 font-bold plume-name">{row.name_ar}</h3>
                  <p className="3 ar">{row.text_ar}</p>
                </section>
              </div>
            </div>
            {/* Image Grid Column */}
            < div className={`${isMobile ? "hidden" : ""} dark-bg px-4 py-8 flex items-center max-h-[330px]`} >
              <div className={"grid grid-cols-5 grid-rows-1 gap-2 w-full h-full overflow-hidden"}>
                {row.filenames.map((name, index) => (
                  <div key={index} className="img-container w-full h-full relative cursor-pointer">
                    <img src={name}
                      className="w-full h-full object-cover inset-0 cursor-pointer"
                      loading="lazy"
                      alt=""
                    ></img>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
        }
      </div >
    </div>
  );
}
