'use client'

/**
 * (superadmin)/layout.jsx
 * Superadmin Portal layout — purple/gold theme.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Briefcase, ShieldCheck,
  Activity, BookOpen, LogOut, Menu, X, ChevronRight, FileText, BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { PortalGuard } from '@/components/portal/PortalShell';

const NAV = [
  { href: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/users', label: 'Users', icon: Users },
  { href: '/superadmin/funds', label: 'Funds', icon: Briefcase },
  { href: '/superadmin/prompts', label: 'Prompt Library', icon: BookOpen },
  { href: '/superadmin/audit', label: 'Audit Logs', icon: Activity },
  { href: '/superadmin/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/superadmin/analytics', label: 'Analytics', icon: BarChart3 },
];

function Sidebar({ collapsed, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen z-40
          flex flex-col
          bg-[#0d0124] border-r border-white/8
          transition-all duration-300 ease-in-out
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'w-64'}
          lg:static lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 rounded-sm bg-purple-500" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-white font-bold text-sm leading-none">Finlogic</p>
              <p className="text-purple-400 text-[10px] uppercase tracking-widest mt-0.5">Superadmin</p>
            </div>
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
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-white/50 hover:text-white hover:bg-white/5'}
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
    <div className="border-t border-white/8 p-4">
      {!collapsed && user && (
        <div className="mb-3">
          <p className="text-white/80 text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
          <p className="text-white/30 text-xs truncate">{user.email}</p>
        </div>
      )}
      <button
        onClick={logout}
        className="flex items-center gap-2 text-white/40 hover:text-red-400 text-sm transition-colors w-full"
      >
        <LogOut size={16} />
        {!collapsed && <span>Sign out</span>}
      </button>
    </div>
  );
}

export default function SuperadminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PortalGuard allowedRoles={['super_admin']}>
      <div className="flex h-screen bg-[#060010] overflow-hidden">
        <Sidebar
          collapsed={!sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="h-14 flex items-center gap-3 px-4 border-b border-white/8 bg-[#0d0124]/80 backdrop-blur flex-shrink-0">
            <button
              className="lg:hidden text-white/60 hover:text-white p-1"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full font-medium border border-purple-500/20">
                System Master
              </span>
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
