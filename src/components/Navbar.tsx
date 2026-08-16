'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, Menu, X, ArrowRight, User } from 'lucide-react';

export function BrandLogo({ isLight = false }: { isLight?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0 select-none">
      <svg
        className="w-7 h-7 shrink-0 drop-shadow-[0_2px_8px_rgba(234,88,12,0.35)]"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 15L30 5C30.6 4.4 31.5 4.4 32.1 5C32.7 5.6 32.7 6.5 32.1 7.1L22 17"
          stroke="#EA580C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M7 16C7 24.5 12 28.5 19 28.5C24.5 28.5 28 25 29 20.5H10C8.5 20.5 7.5 19.5 7 18V16Z"
          fill="url(#ladleBrandGradNext)"
        />
        <path
          d="M6 15C6 14.2 6.6 13.5 7.5 13.5H28.5C29.4 13.5 30 14.2 30 15C30 15.8 29.4 16.5 28.5 16.5H7.5C6.6 16.5 6 15.8 6 15Z"
          fill="#F97316"
        />
        <ellipse cx="18" cy="15" rx="10" ry="2.2" fill="#FDBA74" />
        <path
          d="M8 18C7.5 21 6.5 26 6 29C5.8 30 6.6 31 7.5 31C8.4 31 9.2 30 9 29C8.5 26 8.5 21 8 18Z"
          fill="#EA580C"
        />
        <circle cx="7.5" cy="30" r="2" fill="#FF8A3D" />

        <defs>
          <linearGradient id="ladleBrandGradNext" x1="7" y1="16" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EA580C" />
            <stop offset="1" stopColor="#C2410C" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex flex-col leading-[1.08]">
        <span
          className={`text-[17px] font-bold tracking-tight font-sans transition-colors ${
            isLight ? 'text-neutral-900' : 'text-white'
          }`}
        >
          Shakti
        </span>
        <span className="text-[14px] font-bold tracking-tight text-orange-500 font-sans">
          Udyog
        </span>
      </div>
    </div>
  );
}

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Products', href: '/products' },
  { label: 'Capabilities', href: '/capabilities' },
  { label: 'Quality', href: '/quality' },
  { label: 'Industries', href: '/industries' },
  { label: 'Resources', href: '/resources' },
  { label: 'Contact', href: '/contact' },
];

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const isLight = theme === 'light';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextTheme);
    }
  };

  return (
    <header className="fixed top-3 sm:top-4 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none">
      <div
        className={`max-w-[1400px] mx-auto px-5 sm:px-7 py-2.5 sm:py-3 rounded-2xl sm:rounded-[22px] border transition-all duration-300 pointer-events-auto flex items-center justify-between gap-4 ${
          isLight
            ? isScrolled
              ? 'bg-white/95 backdrop-blur-2xl border-neutral-300 shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
              : 'bg-white/90 backdrop-blur-xl border-neutral-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.05)]'
            : isScrolled
              ? 'bg-[#0b0c10]/95 backdrop-blur-2xl border-white/[0.12] shadow-[0_12px_45px_rgba(0,0,0,0.85)]'
              : 'bg-[#0c0d12]/80 backdrop-blur-xl border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.7)]'
        }`}
      >
        <Link
          href="/"
          className="group hover:opacity-95 transition-opacity inline-flex items-center shrink-0"
          aria-label="Shakti Udyog — home"
        >
          <BrandLogo isLight={isLight} />
        </Link>

        <nav
          className="hidden xl:flex items-center gap-6 2xl:gap-8"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors py-1 ${
                item.href === '/'
                  ? isLight
                    ? 'text-orange-500 font-semibold'
                    : 'text-white font-semibold'
                  : isLight
                    ? 'text-neutral-600 hover:text-neutral-950'
                    : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Link
            href="/request-a-quote"
            className={`group hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
              isLight
                ? 'text-orange-600 bg-orange-500/5 border border-orange-500 hover:bg-orange-500 hover:text-white shadow-[0_0_12px_rgba(255,109,0,0.15)] hover:shadow-[0_0_20px_rgba(255,109,0,0.4)]'
                : 'text-white bg-orange-500/15 border border-orange-500/70 hover:bg-orange-500 hover:border-orange-500 shadow-[0_0_15px_rgba(255,109,0,0.2)] hover:shadow-[0_0_25px_rgba(255,109,0,0.5)]'
            }`}
          >
            <span>Request a Quote</span>
            <ArrowRight
              className={`w-3.5 h-3.5 transition-all group-hover:translate-x-0.5 ${
                isLight ? 'text-orange-500 group-hover:text-white' : 'text-orange-400 group-hover:text-white'
              }`}
            />
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/login"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                isLight
                  ? 'text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200'
                  : 'text-neutral-300 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <span>Login</span>
              <User className="w-3.5 h-3.5 text-neutral-400" />
            </Link>
            <Link
              href="/signup"
              className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-medium transition-all ${
                isLight
                  ? 'text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200'
                  : 'text-neutral-300 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 hover:text-white'
              }`}
            >
              Sign Up
            </Link>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
            title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm ${
              isLight
                ? 'bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-950'
                : 'bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 text-orange-400/80 hover:text-orange-400'
            }`}
          >
            {isLight ? (
              <Moon className="w-4 h-4 text-neutral-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
            className={`xl:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isLight
                ? 'bg-neutral-100 border border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                : 'bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className={`xl:hidden max-w-[1400px] mx-auto mt-2 px-4 py-4 rounded-2xl border pointer-events-auto transition-all ${
            isLight
              ? 'bg-white/95 backdrop-blur-2xl border-neutral-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)]'
              : 'bg-[#0c0d12]/95 backdrop-blur-2xl border-white/[0.08] shadow-[0_12px_45px_rgba(0,0,0,0.9)]'
          }`}
        >
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isLight
                    ? 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                    : 'text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
