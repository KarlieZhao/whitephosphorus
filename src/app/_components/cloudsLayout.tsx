import React from 'react';
import { useRef, useEffect, useState } from 'react';
import FootageDisplay from './footageDisplay';
import $ from 'jquery';

interface DataInputRow {
  name: string;
  name_ar: string;
  text: string;
  img_count: number;
  video_count: number
}
interface CloudRow {
  name: string;
  name_ar: string;
  video: string;
  text: string;
  images: Array<string>;
  videos: Array<string>
}

const inputData: DataInputRow[] = [
  {
    name: "White Phosphorus",
    name_ar: "",
    text: "Upon detonation, WP munitions like the M825A1 155mm artillery shell eject approximately 116 WP-impregnated felt wedges into the air. These wedges ignite upon exposure to oxygen, producing a dense, white smoke plume that rapidly expands. The resulting cloud is thick and white, often resembling a jellyfish as it disperses. The ignited felt wedges create trailing streams of smoke, giving the plume a tentacle-like appearance as they descend. The smoke emits a distinct garlic-like odor.",
    img_count: 6,
    video_count: 3
  },
  {
    name: "Smoke Bomb M150",
    name_ar: "",
    text: "The M150 is an Israeli 155mm artillery smoke projectile designed to produce screening smoke using a hexachloroethane (HC)-based composition. Upon detonation, it ejects five HC smoke canisters that ignite upon exposure to air, generating dense, white smoke. The resulting smoke cloud is thick and white. Unlike white phosphorus munitions, the M150's smoke is less toxic and does not have incendiary properties. ",
    img_count: 0,
    video_count: 1
  },
  {
    name: "Flare",
    name_ar: "",
    text: "A military flare is a pyrotechnic device designed to produce a bright light or intense heat without an explosion. Flares serve multiple purposes, including signaling and illumination. Upon activation, they emit a brilliant light, often accompanied by a trail of smoke, making them visible over long distances. Some flares are equipped with small parachutes to slow their descent, allowing for prolonged illumination or signaling. ",
    img_count: 3,
    video_count: 2
  },
  {
    name: "Rocket Launches",
    name_ar: "",
    text: "Upon launch, Hezbollah's rockets, such as the Katyusha, Fajr-3, Fajr-5, and Zelzal, emit a bright flash due to propellant ignition. This is followed by a dense, white or gray smoke plume marking the rocket's ascent. As the rocket gains altitude and the propellant burns more efficiently, the visible flame diminishes, resulting in reduced light emission and a less pronounced smoke trail. ",
    img_count: 1,
    video_count: 2
  },
  {
    name: "Iron Dome Missiles",
    name_ar: "",
    text: "Iron Dome missiles produce distinctive smoke trails characterized by rapid, arcing paths that curve upward to engage incoming rockets. These trails are typically white and dense. The arcing trajectory is a visual indicator of the interceptor adjusting its path to intercept rockets. At night, the launch is marked by a bright flash, and the smoke trails may be illuminated by the missile's exhaust, creating a visible arc against the dark sky. ",
    img_count: 1,
    video_count: 5
  },
  {
    name: "Detonation of Iron Dome Missile",
    name_ar: "",
    text: "When an Iron Dome interceptor missile detonates to neutralize an incoming rocket, it generates a bright flash accompanied by a rapidly expanding smoke cloud, typically white or gray, resulting from the combustion of the missile's components and the intercepted projectile. This smoke plume often forms a spherical or irregular shape, depending on atmospheric conditions and the altitude of the interception. ",
    img_count: 3,
    video_count: 1
  },
  {
    name: "Fighter Jets",
    name_ar: "",
    text: "An airstrike from an F-16 or F-35, generates a rapid, intense explosion characterized by a bright flash and a swiftly expanding smoke plume. The plume's appearance varies based on the target and munitions used but typically features a dense, dark gray or black cloud that rises quickly, often forming a mushroom-like shape. The plume's opacity and color are influenced by factors such as the presence of fuel, building materials, and other combustibles at the target site. In some cases, secondary explosions may occur, leading to additional plumes.",
    img_count: 5,
    video_count: 5
  },
  {
    name: "UAV Strike",
    name_ar: "",
    text: "The plume's appearance varies based on the target and munitions used but typically features a dense, dark gray or black cloud that rises quickly, often forming a mushroom-like shape. The plume is generally smaller and more focused than those produced by fighter jet airstrikes, though its size and intensity can vary depending on what is exploding. The plume's opacity and color are influenced by factors such as the presence of fuel, building materials, and other combustibles at the target site.",
    img_count: 2,
    video_count: 3
  },
  {
    name: "Artillery Shelling",
    name_ar: "",
    text: "Artillery shell impacts produce plumes that are typically short-lived and concentrated, featuring bursts of dark gray or black smoke that rise rapidly before dispersing. The plume's shape is usually conical or irregular, influenced by the ground impact and the surrounding materials being ejected. These plumes are smaller and more contained compared to those from airstrikes, though repeated shelling can create overlapping clouds.",
    img_count: 2,
    video_count: 5
  },
  {
    name: "Contrails",
    name_ar: "",
    text: "Fighter jet contrails are long, thin, white trails formed when the jet's exhaust gases mix with cold, moist air at high altitudes. The water vapor in the exhaust condenses into ice crystals, creating visible streaks in the sky. Contrails often appear straight or slightly curved, following the jet's flight path. Their persistence and spread depend on atmospheric conditions such as humidity and temperature. In humid conditions, contrails may linger and expand, while in drier air, they dissipate quickly, leaving only faint traces.",
    img_count: 2,
    video_count: 4
  }
];

