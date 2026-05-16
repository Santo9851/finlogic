'use client'

/**
 * (gp)/layout.jsx
 * GP Staff Portal layout — dark sidebar + header.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Briefcase, PieChart, ShieldCheck,
  UserPlus, LogOut, Menu, X, ChevronDown, Files, User, FileText, Settings, HelpCircle, ArrowLeftRight, Library, CircleDollarSign
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { PortalGuard } from '@/components/portal/PortalShell';
import FinlogicLogo from '@/components/FinlogicLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';
import ProfileDropdown from '@/components/portal/ProfileDropdown';
import { motion } from 'framer-motion';

const NAV = [
  { href: '/gp/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gp/deals', label: 'Deals', icon: Briefcase },
  { 
    label: 'Portfolio', 
    href: '/gp/portfolio',
    icon: PieChart,
    children: [
      { href: '/gp/portfolio/analytics', label: 'Analytics' },
      { href: '/gp/portfolio/waterfall', label: 'Waterfall' },
      { href: '/gp/portfolio/valuations', label: 'Valuations' },
      { href: '/gp/portfolio/exit-planning', label: 'Exit Planning' },
      { href: '/gp/governance', label: 'Governance' },
      { href: '/gp/compliance', label: 'Compliance' },
    ]
  },
  { href: '/gp/fund-admin/drawdowns', label: 'Drawdown Management', icon: CircleDollarSign },
  { href: '/gp/fund-admin/documents', label: 'Fund Admin', icon: Files },
  { href: '/gp/ir-documents', label: 'Shareholder IR', icon: FileText },
  { href: '/gp/audit', label: 'Audit Log', icon: ShieldCheck },
  { href: '/gp/deals/invite', label: 'Invite Entrepreneur', icon: UserPlus },
  { href: '/gp/profile', label: 'Profile Settings', icon: User },
];

function Sidebar({ collapsed, onClose }) {
  const pathname = usePathname();
  const router = require('next/navigation').useRouter();
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const [openSection, setOpenSection] = useState('Portfolio');

  const isDark = resolvedTheme === 'dark';

  return (
    <>
      {/* Mobile backdrop */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm transition-all"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen z-40
          flex flex-col
          bg-ls-primary border-r border-ls-white/5
          transition-all duration-300 ease-in-out
          overflow-x-hidden shadow-2xl
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'w-72'}
          lg:static lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-8 border-b border-ls-white/5">
           <FinlogicLogo size={32} variant={collapsed ? "icon" : "full"} darkBg={true} />
           {!collapsed && (
             <span className="text-ls-compliment text-[8px] font-black uppercase tracking-[0.4em] mt-1 ml-auto border border-ls-compliment/20 px-2 py-1">GP Staff</span>
           )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-8 px-3 overflow-y-auto space-y-1">
          {NAV.map((item) => {
            if (item.children) {
              const isOpen = openSection === item.label;
              const hasActiveChild = item.children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'));
              
              return (
                <div key={item.label} className="mb-2">
                  <button
                    onClick={() => {
                      if (item.href) router.push(item.href);
                      setOpenSection(isOpen ? null : item.label);
                    }}
                    className={`
                      w-full flex items-center gap-4 px-5 py-4 transition-all group relative
                      ${hasActiveChild || (item.href && pathname === item.href) ? 'text-ls-compliment' : 'text-ls-white/40 hover:text-ls-white hover:bg-ls-white/5'}
                    `}
                  >
                    {hasActiveChild && !collapsed && (
                      <motion.div 
                        layoutId="nav-indicator-gp"
                        className="absolute left-0 w-1 h-6 bg-ls-compliment" 
                      />
                    )}
                    <item.icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{item.label}</span>}
                    {!collapsed && (
                      <ChevronDown 
                        size={12} 
                        className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </button>
                  
                  {isOpen && !collapsed && (
                    <div className="mt-2 ml-10 border-l border-ls-white/10 space-y-1">
                      {item.children.map((child) => {
                        const active = pathname === child.href || pathname.startsWith(child.href + '/');
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => {
                              if (window.innerWidth < 1024) onClose();
                            }}
                            className={`
                              block px-6 py-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all
                              ${active ? 'text-ls-compliment bg-ls-compliment/5' : 'text-ls-white/30 hover:text-ls-white'}
                            `}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  relative flex items-center gap-4 px-5 py-4 transition-all group
                  ${active
                    ? 'text-ls-compliment'
                    : 'text-ls-white/40 hover:text-ls-white hover:bg-ls-white/5'}
                `}
              >
                {active && !collapsed && (
                   <div className="absolute left-0 w-1 h-6 bg-ls-compliment" />
                )}
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-ls-white/5">
           {!collapsed && user && (
             <div className="mb-6 flex items-center gap-4">
                <div className="w-10 h-10 border border-ls-white/10 flex items-center justify-center text-ls-compliment">
                   <User size={18} />
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-bold text-ls-white truncate uppercase tracking-widest">{user.first_name || user.username}</p>
                   <p className="text-[8px] font-bold text-ls-white/30 truncate uppercase tracking-widest">{user.email}</p>
                </div>
             </div>
           )}
           <button 
             onClick={logout}
             className="flex items-center gap-3 text-[9px] font-bold text-ls-white/20 hover:text-red-400 uppercase tracking-[0.4em] transition-colors w-full group"
           >
             <LogOut size={14} className="group-hover:translate-x-1 transition-transform" />
             {!collapsed && <span>Sign Out Protocol</span>}
           </button>
        </div>
      </aside>
    </>
  );
}

function GPSidebarFooter({ collapsed }) {
  const { user, logout } = useAuth();
  return (
    <div className="border-t border-border-theme p-4">
      {!collapsed && user && (
        <div className="mb-3">
          <p className="text-foreground text-sm font-medium truncate">{user.first_name || user.username} {user.last_name}</p>
          <p className="text-text-muted text-xs truncate">{user.email}</p>
        </div>
      )}
      <button
        onClick={logout}
        className="flex items-center gap-2 text-text-muted hover:text-red-400 text-sm transition-colors w-full"
      >
        <LogOut size={16} />
        {!collapsed && <span>Sign out</span>}
      </button>
    </div>
  );
}

export default function GPLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  return (
    <PortalGuard allowedRoles={['admin', 'super_admin']}>
      <div className="flex h-screen bg-background overflow-hidden theme-transition">
        <Sidebar
          collapsed={!sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="h-16 flex items-center gap-3 px-4 border-b border-border-theme bg-card/80 backdrop-blur flex-shrink-0 z-[100] theme-transition">
            <button
              className="lg:hidden text-text-muted hover:text-ls-primary dark:hover:text-white p-1"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-4 ml-auto relative">
              <ThemeToggle />
              
              <div className="h-6 w-px bg-border-theme hidden sm:block" />

              {/* Profile Dropdown */}
              <ProfileDropdown 
                profileOpen={profileOpen} 
                setProfileOpen={setProfileOpen} 
                roleLabel="GP Staff"
                rolePath="/gp/profile"
                roleColor="bg-[#F59F01]"
                roleText="text-[#F59F01]"
              />
            </div>
          </header>

          {/* Page content */}
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
