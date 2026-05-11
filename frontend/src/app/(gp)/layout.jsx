'use client'

/**
 * (gp)/layout.jsx
 * GP Staff Portal layout — dark sidebar + header.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Briefcase, PieChart, ShieldCheck,
  UserPlus, LogOut, Menu, X, ChevronDown, Files, User, FileText, Settings, HelpCircle, ArrowLeftRight, Library
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { PortalGuard } from '@/components/portal/PortalShell';
import FinlogicLogo from '@/components/FinlogicLogo';

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
  { href: '/gp/fund-admin/documents', label: 'Fund Admin', icon: Files },
  { href: '/gp/ir-documents', label: 'Shareholder IR', icon: FileText },
  { href: '/gp/audit', label: 'Audit Log', icon: ShieldCheck },
  { href: '/gp/deals/invite', label: 'Invite Entrepreneur', icon: UserPlus },
  { href: '/gp/profile', label: 'Profile Settings', icon: User },
];

function Sidebar({ collapsed, onClose }) {
  const pathname = usePathname();
  const router = require('next/navigation').useRouter();
  const [openSection, setOpenSection] = useState('Portfolio');

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
          bg-[#140b2e] border-r border-white/8
          transition-all duration-300 ease-in-out
          overflow-x-hidden
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'w-64'}
          lg:static lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
           <FinlogicLogo size={32} variant={collapsed ? "icon" : "full"} darkBg={true} />
           {!collapsed && (
             <span className="text-[#F59F01] text-[10px] font-black uppercase tracking-widest mt-1 ml-auto">GP Staff</span>
           )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map((item) => {
            if (item.children) {
              const isOpen = openSection === item.label;
              const hasActiveChild = item.children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'));
              
              return (
                <div key={item.label} className="mb-1">
                  <button
                    onClick={() => {
                      if (item.href) router.push(item.href);
                      setOpenSection(isOpen ? null : item.label);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                      text-sm font-medium transition-all group
                      ${hasActiveChild || (item.href && pathname === item.href) ? 'text-[#F59F01]' : 'text-white/50 hover:text-white'}
                    `}
                  >
                    <item.icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.children && (
                      <ChevronDown 
                        size={14} 
                        className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </button>
                  
                  {isOpen && !collapsed && (
                    <div className="mt-1 ml-9 space-y-1">
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
                              block px-4 py-2 rounded-lg text-xs font-medium transition-all
                              ${active ? 'text-[#F59F01] bg-[#F59F01]/10' : 'text-white/30 hover:text-white/60'}
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
                  flex items-center gap-3 px-4 py-3 mx-2 rounded-lg mb-1
                  text-sm font-medium transition-all group
                  ${active
                    ? 'bg-[#F59F01]/15 text-[#F59F01]'
                    : 'text-white/50 hover:text-white hover:bg-white/5'}
                `}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && active && <ChevronDown size={14} className="ml-auto -rotate-90" />}
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
          <p className="text-white/80 text-sm font-medium truncate">{user.first_name || user.username} {user.last_name}</p>
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
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <PortalGuard allowedRoles={['admin', 'super_admin']}>
      <div className="flex h-screen bg-[#100226] overflow-hidden">
        <Sidebar
          collapsed={!sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="h-14 flex items-center gap-3 px-4 border-b border-white/8 bg-[#140b2e]/80 backdrop-blur flex-shrink-0">
            <button
              className="lg:hidden text-white/60 hover:text-white p-1"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-4 ml-auto relative">
              {/* Profile Dropdown */}
              <div 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 px-3 py-1.5 bg-white/5 border border-white/8 rounded-full hover:bg-white/10 transition-all cursor-pointer active:scale-95"
              >
                <div className="w-6 h-6 rounded-full bg-[#F59F01] flex items-center justify-center text-[10px] font-black text-black">
                  {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[11px] text-white font-bold leading-tight">{user?.first_name || user?.username}</p>
                  <p className="text-[9px] text-[#F59F01] uppercase tracking-tighter leading-none">GP Staff</p>
                </div>
                <ChevronDown className={`w-3 h-3 text-white/20 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </div>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#140b2e] border border-white/8 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                    <Link 
                      href="/gp/profile" 
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                      <User size={14} /> Profile Settings
                    </Link>
                    <Link 
                      href="/wisdom-hub" 
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#F59F01] hover:text-[#F59F01]/80 hover:bg-white/5 rounded-xl transition-all"
                    >
                      <Library size={14} /> My Library
                    </Link>
                    <Link 
                      href="/" 
                      className="flex items-center gap-3 px-4 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                      <ArrowLeftRight size={14} /> Switch Portal
                    </Link>
                    <div className="h-px bg-white/5 my-1" />
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-rose-400/60 hover:text-rose-400 hover:bg-rose-400/5 rounded-xl transition-all"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </>
              )}
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
