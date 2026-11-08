import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface NoteBadgeButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  headerText: string;
  noteText: string;
  buttonLabel?: React.ReactNode;
  buttonClassName?: string;
}

export const NoteBadgeButton: React.FC<NoteBadgeButtonProps> = ({
  isOpen,
  onToggle,
  onClose,
  headerText,
  noteText,
  buttonLabel = 'Note',
  buttonClassName,
}) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
  } | null>(null);
  const [bubbleSize, setBubbleSize] = useState<{ width: number; height: number }>({
    width: 220,
    height: 72,
  });

  const showBubble = isOpen || isHovered;

  const updateCoords = useCallback(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    // If scrolled completely out of viewport, close locked bubble
    if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) {
      if (isOpen) onClose();
      setIsHovered(false);
      return;
    }
    setCoords({
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      width: r.width,
    });
  }, [isOpen, onClose]);

  useLayoutEffect(() => {
    if (!showBubble) return;
    updateCoords();
  }, [showBubble, updateCoords, noteText]);

  useLayoutEffect(() => {
    if (!showBubble || !bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setBubbleSize((prev) =>
        Math.abs(prev.width - rect.width) > 2 || Math.abs(prev.height - rect.height) > 2
          ? { width: rect.width, height: rect.height }
          : prev
      );
    }
  }, [showBubble, coords, noteText]);

  useEffect(() => {
    if (!showBubble) return;
    const handleScrollOrResize = () => updateCoords();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [showBubble, updateCoords]);

  const vw = typeof window !== 'undefined' ? window.innerWidth : 360;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 640;

  let clampedCenterX = 180;
  let arrowOffset = 0;
  let placeAbove = true;

  if (coords) {
    const btnCenterX = coords.left + coords.width / 2;
    const halfW = Math.max(95, bubbleSize.width / 2);
    const margin = 12;
    clampedCenterX = Math.max(margin + halfW, Math.min(vw - margin - halfW, btnCenterX));
    arrowOffset = Math.max(-(halfW - 16), Math.min(halfW - 16, btnCenterX - clampedCenterX));
    const neededTopSpace = bubbleSize.height + 16;
    placeAbove = coords.top >= neededTopSpace || coords.top > vh - coords.bottom;
  }

  return (
    <div className="relative inline-flex items-center justify-center max-w-full">
      <button
        ref={anchorRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          updateCoords();
          onToggle();
        }}
        onMouseEnter={() => {
          if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
            updateCoords();
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        className={
          buttonClassName ||
          'inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold text-orange-950 dark:text-[#e9762b] bg-orange-500/20 dark:bg-orange-500/15 hover:bg-orange-500/30 border border-orange-500/40 dark:border-orange-500/35 transition cursor-pointer select-none active:scale-95 shadow-sm'
        }
        title="Click to view note"
      >
        {buttonLabel}
      </button>

      {showBubble &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            {isOpen && (
              <div
                className="fixed inset-0 z-[9998]"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              />
            )}
            <div
              ref={bubbleRef}
              style={{
                position: 'fixed',
                left: `${clampedCenterX}px`,
                transform: 'translateX(-50%)',
                ...(placeAbove
                  ? { bottom: `${vh - coords.top + 10}px` }
                  : { top: `${coords.bottom + 10}px` }),
              }}
              className={`z-[9999] glass-modal bg-white/95 dark:bg-[#141413]/95 text-xs px-4 py-2.5 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(233,118,43,0.16)] max-w-[min(320px,calc(100vw-24px))] min-w-[180px] sm:min-w-[220px] text-left whitespace-normal border border-orange-500/30 dark:border-white/20 animate-in fade-in zoom-in-95 duration-150 ${
                !isOpen ? 'pointer-events-none' : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] text-[#e9762b] uppercase font-bold tracking-wider block mb-1 font-mono">
                {headerText}
              </span>
              <p className="text-stone-900 dark:text-slate-100 text-xs sm:text-sm leading-relaxed break-words font-mono whitespace-pre-wrap select-text max-h-48 overflow-y-auto">
                {noteText}
              </p>
              <div
                style={{ left: `calc(50% + ${arrowOffset}px)` }}
                className={`w-2.5 h-2.5 bg-white dark:bg-[#141413] border-orange-500/30 dark:border-white/20 transform rotate-45 absolute -translate-x-1/2 pointer-events-none ${
                  placeAbove
                    ? '-bottom-[6px] border-r border-b'
                    : '-top-[6px] border-l border-t'
                }`}
              />
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
