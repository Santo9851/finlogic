'use client'

/**
 * (superadmin)/layout.jsx
 * Superadmin Portal layout — purple/gold theme.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Briefcase, ShieldCheck,
  Activity, BookOpen, LogOut, Menu, X, ChevronDown, FileText, BarChart3, User, Library, ArrowLeftRight,
  CircleDollarSign, ChevronRight, FileSearch
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { PortalGuard } from '@/components/portal/PortalShell';
import FinlogicLogo from '@/components/FinlogicLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';
import ProfileDropdown from '@/components/portal/ProfileDropdown';

const NAV = [
  { href: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/users', label: 'Users', icon: Users },
  { href: '/superadmin/funds', label: 'Funds', icon: Briefcase },
  { href: '/superadmin/deals', label: 'Deals', icon: FileText },
  { href: '/superadmin/capital-calls', label: 'Capital Calls', icon: CircleDollarSign },
  { href: '/superadmin/prompts', label: 'Prompt Library', icon: BookOpen },
  { href: '/superadmin/audit', label: 'Audit Logs', icon: Activity },
  { href: '/superadmin/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/superadmin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/superadmin/validations', label: 'Validator', icon: FileSearch },
];

function Sidebar({ collapsed, onClose }) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

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
          bg-card border-r border-border-theme
          transition-all duration-300 ease-in-out
          overflow-x-hidden theme-transition
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'w-64'}
          lg:static lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border-theme">
           <FinlogicLogo size={32} variant={collapsed ? "icon" : "full"} darkBg={isDark} />
           {!collapsed && (
             <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest mt-1 ml-auto">Admin</span>
           )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 mx-2 rounded-lg mb-1
                  text-sm font-medium transition-all group
                  ${active
                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                    : 'text-text-muted hover:text-ls-primary dark:hover:text-white hover:bg-ls-primary/5 dark:hover:bg-white/5'}
                `}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
                {!collapsed && active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <SuperadminSidebarFooter collapsed={collapsed} />
      </aside>
    </>
  );
}

function SuperadminSidebarFooter({ collapsed }) {
  const { user, logout } = useAuth();
  return (
    <div className="border-t border-border-theme p-4">
      {!collapsed && user && (
        <div className="mb-3">
          <p className="text-foreground text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
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

export default function SuperadminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <PortalGuard allowedRoles={['super_admin']}>
      <div className="flex h-screen bg-background overflow-hidden theme-transition">
        <Sidebar
          collapsed={!sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="h-14 flex items-center gap-3 px-4 border-b border-border-theme bg-card/80 backdrop-blur flex-shrink-0 z-40 theme-transition">
            <button
              className="lg:hidden text-text-muted hover:text-ls-primary dark:hover:text-white p-1"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="ml-auto flex items-center gap-4 relative">
              <ThemeToggle />
              <div className="h-6 w-px bg-border-theme hidden sm:block" />

              {/* Profile Dropdown */}
              <ProfileDropdown 
                profileOpen={profileOpen} 
                setProfileOpen={setProfileOpen} 
                roleLabel="Superadmin"
                rolePath="/superadmin/profile"
                roleColor="bg-purple-500"
                roleText="text-purple-600 dark:text-purple-400"
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
