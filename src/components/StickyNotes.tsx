import React from 'react';
import { motion, useDragControls } from 'framer-motion';

export const HandDrawnX = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 25 22 C 45 45 65 65 78 82 M 75 25 C 55 45 35 65 22 78" />
  </svg>
);

export const HandDrawnCheck = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 20 55 C 35 70 40 80 45 85 C 55 60 75 30 85 20" />
  </svg>
);

export const HandDrawnQuestion = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 30 40 C 30 20 70 20 70 40 C 70 55 50 60 50 70 M 50 85 A 2 2 0 1 1 50 85.1" />
  </svg>
);

export const HandDrawnWord = ({ word, className }: { word: string, className?: string }) => {
  return (
    <div className={`relative flex w-full h-full items-center justify-center p-2 ${className}`}>
      <svg viewBox="0 0 200 100" className="absolute inset-0 w-full h-full" fill="currentColor">
        <filter id={`marker-${word}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <text 
          x="50%" 
          y="52%" 
          dominantBaseline="middle" 
          textAnchor="middle" 
          className="font-handdrawn"
          fontSize="68" 
          fontWeight="700"
          letterSpacing="2"
          stroke="currentColor"
          strokeWidth="1.5"
          filter={`url(#marker-${word})`}
        >
          {word}
        </text>
      </svg>
    </div>
  );
};

export const StickyNote = ({ type, content, color, textColor, tapeColor, shadowClass = 'shadow-md', sizeClass = 'w-24 h-24 sm:w-28 sm:h-28' }: any) => {
  return (
    <div className={`relative ${sizeClass} flex items-center justify-center ${color} ${textColor} rounded-sm ${shadowClass} border border-black/5`}>
      {/* Semi-transparent tape for all notes */}
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 ${tapeColor} opacity-80 backdrop-blur-sm rotate-[-2deg] shadow-sm border border-white/20 rounded-sm z-10`}></div>
      
      {type === 'image' ? (
        <img src={content} alt="note" className="w-3/4 h-3/4 object-contain pointer-events-none mix-blend-multiply" draggable={false} />
      ) : (
        <HandDrawnWord word={content} className="text-gray-800 drop-shadow-sm" />
      )}
    </div>
  );
};

export const StackItem = ({ source, x, y, onPointerDown, onPointerEnter, onPointerLeave }: any) => {
  const controls = useDragControls();
  const isBottomRow = ['s6', 's7', 's8', 's9'].includes(source.id);
  const sizeClass = source.sizeClass || (isBottomRow 
    ? (source.type === 'icon' ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-28 h-28 sm:w-32 sm:h-32')
    : (source.type === 'icon' ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-24 h-24 sm:w-28 sm:h-28'));

  return (
    <motion.div
      drag
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      initial={{ x, y }}
      onPointerDown={(e) => onPointerDown(source, e, controls)}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={`absolute cursor-grab-hand flex items-center justify-center select-none ${
        source.type === 'icon' ? sizeClass + ' ' + source.color : ''
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ x, y }}
    >
      {(source.type === 'text' || source.type === 'image') && (
        <StickyNote 
          type={source.type}
          content={source.content} 
          color={source.color} 
          textColor={source.textColor} 
          tapeColor={source.tapeColor} 
          shadowClass="shadow-md"
          sizeClass={sizeClass}
          pin={source.pin}
          curl={source.curl}
        />
      )}
      {source.type === 'icon' && source.content === 'x' && <HandDrawnX className="w-full h-full" />}
      {source.type === 'icon' && source.content === 'check' && <HandDrawnCheck className="w-full h-full" />}
      {source.type === 'icon' && source.content === 'question' && <HandDrawnQuestion className="w-full h-full" />}
    </motion.div>
  );
};
