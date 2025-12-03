import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

export const StarryBackground = () => {
  const [init, setInit] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });

    // Monitor theme changes
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const options = useMemo<ISourceOptions>(
    () => ({
      fpsLimit: 120,
      background: {
        color: "transparent",
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "grab",
          },
        },
        modes: {
          grab: {
            distance: 180, // Increased distance for easier connection
            links: {
              opacity: 0.8, // More visible grab links
              color: isDark ? "#ffffff" : "#475569", // Stronger color in light mode
            },
          },
        },
      },
      particles: {
        color: {
          value: isDark ? "#ffffff" : "#334155", // Darker slate for light mode
        },
        links: {
          color: isDark ? "#ffffff" : "#64748b", // Darker links for light mode
          distance: 150,
          enable: true,
          opacity: 0.4, // Increased base opacity
          width: 1.2, // Slightly thicker lines
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: true,
          speed: 0.8, // Slightly faster movement
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 160, // Increased particle count for denser effect
        },
        opacity: {
          value: { min: 0.3, max: 0.8 }, // Higher minimum opacity
          animation: {
            enable: true,
            speed: 1,
            sync: false,
          },
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1.5, max: 3.5 }, // Slightly larger particles
        },
      },
      detectRetina: true,
    }),
    [isDark]
  );

  if (!init) return (
      <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-neutral-950 transition-colors duration-500" />
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-50 dark:bg-neutral-950 transition-colors duration-500">
      {/* 朦胧背景光斑 - 保持 CSS 实现，因为性能好且效果柔和 */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/5 dark:bg-blue-500/10 blur-[120px] animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-purple-600/5 dark:bg-purple-500/10 blur-[120px] animate-pulse delay-1000 duration-[8000ms]" />
      <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 dark:bg-indigo-400/10 blur-[100px] animate-pulse delay-2000 duration-[10000ms]" />

      {/* tsParticles 交互层 */}
      <Particles
        id="tsparticles"
        options={options}
        className="absolute inset-0 w-full h-full opacity-80 dark:opacity-100"
      />
    </div>
  );
};
