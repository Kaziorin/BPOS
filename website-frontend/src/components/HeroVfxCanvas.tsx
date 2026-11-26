"use client";

import React, { useEffect, useRef } from "react";
import type { HeroBgStyle } from "@/context/WebsiteContext";

interface HeroVfxCanvasProps {
  variant?: HeroBgStyle;
  accent?: string;
}

export default function HeroVfxCanvas({ variant = "constellation", accent = "#38bdf8" }: HeroVfxCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const dots = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 1,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
    }));

    const orbs = Array.from({ length: 18 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 34 + 14,
      vx: (Math.random() - 0.5) * 0.45,
      vy: -(Math.random() * 0.45 + 0.15),
      alpha: Math.random() * 0.2 + 0.08,
    }));

    const tick = () => {
      time += 0.015;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (variant === "aurora") {
        for (let band = 0; band < 3; band++) {
          ctx.beginPath();
          const baseY = h * (0.32 + band * 0.18);
          ctx.moveTo(0, h);
          for (let x = 0; x <= w; x += 24) {
            const y =
              baseY +
              Math.sin(x * 0.004 + time + band * 1.4) * 42 +
              Math.cos(x * 0.009 - time * 0.8) * 20;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          const grad = ctx.createLinearGradient(0, baseY - 60, 0, h);
          grad.addColorStop(0, band === 1 ? `${accent}44` : "rgba(255,255,255,0.14)");
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = grad;
          ctx.fill();
        }
      } else if (variant === "particles") {
        for (const o of orbs) {
          o.x += o.vx;
          o.y += o.vy;
          if (o.y < -o.r * 2) {
            o.y = h + o.r * 2;
            o.x = Math.random() * w;
          }
          if (o.x < -o.r * 2 || o.x > w + o.r * 2) o.vx *= -1;
          const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
          grad.addColorStop(0, `rgba(255,255,255,${o.alpha})`);
          grad.addColorStop(0.55, `${accent}33`);
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      } else if (variant === "grid") {
        const horizon = h * 0.38;
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        const cols = 16;
        for (let i = -cols; i <= cols; i++) {
          const xTop = w * 0.5 + i * 38;
          const xBot = w * 0.5 + i * 165;
          ctx.beginPath();
          ctx.moveTo(xTop, horizon);
          ctx.lineTo(xBot, h);
          ctx.stroke();
        }
        const offset = (time * 36) % 45;
        for (let row = 0; row < 10; row++) {
          const p = (row * 45 + offset) / 450;
          const y = horizon + Math.pow(p, 1.55) * (h - horizon);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.strokeStyle = `rgba(255,255,255,${0.05 + p * 0.16})`;
          ctx.stroke();
        }
      } else {
        // Default: Constellation Network
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];
          d.x += d.vx;
          d.y += d.vy;
          if (d.x < 0 || d.x > w) d.vx *= -1;
          if (d.y < 0 || d.y > h) d.vy *= -1;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.fill();

          for (let j = i + 1; j < dots.length; j++) {
            const dist = Math.hypot(d.x - dots[j].x, d.y - dots[j].y);
            if (dist < 135) {
              ctx.beginPath();
              ctx.moveTo(d.x, d.y);
              ctx.lineTo(dots[j].x, dots[j].y);
              ctx.strokeStyle = `rgba(255,255,255,${0.16 * (1 - dist / 135)})`;
              ctx.stroke();
            }
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [variant, accent]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
