import React, { useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Navigate } from 'react-router';
import { Home, Zap, Heart, User, Sparkles, LoaderCircle } from 'lucide-react';
import { useEmotionalTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'motion/react';

export function Layout() {
  const { theme, themeConfig } = useEmotionalTheme();
  const { session, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isFullPage = 
    location.pathname.startsWith('/adopt') || 
    location.pathname.startsWith('/ceremony') || 
    location.pathname.startsWith('/join') ||
    location.pathname.startsWith('/journal') ||
    location.pathname.startsWith('/mood') ||
    location.pathname.startsWith('/video-status') ||
    location.pathname.startsWith('/plant-profile') ||
    location.pathname.startsWith('/achievements');

  useEffect(() => {
    if (!loading && !session && location.pathname !== '/login' && !location.pathname.startsWith('/join/')) {
      navigate('/login', { replace: true });
    }
  }, [session, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <LoaderCircle className="animate-spin text-green-500" size={32} />
      </div>
    );
  }

  if (!session && location.pathname !== '/login' && !location.pathname.startsWith('/join/')) {
    return null;
  }

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/interaction', icon: Zap, label: '互动' },
    { path: '/moments', icon: Sparkles, label: '广场' },
    { path: '/profile', icon: User, label: '个人' },
  ];

  return (
    <div 
      className="flex flex-col h-screen max-w-md mx-auto shadow-2xl relative overflow-hidden transition-all duration-500"
      style={{ backgroundColor: themeConfig.bg }}
    >
      {/* Scrollable Content */}
      <main className={cn(
        "flex-1 overflow-y-auto scroll-smooth",
        isFullPage ? "pb-0" : "pb-32"
      )}>
        <Outlet />
      </main>

      {/* Tab Bar */}
      {!isFullPage && (
        <nav 
          className="absolute bottom-6 left-6 right-6 h-20 bg-black/90 backdrop-blur-xl border border-white/10 rounded-[32px] flex items-center justify-around px-6 pb-0 z-50 shadow-2xl"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 transition-all duration-300",
                  isActive ? "scale-110" : "opacity-40"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div 
                    className={cn(
                      "p-2 rounded-2xl transition-all duration-300",
                      isActive ? `bg-white text-black shadow-lg` : "text-white/60"
                    )}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest transition-colors duration-300",
                    isActive ? "text-white" : "text-white/40"
                  )}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