const generateLinks = (inputArray: DataInputRow[]): CloudRow[] => {
  return inputArray.map((item, index) => ({
    ...item,
    video: `${process.env.NEXT_PUBLIC_CDN_URL}/cloud_videos/${item.name
      .replace(/ /g, "")}.mp4`, // Generate video path
    images: Array.from({ length: item.img_count }, (_, i) =>
      `${process.env.NEXT_PUBLIC_CDN_URL}/cloud_videos/cloud_footage/${index + 1}_${item.name}/i${i + 1}.jpg`
    ),// Generate footage paths
    videos: Array.from({ length: item.video_count }, (_, i) =>
      `${process.env.NEXT_PUBLIC_CDN_URL}/cloud_videos/cloud_footage/${index + 1}_${item.name}/v${i + 1}.mp4`)
  }));
};
const cloudData = generateLinks(inputData);

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

  // onload effect
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

  useEffect(() => {
    $('.video-container').on('mouseenter', function () {
      $(this).find('video').prop('controls', true);
    });

    $('.video-container').on('mouseleave', function () {
      $(this).find('video').prop('controls', false);
    });
    return () => {
      $('.video-container').off('mouseenter mouseleave');
    };
  }, []);


  return (
    <div className="w-full h-full min-h-screen bg-transparent text-white p-4">
      <div className="flex flex-col gap-2">
        {cloudData.map((row, rowIndex) => (
          <div key={rowIndex}
            className={`grid grid-cols-1 md:grid-cols-[300px,0.5fr,1fr] gap-2 max-h-[330px] transition-all duration-700 ease-in-out transform 
            ${visibleRows[rowIndex] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <VideoPlayer src={row.video} name={row.name} />
            {/* Text Column */}
            <div className="dark-bg p-4 flex justify-center max-h-[330px] overflow-hidden">
              <div className="text-left plumes-description">
                <h3 className="mb-4">{row.name}</h3>
                <p> {row.text}</p>
              </div>
            </div>
            {/* Image Grid Column */}
            < div className="dark-bg p-4 flex items-center max-h-[330px]" >
              <div className={"grid grid-cols-5 grid-rows-2 gap-2 w-full h-full overflow-hidden"}>
                {row.images.map((link, index) => (
                  <div key={index} className="w-full h-full relative">
                    <img src={link}
                      className="w-full h-full object-cover inset-0"
                      loading="lazy"></img>
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
    </div >
  );
}
