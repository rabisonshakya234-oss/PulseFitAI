import React, { useEffect, useRef } from 'react';

interface PulseWaveformCanvasProps {
  bpm: number;
  zone: 1 | 2 | 3 | 4 | 5;
  accentColor: string;
  height?: number;
}

export const PulseWaveformCanvas: React.FC<PulseWaveformCanvasProps> = ({
  bpm,
  zone,
  accentColor,
  height = 90,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const offsetRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = (height || rect.height) * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const canvasHeight = height;

    // Wave speed depends on BPM (higher BPM = faster flow)
    const speed = (bpm / 60) * 1.8;

    const render = () => {
      offsetRef.current += speed;
      ctx.clearRect(0, 0, width, canvasHeight);

      // Subtle horizontal baseline grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const midY = canvasHeight / 2;
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // ECG wave pattern generator
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = accentColor;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = zone >= 4 ? 14 : 8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const wavelength = 120; // Distance between heartbeats in pixels

      for (let x = 0; x <= width; x += 2) {
        // Position within single cardiac cycle (0 to 1)
        const cycleX = ((x + offsetRef.current) % wavelength) / wavelength;
        let y = midY;

        // P-Q-R-S-T wave model
        if (cycleX > 0.15 && cycleX < 0.22) {
          // P Wave (Atrial depolarization)
          const p = Math.sin(((cycleX - 0.15) / 0.07) * Math.PI);
          y -= p * 7;
        } else if (cycleX >= 0.22 && cycleX < 0.25) {
          // Q Dip
          y += 5;
        } else if (cycleX >= 0.25 && cycleX < 0.32) {
          // R Spike (Ventricular depolarization)
          const rAmp = zone >= 4 ? 38 : 28;
          const rProgress = (cycleX - 0.25) / 0.07;
          if (rProgress < 0.5) {
            y -= (rProgress / 0.5) * rAmp;
          } else {
            y -= (1 - (rProgress - 0.5) / 0.5) * rAmp;
          }
        } else if (cycleX >= 0.32 && cycleX < 0.36) {
          // S Dip
          y += 10;
        } else if (cycleX >= 0.42 && cycleX < 0.55) {
          // T Wave (Ventricular repolarization)
          const t = Math.sin(((cycleX - 0.42) / 0.13) * Math.PI);
          y -= t * 12;
        } else {
          // Baseline isoelectric with realistic micro jitter
          const jitter = Math.sin((x + offsetRef.current) * 0.1) * 0.8;
          y += jitter;
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Leading pulse dot on the right side
      const leadX = width - 10;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(leadX, midY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [bpm, zone, accentColor, height]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black/40 border border-white/5 backdrop-blur-sm">
      <div className="absolute top-2 left-3 flex items-center gap-2 z-10">
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: accentColor }}
          ></span>
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: accentColor }}
          ></span>
        </span>
        <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
          Live Cardiac Wave • {bpm} BPM
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};
