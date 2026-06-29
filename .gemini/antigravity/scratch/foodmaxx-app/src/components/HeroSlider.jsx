import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HeroSlider({ config }) {
  const type = config?.type || 'video';
  const videoLoops = config?.videoLoops || (config?.videoUrl ? [{ url: config.videoUrl }] : [{ url: '/splash.mp4' }]);
  const slides = config?.slides || [];

  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef(null);

  // Helper to determine if a URL is a video format
  const isVideoUrl = (url) => {
    if (!url) return false;
    const ext = url.toLowerCase().split('?')[0].split('.').pop();
    return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
  };

  // Filter slides to only show active and scheduled ones
  const activeSlides = useMemo(() => {
    if (!slides || !Array.isArray(slides)) return [];
    const now = new Date();
    return slides.filter(slide => {
      if (slide.active === false) return false;
      if (slide.startDate && new Date(slide.startDate) > now) return false;
      if (slide.endDate && new Date(slide.endDate) < now) return false;
      return true;
    });
  }, [slides]);

  // Unified items selector: falls back to legacy loops if slides are empty
  const items = useMemo(() => {
    if (type === 'video' && (!slides || slides.length === 0)) {
      return videoLoops.map(loop => ({
        ...loop,
        image: loop.url,
        mediaType: 'video'
      }));
    }
    return activeSlides;
  }, [type, activeSlides, videoLoops, slides]);

  // Auto-advance for non-video or mixed items containing multiple slides
  useEffect(() => {
    if (items.length > 1) {
      const currentItem = items[activeIndex];
      const isVideo = currentItem?.mediaType === 'video' || isVideoUrl(currentItem?.image || currentItem?.url);
      
      // Auto-advance only for images. Videos will trigger handleNext() onEnded
      if (!isVideo) {
        const interval = setInterval(() => {
          setActiveIndex(prev => (prev === items.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [items, activeIndex]);

  // Autoplay video loop when active index changes or mount
  useEffect(() => {
    const currentItem = items[activeIndex];
    const isVideo = currentItem?.mediaType === 'video' || isVideoUrl(currentItem?.image || currentItem?.url);

    if (isVideo) {
      const video = videoRef.current;
      if (!video) return;
      const tryPlay = () => {
        video.play().catch(() => {});
      };
      
      if (items.length === 1) {
        video.addEventListener('pause', tryPlay);
        tryPlay();
        return () => video.removeEventListener('pause', tryPlay);
      } else {
        tryPlay();
      }
    }
  }, [activeIndex, items]);

  if (!items || items.length === 0) return null;

  const handlePrev = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setActiveIndex(prev => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setActiveIndex(prev => (prev === items.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="hero-slider-wrapper">
      <AnimatePresence mode="wait">
        {items.map((item, idx) => {
          if (idx !== activeIndex) return null;
          const isVideo = item.mediaType === 'video' || isVideoUrl(item.image || item.url);
          const mediaSrc = item.image || item.url;
          
          return (
            <motion.div
              key={`slide-${idx}-${mediaSrc}`}
              className="hero-slide-pane"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {isVideo ? (
                <video
                  fetchpriority="high"
                  disablePictureInPicture
                  ref={idx === activeIndex ? videoRef : null}
                  src={mediaSrc}
                  autoPlay
                  muted
                  loop={items.length === 1}
                  onEnded={items.length > 1 ? () => handleNext() : undefined}
                  playsInline
                  preload="auto"
                  className="hero-video"
                />
              ) : (
                <img 
                  loading="lazy" 
                  decoding="async" 
                  src={mediaSrc} 
                  alt={item.title} 
                  className="hero-slide-img" 
                />
              )}
              
              {/* Overlay content */}
              {(item.title || item.desc || (item.ctaText && item.ctaLink)) && (
                <div className="hero-slide-overlay">
                  {item.title && <h3 className="hero-slide-title">{item.title}</h3>}
                  {item.desc && <p className="hero-slide-desc">{item.desc}</p>}
                  {item.ctaText && item.ctaLink && (
                    <a 
                      href={item.ctaLink} 
                      className="hero-slide-cta"
                      onClick={(e) => {
                        // Let React Router handle internal links if needed, otherwise normal navigate
                      }}
                    >
                      {item.ctaText}
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Navigation Arrows if more than 1 item */}
      {items.length > 1 && (
        <>
          <button className="slider-nav-btn prev" onClick={handlePrev} aria-label="Previous slide">
            <ChevronLeft size={14} strokeWidth={3} />
          </button>
          <button className="slider-nav-btn next" onClick={handleNext} aria-label="Next slide">
            <ChevronRight size={14} strokeWidth={3} />
          </button>

          {/* Dots Indicator */}
          <div className="slider-dots">
            {items.map((_, idx) => (
              <span
                key={idx}
                className={`slider-dot ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(idx)}
              />
            ))}
          </div>
        </>
      )}

      <style>{`
        .hero-slider-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 3776 / 1132;
          max-height: 200px;
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 12px;
          background: #111;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        }

        .hero-slide-pane {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .hero-video, .hero-slide-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .hero-slide-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0) 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 16px 20px;
          box-sizing: border-box;
          color: #fff;
          align-items: flex-start;
          text-align: left;
        }

        .hero-slide-title {
          font-family: var(--font-accent);
          font-size: 1.05rem;
          font-weight: 900;
          margin: 0 0 2px 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .hero-slide-desc {
          font-size: 0.72rem;
          font-weight: 600;
          margin: 0;
          opacity: 0.9;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .hero-slide-cta {
          display: inline-block;
          margin-top: 8px;
          padding: 6px 14px;
          background: var(--primary, #FF5B26);
          color: white;
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
          border-radius: 8px;
          width: fit-content;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(255, 91, 38, 0.35);
          transition: all 0.2s ease;
        }

        .hero-slide-cta:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 16px rgba(255, 91, 38, 0.5);
          color: white;
        }

        .slider-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.3);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .slider-nav-btn:hover {
          background: rgba(255,255,255,0.4);
          scale: 1.05;
        }

        .slider-nav-btn.prev {
          left: 12px;
        }

        .slider-nav-btn.next {
          right: 12px;
        }

        .slider-dots {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          z-index: 10;
        }

        .slider-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .slider-dot.active {
          background: var(--primary, #FF5B26);
          width: 14px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
