'use client'

/**
 * (gp-investor)/layout.jsx – GP Investor Portal sidebar layout
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Calendar, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { PortalGuard } from '@/components/portal/PortalShell';

const NAV = [
  { href: '/gp-investor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gp-investor/documents', label: 'IR Documents', icon: FileText },
  { href: '/gp-investor/meetings', label: 'Meetings', icon: Calendar },
  { href: '/gp-investor/profile', label: 'Profile Settings', icon: Settings },
];

export default function GPInvestorLayout({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <PortalGuard allowedRoles={['gp_investor']}>
      <div className="flex h-screen bg-[#060010] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 flex flex-col bg-[#08001a] border-r border-white/8">
          <div className="px-4 py-5 border-b border-white/8">
            <p className="text-white font-bold text-sm">Finlogic</p>
            <p className="text-[#16c784] text-[10px] uppercase tracking-widest mt-0.5">GP Investor</p>
          </div>
          <nav className="flex-1 py-4">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-1 text-sm font-medium transition-all ${
                    active ? 'bg-[#16c784]/15 text-[#16c784]' : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/8 p-4">
            {user && (
              <div className="mb-3">
                <p className="text-white/80 text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
                <p className="text-white/30 text-xs truncate">{user.email}</p>
              </div>
            )}
            <button onClick={logout} className="flex items-center gap-2 text-white/40 hover:text-red-400 text-sm transition-colors">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center px-6 border-b border-white/8 bg-[#08001a]/80 backdrop-blur flex-shrink-0">
            <span className="ml-auto text-xs text-[#16c784] bg-[#16c784]/10 px-2.5 py-1 rounded-full font-medium">
              GP Investor
            </span>
          </header>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </PortalGuard>
  );
}
