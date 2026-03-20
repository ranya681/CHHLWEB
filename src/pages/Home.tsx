import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import confetti from 'canvas-confetti';
import { HandDrawnX, HandDrawnCheck, HandDrawnQuestion, HandDrawnWord, StickyNote, StackItem } from '../components/StickyNotes';

type NoteData = {
  id: string;
  type: 'text' | 'image' | 'icon';
  content: string;
  color: string;
  textColor?: string;
  tapeColor?: string;
  x: number;
  y: number;
  rotation: number;
  shadowClass: string;
};

const STICKY_SOURCES = [
  { id: 's0', type: 'icon', content: 'check', color: 'text-brand-green' },
  { id: 's1', type: 'icon', content: 'x', color: 'text-brand-red' },
  { id: 's2', type: 'icon', content: 'question', color: 'text-brand-orange' },
  { id: 's3', type: 'text', content: 'Obey', color: 'bg-gradient-to-br from-[#fef08a] to-[#fde047]', tapeColor: 'bg-red-200/80' },
  { id: 's4', type: 'text', content: 'Game', color: 'bg-gradient-to-br from-[#d9f99d] to-[#bef264]', tapeColor: 'bg-blue-200/80' },
  { id: 's5', type: 'text', content: 'Rule', color: 'bg-gradient-to-br from-[#fbcfe8] to-[#f9a8d4]', tapeColor: 'bg-yellow-200/80' },
  { id: 's6', type: 'text', content: 'Free', color: 'bg-gradient-to-br from-[#bfdbfe] to-[#93c5fd]', tapeColor: 'bg-pink-200/80' },
  { id: 's7', type: 'text', content: 'Design', color: 'bg-gradient-to-br from-[#e9d5ff] to-[#d8b4fe]', tapeColor: 'bg-green-200/80' },
  { id: 's8', type: 'text', content: 'Her', color: 'bg-gradient-to-br from-[#fed7aa] to-[#fdba74]', tapeColor: 'bg-purple-200/80' },
  { id: 's9', type: 'text', content: 'Life', color: 'bg-gradient-to-br from-[#fecaca] to-[#fca5a5]', tapeColor: 'bg-orange-200/80' },
];

const PYRAMID_POSITIONS = [
  { id: 's2', x: 20, y: -300 },
  { id: 's1', x: -100, y: -170 },
  { id: 's0', x: 140, y: -170 },
  { id: 's3', x: -180, y: -10 },
  { id: 's4', x: 20, y: -10 },
  { id: 's5', x: 220, y: -10 },
  { id: 's6', x: -320, y: 160 },
  { id: 's7', x: -100, y: 160 },
  { id: 's8', x: 120, y: 160 },
  { id: 's9', x: 340, y: 160 },
];

