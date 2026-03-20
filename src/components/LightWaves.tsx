import React, { useEffect, useRef } from 'react';

const COLORS = [
  'rgba(34, 197, 94, 0.4)', // brand-green
  'rgba(249, 115, 22, 0.4)', // brand-orange
  'rgba(59, 130, 246, 0.4)', // brand-blue
  'rgba(239, 68, 68, 0.4)', // brand-red
  'rgba(250, 204, 21, 0.4)', // yellow-400
  'rgba(192, 132, 252, 0.4)', // purple-400
  'rgba(168, 85, 247, 0.4)', // purple-500
  'rgba(236, 72, 153, 0.4)', // pink-500
  'rgba(14, 165, 233, 0.4)', // sky-500
  'rgba(16, 185, 129, 0.4)', // emerald-500
];

class Wave {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;

  constructor(width: number, height: number, color: string) {
    this.radius = Math.random() * 100 + 150; // 150 to 250
    
    // Start near edges (sparse distribution)
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { // top
      this.x = Math.random() * width;
      this.y = Math.random() * (height * 0.2);
    } else if (edge === 1) { // bottom
      this.x = Math.random() * width;
      this.y = height - Math.random() * (height * 0.2);
    } else if (edge === 2) { // left
      this.x = Math.random() * (width * 0.2);
      this.y = Math.random() * height;
    } else { // right
      this.x = width - Math.random() * (width * 0.2);
      this.y = Math.random() * height;
    }

    // Speed: faster
    const speed = Math.random() * 2 + 1.5;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
  }

  update(width: number, height: number) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx *= -1;
    } else if (this.x + this.radius > width) {
      this.x = width - this.radius;
      this.vx *= -1;
    }

    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy *= -1;
    } else if (this.y + this.radius > height) {
      this.y = height - this.radius;
      this.vy *= -1;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

export default function LightWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let waves: Wave[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Re-initialize waves on resize to ensure they are within bounds
      waves = Array.from({ length: 10 }).map((_, i) => new Wave(canvas.width, canvas.height, COLORS[i % COLORS.length]));
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update physics
      for (let i = 0; i < waves.length; i++) {
        waves[i].update(canvas.width, canvas.height);
        
        // Collision detection
        for (let j = i + 1; j < waves.length; j++) {
          const dx = waves[j].x - waves[i].x;
          const dy = waves[j].y - waves[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = waves[i].radius + waves[j].radius;

          if (distance < minDistance) {
            // Simple elastic collision
            const angle = Math.atan2(dy, dx);
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);

            // Rotate velocities
            const vx1 = waves[i].vx * cos + waves[i].vy * sin;
            const vy1 = waves[i].vy * cos - waves[i].vx * sin;
            const vx2 = waves[j].vx * cos + waves[j].vy * sin;
            const vy2 = waves[j].vy * cos - waves[j].vx * sin;

            // Swap vx
            waves[i].vx = vx2 * cos - vy1 * sin;
            waves[i].vy = vy1 * cos + vx2 * sin;
            waves[j].vx = vx1 * cos - vy2 * sin;
            waves[j].vy = vy2 * cos + vx1 * sin;

            // Separate to prevent sticking
            const overlap = minDistance - distance;
            waves[i].x -= overlap / 2 * Math.cos(angle);
            waves[i].y -= overlap / 2 * Math.sin(angle);
            waves[j].x += overlap / 2 * Math.cos(angle);
            waves[j].y += overlap / 2 * Math.sin(angle);
          }
        }
      }

      waves.forEach(wave => wave.draw(ctx));

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80 blur-[80px] mix-blend-multiply"
    />
  );
}
