'use client'

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PieChart, FileText, LogOut, User, Menu, X, TrendingUp, ChevronDown, Library, ArrowLeftRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { PortalGuard } from '@/components/portal/PortalShell';
import FinlogicLogo from '@/components/FinlogicLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';
import ProfileDropdown from '@/components/portal/ProfileDropdown';
import { motion } from 'framer-motion';

const NAV = [
  { href: '/lp/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lp/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/lp/distributions', label: 'Distributions', icon: TrendingUp },
  { href: '/lp/documents', label: 'Documents', icon: FileText },
  { href: '/lp/profile', label: 'Profile & KYC', icon: User },
];

export default function LPLayout({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isDark = resolvedTheme === 'dark';

  return (
    <PortalGuard allowedRoles={['investor']}>
      <div className="flex h-screen bg-background overflow-hidden relative theme-transition">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 flex-shrink-0 flex flex-col bg-ls-primary border-r border-ls-white/5 transition-transform duration-300 ease-in-out overflow-x-hidden shadow-2xl
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="px-8 py-10 border-b border-ls-white/5 flex items-center justify-between">
             <FinlogicLogo size={36} variant="full" darkBg={true} />
             <button className="lg:hidden text-ls-white/40 p-1" onClick={() => setIsMobileMenuOpen(false)}>
               <X size={20} />
             </button>
          </div>
          <nav className="flex-1 py-12 px-4 space-y-2">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`relative flex items-center gap-5 px-6 py-4 transition-all group ${
                    active 
                      ? 'text-ls-compliment' 
                      : 'text-ls-white/40 hover:text-ls-white hover:bg-ls-white/5'
                  }`}
                >
                  {active && (
                    <motion.div 
                      layoutId="nav-indicator-lp"
                      className="absolute left-0 w-1 h-8 bg-ls-compliment" 
                    />
                  )}
                  <Icon size={18} className={`${active ? 'text-ls-compliment' : 'group-hover:text-ls-compliment'} transition-colors`} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em]">{label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-8 border-t border-ls-white/5">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 border border-ls-white/10 flex items-center justify-center text-ls-compliment">
                   <ShieldCheck size={20} />
                </div>
                <div>
                   <p className="text-[9px] font-bold text-ls-white/60 uppercase tracking-widest">Auth Level</p>
                   <p className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.3em]">Institutional LP</p>
                </div>
             </div>
             <button 
               onClick={logout}
               className="flex items-center gap-3 text-[9px] font-bold text-ls-white/20 hover:text-red-400 uppercase tracking-[0.4em] transition-colors w-full group"
             >
               <LogOut size={14} className="group-hover:translate-x-1 transition-transform" />
               Sign Out Protocol
             </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 w-full h-full relative">
          <header className="h-16 flex items-center px-4 lg:px-6 border-b border-border-theme bg-card/80 backdrop-blur sticky top-0 z-[100] theme-transition">
            <button 
              className="lg:hidden p-2 -ml-2 text-text-muted hover:text-ls-primary dark:hover:text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2 ml-4 lg:ml-0">
               <div className="lg:hidden">
                 <FinlogicLogo size={28} variant="full" darkBg={isDark} />
               </div>
            </div>

            <div className="ml-auto flex items-center gap-4 relative">
              <ThemeToggle />
              <div className="h-6 w-px bg-border-theme hidden sm:block" />

              {/* Profile Dropdown */}
              <ProfileDropdown 
                profileOpen={profileOpen} 
                setProfileOpen={setProfileOpen} 
                roleLabel="Investor"
                rolePath="/lp/profile"
                roleColor="bg-blue-500"
                roleText="text-blue-600 dark:text-blue-400"
              />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </PortalGuard>
  );
}
