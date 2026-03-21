import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, Type, Trash2, GripHorizontal, Heading, Palette, Type as TypeIcon, Bold, AlignLeft, AlignCenter, AlignRight, AlignJustify, Indent } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, useDragControls, AnimatePresence } from 'framer-motion';
import { HandDrawnX, HandDrawnCheck, HandDrawnQuestion } from './StickyNotes';

export type Block = {
  id: string;
  type: 'text' | 'image' | 'icon';
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex: number;
  color?: string;
  rotation?: number;
  isDistorted?: boolean;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textIndent?: '0' | '2em';
  fontSize?: 'text-xs' | 'text-sm' | 'text-base' | 'text-lg' | 'text-xl' | 'text-2xl' | 'text-3xl' | 'text-4xl' | 'text-5xl' | 'text-6xl' | 'text-7xl';
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
};

interface EditorProps {
  blocks?: Block[];
  onChange?: (blocks: Block[]) => void;
  trashRef?: React.RefObject<HTMLDivElement>;
  offsetX?: string;
  contentScale?: number;
  isAdmin?: boolean;
  allowDrag?: boolean;
  reduceBottomLength?: string;
}

interface BlockItemProps {
  block: Block;
  isSelected: boolean;
  isMultiSelected: boolean;
  dragOffset: { x: number, y: number };
  onDragMulti: (x: number, y: number) => void;
  onDragMultiEnd: (x: number, y: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  bringToFront: (id: string, multiSelect?: boolean) => void;
  handleImageUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  trashRef?: React.RefObject<HTMLDivElement>;
  isAdmin?: boolean;
  allowDrag?: boolean;
}

const BlockItem: React.FC<BlockItemProps> = ({ 
  block, 
  isSelected,
  isMultiSelected,
  dragOffset,
  onDragMulti,
  onDragMultiEnd,
  containerRef, 
  updateBlock, 
  removeBlock, 
  bringToFront, 
  handleImageUpload,
  trashRef,
  isAdmin,
  allowDrag
}) => {
  const controls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false);
  const [showAlignPicker, setShowAlignPicker] = useState(false);
  const colors = [
    '#1f2937', '#4b5563', '#9ca3af', // Grays
    '#ef4444', '#f97316', '#f59e0b', // Warm
    '#84cc16', '#22c55e', '#10b981', // Greens
    '#06b6d4', '#3b82f6', '#6366f1', // Blues
    '#a855f7', '#ec4899', '#f43f5e'  // Purples/Pinks
  ];

