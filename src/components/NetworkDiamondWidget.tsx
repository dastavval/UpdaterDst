import React, { useEffect, useRef } from 'react';

interface DiamondProps {
  size?: number;
}

export const NetworkDiamondWidget: React.FC<DiamondProps> = ({ size = 120 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let rotationY = 0;
    let rotationX = 0.3;

    const width = canvas.width = size * 2;
    const height = canvas.height = size * 2;
    const centerX = width / 2;
    const centerY = height / 2;

    const scale = size * 0.75;

    // Define 3D vertices of a premium diamond (double-cone structure)
    // Octahedron/Gem structure:
    // Top tip: (0, 1.2, 0)
    // Upper ring (e.g. 8 vertices at y = 0.4)
    // Lower ring (e.g. 8 vertices at y = -0.4)
    // Bottom tip: (0, -1.2, 0)
    const numRingPoints = 8;
    const vertices: { x: number; y: number; z: number; isTip?: boolean }[] = [];

    // Top Tip
    vertices.push({ x: 0, y: 1.2, z: 0, isTip: true });
    // Bottom Tip
    vertices.push({ x: 0, y: -1.2, z: 0, isTip: true });

    // Upper ring (y = 0.45, radius = 0.7)
    for (let i = 0; i < numRingPoints; i++) {
      const angle = (i / numRingPoints) * Math.PI * 2;
      vertices.push({
        x: Math.cos(angle) * 0.7,
        y: 0.45,
        z: Math.sin(angle) * 0.7
      });
    }

    // Lower ring (y = -0.45, radius = 0.7)
    for (let i = 0; i < numRingPoints; i++) {
      const angle = (i / numRingPoints) * Math.PI * 2;
      vertices.push({
        x: Math.cos(angle) * 0.7,
        y: -0.45,
        z: Math.sin(angle) * 0.7
      });
    }

    // Define connections (edges)
    const edges: [number, number][] = [];

    // Connections from Top Tip (index 0) to all Upper ring points (indices 2 to 9)
    for (let i = 0; i < numRingPoints; i++) {
      edges.push([0, 2 + i]);
    }

    // Connections within Upper ring (indices 2 to 9)
    for (let i = 0; i < numRingPoints; i++) {
      edges.push([2 + i, 2 + ((i + 1) % numRingPoints)]);
    }

    // Connections from Upper ring to corresponding Lower ring points (indices 10 to 17)
    for (let i = 0; i < numRingPoints; i++) {
      edges.push([2 + i, 10 + i]);
      // Cross lines for a diamond-grid texture
      edges.push([2 + i, 10 + ((i + 1) % numRingPoints)]);
    }

    // Connections within Lower ring (indices 10 to 17)
    for (let i = 0; i < numRingPoints; i++) {
      edges.push([10 + i, 10 + ((i + 1) % numRingPoints)]);
    }

    // Connections from Bottom Tip (index 1) to all Lower ring points (indices 10 to 17)
    for (let i = 0; i < numRingPoints; i++) {
      edges.push([1, 10 + i]);
    }

    let pulseTime = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      rotationY += 0.015;
      rotationX = 0.2 + Math.sin(pulseTime * 0.3) * 0.1;
      pulseTime += 0.05;

      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);

      // Project vertices
      const projected = vertices.map((v) => {
        // Rotate on Y
        const x1 = v.x * cosY - v.z * sinY;
        const z1 = v.z * cosY + v.x * sinY;
        // Rotate on X
        const y2 = v.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + v.y * sinX;

        return {
          px: centerX + x1 * scale,
          py: centerY - y2 * scale,
          z: z2,
          isTip: v.isTip
        };
      });

      // Glow backing
      const glowGrad = ctx.createRadialGradient(centerX, centerY, size * 0.1, centerX, centerY, size * 0.9);
      glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      glowGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
      glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Draw edges
      edges.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];

        // Depth average to calculate opacity
        const avgZ = (p1.z + p2.z) / 2;
        const alpha = Math.max(0.12, (avgZ + 1.2) / 2.4);

        // Highlight lines running vertically
        const isHighlight = i === 0 || i === 1 || j === 0 || j === 1;

        ctx.strokeStyle = isHighlight 
          ? `rgba(16, 185, 129, ${alpha * 0.8})` 
          : `rgba(99, 102, 241, ${alpha * 0.55})`;
        ctx.lineWidth = isHighlight ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      });

      // Draw vertex particles
      projected.forEach((p) => {
        const alpha = Math.max(0.2, (p.z + 1.2) / 2.4);
        ctx.fillStyle = p.isTip 
          ? '#10b981' 
          : `rgba(99, 102, 241, ${alpha * 0.9})`;
        
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.isTip ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Extra ring for tips
        if (p.isTip) {
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 + Math.sin(pulseTime * 2) * 0.2})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.px, p.py, 8 + Math.sin(pulseTime * 2) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [size]);

  return (
    <canvas 
      ref={canvasRef} 
      className="max-w-full max-h-full block select-none pointer-events-none" 
      style={{ width: size, height: size }}
    />
  );
};
