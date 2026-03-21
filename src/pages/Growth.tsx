import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { get, set } from 'idb-keyval';
import Editor, { Block } from '../components/Editor';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_GROWTH_BLOCKS: Block[] = [
  { id: uuidv4(), type: 'text', content: '<h1 class="text-5xl font-serif font-bold mb-8 text-brand-green">个人成长</h1><p class="text-2xl text-gray-600 mb-12 leading-relaxed">在这里记录我的学习轨迹、思考感悟和成长瞬间。</p>', x: 50, y: 50, zIndex: 1 },
  { id: uuidv4(), type: 'image', content: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop', x: 50, y: 300, zIndex: 2 },
  { id: uuidv4(), type: 'text', content: '<h2 class="text-3xl font-serif font-bold mt-12 mb-6 text-brand-orange">2024年的目标</h2><ul class="list-disc pl-6 space-y-4 text-xl text-gray-700"><li>掌握前端全栈开发技能</li><li>完成至少3个独立设计项目</li><li>保持每周阅读一本书的习惯</li></ul>', x: 50, y: 600, zIndex: 3 },
  { id: uuidv4(), type: 'text', content: '<h2 class="text-3xl font-serif font-bold mt-16 mb-8 text-brand-blue">多面手</h2><p class="text-xl text-gray-700 leading-relaxed">我一直认为，在这个快速变化的时代，做一个“多面手”比单纯的专家更有优势。从设计到前端，从文案到产品思维，每一个维度的拓展都是在为未来的可能性加码。</p>', x: 50, y: 900, zIndex: 4 },
  { id: uuidv4(), type: 'text', content: '<h2 class="text-3xl font-serif font-bold mt-16 mb-8 text-brand-red">一次自认为“理性”的退场</h2><p class="text-xl text-gray-700 leading-relaxed">退场并不总是意味着失败，有时候它是一种更高维度的进取。当我意识到当下的路径已经无法支撑我的长期愿景时，选择理性的离开，是为了在更广阔的天地里重新出发。</p>', x: 50, y: 1200, zIndex: 5 },
  { id: uuidv4(), type: 'text', content: '<h2 class="text-3xl font-serif font-bold mt-16 mb-8 text-brand-orange">重大转折</h2><p class="text-xl text-gray-700 leading-relaxed">生命中总有一些时刻，看似微不足道，却在多年后回望时发现那是命运的齿轮开始转动的瞬间。那个转折点，让我从一个单纯的执行者，变成了一个拥有全局视野的创造者。</p>', x: 50, y: 1500, zIndex: 6 },
  { id: uuidv4(), type: 'text', content: '<h2 class="text-3xl font-serif font-bold mt-16 mb-8 text-brand-green">我与AI</h2><p class="text-xl text-gray-700 leading-relaxed">AI不是对手，而是延伸。它像是一面镜子，映照出人类创造力的本质；又像是一个支点，撬动了效率的边界。在与AI共生的过程中，我学会了如何更好地提问，如何更深刻地思考。</p>', x: 50, y: 1800, zIndex: 7 },
  { id: uuidv4(), type: 'text', content: '<h2 class="text-3xl font-serif font-bold mt-16 mb-8 text-brand-blue">有限与无限</h2><p class="text-xl text-gray-700 leading-relaxed">在有限的时间里，追求无限的可能。这听起来像是一个悖论，但正是这种张力驱动着我们不断前行。我们无法延长生命的长度，但我们可以通过不断的探索 and 创造，无限地拓宽它的宽度。</p>', x: 50, y: 2100, zIndex: 8 }
];

const LightWaves = () => {
  const wavesRef = useRef<HTMLDivElement[]>([]);
  
  useEffect(() => {
    const waves = Array.from({ length: 7 }).map((_, i) => {
      const angle = (i / 7) * Math.PI * 2;
      const radius = 40 + Math.random() * 10; // 40-50% from center (sparse towards edges)
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      
      const speed = 0.05 + Math.random() * 0.05; // Slower speed
      const dirAngle = Math.random() * Math.PI * 2;
      const vx = Math.cos(dirAngle) * speed;
      const vy = Math.sin(dirAngle) * speed;
      
      return {
        x, y, vx, vy,
        size: 15 + Math.random() * 10, // 15 to 25 rem
      };
    });

    let animationFrameId: number;
    let lastTime = performance.now();

    const update = (time: number) => {
      const deltaTime = (time - lastTime) / 16;
      lastTime = time;

      for (let i = 0; i < waves.length; i++) {
        let w = waves[i];
        w.x += w.vx * deltaTime;
        w.y += w.vy * deltaTime;

        // Shrink boundary to 3-97 and prevent getting stuck
        if (w.x <= 3) { w.x = 3; w.vx = Math.abs(w.vx); }
        if (w.x >= 97) { w.x = 97; w.vx = -Math.abs(w.vx); }
        if (w.y <= 3) { w.y = 3; w.vy = Math.abs(w.vy); }
        if (w.y >= 97) { w.y = 97; w.vy = -Math.abs(w.vy); }
      }

      for (let i = 0; i < waves.length; i++) {
        for (let j = i + 1; j < waves.length; j++) {
          const w1 = waves[i];
          const w2 = waves[j];
          
          const dx = w1.x - w2.x;
          const dy = w1.y - w2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const minDistance = (w1.size + w2.size) * 0.4;
          
          if (dist < minDistance) {
            const tempVx = w1.vx;
            const tempVy = w1.vy;
            w1.vx = w2.vx;
            w1.vy = w2.vy;
            w2.vx = tempVx;
            w2.vy = tempVy;
            
            const overlap = minDistance - dist;
            const angle = Math.atan2(dy, dx);
            w1.x += Math.cos(angle) * overlap / 2;
            w1.y += Math.sin(angle) * overlap / 2;
            w2.x -= Math.cos(angle) * overlap / 2;
            w2.y -= Math.sin(angle) * overlap / 2;
          }
        }
      }

      waves.forEach((w, i) => {
        const el = wavesRef.current[i];
        if (el) {
          el.style.left = `${w.x}%`;
          el.style.top = `${w.y}%`;
        }
      });

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const colors = [
    'bg-brand-green/40', 'bg-brand-orange/40', 'bg-brand-blue/40', 
    'bg-brand-red/40', 'bg-yellow-400/40', 'bg-purple-400/40', 'bg-pink-400/40'
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {colors.map((color, i) => (
        <div
          key={i}
          ref={el => { if (el) wavesRef.current[i] = el; }}
          className={`absolute rounded-full mix-blend-multiply filter blur-3xl opacity-60 ${color}`}
          style={{
            width: '20rem',
            height: '20rem',
            transform: 'translate(-50%, -50%)',
            willChange: 'left, top'
          }}
        />
      ))}
    </div>
  );
};

const BOOKMARKS = [
  { title: '多面手', color: 'from-[#3b82f6]', target: '多面手', length: 2.5 },
  { title: '理性退场', color: 'from-[#a855f7]', target: '一次自认为“理性”的退场', length: 3.5 },
  { title: '重大转折', color: 'from-[#eab308]', target: '重大转折', length: 3.5 },
  { title: '与AI', color: 'from-[#84cc16]', target: '我与AI', length: 2 },
  { title: '有限无限', color: 'from-[#db2777]', target: '有限与无限', length: 3.5 },
];

export default function Growth() {
  const [blocks, setBlocks] = useState<Block[]>(DEFAULT_GROWTH_BLOCKS);
  const [isLoading, setIsLoading] = useState(true);

  const scrollToSection = (title: string, target: string) => {
    // Find the block that contains the target text
    const block = blocks.find(b => b.content.includes(target));
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      let targetEl: Element | null = null;
      
      if (block) {
        targetEl = document.querySelector(`[data-block-id="${block.id}"]`);
      }
      
      if (!targetEl) {
        const allTextElements = Array.from(document.querySelectorAll('.editor-content'));
        targetEl = allTextElements.find(el => el.textContent?.includes(target)) || null;
      }

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        let offset = 100; // Default
        
        if (title === '重大转折') offset = 100 + 50; // Up one scroll (50px)
        if (title === '与AI') offset = 100 - 25; // Down half scroll (25px)
        
        const y = rect.top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      try {
        let saved = await get('my_growth');
        
        if (!saved) {
          const localSaved = localStorage.getItem('my_growth');
          if (localSaved) {
            saved = JSON.parse(localSaved);
            await set('my_growth', saved);
          }
        }

        if (saved) {
          setBlocks(saved);
        }
      } catch (e) {
        console.error('Failed to load growth data:', e);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const timeoutId = setTimeout(() => {
      set('my_growth', blocks).catch(e => {
        console.error('Failed to save growth data to IndexedDB:', e);
      });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [blocks, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-6rem)] overflow-hidden bg-bg-warm">
      {/* Background Decorations */}
      <LightWaves />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.5 }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-[1600px] w-full mx-auto px-8 md:px-16 lg:px-28 py-12 min-h-[calc(100vh-6rem)] flex flex-col relative z-10 translate-x-6"
      >
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-16 pb-64 flex-1 relative">
          
          {/* Bookmarks */}
          <div className="absolute -top-4 left-4 md:left-12 flex gap-3 z-20">
            {BOOKMARKS.map((bm, i) => (
              <button
                key={i}
                onClick={() => scrollToSection(bm.title, bm.target)}
                className={`w-10 rounded-b-full shadow-[0_4px_6px_rgba(0,0,0,0.3)] text-white font-serif font-bold text-[18px] flex flex-col items-center justify-start pt-3 hover:-translate-y-2 transition-transform duration-300 bg-gradient-to-b ${bm.color} to-white`}
                style={{ 
                  transformOrigin: 'top center', 
                  height: `${bm.title === '与AI' ? 100 : bm.length * 20 + 90}px`,
                  background: `linear-gradient(to bottom, var(--tw-gradient-from), #fff)`
                }}
              >
                {bm.title === '与AI' ? (
                  <div className="flex flex-col items-center -space-y-1">
                    <span>与</span>
                    <span className="font-sans font-bold text-base tracking-tighter" style={{ writingMode: 'horizontal-tb' }}>AI</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center -space-y-1">
                    {bm.title.split('').map((char, idx) => (
                      <span key={idx}>{char}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
 
          <Editor blocks={blocks} onChange={setBlocks} offsetX="5.0em" contentScale={1.05} isAdmin={true} allowDrag={true} />
        </div>

        {/* Back to Top Button - Fixed and aligned with white area */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-[1600px] pointer-events-none z-50">
          <div className="relative w-full h-full px-8 md:px-16 lg:px-28">
            <button
              onClick={scrollToTop}
              className="absolute right-2 md:right-6 lg:right-14 bottom-0 pointer-events-auto w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand-orange hover:border-brand-orange/30 transition-colors"
              title="回到顶部"
              style={{ transform: 'translateY(-1em)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            </button>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
