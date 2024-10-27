import React from 'react';

interface CloudRow {
  name: string;
  video: string;
  text: string;
  images: string[];
}

const cloudData: CloudRow[] = [
  {
    name: "Cumulus",
    video: "/videos/cumulus.mp4",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam et pretium dui. Phasellus aliquet, leo vitae venenatis lobortis, neque nulla suscipit nunc.",
    images: Array(8).fill('/api/placeholder/200/200')
  },
  {
    name: "Stratus",
    video: "/videos/stratus.mp4",
    text: "Integer non scelerisque magna. Donec eu accumsan dui, vitae condimentum sem. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac.",
    images: Array(2).fill('/api/placeholder/200/200')
  },
  {
    name: "Cirrus",
    video: "/videos/cirrus.mp4",
    text: "Suspendisse et gravida augue. Sed eleifend posuere ex id interdum. Proin feugiat interdum sem, eget tincidunt justo pellentesque quis.",
    images: Array(4).fill('/api/placeholder/200/200')
  }
];

const getGridConfig = (imageCount: number) => {
  switch (imageCount) {
    case 1:
      return 'grid-cols-1 grid-rows-1';
    case 2:
      return 'grid-cols-2 grid-rows-1';
    case 3:
      return 'grid-cols-3 grid-rows-1';
    case 4:
      return 'grid-cols-2 grid-rows-2';
    case 5:
    case 6:
      return 'grid-cols-3 grid-rows-2';
    default:
      return 'grid-cols-4 grid-rows-2';
  }
};

export default function CloudLayout() {
  return (
    <div className="w-full h-full min-h-screen bg-transparent text-white p-4">
      <div className="flex flex-col gap-4">
        {cloudData.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Video Column */}
            <div className="bg-zinc-800 p-4 flex items-center justify-center">
              <div className="aspect-video bg-black rounded-lg w-full flex items-center justify-center">
                <span className="text-white">{row.name} Video</span>
              </div>
            </div>

            {/* Text Column */}
            <div className="bg-zinc-800 p-4 flex items-center justify-center">
              <div className="prose prose-invert text-center">
                <h3 className="text-white mb-4">{row.name}</h3>
                {row.text}
              </div>
            </div>

            {/* Image Grid Column */}
            <div className="bg-zinc-800 p-4 flex items-center justify-center">
              <div className="w-full h-full aspect-video flex items-center justify-center">
                <div className={`grid ${getGridConfig(row.images.length)} gap-2 w-full h-full p-2`}>
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