  const FONT_FAMILIES = [
    { label: '系统默认', value: 'system-ui, -apple-system, sans-serif' },
    { label: '霞鹜文楷', value: '"LXGW WenKai Lite", sans-serif' },
    { label: '手写体', value: '"Klee One", "Caveat", cursive' },
    { label: '黑体', value: '"PingFang SC", "Microsoft YaHei", "SimHei", sans-serif' },
    { label: '宋体', value: '"Songti SC", "SimSun", serif' },
    { label: '楷体', value: '"Kaiti SC", "KaiTi", serif' },
    { label: '思源宋体', value: '"Noto Serif SC", serif' },
    { label: '圆体', value: '"Yuanti SC", "YouYuan", sans-serif' },
    { label: '魏碑', value: '"Weibei SC", "STXinwei", serif' },
  ];

  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current && textRef.current.innerHTML !== block.content) {
      textRef.current.innerHTML = block.content;
    }
  }, [block.content]);

  const startResize = (e: React.PointerEvent, currentWidth: number | undefined, currentHeight: number | undefined) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront(block.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = currentWidth || (block.type === 'text' ? 300 : 400);
    const startHeight = currentHeight || (block.type === 'image' ? 300 : 100);

    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newWidth = Math.max(100, startWidth + deltaX);
      const newHeight = Math.max(50, startHeight + deltaY);
      
      if (block.type === 'image') {
        updateBlock(block.id, { width: newWidth, height: newHeight });
      } else {
        updateBlock(block.id, { width: newWidth });
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <motion.div
      drag={isAdmin && allowDrag}
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      data-block-id={block.id}
      onPointerDown={(e) => {
        bringToFront(block.id, isSelected ? true : e.shiftKey);
        e.stopPropagation();
      }}
      onDragStart={() => setIsDragging(true)}
      onDrag={(e, info) => {
        if (isMultiSelected) {
          onDragMulti(info.offset.x, info.offset.y);
        }
      }}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        if (isMultiSelected) {
          onDragMultiEnd(info.offset.x, info.offset.y);
        } else {
          updateBlock(block.id, { 
            x: block.x + info.offset.x, 
            y: block.y + info.offset.y 
          });
        }
      }}
      onContextMenu={(e) => e.stopPropagation()}
      initial={{ x: block.x, y: block.y, rotate: block.rotation || 0 }}
      animate={{ 
        x: block.x + (isSelected && !isDragging ? dragOffset.x : 0), 
        y: block.y + (isSelected && !isDragging ? dragOffset.y : 0), 
        rotate: block.rotation || 0 
      }}
      transition={{ type: 'tween', duration: 0 }}
      style={{ 
        zIndex: isSelected ? 99998 : block.zIndex, 
        width: block.width,
        height: block.type === 'image' && block.isDistorted ? block.height : undefined
      }}
      className="absolute top-0 left-0 group"
    >
      {/* Hover Outline */}
      {isAdmin && (
        <div className={`absolute inset-0 border-2 rounded-xl pointer-events-none transition-colors z-0 ${isSelected ? 'border-brand-blue/40' : 'border-transparent group-hover:border-brand-blue/20'}`}></div>
      )}

      {/* Drag Handle */}
      {isAdmin && isSelected && allowDrag && (
        <div 
          className="absolute -top-12 right-0 flex items-center justify-center w-10 h-10 bg-white shadow-xl border border-gray-100 rounded-xl cursor-move z-[100] hover:bg-gray-50 transition-colors"
          onPointerDown={(e) => controls.start(e)}
          title="移动"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="19 9 22 12 19 15"/><polyline points="9 19 12 22 15 19"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
        </div>
      )}

      {/* isSelected controls */}
      {isAdmin && isSelected && (
        <>
          <div className="absolute -top-12 left-0 flex items-center gap-1 bg-white shadow-xl border border-gray-100 rounded-xl p-1.5 z-[100] animate-in fade-in zoom-in duration-200">
            {block.type === 'text' && (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setShowFontPicker(!showFontPicker)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors flex items-center gap-1"
                    title="字号"
                  >
                    <TypeIcon size={18} />
                    <span className="text-[10px] font-bold w-4">
                      {block.fontSize?.replace('text-', '') || 'lg'}
                    </span>
                  </button>
                  <AnimatePresence>
                    {showFontPicker && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 bg-white shadow-2xl border border-gray-100 rounded-xl p-2 z-[101] grid grid-cols-3 gap-1 w-48"
                      >
                        {['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              updateBlock(block.id, { fontSize: size as any });
                              setShowFontPicker(false);
                            }}
                            className={`px-2 py-1.5 text-[10px] rounded-lg transition-colors ${block.fontSize === size ? 'bg-brand-blue text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                          >
                            {size.replace('text-', '')}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setShowFontFamilyPicker(!showFontFamilyPicker)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors flex items-center gap-1"
                    title="字体"
                  >
                    <span className="text-[10px] font-bold truncate max-w-[40px]">
                      {FONT_FAMILIES.find(f => f.value === block.fontFamily)?.label || '默认'}
                    </span>
                  </button>
                  <AnimatePresence>
                    {showFontFamilyPicker && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 bg-white shadow-2xl border border-gray-100 rounded-xl p-2 z-[101] flex flex-col gap-1 w-48"
                      >
                        {FONT_FAMILIES.map((font) => (
                          <button
                            key={font.value}
                            onClick={() => {
                              updateBlock(block.id, { fontFamily: font.value });
                              setShowFontFamilyPicker(false);
                            }}
                            className={`px-3 py-2 text-xs text-left rounded-lg transition-colors ${block.fontFamily === font.value ? 'bg-brand-blue text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                            style={{ fontFamily: font.value }}
                          >
                            {font.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={() => updateBlock(block.id, { fontWeight: block.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`p-2 rounded-lg transition-colors ${block.fontWeight === 'bold' ? 'bg-brand-blue/10 text-brand-blue' : 'hover:bg-gray-100 text-gray-600'}`}
                  title="加粗"
                >
                  <Bold size={18} />
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setShowAlignPicker(!showAlignPicker)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    title="对齐"
                  >
                    {block.textAlign === 'center' ? <AlignCenter size={18} /> : 
                     block.textAlign === 'right' ? <AlignRight size={18} /> :
                     block.textAlign === 'justify' ? <AlignJustify size={18} /> :
                     <AlignLeft size={18} />}
                  </button>
                  <AnimatePresence>
                    {showAlignPicker && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 bg-white shadow-2xl border border-gray-100 rounded-xl p-1.5 z-[101] flex gap-1"
                      >
                        {[
                          { val: 'left', icon: <AlignLeft size={16} /> },
                          { val: 'center', icon: <AlignCenter size={16} /> },
                          { val: 'right', icon: <AlignRight size={16} /> },
                          { val: 'justify', icon: <AlignJustify size={16} /> }
                        ].map((item) => (
                          <button
                            key={item.val}
                            onClick={() => {
                              updateBlock(block.id, { textAlign: item.val as any });
                              setShowAlignPicker(false);
                            }}
                            className={`p-2 rounded-lg transition-colors ${block.textAlign === item.val ? 'bg-brand-blue text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                          >
                            {item.icon}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={() => updateBlock(block.id, { textIndent: block.textIndent === '2em' ? '0' : '2em' })}
                  className={`p-2 rounded-lg transition-colors ${block.textIndent === '2em' ? 'bg-brand-blue/10 text-brand-blue' : 'hover:bg-gray-100 text-gray-600'}`}
                  title="首行缩进"
                >
                  <Indent size={18} />
                </button>
              </>
            )}

            <div className="w-px h-4 bg-gray-200 mx-1"></div>

            <div className="relative">
              <button 
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="颜色"
              >
                <Palette size={18} style={{ color: block.color || '#374151' }} />
              </button>
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 bg-white shadow-2xl border border-gray-100 rounded-xl p-3 z-[101] grid grid-cols-5 gap-2 w-48"
                  >
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          updateBlock(block.id, { color: c });
                          setShowColorPicker(false);
                        }}
                        className="w-6 h-6 rounded-full border border-gray-200 transition-transform hover:scale-125"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => updateBlock(block.id, { rotation: (block.rotation || 0) + 15 })}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="旋转"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            </button>

            <button 
              onClick={() => removeBlock(block.id)}
              className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
              title="删除"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </>
      )}

      {block.type === 'text' ? (
        <div className="relative bg-transparent group/text">
          <div
            ref={textRef}
            contentEditable={isAdmin}
            suppressContentEditableWarning
            onBlur={(e) => {
              if (isAdmin && e.currentTarget.innerHTML !== block.content) {
                updateBlock(block.id, { content: e.currentTarget.innerHTML });
              }
            }}
            className={`editor-content w-full min-h-[2rem] outline-none leading-relaxed font-sans p-4 rounded-xl transition-all border border-transparent ${block.fontSize || 'text-lg'} ${block.fontWeight === 'bold' ? 'font-bold' : ''}`}
            style={{ color: block.color || '#374151', fontFamily: block.fontFamily || 'system-ui, -apple-system, sans-serif', textAlign: block.textAlign || 'left', textIndent: block.textIndent || '0' }}
            onPointerDown={(e) => {
              if (isAdmin && !isSelected) bringToFront(block.id, e.shiftKey);
              e.stopPropagation();
            }} // Allow text selection and select block
          />
          {/* Resize Handle */}
          {isAdmin && isSelected && (
            <div 
              className="absolute bottom-0 right-0 w-4 h-4 z-10 flex items-end justify-end p-1 cursor-nwse-resize"
              onPointerDown={(e) => startResize(e, block.width, block.height)}
            >
              <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
      ) : block.type === 'image' ? (
        <div className={`relative rounded-xl overflow-hidden border-2 border-transparent transition-colors group/img w-full h-full ${block.content ? 'bg-transparent' : 'bg-gray-50'}`}>
          {block.content ? (
            <img 
              src={block.content} 
              alt="Uploaded" 
              className={`w-full pointer-events-none ${block.isDistorted ? 'h-full object-fill' : 'h-auto object-contain'}`} 
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 w-full h-full min-h-[200px]">
              <ImageIcon size={48} className="mb-4 opacity-30" />
              <span className="font-medium text-sm">暂无图片</span>
            </div>
          )}
          
          {/* Image Controls */}
          {isAdmin && block.content && isSelected && (
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <label className="p-2 bg-white/90 backdrop-blur-md shadow-lg rounded-lg cursor-pointer hover:bg-white transition-colors text-brand-green">
                <ImageIcon size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(block.id, e)} />
              </label>
              <button 
                onClick={() => updateBlock(block.id, { isDistorted: !block.isDistorted })}
                className={`p-2 bg-white/90 backdrop-blur-md shadow-lg rounded-lg transition-colors ${block.isDistorted ? 'text-brand-orange' : 'text-gray-400'}`}
                title="自由拉伸"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
              </button>
            </div>
          )}
          
          {/* Resize Handle */}
          {isAdmin && isSelected && (
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 z-10 flex items-end justify-end p-2 cursor-nwse-resize"
              onPointerDown={(e) => startResize(e, block.width, block.height)}
            >
              <div className="w-3 h-3 border-r-2 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center group/icon">
          {block.content === 'x' && <HandDrawnX className="w-full h-full text-brand-red" />}
          {block.content === 'check' && <HandDrawnCheck className="w-full h-full text-brand-green" />}
          {block.content === 'question' && <HandDrawnQuestion className="w-full h-full text-brand-orange" />}
          
          {/* Resize Handle */}
          {isAdmin && isSelected && (
            <div 
              className="absolute bottom-0 right-0 w-6 h-6 z-10 flex items-center justify-center cursor-nwse-resize"
              onPointerDown={(e) => startResize(e, block.width, block.height)}
              title="拖动缩放"
            >
              <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default function Editor({ blocks = [], onChange, trashRef, offsetX, contentScale, isAdmin, allowDrag, reduceBottomLength }: EditorProps) {
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const DESIGN_WIDTH = 1280;

  const [showExport, setShowExport] = useState(false);
  const exportData = () => {
    const data = JSON.stringify(blocks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'editor_data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width < DESIGN_WIDTH) {
          setScale(width / DESIGN_WIDTH);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    if (blocks.length > 0) {
      const maxZ = Math.max(...blocks.map(b => b.zIndex || 1));
      if (maxZ > maxZIndex) {
        setMaxZIndex(maxZ);
      }
    }
  }, [blocks]);

  const bringToFront = (id: string, multiSelect: boolean = false) => {
    const block = blocks.find(b => b.id === id);
    let zIndexChanged = false;
    let newZIndex = maxZIndex;
    
    if (block && block.zIndex !== maxZIndex) {
      newZIndex = maxZIndex + 1;
      setMaxZIndex(newZIndex);
      zIndexChanged = true;
    }

    if (zIndexChanged) {
      onChange?.(blocks.map(b => b.id === id ? { ...b, zIndex: newZIndex } : b));
    }

    if (multiSelect) {
      setSelectedBlockIds(prev => prev.includes(id) ? prev : [...prev, id]);
    } else {
      setSelectedBlockIds([id]);
    }
  };

  const handleDragMulti = (x: number, y: number) => {
    setDragOffset({ x, y });
  };

  const handleDragMultiEnd = (x: number, y: number) => {
    setDragOffset({ x: 0, y: 0 });
    onChange?.(blocks.map(b => {
      if (selectedBlockIds.includes(b.id)) {
        return { ...b, x: b.x + x, y: b.y + y };
      }
      return b;
    }));
  };

  const handleContainerPointerDown = (e: React.PointerEvent) => {
    if (!isAdmin) return;
    
    if (e.button === 2) { // Right click
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const actualScale = scale * (contentScale || 1);
      const startX = (e.clientX - rect.left) / actualScale;
      const startY = (e.clientY - rect.top) / actualScale;
      
      setSelectionBox({ startX, startY, currentX: startX, currentY: startY });
      
      const onMove = (moveEvent: PointerEvent) => {
        const currentX = (moveEvent.clientX - rect.left) / actualScale;
        const currentY = (moveEvent.clientY - rect.top) / actualScale;
        setSelectionBox(prev => prev ? { ...prev, currentX, currentY } : null);
        
        const minX = Math.min(startX, currentX);
        const maxX = Math.max(startX, currentX);
        const minY = Math.min(startY, currentY);
        const maxY = Math.max(startY, currentY);
        
        const selectedIds = blocks.filter(b => {
          const blockWidth = b.width || 300;
          const blockHeight = b.height || 100;
          return (
            b.x < maxX &&
            b.x + blockWidth > minX &&
            b.y < maxY &&
            b.y + blockHeight > minY
          );
        }).map(b => b.id);
        
        setSelectedBlockIds(selectedIds);
      };
      
      const onUp = () => {
        setSelectionBox(null);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    } else {
      setSelectedBlockIds([]);
    }
  };

  const addBlock = (type: 'text' | 'image' | 'title' | 'icon-question' | 'icon-x' | 'icon-check', dropX?: number, dropY?: number) => {
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    
    let content = '';
    let width = 400;
    let blockType = 'text';
    let fontSize = 'text-lg';
    
    if (type === 'title') {
      content = `
        <div class="flex items-baseline gap-[0.5em] pb-[0.5em] mb-[0.5em]" style="border-bottom: 0.2em solid rgba(59, 130, 246, 0.3)">
          <span class="font-bold text-brand-blue/40 leading-none" style="font-size: 2em">01</span>
          <h2 class="font-bold flex-1 outline-none leading-none select-none" style="font-size: 1em">输入标题...</h2>
        </div>
      `;
      width = 600;
      fontSize = 'text-3xl';
    } else if (type === 'text') {
      width = 300;
    } else if (type === 'image') {
      blockType = 'image';
    } else if (type.startsWith('icon-')) {
      blockType = 'icon';
      content = type.replace('icon-', '');
      width = 120;
    }

    // Calculate position near the toolbar (right side, top 1/3)
    const containerRect = containerRef.current?.getBoundingClientRect();
    const scrollY = window.scrollY;
    
    // Default position if container not found
    let x = dropX !== undefined ? dropX : 50;
    let y = dropY !== undefined ? dropY : 50 + (blocks.length * 20);

    if (containerRect && dropX === undefined && dropY === undefined) {
      // Toolbar is roughly at right: 32px, top: 33vh
      // We want the block to appear to the left of the toolbar
      const toolbarX = window.innerWidth - 32;
      const toolbarY = window.innerHeight / 3;
      
      // Convert screen coordinates to container-relative coordinates
      const targetX = toolbarX - containerRect.left - width - 40;
      const offset = (blocks.length % 5) * 20;
      x = Math.max(0, Math.min(targetX - offset, containerRect.width - width - 20));
      y = Math.max(0, toolbarY - containerRect.top + offset);
    }

    const newBlock: Block = { 
      id: uuidv4(), 
      type: blockType as 'text' | 'image' | 'icon', 
      content, 
      x, 
      y, 
      width,
      zIndex: newZIndex,
      fontSize: fontSize as any
    };
    onChange?.([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    onChange?.(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    onChange?.(blocks.filter(b => b.id !== id));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (file.type === 'image/gif') {
          updateBlock(id, { content: reader.result as string });
          return;
        }
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, 0.7);
          updateBlock(id, { content: dataUrl });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* Floating Toolbar */}
      {isAdmin && createPortal(
        <motion.div 
          drag="y"
          dragConstraints={{ top: -2000, bottom: 2000 }}
          dragElastic={0.1}
          dragMomentum={false}
          className="fixed top-1/3 right-8 z-50 flex flex-col gap-2 bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 rounded-2xl p-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center justify-center pb-2 border-b border-gray-100 text-gray-400 hover:text-gray-600">
            <GripHorizontal size={20} />
          </div>
          <button onClick={() => addBlock('title')} className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-brand-blue/10 hover:text-brand-blue transition-colors text-sm font-medium text-gray-700">
            <Heading size={18} /> 添加标题
          </button>
          <button onClick={() => addBlock('text')} className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-brand-orange/10 hover:text-brand-orange transition-colors text-sm font-medium text-gray-700">
            <Type size={18} /> 添加文字
          </button>
          <button onClick={() => addBlock('image')} className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-brand-green/10 hover:text-brand-green transition-colors text-sm font-medium text-gray-700">
            <ImageIcon size={18} /> 添加图片
          </button>
        </motion.div>,
        document.body
      )}

      {/* Canvas */}
      <div 
        id="project-editor-container"
        ref={containerRef}
        className="relative w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        style={{ 
          minHeight: reduceBottomLength ? `calc(${Math.max(1200, blocks.length > 0 ? Math.max(...blocks.map(b => b.y + 500)) : 1200) * scale}px - ${reduceBottomLength})` : Math.max(1200, blocks.length > 0 ? Math.max(...blocks.map(b => b.y + 500)) : 1200) * scale,
          height: blocks.length > 0 ? (reduceBottomLength ? `calc(${Math.max(...blocks.map(b => b.y + 500)) * scale}px - ${reduceBottomLength})` : (Math.max(...blocks.map(b => b.y + 500)) * scale)) : undefined
        }}
        onPointerDown={handleContainerPointerDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div 
          style={{ 
            transform: `scale(${scale * (contentScale || 1)})`, 
            transformOrigin: 'top left',
            width: DESIGN_WIDTH,
            height: '100%',
            position: 'absolute',
            top: 0,
            left: offsetX || 0
          }}
        >
          {blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
              暂无内容
            </div>
          )}
          
          {selectionBox && (
            <div 
              className="absolute border-2 border-brand-blue/50 bg-brand-blue/10 z-[100000] pointer-events-none"
              style={{
                left: Math.min(selectionBox.startX, selectionBox.currentX),
                top: Math.min(selectionBox.startY, selectionBox.currentY),
                width: Math.abs(selectionBox.currentX - selectionBox.startX),
                height: Math.abs(selectionBox.currentY - selectionBox.startY),
              }}
            />
          )}
          
          {blocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              isSelected={selectedBlockIds.includes(block.id)}
              isMultiSelected={selectedBlockIds.length > 1 && selectedBlockIds.includes(block.id)}
              dragOffset={dragOffset}
              onDragMulti={handleDragMulti}
              onDragMultiEnd={handleDragMultiEnd}
              containerRef={containerRef}
              updateBlock={updateBlock}
              removeBlock={removeBlock}
              bringToFront={bringToFront}
              handleImageUpload={handleImageUpload}
              isAdmin={isAdmin}
              allowDrag={allowDrag}
            />
          ))}
        </div>
      </div>

      {/* Export Button (Hidden in corner) */}
      {isAdmin && (
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
          <AnimatePresence>
            {showExport && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="bg-white p-4 rounded-xl shadow-2xl border border-gray-200 w-80 mb-2"
              >
                <h3 className="text-sm font-bold mb-2">数据导出说明</h3>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  您在浏览器中编辑的内容存储在本地缓存中。下载源码后，请将导出的 JSON 数据替换代码中的 <code>DEFAULT_PROJECTS</code> 或 <code>DEFAULT_GROWTH_BLOCKS</code> 常量，以永久保存您的修改。
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={exportData}
                    className="flex-1 py-2 bg-brand-orange text-white text-xs font-bold rounded-lg hover:bg-brand-orange/90 transition-colors"
                  >
                    下载当前页面 JSON
                  </button>
                  <button 
                    onClick={() => setShowExport(false)}
                    className="px-3 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setShowExport(!showExport)}
            className="w-10 h-10 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:text-brand-orange transition-colors"
            title="数据管理"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
