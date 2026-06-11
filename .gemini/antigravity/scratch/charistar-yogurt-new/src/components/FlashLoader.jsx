import React from 'react';

export default function FlashLoader() {
  return (
    <div className="min-h-screen bg-charistar-dark px-6 pt-12 pb-24 flex flex-col font-sans overflow-x-hidden w-full relative">
      {/* Skeleton Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="w-1/2 h-8 bg-white/5 rounded-xl animate-pulse"></div>
        <div className="w-10 h-10 bg-white/5 rounded-full animate-pulse"></div>
      </div>

      {/* Skeleton Promo Banner */}
      <div className="w-full h-32 bg-white/5 rounded-3xl mb-8 animate-pulse"></div>

      {/* Skeleton Section Title */}
      <div className="w-1/3 h-6 bg-white/5 rounded-md mb-4 animate-pulse"></div>

      {/* Skeleton Grid (Products/Bento) */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="w-full aspect-[4/5] bg-white/5 rounded-2xl animate-pulse"></div>
            <div className="w-3/4 h-4 bg-white/5 rounded-md animate-pulse"></div>
            <div className="w-1/2 h-4 bg-white/5 rounded-md animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
