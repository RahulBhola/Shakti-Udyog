'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { STORY_MILESTONES, TOTAL_FRAMES } from '@/lib/constants';

export const ScrollytellingCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [activeMilestoneIndex, setActiveMilestoneIndex] = useState(0);
  const [, setCurrentProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 26,
    restDelta: 0.0001,
  });

  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const safeIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(frameIndex)));
    const img = imagesRef.current[safeIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

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

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

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

    // Draw the image frame cleanly with zero masks
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    ctx.restore();
  }, []);

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

      if (loadedCount >= 10 || loadedCount >= TOTAL_FRAMES) {
        setIsReady(true);
      }
    };

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/sequence/frame_${frameNum}.jpg`;

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

  useEffect(() => {
    const unsubscribe = smoothProgress.on('change', (latestProgress) => {
      const clamped = Math.max(0, Math.min(1, latestProgress));
      setCurrentProgress(clamped);

      const frameIndex = clamped * (TOTAL_FRAMES - 1);
      drawFrame(frameIndex);

      const currentMilestoneIndex = STORY_MILESTONES.findIndex(
        (m) => clamped >= m.startProgress && clamped <= m.endProgress
      );
      if (currentMilestoneIndex !== -1) {
        setActiveMilestoneIndex(currentMilestoneIndex);
      }
    });

    return () => unsubscribe();
  }, [smoothProgress, drawFrame]);

  useEffect(() => {
    const handleResize = () => {
      const currentVal = smoothProgress.get();
      drawFrame(currentVal * (TOTAL_FRAMES - 1));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [smoothProgress, drawFrame]);

  const activeMilestone = STORY_MILESTONES[activeMilestoneIndex] || STORY_MILESTONES[0];
  const loadPercentage = Math.floor((imagesLoaded / TOTAL_FRAMES) * 100);

  return (
    <div
      id="casting-story"
      ref={containerRef}
      className="relative w-full h-[750vh] bg-[#050505] text-[#F5F5F7]"
      style={{ isolation: 'isolate' }}
    >
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full block object-contain pointer-events-none"
        />

        {!isReady && (
          <div className="absolute inset-0 z-40 bg-[#050505] flex flex-col items-center justify-center p-6 transition-opacity duration-700">
            <div className="w-full max-w-md space-y-6 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-orange-500/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-mono tracking-widest text-orange-400 uppercase">
                  INITIALIZING FOUNDRY SEQUENCER
                </p>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Preloading 300 Ultra-HD Casting Frames
                </h3>
                <p className="text-xs text-neutral-400">
                  Precision metallurgical transformation dataset · Shakti Udyog DN25 PN25
                </p>
              </div>

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

        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-end p-4 xs:p-6 sm:p-10 md:p-12 lg:p-16">
          <div className="w-full max-w-[1720px] mx-auto">
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
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/40 text-orange-400 font-mono text-xs sm:text-sm font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(255,109,0,0.15)]">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
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
          </div>
        </div>
      </div>
    </div>
  );
};
