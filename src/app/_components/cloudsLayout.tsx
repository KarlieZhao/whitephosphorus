import React from 'react';
import { useRef, useEffect, useState } from 'react';
import $ from 'jquery';
import { isMobileDevice } from './mobile-detector';
import cloudData from './plumeData';

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
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    // onload effect
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

  useEffect(() => {
    //show video control on hover?
    // $('.video-container').on('mouseenter', function () {
    //   $(this).find('video').prop('controls', true);
    // });

    // $('.video-container').on('mouseleave', function () {
    //   $(this).find('video').prop('controls', false);
    // });

    // Open overlay on image or video click
    $('.img-container img, .video-container video').on('click', function () {
      const overlay = $('#media-overlay');
      const overlayContent = $('#overlay-content');

      // Clear previous content
      overlayContent.empty();

      // Check if the clicked element is an image or video
      if ($(this).is('img')) {
        const imgSrc = $(this).attr('src');
        overlayContent.append(`<img src="${imgSrc}" class="w-full h-full object-contain" />`);
      } else if ($(this).is('video')) {
        const videoSrc = $(this).find('source').attr('src');
        overlayContent.append(`
            <video controls autoplay class="w-full h-full object-contain">
              <source src="${videoSrc}" type="video/mp4" />
            </video>
          `);
      }

      // Show the overlay
      overlay.removeClass('fade-out').addClass('fade-in');
    });

    // Close overlay
    $('#close-overlay, #media-overlay').on('click', function (e) {
      if (e.target.id === 'media-overlay' || e.target.id === 'close-overlay') {
        const videoElement = $('#overlay-content video')[0] as HTMLVideoElement;
        if (videoElement) {
          videoElement.pause();
          videoElement.currentTime = 0; // Reset playback position
        }
        $('#media-overlay').removeClass('fade-in').addClass('fade-out');
      }
    });

    // Clean up event listeners
    return () => {
      $('.img-container img, .video-container video').off('click');
      $('#close-overlay, #media-overlay').off('click');
      // $('.video-container').off('mouseenter mouseleave');
    };

  }, [cloudData]);

  return (
    <div className="w-full h-full min-h-screen bg-transparent text-white p-4">

      {/* media overlay */}
      <div id="media-overlay" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div id="overlay-content" className="border-2 flex justify-center items-center"></div>
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
        >   اَلْعَرَبِيَّةُ</span></div>

      <div className="flex flex-col gap-2">
        {cloudData.map((row, rowIndex) => (
          <div key={rowIndex}
            className={`grid grid-cols-1 md:grid-cols-[300px,0.5fr,1fr] gap-2 max-h-[330px] transition-all duration-700 ease-in-out transform 
            ${visibleRows[rowIndex] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

            <VideoPlayer src={row.video} name={row.name} />

            {/* Text Column */}
            <div className={`${isMobileDevice() ? "absolute" : ""} dark-bg p-4 flex justify-center max-h-[330px] overflow-hidden`}>
              <div className="text-left plumes-description relative">
                <section className={`absolute top-0 left-0 w-100 transition-all ${lang === "en" ? "opacity-1 fadeIn" : "fadeOut opacity-0"}`}>
                  <h3 className="mb-4 font-bold">{row.name}</h3>
                  <p className="mt-3 ">{row.text}</p>
                </section>

                <section className={`transition-all ${lang === "ar" ? "opacity-1 fadeIn" : "fadeOut opacity-0"}`}>
                  <h3 className="ar">{row.name_ar}</h3>
                  <p className="mt-3 ar">{row.text_ar}</p>
                </section>
              </div>
            </div>
            {/* Image Grid Column */}
            < div className={`${isMobileDevice() ? "hidden" : ""} dark-bg p-4 flex items-center max-h-[330px]`} >
              <div className={"grid grid-cols-5 grid-rows-2 gap-2 w-full h-full overflow-hidden"}>
                {row.images.map((link, index) => (
                  <div key={index} className="img-container w-full h-full relative">
                    <img src={link}
                      className="w-full h-full object-cover inset-0"
                      loading="lazy"
                    ></img>
                  </div>
                ))}

                {row.videos.map((link, index) => (
                  <div key={index} className="video-container w-full h-full relative">
                    <video controls={false} className="w-full h-full object-cover inset-0">
                      <source src={link} type='video/mp4' />
                    </video>
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