export default function Home() {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const [trashProgress, setTrashProgress] = useState(0);
  const trashTimerRef = useRef<NodeJS.Timeout | null>(null);

  const placedTypesRef = useRef<Set<string>>(new Set());
  const totalPlacedRef = useRef(0);
  const [showCuriosity, setShowCuriosity] = useState(false);
  const [showCreative, setShowCreative] = useState(false);

  const [peelingNoteState, setPeelingNoteState] = useState<NoteData | null>(null);
  const peelingNoteRef = useRef<NoteData | null>(null);

  const setPeelingNote = (val: NoteData | null | ((prev: NoteData | null) => NoteData | null)) => {
    if (typeof val === 'function') {
      setPeelingNoteState((prev) => {
        const next = val(prev);
        peelingNoteRef.current = next;
        return next;
      });
    } else {
      peelingNoteRef.current = val;
      setPeelingNoteState(val);
    }
  };
  const peelingNote = peelingNoteState;

  const [cursorProgress, setCursorProgress] = useState<{ x: number, y: number, progress: number } | null>(null);
  
  const [tooltip, setTooltip] = useState<{ text: string, x: number, y: number } | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  const interactionState = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    source: null as any,
    peelTriggered: false,
    stackUnlocked: false,
    holdTimer: null as NodeJS.Timeout | null,
    progressTimer: null as NodeJS.Timeout | null,
  });

  const handlePointerEnterTooltip = (text: string) => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => {
      setTooltip({ text, x: mousePos.current.x, y: mousePos.current.y });
    }, 800);
  };

  const handlePointerLeaveTooltip = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setTooltip(null);
  };

  const handleSourcePointerDown = (source: any, e: React.PointerEvent, dragControls: any) => {
    handlePointerLeaveTooltip();
    interactionState.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      source,
      peelTriggered: false,
      stackUnlocked: false,
      holdTimer: null,
      progressTimer: null,
    };

    interactionState.current.holdTimer = setTimeout(() => {
      const state = interactionState.current;
      if (!state.peelTriggered && state.isDown) {
        let progress = 0;
        setCursorProgress({ x: state.currentX, y: state.currentY, progress: 0 });
        
        state.progressTimer = setInterval(() => {
          progress += 10;
          setCursorProgress(prev => prev ? { ...prev, progress } : null);
          
          if (progress >= 100) {
            clearInterval(state.progressTimer!);
            setCursorProgress(null);
            state.stackUnlocked = true;
            dragControls.start(e); 
          }
        }, 30);
      }
    }, 200);
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);

      const state = interactionState.current;
      state.currentX = e.clientX;
      state.currentY = e.clientY;

      setCursorProgress(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);

      if (!state.isDown) return;

      const dist = Math.hypot(e.clientX - state.startX, e.clientY - state.startY);

      if (!state.peelTriggered && !state.stackUnlocked && dist > 5) {
        state.peelTriggered = true;
        if (state.holdTimer) clearTimeout(state.holdTimer);
        if (state.progressTimer) clearInterval(state.progressTimer);
        setCursorProgress(null);

        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const shadowTypes = ['shadow-curl-br', 'shadow-curl-bl', 'shadow-curl-bottom', 'shadow-md'];
        const randomShadow = shadowTypes[Math.floor(Math.random() * shadowTypes.length)];

        setPeelingNote({
          id: uuidv4(),
          type: state.source.type,
          content: state.source.content,
          color: state.source.color,
          textColor: state.source.textColor,
          tapeColor: state.source.tapeColor,
          x: e.clientX - containerRect.left - 40,
          y: e.clientY - containerRect.top - 40,
          rotation: Math.random() * 20 - 10,
          shadowClass: randomShadow,
        });
      }

      if (state.peelTriggered) {
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;
        setPeelingNote(prev => prev ? {
          ...prev,
          x: e.clientX - containerRect.left - 40,
          y: e.clientY - containerRect.top - 40,
        } : null);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const state = interactionState.current;
      if (!state.isDown) return;

      state.isDown = false;
      if (state.holdTimer) clearTimeout(state.holdTimer);
      if (state.progressTimer) clearInterval(state.progressTimer);
      setCursorProgress(null);

      if (state.peelTriggered) {
        const prev = peelingNoteRef.current;
        if (prev) {
          let isOverTrash = false;
          if (trashRef.current) {
            const trashRect = trashRef.current.getBoundingClientRect();
            isOverTrash = 
              e.clientX >= trashRect.left &&
              e.clientX <= trashRect.right &&
              e.clientY >= trashRect.top &&
              e.clientY <= trashRect.bottom;
          }
          if (!isOverTrash) {
            setNotes(notes => {
              if (notes.some(n => n.id === prev.id)) return notes;
              
              // Easter egg logic
              placedTypesRef.current.add(prev.content);
              totalPlacedRef.current += 1;
              if (placedTypesRef.current.size === 10 && !showCuriosity) {
                setShowCuriosity(true);
              }

              return [...notes, prev];
            });
          }
        }
        setPeelingNote(null);
        state.peelTriggered = false;
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  // Creative easter egg trigger logic
  useEffect(() => {
    if (notes.length >= 15 && !showCreative) {
      setShowCreative(true);
      // Trigger confetti - multiple bursts with different sizes and shapes
      const colors = ['#F97316', '#EF4444', '#22C55E', '#3B82F6', '#A855F7'];
      
      // Large particles
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 100,
        origin: { x: 0, y: 1 },
        colors: colors,
        zIndex: 100,
        startVelocity: 90,
        scalar: 1.5,
        ticks: 300,
        shapes: ['square']
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 100,
        origin: { x: 1, y: 1 },
        colors: colors,
        zIndex: 100,
        startVelocity: 90,
        scalar: 1.5,
        ticks: 300,
        shapes: ['square']
      });

      // Small particles
      confetti({
        particleCount: 100,
        angle: 70,
        spread: 80,
        origin: { x: 0, y: 1 },
        colors: colors,
        zIndex: 100,
        startVelocity: 70,
        scalar: 0.9,
        ticks: 300,
        shapes: ['circle']
      });
      confetti({
        particleCount: 100,
        angle: 110,
        spread: 80,
        origin: { x: 1, y: 1 },
        colors: colors,
        zIndex: 100,
        startVelocity: 70,
        scalar: 0.9,
        ticks: 300,
        shapes: ['circle']
      });

      // Rectangular-ish particles
      const rect = confetti.shapeFromPath({ path: 'M0 0 L10 0 L10 20 L0 20 Z' });
      confetti({
        particleCount: 40,
        angle: 90,
        spread: 120,
        origin: { x: 0.5, y: 1 },
        colors: colors,
        zIndex: 100,
        startVelocity: 80,
        scalar: 1.1,
        ticks: 300,
        shapes: [rect]
      });
    }
  }, [notes.length, showCreative]);

  const handleDragEnd = (event: any, info: any, id: string) => {
    if (!trashRef.current) {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));
      return;
    }
    
    const trashRect = trashRef.current.getBoundingClientRect();
    const padding = 60;
    const dropX = info.point.x - window.scrollX;
    const dropY = info.point.y - window.scrollY;
    
    const isOverTrash = 
      dropX >= trashRect.left - padding &&
      dropX <= trashRect.right + padding &&
      dropY >= trashRect.top - padding &&
      dropY <= trashRect.bottom + padding;

    if (isOverTrash) {
      setNotes(prev => prev.filter(n => n.id !== id));
    } else {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));
    }
  };

  const startTrashHold = () => {
    handlePointerLeaveTooltip();
    setTrashProgress(0);
    let progress = 0;
    trashTimerRef.current = setInterval(() => {
      progress += 5;
      setTrashProgress(Math.min(progress, 100));
      if (progress >= 100) {
        setNotes([]);
        if (trashTimerRef.current) clearInterval(trashTimerRef.current);
      }
    }, 50);
  };

  const stopTrashHold = () => {
    if (trashTimerRef.current) clearInterval(trashTimerRef.current);
    setTrashProgress(0);
  };

  return (
    <div ref={containerRef} className="h-[calc(100vh-4rem)] w-full relative overflow-hidden flex flex-col pt-16">
      
      {/* Central Container for Responsive Layout */}
      <div className="max-w-[1400px] w-full h-[800px] mx-auto relative mt-4">
        
        {/* Central Text - Right Aligned */}
        <div 
          className="absolute top-[20%] right-[-15%] md:right-[-10%] flex flex-col items-end text-right z-10 pointer-events-none space-y-6"
          style={{ transform: 'translateY(0.5rem)' }}
        >
          {showCuriosity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-[144px] md:-top-[164px] right-[calc(5%-3rem)] text-[3rem] md:text-[4rem] whitespace-nowrap"
              style={{ 
                fontFamily: "'Segoe Print', cursive",
                fontWeight: 'bold',
                background: 'linear-gradient(to bottom, #cb3079, #c82371, #c92d74, #d26e89, #d16985, #cf6e84)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.2))'
              }}
            >
              Curiosity-driven~
            </motion.div>
          )}
          <h1 
            className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-4 flex items-center gap-4"
            style={{ transform: 'translateX(-0.5em)' }}
          >
            Hi
            <motion.span 
              className="text-6xl inline-block origin-bottom-right"
              animate={{ rotate: [0, 20, -10, 20, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            >
              👋
            </motion.span>
            我是陈泓利
          </h1>
          <h2 className="font-serif text-2xl md:text-3xl text-gray-700">
            立志成为一名综合素质耐造的“六边形战士”！
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed font-light">
            我的名字谐音“橙红绿”，因此 单取三者中的任意一种颜色称呼我就好~<br/>
            比如：<span className="text-brand-red/70 font-medium">小红</span>、
            <span className="text-brand-green/70 font-medium">绿绿</span>...
          </p>
          {showCreative && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-[156px] md:-bottom-[176px] right-[0.5rem] text-[4rem] md:text-[5.5rem] whitespace-nowrap"
              style={{ 
                fontFamily: "'Segoe Script', cursive",
                fontWeight: 'bold',
                background: 'linear-gradient(to bottom, #44d2b7, #2ebfb2, #32a2c3, #3772b5, #3262a8)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(1px 1px 0px rgba(255,255,255,0.3))'
              }}
            >
              Creative !
            </motion.div>
          )}
        </div>

        {/* Pyramid Layout for Sources - Absolute Positioning */}
        <div className="absolute top-[40%] left-[20%] md:left-[25%] z-20 scale-75 md:scale-90">
          {PYRAMID_POSITIONS.map((pos) => {
            const source = STICKY_SOURCES.find(s => s.id === pos.id);
            if (!source) return null;
            return (
              <StackItem 
                key={source.id} 
                source={source} 
                x={pos.x}
                y={pos.y}
                onPointerDown={handleSourcePointerDown}
                onPointerEnter={() => handlePointerEnterTooltip('长按拖动整摞，短促拖动撕下单张')}
                onPointerLeave={handlePointerLeaveTooltip}
              />
            );
          })}
        </div>
      </div>

      {/* Custom Tooltip */}
      {tooltip && (
        <div 
          className="fixed z-[100] pointer-events-none bg-white border border-gray-200 text-gray-600 text-sm px-3 py-1.5 rounded shadow-md whitespace-nowrap transition-opacity duration-200"
          style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Rendered Sticky Notes */}
      {notes.map(note => (
        <motion.div
          key={note.id}
          drag
          dragMomentum={false}
          onDragEnd={(e, info) => handleDragEnd(e, info, note.id)}
          initial={{ x: note.x, y: note.y, scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: note.rotation }}
          className={`absolute top-0 left-0 cursor-grab-hand flex items-center justify-center select-none z-30 ${
            note.type === 'icon' ? `w-20 h-20 sm:w-24 sm:h-24 ${note.color}` : ''
          }`}
          style={{ x: note.x, y: note.y }}
        >
          {(note.type === 'text' || note.type === 'image') && (
            <StickyNote 
              type={note.type}
              content={note.content} 
              color={note.color} 
              textColor={note.textColor} 
              tapeColor={note.tapeColor} 
              shadowClass={note.shadowClass}
              sizeClass="w-28 h-28 sm:w-32 sm:h-32"
            />
          )}
          {note.type === 'icon' && note.content === 'x' && <HandDrawnX className="w-full h-full" />}
          {note.type === 'icon' && note.content === 'check' && <HandDrawnCheck className="w-full h-full" />}
          {note.type === 'icon' && note.content === 'question' && <HandDrawnQuestion className="w-full h-full" />}
        </motion.div>
      ))}

      {/* Peeling Note (Active Drag) */}
      {peelingNote && (
        <div
          className={`absolute top-0 left-0 pointer-events-none flex items-center justify-center select-none z-50 ${
            peelingNote.type === 'icon' ? `w-20 h-20 sm:w-24 sm:h-24 ${peelingNote.color}` : ''
          }`}
          style={{
            transform: `translate(${peelingNote.x}px, ${peelingNote.y}px) rotate(${peelingNote.rotation}deg)`,
          }}
        >
          {(peelingNote.type === 'text' || peelingNote.type === 'image') && (
            <StickyNote 
              type={peelingNote.type}
              content={peelingNote.content} 
              color={peelingNote.color} 
              textColor={peelingNote.textColor} 
              tapeColor={peelingNote.tapeColor} 
              shadowClass={peelingNote.shadowClass}
              sizeClass="w-28 h-28 sm:w-32 sm:h-32"
            />
          )}
          {peelingNote.type === 'icon' && peelingNote.content === 'x' && <HandDrawnX className="w-full h-full" />}
          {peelingNote.type === 'icon' && peelingNote.content === 'check' && <HandDrawnCheck className="w-full h-full" />}
          {peelingNote.type === 'icon' && peelingNote.content === 'question' && <HandDrawnQuestion className="w-full h-full" />}
        </div>
      )}

      {/* Cursor Progress Bar */}
      {cursorProgress && (
        <div 
          className="fixed pointer-events-none z-50 w-8 h-8 -ml-4 -mt-4"
          style={{ left: cursorProgress.x, top: cursorProgress.y }}
        >
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#e5e7eb" strokeWidth="20" />
            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#000000" strokeWidth="20"
              strokeDasharray="220" strokeDashoffset={220 - (220 * cursorProgress.progress) / 100} 
              className="transition-all duration-75 ease-linear" />
          </svg>
        </div>
      )}

      {/* Trash Can */}
      <div
        ref={trashRef}
        onPointerDown={startTrashHold}
        onPointerUp={stopTrashHold}
        onPointerLeave={() => { stopTrashHold(); handlePointerLeaveTooltip(); }}
        onPointerEnter={() => handlePointerEnterTooltip('拖入删除单张，长按清空所有')}
        className="absolute bottom-12 left-12 z-40 cursor-grab-hand w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center"
      >
        <div className="relative flex items-center justify-center w-full h-full">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="46" fill="transparent" stroke="#EF4444" strokeWidth="8"
              strokeDasharray="289" strokeDashoffset={289 - (289 * trashProgress) / 100}
              className="transition-all duration-75 ease-linear"
            />
          </svg>
          <div className={`p-6 rounded-full bg-white shadow-lg transition-colors ${trashProgress > 0 ? 'text-brand-red' : 'text-gray-400'}`}>
            <Trash2 size={56} />
          </div>
        </div>
      </div>
    </div>
  );
}
