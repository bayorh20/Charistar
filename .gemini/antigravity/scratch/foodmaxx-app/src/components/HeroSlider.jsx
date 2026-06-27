import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HeroSlider({ config }) {
  const type = config?.type || 'video';
  const videoLoops = config?.videoLoops || (config?.videoUrl ? [{ url: config.videoUrl }] : [{ url: '/splash.mp4' }]);
  const slides = config?.slides || [];

  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef(null);

  const items = type === 'video' ? videoLoops : slides;

  // Auto-advance for image slides
  useEffect(() => {
    if (type !== 'video' && items.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex(prev => (prev === items.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [type, items.length]);

  // Autoplay video loop when active index changes or mount
  useEffect(() => {
    if (type === 'video') {
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
  }, [activeIndex, type, items.length]);

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
        {type === 'video' ? (
          items.map((item, idx) => {
            if (idx !== activeIndex) return null;
            return (
              <motion.div
                key={`video-${idx}`}
                className="hero-slide-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <video
                  fetchpriority="high"
                  disablePictureInPicture
                  ref={idx === activeIndex ? videoRef : null}
                  src={item.url}
                  autoPlay
                  muted
                  loop={items.length === 1}
                  onEnded={items.length > 1 ? () => handleNext() : undefined}
                  playsInline
                  preload="auto"
                  className="hero-video"
                />
              </motion.div>
            );
          })
        ) : (
          items.map((item, idx) => {
            if (idx !== activeIndex) return null;
            return (
              <motion.div
                key={`slide-${idx}`}
                className="hero-slide-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <img src={item.image} alt={item.title} className="hero-slide-img" />
                <div className="hero-slide-overlay">
                  <h3 className="hero-slide-title">{item.title}</h3>
                  <p className="hero-slide-desc">{item.desc}</p>
                </div>
              </motion.div>
            );
          })
        )}
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
