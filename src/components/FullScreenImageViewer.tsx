import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Search, Maximize, RotateCcw } from 'lucide-react';

interface FullScreenImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  productName?: string;
  imageDetails?: {
    url: string;
    altText?: string;
    angle?: 'front' | 'back' | 'side' | 'macro';
  }[];
}

export const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  productName = 'Temple Necklace',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const toggleZoom = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.2);
    }
  };

  const handlePrev = () => {
    resetZoom();
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    resetZoom();
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-white backdrop-blur-md p-3 sm:p-6"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="relative w-full max-w-5xl bg-[#14040b] rounded-3xl border border-amber-900/40 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Top Header Bar matching "Product Gallery / Temple Necklace" */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div>
            <span className="text-[10px] uppercase font-sans tracking-widest text-[#E8C77B] block">
              Product Gallery
            </span>
            <h3 className="font-serif font-bold text-base sm:text-lg text-white">
              {productName}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="Close Gallery (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Center Area: Large Image Viewport + Right Vertical Thumbnails */}
        <div className="relative flex-1 flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 gap-4 overflow-hidden">
          {/* Main Image Showcase Canvas */}
          <div
            className="relative flex-1 w-full h-[50vh] sm:h-[60vh] flex items-center justify-center overflow-hidden bg-black/60 rounded-2xl cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              className="relative max-h-full max-w-full flex items-center justify-center"
            >
              <img
                src={currentImage}
                alt={productName}
                className="max-h-[48vh] sm:max-h-[58vh] w-auto max-w-full object-contain pointer-events-none"
                draggable={false}
              />
            </div>

            {/* Left Prev Arrow */}
            {images.length > 1 && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-white/20 transition cursor-pointer z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Right Next Arrow */}
            {images.length > 1 && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-white/20 transition cursor-pointer z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Bottom Controls: Zoom and Full Screen */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/70 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/10 text-xs">
              <button
                onClick={toggleZoom}
                className="flex items-center gap-1 hover:text-amber-400 transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{scale > 1 ? 'Reset' : 'Zoom'}</span>
              </button>
              <span className="text-white/20">•</span>
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen?.();
                  } else {
                    document.exitFullscreen?.();
                  }
                }}
                className="flex items-center gap-1 hover:text-amber-400 transition cursor-pointer"
              >
                <Maximize className="w-3.5 h-3.5" />
                <span>Full Screen</span>
              </button>
            </div>
          </div>

          {/* Right Column: Vertical Thumbnails Strip matching screenshot */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto scrollbar-none shrink-0 py-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    resetZoom();
                    setCurrentIndex(idx);
                  }}
                  className={`w-14 h-14 sm:w-18 sm:h-18 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-black shrink-0 ${
                    currentIndex === idx
                      ? 'border-[#C69A39] shadow-md scale-105'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
