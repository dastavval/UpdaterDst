import React, { useEffect, useRef } from 'react';

export const HeroGlobeWidget: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ size = 'lg' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let rotationY = 0;

    const dimensions = size === 'sm' ? 80 : size === 'md' ? 120 : size === 'xl' ? 180 : 150;
    const width = canvas.width = dimensions * 2;
    const height = canvas.height = dimensions * 2;
    const radius = dimensions * 0.78;
    const centerX = width / 2;
    const centerY = height / 2;

    // Golden spiral sphere distribution
    const numPoints = 170;
    const points: { x: number; y: number; z: number }[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      points.push({
        x: Math.cos(theta) * r * radius,
        y: y * radius,
        z: Math.sin(theta) * r * radius
      });
    }

    // Key B2B Hub nodes
    const hubIndices = [6, 24, 48, 72, 96, 120, 142];

    let pulseTime = 0;

    let lastTime = 0;
    const fpsInterval = 1000 / 30;

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      const elapsed = now - lastTime;
      if (elapsed < fpsInterval) return;
      lastTime = now - (elapsed % fpsInterval);

      ctx.clearRect(0, 0, width, height);
      rotationY += 0.009;
      pulseTime += 0.05;

      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const cosX = Math.cos(0.28);
      const sinX = Math.sin(0.28);

      // Project & transform points
      const projected = points.map((p, idx) => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        return {
          px: centerX + x1,
          py: centerY - y2,
          z: z2,
          isHub: hubIndices.includes(idx)
        };
      });

      // Soft Glow Aura behind globe
      const glowGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 1.25);
      glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
      glowGrad.addColorStop(0.6, 'rgba(13, 148, 136, 0.09)');
      glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Draw globe grid particles
      projected.forEach(p => {
        if (p.z < -radius * 0.7) return; // depth clipping
        const depthAlpha = Math.max(0.15, (p.z + radius) / (radius * 2));
        
        ctx.fillStyle = p.isHub ? '#047857' : `rgba(16, 185, 129, ${depthAlpha * 0.88})`;
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.isHub ? 4.8 : Math.max(1.2, 2.3 * depthAlpha), 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw network arc lines between hubs on front hemisphere
      const frontHubs = projected.filter(p => p.isHub && p.z > -radius * 0.25);

      for (let i = 0; i < frontHubs.length; i++) {
        for (let j = i + 1; j < frontHubs.length; j++) {
          const h1 = frontHubs[i];
          const h2 = frontHubs[j];

          ctx.beginPath();
          ctx.moveTo(h1.px, h1.py);

          const midX = (h1.px + h2.px) / 2;
          const midY = (h1.py + h2.py) / 2;
          const cpX = midX + (midX - centerX) * 0.35;
          const cpY = midY + (midY - centerY) * 0.35 - 8;

          ctx.quadraticCurveTo(cpX, cpY, h2.px, h2.py);

          ctx.strokeStyle = 'rgba(5, 150, 105, 0.55)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Energy pulse packet traveling along line
          const t = (pulseTime + (i + j) * 0.3) % 1;
          const px = (1 - t) * (1 - t) * h1.px + 2 * (1 - t) * t * cpX + t * t * h2.px;
          const py = (1 - t) * (1 - t) * h1.py + 2 * (1 - t) * t * cpY + t * t * h2.py;

          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(px, py, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

    };

    animId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animId);
  }, [size]);

  const containerSizeClasses = size === 'sm' 
    ? "w-20 h-20" 
    : size === 'md'
      ? "w-28 h-28"
      : size === 'xl' 
        ? "w-44 h-44" 
        : "w-36 h-36 sm:w-40 sm:h-40";

  return (
    <div className={`relative flex items-center justify-center shrink-0 group overflow-visible bg-transparent ${containerSizeClasses}`}>
      {/* Animated Center Live Ping */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
      </div>

      {/* Canvas Globe */}
      <canvas ref={canvasRef} className="w-full h-full relative z-0 pointer-events-none" />
    </div>
  );
};
