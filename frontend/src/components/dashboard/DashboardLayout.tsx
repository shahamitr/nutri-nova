'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠', description: 'Overview' },
    { href: '/dashboard/diet-planning', label: 'Start Diet Planning', icon: '🎯', description: 'AI Consultation' },
    { href: '/dashboard/diet-plan', label: 'My Diet Plan', icon: '🍽️', description: 'Meal Schedule' },
    { href: '/dashboard/exercise-library', label: 'Exercise Library', icon: '💪', description: 'Workouts' },
    { href: '/dashboard/recipe-hub', label: 'Recipe Hub', icon: '🥗', description: 'Healthy Recipes' },
    { href: '/dashboard/wellness', label: 'Wellness', icon: '🧘', description: 'Mind & Body' },
    { href: '/dashboard/favorites', label: 'My Favorites', icon: '⭐', description: 'Saved Content' },
    { href: '/dashboard/memory', label: 'Memory', icon: '🧠', description: 'AI Remembers' },
    { href: '/dashboard/gamification', label: 'Achievements', icon: '🏆', description: 'Progress & Rewards' },
    { href: '/dashboard/health-metrics', label: 'Health Metrics', icon: '📊', description: 'BMI & Profile' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️', description: 'Preferences' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Logo & Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/25">
                N
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-800">NutriVoice</h1>
                <p className="text-xs text-teal-600 font-medium -mt-0.5">AI Diet Doctor</p>
              </div>
            </Link>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white/70 backdrop-blur-xl border-r border-slate-200/60 transition-all duration-300 ${
            sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-72 lg:w-72'
          }`}
        >
          {/* Collapse Toggle (Desktop) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
          >
            <svg
              className={`w-3 h-3 text-slate-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <nav className="p-3 space-y-1 overflow-y-auto h-full">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => window.innerWidth < 1024 && setSidebarCollapsed(true)}
                className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={`text-2xl flex-shrink-0 ${sidebarCollapsed ? 'lg:mx-auto' : ''}`}>
                  {item.icon}
                </span>
                <div className={`flex-1 min-w-0 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                  <p className={`font-medium truncate ${isActive(item.href) ? 'text-white' : ''}`}>
                    {item.label}
                  </p>
                  <p className={`text-xs truncate ${isActive(item.href) ? 'text-teal-100' : 'text-slate-400'}`}>
                    {item.description}
                  </p>
                </div>
                {isActive(item.href) && !sidebarCollapsed && (
                  <div className="w-1.5 h-8 bg-white/30 rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200/60 bg-white/50 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Powered by Amazon Nova AI</span>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {!sidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-0' : ''}`}>
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
