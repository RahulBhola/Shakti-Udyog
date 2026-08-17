import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../auth/ThemeContext';
import {
  DELIVERY_MILESTONES,
  TOTAL_DELIVERY_FRAMES,
  type DeliveryMilestone,
} from '../lib/deliveryConstants';

export const DeliveryScrollytellingCanvas: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef<number>(0);

  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [activeMilestoneIndex, setActiveMilestoneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const animationFrameRef = useRef<number | null>(null);

  // Framer Motion scroll hook on the 750vh container for smooth, elongated scroll travel
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 26,
    restDelta: 0.0001,
  });

  // Frame drawing routine with High-DPI support, aspect-ratio preservation, and clean rendering
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const safeIndex = Math.max(0, Math.min(TOTAL_DELIVERY_FRAMES - 1, Math.floor(frameIndex)));
    currentFrameRef.current = safeIndex;
    const img = imagesRef.current[safeIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    // Retina / High-DPI Canvas scaling
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
    const height = rect.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear with ultra-deep background #050505
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Expansive full-width cinematic scaling
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = width / height;

    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    if (canvasAspect > imgAspect) {
      drawWidth = width;
      drawHeight = width / imgAspect;
      drawX = 0;
      drawY = (height - drawHeight) / 2;
    } else {
      drawHeight = height;
      drawWidth = height * imgAspect;
      drawX = (width - drawWidth) / 2;
      drawY = 0;
    }

    // High quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    ctx.restore();
  }, []);

  // Preload all 300 truck delivery frames
  useEffect(() => {
    let isCancelled = false;
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    const handleSingleLoad = (index: number) => {
      if (isCancelled) return;
      loadedCount++;
      setImagesLoaded(loadedCount);

      // Draw initial frame immediately once frame 1 is ready
      if (index === 0) {
        requestAnimationFrame(() => drawFrame(0));
      }

      // Unlock preloader as soon as first 10 frames or all frames are ready
      if (loadedCount >= 10 || loadedCount >= TOTAL_DELIVERY_FRAMES) {
        setIsReady(true);
      }
    };

    for (let i = 1; i <= TOTAL_DELIVERY_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/images/truck_video_to_images/ezgif-frame-${frameNum}.jpg`;

      img.onload = () => handleSingleLoad(i - 1);
      img.onerror = () => {
        if (!isCancelled) {
          loadedCount++;
          setImagesLoaded(loadedCount);
        }
      };

      images.push(img);
    }

    imagesRef.current = images;

    return () => {
      isCancelled = true;
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [drawFrame]);

  // Subscribe to smooth scroll progress updates (when not in autoplay mode)
  useEffect(() => {
    if (isPlaying) return;

    const unsubscribe = smoothProgress.on('change', (latestProgress) => {
      const clamped = Math.max(0, Math.min(1, latestProgress));

      // Map progress directly to frame index 0 - 299
      const frameIndex = clamped * (TOTAL_DELIVERY_FRAMES - 1);
      drawFrame(frameIndex);

      // Determine active story milestone based on scroll progress
      const currentMilestoneIndex = DELIVERY_MILESTONES.findIndex(
        (m) => clamped >= m.startProgress && clamped <= m.endProgress
      );
      if (currentMilestoneIndex !== -1) {
        setActiveMilestoneIndex(currentMilestoneIndex);
      }
    });

    return () => unsubscribe();
  }, [smoothProgress, drawFrame, isPlaying]);

  // Autoplay animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let lastTimestamp = performance.now();
    const targetFps = 30 * playbackSpeed;
    const intervalMs = 1000 / targetFps;

    const step = (timestamp: number) => {
      const elapsed = timestamp - lastTimestamp;
      if (elapsed >= intervalMs) {
        lastTimestamp = timestamp - (elapsed % intervalMs);
        const nextFrame = (currentFrameRef.current + 1) % TOTAL_DELIVERY_FRAMES;

        drawFrame(nextFrame);

        const progress = nextFrame / (TOTAL_DELIVERY_FRAMES - 1);
        const currentMilestoneIndex = DELIVERY_MILESTONES.findIndex(
          (m) => progress >= m.startProgress && progress <= m.endProgress
        );
        if (currentMilestoneIndex !== -1) {
          setActiveMilestoneIndex(currentMilestoneIndex);
        }
      }

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, drawFrame]);

  // Jump to specific milestone
  const jumpToMilestone = (index: number) => {
    setIsPlaying(false);
    const targetMilestone = DELIVERY_MILESTONES[index];
    if (!targetMilestone) return;

    const targetFrame = targetMilestone.startFrame - 1;
    drawFrame(targetFrame);
    setActiveMilestoneIndex(index);

    if (containerRef.current) {
      const containerTop = containerRef.current.offsetTop;
      const containerHeight = containerRef.current.offsetHeight - window.innerHeight;
      const targetScrollY = containerTop + containerHeight * targetMilestone.startProgress;
      window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
    }
  };

  // Toggle playback
  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      drawFrame(currentFrameRef.current);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFrame]);

  const activeMilestone: DeliveryMilestone =
    DELIVERY_MILESTONES[activeMilestoneIndex] || DELIVERY_MILESTONES[0];
  const loadPercentage = Math.floor((imagesLoaded / TOTAL_DELIVERY_FRAMES) * 100);

  return (
    <div
      id="delivery-story"
      ref={containerRef}
      className={`relative w-full h-[750vh] transition-colors duration-300 ${
        isLight ? 'bg-[#F8F9FA] px-3 sm:px-6 pt-24 sm:pt-28' : 'bg-[#050505]'
      } text-[#F5F5F7]`}
      style={{ isolation: 'isolate' }}
    >
      {/* Sticky Canvas Viewport (Rounded Floating Card in Light Mode, Full-Screen in Dark Mode) */}
      <div
        className={`sticky overflow-hidden flex items-center justify-center transition-all duration-300 ${
          isLight
            ? 'top-24 sm:top-28 left-0 w-full h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)] rounded-2xl sm:rounded-[32px] bg-[#050505] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-neutral-200/40'
            : 'top-0 left-0 w-full h-screen bg-[#050505]'
        }`}
      >
        {/* HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block object-contain pointer-events-none"
        />

        {/* Preloader overlay (shows until first batch is ready) */}
        {!isReady && (
          <div className="absolute inset-0 z-40 bg-[#050505] flex flex-col items-center justify-center p-6 transition-opacity duration-700">
            <div className="w-full max-w-md space-y-6 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-orange-500/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin flex items-center justify-center">
                  <Truck className="w-6 h-6 text-orange-500" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-mono tracking-widest text-orange-400 uppercase">
                  INITIALIZING FLEET LOGISTICS SEQUENCER
                </p>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Preloading 300 Ultra-HD Delivery Frames
                </h3>
                <p className="text-xs text-neutral-400">
                  Precision JIT fleet transport · Shakti Udyog Heavy Transport Logistics
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 transition-all duration-150 ease-out"
                    style={{ width: `${loadPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span>FRAME {String(imagesLoaded).padStart(3, '0')} / 300</span>
                  <span className="text-orange-400 font-semibold">{loadPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Right Live HUD Indicator */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-8 z-30 pointer-events-none hidden sm:flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-lg font-mono text-xs text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-orange-400 font-bold">FRAME {String(currentFrameRef.current + 1).padStart(3, '0')}</span>
          <span className="text-neutral-600">/</span>
          <span>300 (4K HD)</span>
        </div>

        {/* Main Narrative Overlays (Expansive Full-Width Typography matching Home Page) */}
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-end p-4 xs:p-6 sm:p-10 md:p-12 lg:p-16">
          <div className="w-full max-w-[1720px] mx-auto space-y-6">
            
            {/* Cinematic Narrative Block */}
            <div className="max-w-4xl lg:max-w-5xl space-y-3 sm:space-y-4 pointer-events-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMilestone.id}
                  initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-3 sm:space-y-3.5"
                >
                  {/* Phase 1-8 Embedded in Title Area */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/40 text-orange-400 font-mono text-xs sm:text-sm font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(255,109,0,0.15)]">
                      <Truck className="w-3.5 h-3.5 text-orange-500" />
                      <span>{activeMilestone.phaseNumber} : {activeMilestone.phaseTitle}</span>
                    </div>

                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-neutral-300 font-mono text-xs sm:text-sm tracking-wider uppercase backdrop-blur-md">
                      <span>{activeMilestone.badge}</span>
                    </div>
                  </div>

                  <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight !text-white leading-[1.06] text-glow-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
                    {activeMilestone.headline}
                  </h2>

                  <p className="text-sm sm:text-base md:text-lg lg:text-xl !text-neutral-200 max-w-4xl font-normal leading-relaxed drop-shadow-[0_1px_10px_rgba(0,0,0,0.95)]">
                    {activeMilestone.supportingText}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Interactive Timeline Stepper & Player Control Bar */}
            <div className="pointer-events-auto pt-3 border-t border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              
              {/* Playback Controls & Frame Tracker */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-mono text-xs font-bold inline-flex items-center gap-2 transition-all shadow-md shadow-orange-500/30 cursor-pointer"
                  title={isPlaying ? 'Pause Animation' : 'Play Cinematic Sequence'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>PAUSE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>PLAY</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => jumpToMilestone(0)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Reset to Stage 1"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setPlaybackSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 font-mono text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Playback Speed"
                >
                  {playbackSpeed}x SPEED
                </button>
              </div>

              {/* 8-Stage Milestone Seek Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {DELIVERY_MILESTONES.map((m, idx) => {
                  const isActive = activeMilestoneIndex === idx;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => jumpToMilestone(idx)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105'
                          : 'bg-black/40 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>{idx + 1}. {m.phaseTitle}</span>
                    </button>
                  );
                })}
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
