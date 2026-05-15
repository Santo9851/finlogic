'use client'

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { PortalGuard } from '@/components/portal/PortalShell';
import FinlogicLogo from '@/components/FinlogicLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';
import ProfileDropdown from '@/components/portal/ProfileDropdown';

const NAV = [
  { href: '/entrepreneur/dashboard', label: 'My Submissions', icon: LayoutDashboard },
  { href: '/entrepreneur/profile', label: 'Profile Settings', icon: User },
];

export default function EntrepreneurLayout({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isDark = resolvedTheme === 'dark';

  return (
    <PortalGuard allowedRoles={['entrepreneur']}>
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
          fixed lg:static inset-y-0 left-0 z-50 w-64 lg:w-56 flex-shrink-0 flex flex-col bg-card border-r border-border-theme transition-transform duration-300 ease-in-out overflow-x-hidden theme-transition
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="px-4 py-5 border-b border-border-theme flex items-center justify-between">
             <FinlogicLogo size={32} variant="full" darkBg={isDark} />
             <button className="lg:hidden text-text-muted p-1" onClick={() => setIsMobileMenuOpen(false)}>
               <X size={20} />
             </button>
          </div>
          <nav className="flex-1 py-4">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-1 text-sm font-medium transition-all ${
                    active ? 'bg-[#F59F01]/15 text-[#F59F01]' : 'text-text-muted hover:text-ls-primary dark:hover:text-white hover:bg-ls-primary/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border-theme p-4">
            {user && (
              <div className="mb-3">
                <p className="text-foreground text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
                <p className="text-text-muted text-xs truncate">{user.email}</p>
              </div>
            )}
            <button onClick={logout} className="flex items-center gap-2 text-text-muted hover:text-red-400 text-sm transition-colors">
              <LogOut size={15} /> Sign out
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
                roleLabel="Founder"
                rolePath="/entrepreneur/profile"
                roleColor="bg-[#F59F01]"
                roleText="text-[#F59F01]"
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
