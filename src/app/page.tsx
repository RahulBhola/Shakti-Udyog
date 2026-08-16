'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { ScrollytellingCanvas } from '@/components/ScrollytellingCanvas';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#050505] text-[#F5F5F7] selection:bg-orange-600 selection:text-white">
      {/* Top Floating Glass Navigation */}
      <Navbar />

      {/* 300-Frame High Performance Scrollytelling Engine */}
      <ScrollytellingCanvas />

      {/* Ultra-Refined Engineering Footer */}
      <Footer />
    </main>
  );
}
