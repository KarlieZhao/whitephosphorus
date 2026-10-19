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

const VideoPlayer = ({ src, name, mobile }: { src: string; name: string; mobile?: boolean }) => {
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
          // No load() first: it resets the element, which aborts the play request that
          // follows it on the same tick. preload already fetches the file, so play() on
          // its own is both enough and the reliable order.
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

  // Set straight away rather than waiting a frame. The frame delay was there to avoid a
  // flicker, but the opacity already has a 0.3s transition doing that job — and routing
  // it through requestAnimationFrame means that whenever the browser throttles the
  // rendering pipeline the video can finish playing while still invisible.
  const handleVideoLoad = () => setIsVideoReady(true);

  return (
    <div ref={containerRef} className={mobile ? "dark-bg" : "dark-bg p-4"}>
      <div className={mobile ? "relative w-full pt-[100%]" : "relative w-full pt-[100%]  max-h-[300px]"}>
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
            preload="metadata"
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoLoad}
            // canplay/loadeddata only fire while the data is still being readied, so
            // after the first pass they never fire again and the video stayed invisible
            // behind its poster on every return. playing fires each time it resumes.
            onPlaying={handleVideoLoad}
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
      const link = $(this).attr('data-link');
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

  /**
   * The phone layout. Not a reflow of the desktop grid — three columns cannot survive
   * 375px — but the same reading of the content: the footage is the evidence and takes
   * the full width, the stills are corroboration and go on a strip you push sideways.
   * They keep the img-container markup so the existing overlay handler picks them up.
   */
  const mobileCards = (
    <div className="plume-cards">
      <div className="plume-lang">
        <span
          className={lang === "en" ? "text-white underline" : "text-gray-400 no-underline"}
          onClick={() => setLang("en")}
        >English</span>
        &nbsp;/&nbsp;
        <span
          className={lang === "ar" ? "text-white underline" : "text-gray-400 no-underline"}
          onClick={() => setLang("ar")}
        >العربية</span>
      </div>

      {cloudData?.map((row, rowIndex) => (
        <section key={rowIndex} className="plume-card">
          <VideoPlayer src={row.video} name={row.name} mobile />
          <div className="plume-card-body">
            {lang === "en" ? (
              <div className="en">
                <h3 className="plume-name">
                  {row.name === "White Phosphorus" ? `${row.name} (WP)`
                    : row.name === "Fighter Jets" ? `${row.name} & UAVs`
                      : row.name}
                </h3>
                <p className="plume-card-text">{row.text}</p>
              </div>
            ) : (
              <div className="ar">
                <h3 className="plume-name">{row.name_ar}</h3>
                <p className="plume-card-text">{row.text_ar}</p>
              </div>
            )}

            <div className="plume-strip">
              {row.filenames.map((name, index) => (
                <div key={index} className="img-container plume-still">
                  <img src={name} loading="lazy" alt="" data-link={row.links[index]} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );


  return (
    <div className="w-full h-full min-h-screen bg-transparent text-white p-4">

      {/* media overlay */}
      <div id="media-overlay" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div id="overlay-content" className="border-2 flex justify-center items-center"></div>
        <div id="overlay-source"></div>
      </div>

      <div className={isMobile ? 'hidden' : 'fixed top-20 left-8 z-100 text-white cursor-pointer'}>
        <span
          className={`transition-colors ${lang === "en" ? "text-white underline" : "text-gray-400 no-underline"}`}
          onClick={() => { setLang("en") }}
        >English </span>
        &nbsp;/&nbsp;
        <span
          className={`transition-colors ${lang === "ar" ? "text-white underline" : "text-gray-400 no-underline"}`}
          onClick={() => { setLang("ar"); }}
        >   العربية</span></div>

      {isMobile ? mobileCards : (
      <div className="flex flex-col gap-2">

        {cloudData?.map((row, rowIndex) => (
          <div key={rowIndex}
            className={`grid grid-cols-1 md:grid-cols-[260px,0.7fr,1fr] gap-2 max-h-[300px] transition-all duration-700 ease-in-out transform 
            ${visibleRows[rowIndex] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

            <VideoPlayer src={row.video} name={row.name} />

            {/* Text Column */}
            <div className={`${isMobile ? "absolute" : "dark-bg"} p-0 flex items-center max-h-[330px]`}>
              <div className="text-left plumes-description relative overflow-y-auto">
                <div className={`absolute transition-all ${lang === "en" ? "opacity-100 fadeIn" : "fadeOut opacity-0"}`}>
                  <h3 className="en mb-2 font-bold plume-name">
                    {row.name === "White Phosphorus" ? `${row.name} (WP)` :
                      row.name === "Fighter Jets" ? `${row.name} & UAVs` :
                        row.name}
                  </h3>
                  <p className="en">{row.text}</p>
                </div>

                <div className={`transition-all ${lang === "ar" ? "opacity-100 fadeIn" : "fadeOut opacity-0"}`}>
                  <h3 className="ar mb-2 font-bold plume-name">{row.name_ar}</h3>
                  <p className="ar">{row.text_ar}</p>
                </div>
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
                      data-link={row.links[index]}
                    ></img>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
        }
      </div >
      )}
    </div>
  );
}
