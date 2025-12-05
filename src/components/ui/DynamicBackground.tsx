import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { loadTextShape } from "@tsparticles/shape-text";
import type { ISourceOptions } from "@tsparticles/engine";
import { useBackground } from '../../contexts/BackgroundContext';

export const DynamicBackground = () => {
  const [init, setInit] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const { settings } = useBackground();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      await loadTextShape(engine);
    }).then(() => {
      setInit(true);
    });

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Generate color based on theme setting
  const getThemeColors = () => {
    const baseColor = isDark ? "#ffffff" : "#334155";
    const linkColor = isDark ? "#ffffff" : "#64748b";

    switch (settings.theme) {
      case 'blue':
        return { 
          particle: "#3b82f6", 
          link: "#60a5fa", 
          bg: isDark ? "#0f172a" : "#eff6ff",
          gradient: isDark ? ['#172554', '#1e40af'] : ['#dbeafe', '#93c5fd']
        };
      case 'purple':
        return { 
          particle: "#a855f7", 
          link: "#c084fc", 
          bg: isDark ? "#2e1065" : "#faf5ff",
          gradient: isDark ? ['#2e1065', '#5b21b6'] : ['#f3e8ff', '#d8b4fe']
        };
      case 'orange':
        return { 
          particle: "#f97316", 
          link: "#fdba74", 
          bg: isDark ? "#431407" : "#fff7ed",
          gradient: isDark ? ['#431407', '#9a3412'] : ['#ffedd5', '#fdba74']
        };
      case 'green':
        return { 
          particle: "#22c55e", 
          link: "#4ade80", 
          bg: isDark ? "#052e16" : "#f0fdf4",
          gradient: isDark ? ['#052e16', '#166534'] : ['#dcfce7', '#86efac']
        };
      case 'red':
        return { 
          particle: "#ef4444", 
          link: "#f87171", 
          bg: isDark ? "#450a0a" : "#fef2f2",
          gradient: isDark ? ['#450a0a', '#991b1b'] : ['#fee2e2', '#fca5a5']
        };
      case 'pink':
        return { 
          particle: "#ec4899", 
          link: "#f472b6", 
          bg: isDark ? "#500724" : "#fdf2f8",
          gradient: isDark ? ['#500724', '#9d174d'] : ['#fce7f3', '#f9a8d4']
        };
      case 'cyan':
        return { 
          particle: "#06b6d4", 
          link: "#22d3ee", 
          bg: isDark ? "#083344" : "#ecfeff",
          gradient: isDark ? ['#083344', '#155e75'] : ['#cffafe', '#67e8f9']
        };
      case 'yellow':
        return { 
          particle: "#eab308", 
          link: "#facc15", 
          bg: isDark ? "#422006" : "#fefce8",
          gradient: isDark ? ['#422006', '#854d0e'] : ['#fef9c3', '#fde047']
        };
      default: // 'default'
        return { 
          particle: baseColor, 
          link: linkColor, 
          bg: isDark ? "#0a0a0a" : "#f8fafc",
          gradient: isDark ? ['#0f172a', '#1e293b'] : ['#f1f5f9', '#cbd5e1']
        };
    }
  };

  const colors = getThemeColors();

  // Render: Safe hook order guaranteed
  // Generate options based on settings
  const options = useMemo<ISourceOptions>(() => {
    const densityMap = { low: 80, medium: 160, high: 300 };
    const speedMap = { slow: 0.5, normal: 1, fast: 2.5 };
    
    const particleCount = densityMap[settings.density] || 160;
    const moveSpeed = speedMap[settings.speed] || 1;

    // Common config
    const common = {
      fpsLimit: 120,
      interactivity: {
        events: {
          onHover: { enable: true, mode: "grab" },
        },
        modes: {
          grab: { distance: 180, links: { opacity: 0.8, color: colors.link } },
        },
      },
      detectRetina: true,
      background: { color: "transparent" }, // We handle BG color via CSS container
    };

    if (settings.type === 'starry') {
      return {
        ...common,
        particles: {
          color: { value: colors.particle },
          links: {
            color: colors.link,
            distance: 150,
            enable: true,
            opacity: 0.4,
            width: 1.2,
          },
          move: {
            direction: "none" as const,
            enable: true,
            outModes: { default: "bounce" as const },
            random: true,
            speed: moveSpeed * 0.8,
            straight: false,
          },
          number: {
            density: { enable: true, width: 800 },
            value: particleCount,
          },
          opacity: {
            value: { min: 0.3, max: 0.8 },
            animation: { enable: true, speed: 1, sync: false },
          },
          shape: { type: "circle" },
          size: { value: { min: 1.5, max: 3.5 } },
        },
      };
    }

    if (settings.type === 'particles') {
      return {
        ...common,
        particles: {
          color: { value: colors.particle },
          move: {
            direction: "top" as const,
            enable: true,
            outModes: { default: "out" as const },
            random: false,
            speed: moveSpeed,
            straight: false,
          },
          number: {
            density: { enable: true, width: 800 },
            value: particleCount * 0.5, // Less particles for bubbles
          },
          opacity: { value: 0.6 },
          shape: { type: "circle" },
          size: { value: { min: 3, max: 10 } },
        },
      };
    }

    if (settings.type === 'snow') {
      return {
        ...common,
        interactivity: {
          events: {
            onHover: { enable: true, mode: "repulse" },
          },
          modes: {
            repulse: { distance: 100, duration: 0.4 },
          },
        },
        particles: {
          color: { value: isDark ? "#ffffff" : "#64748b" }, // White in dark, Slate-500 in light for visibility
          move: {
            direction: "bottom" as const,
            enable: true,
            outModes: { default: "out" as const },
            random: false,
            speed: { min: 1, max: 3 },
            straight: false,
            warp: true,
          },
          wobble: {
            enable: true,
            distance: 10,
            speed: 5,
          },
          number: {
            density: { enable: true, width: 800 },
            value: particleCount * 0.8,
          },
          opacity: {
            value: { min: 0.4, max: 0.9 },
          },
          shape: { 
            type: "char",
            options: {
              char: [
                { value: ["❄", "❅", "❆"], font: "Verdana", weight: "400" }
              ]
            }
          },
          size: { value: { min: 6, max: 12 } },
          links: { enable: false },
        },
      };
    }

    if (settings.type === 'matrix') {
      return {
        ...common,
        interactivity: {
          events: {
            onHover: { enable: true, mode: "bubble" },
          },
          modes: {
            bubble: { distance: 200, size: 4, duration: 0.3, opacity: 0.8 },
          },
        },
        particles: {
          color: { value: isDark ? "#a5f3fc" : "#2563eb" }, // Cyan-200 in dark, Blue-600 in light
          move: {
            direction: "bottom" as const,
            enable: true,
            outModes: { default: "out" as const },
            random: false,
            speed: { min: 30, max: 50 }, // Driving rain speed
            straight: true,
          },
          number: {
            density: { enable: true, width: 800 },
            value: particleCount * 1.2, // Denser rain
          },
          opacity: {
            value: 0.5,
          },
          shape: { 
            type: "line" 
          },
          stroke: {
            width: 1.5, // Slightly thicker for visibility
            color: isDark ? "#a5f3fc" : "#2563eb"
          },
          size: { value: { min: 20, max: 40 } }, // Long streaks
          rotate: {
            path: true
          },
          links: { enable: false },
        },
      };
    }
    
    if (settings.type === 'grid') {
        // Simulating a grid with particles for now, or return empty for CSS grid
        return {
            ...common,
            particles: {
                color: { value: colors.particle },
                links: {
                    enable: true,
                    distance: 150,
                    color: colors.link,
                    opacity: 0.2,
                    width: 1,
                    triangles: {
                        enable: true,
                        opacity: 0.05,
                    }
                },
                move: { enable: true, speed: moveSpeed * 0.5 },
                number: { value: particleCount * 0.6 },
                opacity: { value: 0.5 },
                size: { value: 1 },
                shape: { type: "circle" }
            }
        }
    }

    // Fallback or other types
    return {};
  }, [settings, isDark, colors]);

  if (!settings.enabled) {
    return (
      <div 
        className="fixed inset-0 -z-10 transition-colors duration-500"
        style={{ backgroundColor: colors.bg }}
      />
    );
  }

  if (!init) return <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-neutral-950" />;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none transition-colors duration-500"
         style={{ backgroundColor: settings.type === 'gradient' ? 'transparent' : colors.bg }}>
      
      {/* Gradient Background Effect */}
      {settings.type === 'gradient' && (
        <div 
          className="absolute inset-0 opacity-80 dark:opacity-60 animate-gradient-xy"
          style={{
            backgroundImage: `linear-gradient(135deg, ${colors.gradient[0]}, ${colors.gradient[1]})`
          }}
        />
      )}

      {/* Ambient Blobs (Visible in all modes to add depth) */}
      <div className={`absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] animate-pulse duration-[8000ms] ${
        settings.theme === 'default' ? 'bg-blue-600/5 dark:bg-blue-500/10' : 
        `bg-${settings.theme}-500/10`
      }`} />
      <div className={`absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] animate-pulse delay-1000 duration-[8000ms] ${
         settings.theme === 'default' ? 'bg-purple-600/5 dark:bg-purple-500/10' :
         `bg-${settings.theme}-400/10`
      }`} />

      {/* Grid Effect (CSS based) */}
      {settings.type === 'grid' && (
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      )}

      {/* tsParticles Layer */}
      {settings.type !== 'gradient' && (
        <Particles
          id="tsparticles"
          options={options}
          className="absolute inset-0 w-full h-full"
        />
      )}
    </div>
  );
};
