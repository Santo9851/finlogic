'use client'

/**
 * (gp)/layout.jsx
 * GP Staff Portal layout — dark sidebar + header.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Briefcase, PieChart, ShieldCheck,
  UserPlus, LogOut, Menu, X, ChevronRight, Files, User
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { PortalGuard } from '@/components/portal/PortalShell';
import { FinlogicLogo } from '@/components/FinlogicLogo';

const NAV = [
  { href: '/gp/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gp/deals', label: 'Deals', icon: Briefcase },
  { href: '/gp/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/gp/fund-admin/documents', label: 'Fund Admin', icon: Files },
  { href: '/gp/audit', label: 'Audit Log', icon: ShieldCheck },
  { href: '/gp/deals/invite', label: 'Invite Entrepreneur', icon: UserPlus },
  { href: '/gp/profile', label: 'Profile Settings', icon: User },
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
          bg-[#08001a] border-r border-white/8
          transition-all duration-300 ease-in-out
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'w-64'}
          lg:static lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
          <div className="w-8 h-8 rounded-lg bg-[#F59F01]/10 flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 rounded-sm bg-[#F59F01]" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-white font-bold text-sm leading-none">Finlogic</p>
              <p className="text-[#F59F01] text-[10px] uppercase tracking-widest mt-0.5">GP Portal</p>
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
                    ? 'bg-[#F59F01]/15 text-[#F59F01]'
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
        <GPSidebarFooter collapsed={collapsed} />
      </aside>
    </>
  );
}

function GPSidebarFooter({ collapsed }) {
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

export default function GPLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PortalGuard allowedRoles={['admin', 'super_admin']}>
      <div className="flex h-screen bg-[#060010] overflow-hidden">
        <Sidebar
          collapsed={!sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="h-14 flex items-center gap-3 px-4 border-b border-white/8 bg-[#08001a]/80 backdrop-blur flex-shrink-0">
            <button
              className="lg:hidden text-white/60 hover:text-white p-1"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-[#F59F01] bg-[#F59F01]/10 px-2.5 py-1 rounded-full font-medium">
                GP Staff
              </span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </PortalGuard>
  );
}
