import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
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
  const [currentFrameNumber, setCurrentFrameNumber] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const animationFrameRef = useRef<number | null>(null);

  // Framer Motion scroll hook on the 700vh container for elongated, silky scroll travel
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 95,
    damping: 24,
    restDelta: 0.0001,
  });

  // Frame drawing routine with High-DPI support and aspect-ratio preservation
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

    // Deep black canvas backdrop
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, width, height);

    // Full-bleed cinematic scaling
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

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    ctx.restore();
    setCurrentFrameNumber(safeIndex + 1);
  }, []);

  // Preload all 300 truck video delivery frames
  useEffect(() => {
    let isCancelled = false;
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;

    const handleSingleLoad = (index: number) => {
      if (isCancelled) return;
      loadedCount++;
      setImagesLoaded(loadedCount);

      if (index === 0) {
        requestAnimationFrame(() => drawFrame(0));
      }

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

      const frameIndex = clamped * (TOTAL_DELIVERY_FRAMES - 1);
      drawFrame(frameIndex);

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
      className={`relative w-full h-[700vh] transition-colors duration-300 ${
        isLight ? 'bg-[#f4f7fb] px-3 sm:px-6' : 'bg-[#050608]'
      } text-white`}
      style={{ isolation: 'isolate' }}
    >
      {/* Sticky Canvas Viewport (Rounded Floating 3D Card in Light Mode) */}
      <div
        className={`sticky overflow-hidden flex items-center justify-center transition-all duration-300 ${
          isLight
            ? 'top-20 sm:top-24 left-0 w-full h-[calc(100vh-6rem)] sm:h-[calc(100vh-7rem)] rounded-3xl bg-[#080a0f] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-neutral-300'
            : 'top-0 left-0 w-full h-screen bg-[#050608]'
        }`}
      >
        {/* HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block object-contain pointer-events-none"
        />

        {/* Preloader overlay */}
        {!isReady && (
          <div className="absolute inset-0 z-40 bg-[#050608] flex flex-col items-center justify-center p-6 transition-opacity duration-700">
            <div className="w-full max-w-md space-y-6 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-orange-500/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin flex items-center justify-center">
                  <Truck className="w-7 h-7 text-orange-500" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-mono tracking-widest text-orange-400 uppercase">
                  INITIALIZING FLEET TELEMATICS
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Loading 300 Cinematic Delivery Frames
                </h3>
                <p className="text-xs text-neutral-400">
                  Full JIT logistics journey · Shakti Udyog Heavy Transport Fleet
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 transition-all duration-150 ease-out"
                    style={{ width: `${loadPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>FRAME {String(imagesLoaded).padStart(3, '0')} / 300</span>
                  <span className="text-orange-400 font-semibold">{loadPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Header Badge (Sticky HUD) */}
        <div className="absolute top-4 sm:top-6 left-4 sm:left-8 z-30 pointer-events-none">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-white">
              FLEET TELEMATICS • LIVE DELIVERY ANIMATION
            </span>
          </div>
        </div>

        {/* Top Right Live Frame HUD */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-8 z-30 pointer-events-none hidden sm:block">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 shadow-lg font-mono text-xs text-neutral-300">
            <span className="text-orange-400 font-bold">FRAME {String(currentFrameNumber).padStart(3, '0')}</span>
            <span className="text-neutral-600">|</span>
            <span>300 FRAMES (4K HD)</span>
          </div>
        </div>

        {/* Interactive Bottom HUD & Story Narrative */}
        <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none p-4 sm:p-8 lg:p-12 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <div className="w-full max-w-[1400px] mx-auto space-y-5">
            
            {/* Story Narrative Box */}
            <div className="max-w-3xl space-y-3 pointer-events-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMilestone.id}
                  initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-2.5"
                >
                  {/* Stage Eyebrow */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-mono text-xs font-bold tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>STAGE {activeMilestone.stageNumber} • {activeMilestone.badge}</span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                      {activeMilestone.title}
                    </h2>
                    <p className="text-xs sm:text-base font-medium text-orange-300/90 font-mono mt-0.5">
                      {activeMilestone.subtitle}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
                    {activeMilestone.description}
                  </p>

                  {/* Badges / Quality Tags */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeMilestone.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-mono font-medium text-white shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Interactive Timeline Stepper & Player Control Bar */}
            <div className="pointer-events-auto pt-2 border-t border-white/15 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              
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
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Reset to Stage 1"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setPlaybackSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 font-mono text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
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
                      <span>{idx + 1}. {m.badge.split(' ')[0]}</span>
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
