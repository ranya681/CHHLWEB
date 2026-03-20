import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, ArrowUp, GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from 'idb-keyval';
import Editor, { Block } from '../components/Editor';
import { HandDrawnX, HandDrawnCheck, HandDrawnQuestion } from '../components/StickyNotes';

type NoteData = {
  id: string;
  type: 'text' | 'image' | 'icon';
  content: string;
  color: string;
  x: number;
  y: number;
  rotation: number;
  projectId?: string;
};

type Project = {
  id: string;
  title: string;
  blocks: Block[];
};

const DEFAULT_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'LOKI Project',
    blocks: [
      { id: 'b1', type: 'text', content: '<h1 class="text-4xl font-serif font-bold mb-6 text-brand-orange">LOKI Project</h1><p class="text-xl text-gray-600 mb-8">A minimalist design exploration focusing on clean lines and subtle interactions.</p>', x: 50, y: 50, zIndex: 1 }
    ]
  },
  {
    id: '2',
    title: 'Make Us Care',
    blocks: [
      { id: 'b3', type: 'text', content: '<h1 class="text-4xl font-serif font-bold mb-6 text-brand-green">Make Us Care</h1><p class="text-xl text-gray-600 mb-8">A campaign focused on environmental awareness and sustainable living.</p>', x: 50, y: 50, zIndex: 1 },
      { id: 'b4', type: 'image', content: 'https://images.unsplash.com/photo-1466692476877-396416fd4622?q=80&w=2671&auto=format&fit=crop', x: 50, y: 200, zIndex: 2 }
    ]
  }
];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const trashRef = React.useRef<HTMLDivElement>(null);

  // Visitor Notes State
  const [visitorNotes, setVisitorNotes] = useState<NoteData[]>([]);
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

  const [trashProgress, setTrashProgress] = useState(0);
  const trashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interactionState = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    source: null as any,
  });

  const isNotesLoaded = useRef(false);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const savedNotes = await get('visitor_notes');
        if (savedNotes) {
          setVisitorNotes(savedNotes);
        } else {
          // Fallback to localStorage for migration
          const localNotes = localStorage.getItem('visitor_notes');
          if (localNotes) {
            const parsed = JSON.parse(localNotes);
            setVisitorNotes(parsed);
            await set('visitor_notes', parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load visitor notes:', e);
      }
      isNotesLoaded.current = true;
    };
    loadNotes();
  }, []);

  useEffect(() => {
    if (isNotesLoaded.current) {
      set('visitor_notes', visitorNotes).catch(e => console.error('Failed to save visitor notes:', e));
    }
  }, [visitorNotes]);

  const handleSourcePointerDown = (source: any, e: React.PointerEvent) => {
    e.preventDefault();
    interactionState.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      source,
    };
    
    setPeelingNote({
      id: uuidv4(),
      type: source.type,
      content: source.content,
      color: source.color,
      x: e.clientX - 40,
      y: e.clientY - 40,
      rotation: Math.random() * 20 - 10,
    });

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!interactionState.current.isDown) return;
    
    setPeelingNote(prev => {
      if (!prev) return null;
      return {
        ...prev,
        x: e.clientX - 40,
        y: e.clientY - 40,
      };
    });
  };

  const handlePointerUp = (e: PointerEvent) => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    
    interactionState.current.isDown = false;
    
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
        const noteWithScroll = {
          ...prev,
          x: prev.x + window.scrollX,
          y: prev.y + window.scrollY,
          projectId: activeProjectId,
        };
        setVisitorNotes(notes => {
          if (notes.some(n => n.id === prev.id)) return notes;
          return [...notes, noteWithScroll];
        });
      }
    }
    setPeelingNote(null);
  };

  const startTrashHold = (e: React.PointerEvent) => {
    e.preventDefault();
    let progress = 0;
    const interval = 50;
    const duration = 1000;
    
    trashTimerRef.current = setInterval(() => {
      progress += (interval / duration) * 100;
      if (progress >= 100) {
        setTrashProgress(100);
        setVisitorNotes([]);
        del('visitor_notes').catch(console.error);
        localStorage.removeItem('visitor_notes');
        
        // Also clear icon blocks from the active project
        if (activeProjectId) {
          setProjects(projects => projects.map(p => {
            if (p.id === activeProjectId) {
              return { ...p, blocks: p.blocks.filter(b => b.type !== 'icon') };
            }
            return p;
          }));
        }
        
        if (trashTimerRef.current) clearInterval(trashTimerRef.current);
      } else {
        setTrashProgress(progress);
      }
    }, interval);
  };

  const stopTrashHold = () => {
    if (trashTimerRef.current) {
      clearInterval(trashTimerRef.current);
      trashTimerRef.current = null;
    }
    setTrashProgress(0);
  };

  const handleNoteDragEnd = (noteId: string, e: any, info: any) => {
    if (!trashRef.current) return;
    const trashRect = trashRef.current.getBoundingClientRect();
    const dropX = info.point.x - window.scrollX;
    const dropY = info.point.y - window.scrollY;
    const padding = 60;

    if (
      dropX >= trashRect.left - padding &&
      dropX <= trashRect.right + padding &&
      dropY >= trashRect.top - padding &&
      dropY <= trashRect.bottom + padding
    ) {
      setVisitorNotes(notes => notes.filter(n => n.id !== noteId));
      return;
    }

    setVisitorNotes(notes => notes.map(n => 
      n.id === noteId 
        ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y }
        : n
    ));
  };

  useEffect(() => {
    const loadData = async () => {
      // Yield to browser to allow fast route transition
      await new Promise(resolve => setTimeout(resolve, 0));
      try {
        let saved = await get('my_projects');
        
        // Fallback to localStorage for migration
        if (!saved) {
          const localSaved = localStorage.getItem('my_projects');
          if (localSaved) {
            saved = JSON.parse(localSaved);
            await set('my_projects', saved);
          }
        }

        if (saved) {
          let parsed = saved;
          
          // Cleanup script: Remove the UNO reverse card image if it exists in the user's localStorage
          parsed = parsed.map((p: Project) => ({
            ...p,
            blocks: p.blocks.filter(b => !b.content.includes('1618005182384-a83a8bd57fbe'))
          }));

          setProjects(parsed);
          if (parsed.length > 0) setActiveProjectId(parsed[0].id);
        } else {
          setActiveProjectId(DEFAULT_PROJECTS[0].id);
        }
      } catch (e) {
        console.error('Failed to load projects:', e);
        setActiveProjectId(DEFAULT_PROJECTS[0].id);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const timeoutId = setTimeout(() => {
      set('my_projects', projects).catch(e => {
        console.error('Failed to save projects to IndexedDB:', e);
      });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [projects, isLoading]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-bg-warm flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleAddProject = () => {
    const newProject: Project = {
      id: uuidv4(),
      title: '新项目',
      blocks: [{ id: uuidv4(), type: 'text', content: '<h1 class="text-4xl font-serif font-bold mb-6 text-gray-800">新项目标题</h1><p class="text-xl text-gray-600">在这里开始描述你的项目...</p>', x: 50, y: 50, zIndex: 1 }]
    };
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    startEditing(newProject.id, newProject.title);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(prev => {
      const newProjects = prev.filter(p => p.id !== id);
      if (activeProjectId === id && newProjects.length > 0) {
        setActiveProjectId(newProjects[0].id);
      } else if (newProjects.length === 0) {
        setActiveProjectId('');
      }
      return newProjects;
    });
  };

  const startEditing = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const saveEditing = (id: string) => {
    if (editTitle.trim()) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, title: editTitle } : p));
    }
    setEditingId(null);
  };

  const handleBlocksChange = (newBlocks: Block[]) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, blocks: newBlocks } : p));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full flex min-h-screen bg-bg-warm relative pt-16">
      {/* Left Column: Project List */}
      <div className="fixed left-0 top-16 bottom-0 w-72 flex flex-col border-r-[3px] border-gray-200 bg-bg-warm pt-8 pb-4 px-6 z-40">
        <div className="flex items-center justify-center mb-8">
            <h2 className="font-serif text-4xl font-bold text-gray-900">我的项目</h2>
            {/* <button 
              onClick={handleAddProject}
              className="p-2 rounded-full hover:bg-brand-orange/10 text-brand-orange transition-colors"
              title="添加新项目"
            >
              <Plus size={24} />
            </button> */}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 pl-4 -ml-4 custom-scrollbar pb-16">
            <div className="space-y-3">
              <AnimatePresence>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`group relative flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                      activeProjectId === project.id
                        ? 'bg-white shadow-md border border-gray-100 scale-105 z-10'
                        : 'hover:bg-gray-50 text-gray-500 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveProjectId(project.id)}
                  >
                  {/* {editingId === project.id ? (
                    <div className="flex items-center w-full gap-2" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEditing(project.id)}
                        className="flex-1 bg-transparent border-b border-brand-orange focus:outline-none text-lg font-medium px-1"
                      />
                      <button onClick={() => saveEditing(project.id)} className="text-brand-green hover:scale-110 transition-transform">
                        <Check size={20} />
                      </button>
                    </div>
                  ) : ( */}
                    <>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors p-1 -ml-2" onPointerDown={(e) => e.stopPropagation()}>
                          <GripVertical size={16} />
                        </div> */}
                        <span className={`font-medium truncate text-left w-full text-xl ${activeProjectId === project.id ? 'text-brand-orange font-bold' : ''}`}>
                          {project.title}
                        </span>
                      </div>
                      {/* <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); startEditing(project.id, project.title); }}
                          className="p-1 text-gray-400 hover:text-brand-green transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="p-1 text-gray-400 hover:text-brand-red transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div> */}
                    </>
                  {/* )} */}
                  </div>
              ))}
              </AnimatePresence>
            </div>
            {projects.length === 0 && (
            <div className="text-center text-gray-400 mt-8 text-sm">
              暂无项目，点击右上角添加
            </div>
          )}
        </div>

        {/* Fixed Footer & Controls at the bottom of the left sidebar */}
        <div className="absolute bottom-4 left-4 right-4 pt-4 border-t border-gray-100/50 flex items-end justify-between bg-bg-warm z-10">
          <div className="leading-tight text-[8px] text-gray-400">
            <p>© 2026 陈泓利</p>
            <p>chl_work0726@163.com</p>
          </div>
          <div className="flex items-center">
            <button
              onClick={scrollToTop}
              className="p-2.5 bg-white text-gray-400 rounded-full shadow-sm border border-gray-100 hover:shadow-md hover:text-brand-orange transition-all"
              title="回到顶部"
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Project Content Editor */}
      <div className="flex-1 ml-72 px-8 md:pl-16 md:pr-28 py-8 max-w-[1600px]">
        <AnimatePresence mode="wait">
          {activeProject ? (
            <motion.div
              key={activeProject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Editor 
                blocks={activeProject.blocks} 
                onChange={handleBlocksChange}
                trashRef={trashRef}
              />
            </motion.div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 font-serif text-xl">
              请选择或创建一个项目
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Render Visitor Notes */}
      {visitorNotes.filter(n => n.projectId === activeProjectId).map((note) => (
        <motion.div
          key={note.id}
          drag
          dragMomentum={false}
          onDragEnd={(e, info) => handleNoteDragEnd(note.id, e, info)}
          initial={{ x: note.x, y: note.y, rotate: note.rotation }}
          animate={{ rotate: note.rotation }}
          whileHover={{ scale: 1.05 }}
          whileDrag={{ scale: 1.1, zIndex: 99995 }}
          className={`absolute cursor-grab-hand flex items-center justify-center select-none z-[99990] w-20 h-20 sm:w-24 sm:h-24 ${note.color}`}
          style={{ x: note.x, y: note.y }}
        >
          {note.type === 'icon' && note.content === 'x' && <HandDrawnX className="w-full h-full" />}
          {note.type === 'icon' && note.content === 'check' && <HandDrawnCheck className="w-full h-full" />}
          {note.type === 'icon' && note.content === 'question' && <HandDrawnQuestion className="w-full h-full" />}
        </motion.div>
      ))}

      {/* Peeling Note (Active Drag) */}
      {peelingNote && (
        <div
          className={`fixed pointer-events-none flex items-center justify-center select-none z-[99995] w-20 h-20 sm:w-24 sm:h-24 ${peelingNote.color}`}
          style={{
            left: peelingNote.x,
            top: peelingNote.y,
            transform: `rotate(${peelingNote.rotation}deg)`,
          }}
        >
          {peelingNote.type === 'icon' && peelingNote.content === 'x' && <HandDrawnX className="w-full h-full" />}
          {peelingNote.type === 'icon' && peelingNote.content === 'check' && <HandDrawnCheck className="w-full h-full" />}
          {peelingNote.type === 'icon' && peelingNote.content === 'question' && <HandDrawnQuestion className="w-full h-full" />}
        </div>
      )}

      {/* Right Sidebar: Visitor Sticky Notes (Floating) */}
      <div className="fixed right-0 top-16 bottom-0 w-28 flex flex-col items-center pt-8 pb-4 z-40 pointer-events-none">
        <div className="flex flex-col gap-8 items-center mt-[217px] pointer-events-auto">
          <div 
            className="w-16 h-16 text-brand-orange cursor-grab-hand hover:scale-110 transition-transform"
            onPointerDown={(e) => handleSourcePointerDown({ type: 'icon', content: 'question', color: 'text-brand-orange' }, e)}
            title="拖拽添加问号"
          >
            <HandDrawnQuestion className="w-full h-full" />
          </div>
          <div 
            className="w-16 h-16 text-brand-red cursor-grab-hand hover:scale-110 transition-transform"
            onPointerDown={(e) => handleSourcePointerDown({ type: 'icon', content: 'x', color: 'text-brand-red' }, e)}
            title="拖拽添加叉号"
          >
            <HandDrawnX className="w-full h-full" />
          </div>
          <div 
            className="w-16 h-16 text-brand-green cursor-grab-hand hover:scale-110 transition-transform"
            onPointerDown={(e) => handleSourcePointerDown({ type: 'icon', content: 'check', color: 'text-brand-green' }, e)}
            title="拖拽添加对号"
          >
            <HandDrawnCheck className="w-full h-full" />
          </div>
        </div>

        <div className="flex-1"></div>

        <div
          ref={trashRef}
          onPointerDown={startTrashHold}
          onPointerUp={stopTrashHold}
          onPointerLeave={stopTrashHold}
          onPointerCancel={stopTrashHold}
          className="relative cursor-grab-hand w-16 h-16 flex items-center justify-center pointer-events-auto"
          title="拖入删除单张，长按清空所有"
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="46" fill="transparent" stroke="#EF4444" strokeWidth="8"
              strokeDasharray="289" strokeDashoffset={289 - (289 * trashProgress) / 100}
              className="transition-all duration-75 ease-linear"
            />
          </svg>
          <div className={`p-3 rounded-full bg-white shadow-sm transition-colors ${trashProgress > 0 ? 'text-brand-red' : 'text-gray-400'}`}>
            <Trash2 size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}
