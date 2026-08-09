import React, { useEffect, useRef } from 'react';
import { Factory, Building2, Truck, Warehouse, ShieldCheck } from 'lucide-react';

interface NodeItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  xRatio: number; // 0 to 1
  yRatio: number; // 0 to 1
  color: string;
  glowColor: string;
  size: number;
  floatOffset: number;
}

export const ConnectedBubblesWidget: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Define node anchor points relative to canvas width/height
    const nodes = [
      { id: 'factory', title: 'خط تولید کارخانه', xR: 0.15, yR: 0.3, size: 22, color: '#059669', glow: 'rgba(16, 185, 129, 0.25)' },
      { id: 'wholesale', title: 'بنکداری دست اول', xR: 0.5, yR: 0.2, size: 26, color: '#0d9488', glow: 'rgba(20, 184, 166, 0.3)' },
      { id: 'transport', title: 'حمل مسقف بیمه‌شده', xR: 0.85, yR: 0.35, size: 20, color: '#d97706', glow: 'rgba(245, 158, 11, 0.25)' },
      { id: 'warehouse', title: 'انبار شما', xR: 0.32, yR: 0.78, size: 24, color: '#16a34a', glow: 'rgba(34, 197, 94, 0.25)' },
      { id: 'quality', title: 'تضمین اصالت', xR: 0.72, yR: 0.75, size: 21, color: '#0284c7', glow: 'rgba(14, 165, 233, 0.25)' },
    ];

    // Connections between nodes (fromIndex -> toIndex)
    const connections = [
      { from: 0, to: 1 }, // Factory -> Wholesale
      { from: 1, to: 2 }, // Wholesale -> Transport
      { from: 1, to: 3 }, // Wholesale -> Warehouse
      { from: 2, to: 3 }, // Transport -> Warehouse
      { from: 0, to: 4 }, // Factory -> Quality
      { from: 4, to: 3 }, // Quality -> Warehouse
    ];

    const render = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const width = canvas.width = parent.clientWidth * 2;
      const height = canvas.height = parent.clientHeight * 2;

      ctx.clearRect(0, 0, width, height);
      time += 0.025;

      // Compute animated positions with subtle floating bubble effect
      const currentPos = nodes.map((n, i) => {
        const floatY = Math.sin(time + i * 1.5) * 8;
        const floatX = Math.cos(time * 0.8 + i * 1.2) * 5;
        return {
          x: n.xR * width + floatX,
          y: n.yR * height + floatY,
          size: n.size * (width < 600 ? 1.2 : 1.6),
          color: n.color,
          glow: n.glow,
          title: n.title,
        };
      });

      // 1. Draw Connecting Lines with Animated Pulse Signals
      connections.forEach(({ from, to }, connIdx) => {
        const p1 = currentPos[from];
        const p2 = currentPos[to];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);

        // Control point for smooth curved connection arc
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const dir = connIdx % 2 === 0 ? 1 : -1;
        const cpX = midX + dir * 18;
        const cpY = midY - dir * 25;

        ctx.quadraticCurveTo(cpX, cpY, p2.x, p2.y);

        // Dashed connection line
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated traveling light energy pulse along curve
        const t = (time * 0.4 + connIdx * 0.25) % 1;
        const px = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * cpX + t * t * p2.x;
        const py = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * cpY + t * t * p2.y;

        // Pulse glow
        const pulseGrad = ctx.createRadialGradient(px, py, 0, px, py, 12);
        pulseGrad.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
        pulseGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = pulseGrad;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fill();

        // Inner pulse core
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Floating Bubble Nodes
      currentPos.forEach((p, i) => {
        // Outer pulsing ring
        const ringPulse = (Math.sin(time * 2 + i) + 1) * 6;
        ctx.strokeStyle = p.glow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + ringPulse, 0, Math.PI * 2);
        ctx.stroke();

        // Bubble body gradient (Glassmorphic bubble effect)
        const bubbleGrad = ctx.createRadialGradient(
          p.x - p.size * 0.3,
          p.y - p.size * 0.3,
          p.size * 0.1,
          p.x,
          p.y,
          p.size
        );
        bubbleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        bubbleGrad.addColorStop(0.5, p.glow);
        bubbleGrad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');

        ctx.fillStyle = bubbleGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Bubble Border
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();

        // Inner shine highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      cancelAnimationFrame(animId);
      render();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-100/90 shadow-inner overflow-hidden my-3" dir="rtl">
      {/* Background Soft Gradients */}
      <div className="absolute top-0 right-1/4 w-36 h-36 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Banner Badge */}
      <div className="absolute top-2.5 right-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-200/80 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black text-emerald-900">شبکه هوشمند اتصال مستقیم به تولیدکنندگان</span>
      </div>

      {/* HTML5 Canvas Background for Lines & Bubbles */}
      <div className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Overlay HTML Labels with Glass Badges for Crisp Persian Typography */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-2 p-3 gap-2">
        {/* Node 1: Factory */}
        <div className="flex flex-col items-center justify-center col-start-1 row-start-1">
          <div className="bg-white/95 backdrop-blur-md border border-emerald-200 px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1 text-[9.5px] sm:text-[10.5px] font-black text-emerald-900 mt-7">
            <Factory size={11} className="text-emerald-600 shrink-0" />
            <span>خط تولید کارخانه</span>
          </div>
        </div>

        {/* Node 2: Wholesale */}
        <div className="flex flex-col items-center justify-center col-start-2 row-start-1">
          <div className="bg-teal-900/90 text-white backdrop-blur-md border border-teal-400/60 px-2.5 py-0.5 rounded-lg shadow-md flex items-center gap-1 text-[10px] sm:text-[11px] font-black mt-5">
            <Building2 size={12} className="text-teal-300 shrink-0" />
            <span>بنکداری دست اول</span>
          </div>
        </div>

        {/* Node 3: Transport */}
        <div className="flex flex-col items-center justify-center col-start-3 row-start-1">
          <div className="bg-white/95 backdrop-blur-md border border-amber-200 px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1 text-[9.5px] sm:text-[10.5px] font-black text-amber-900 mt-8">
            <Truck size={11} className="text-amber-600 shrink-0" />
            <span>حمل بیمه‌شده</span>
          </div>
        </div>

        {/* Node 4: Warehouse */}
        <div className="flex flex-col items-center justify-center col-start-1 row-start-2 col-span-2">
          <div className="bg-emerald-900/90 text-emerald-100 backdrop-blur-md border border-emerald-400/60 px-2.5 py-0.5 rounded-lg shadow-md flex items-center gap-1 text-[10px] sm:text-[11px] font-black mt-2">
            <Warehouse size={12} className="text-emerald-300 shrink-0" />
            <span>تحویل مستقیم به انبار شما</span>
          </div>
        </div>

        {/* Node 5: Quality Guarantee */}
        <div className="flex flex-col items-center justify-center col-start-3 row-start-2">
          <div className="bg-white/95 backdrop-blur-md border border-sky-200 px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1 text-[9.5px] sm:text-[10.5px] font-black text-sky-900 mt-2">
            <ShieldCheck size={11} className="text-sky-600 shrink-0" />
            <span>تضمین اصالت بار</span>
          </div>
        </div>
      </div>
    </div>
  );
};
