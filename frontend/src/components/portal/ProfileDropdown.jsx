'use client'

/**
 * components/portal/ProfileDropdown.jsx
 * Unified high-fidelity profile dropdown used across all portal headers.
 */
import Link from 'next/link';
import { 
  User, 
  LogOut, 
  ChevronDown, 
  Library, 
  ArrowLeftRight 
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileDropdown({ 
  profileOpen, 
  setProfileOpen, 
  roleLabel = 'User', 
  roleColor = 'bg-[#F59F01]', 
  roleText = 'text-[#F59F01]',
  rolePath = null 
}) {
  const { user, logout } = useAuth();
  const accountPath = rolePath || `/${roleLabel.toLowerCase().replace(' ', '-')}/profile`;

  return (
    <div className="relative">
      <div 
        onClick={() => setProfileOpen(!profileOpen)}
        className="flex items-center gap-3 px-3 py-1.5 bg-foreground/5 border border-border-theme rounded-full hover:bg-foreground/10 transition-all cursor-pointer active:scale-95 theme-transition group"
      >
        <div className={`w-7 h-7 rounded-full ${roleColor} flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-black/10`}>
          {user?.first_name?.[0] || user?.username?.[0] || 'U'}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-[11px] text-foreground font-bold leading-tight uppercase tracking-tight">{user?.first_name || user?.username}</p>
          <p className={`text-[8px] ${roleText} uppercase font-black tracking-[0.1em] leading-none mt-0.5 opacity-80`}>{roleLabel}</p>
        </div>
        <ChevronDown size={14} className={`text-text-muted transition-transform duration-500 ${profileOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {profileOpen && (
          <>
            {/* Backdrop for mobile/outside clicks if needed, though usually handled by parent useEffect */}
            <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setProfileOpen(false)} />
            
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-4 w-60 bg-card border border-border-theme rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] z-[110] p-3 overflow-hidden theme-transition"
            >
              <div className="px-5 py-4 border-b border-border-theme/50 mb-2 sm:hidden">
                <p className="text-xs font-black truncate uppercase tracking-tight">{user?.email}</p>
                <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mt-1">{roleLabel}</p>
              </div>

              <Link 
                href={accountPath}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-foreground hover:bg-foreground/[0.03] rounded-2xl transition-all"
              >
                <User size={16} /> 
                Account Control
              </Link>

              <Link 
                href="/wisdom-hub" 
                onClick={() => setProfileOpen(false)}
                className={`flex items-center gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] ${roleText} hover:bg-foreground/[0.03] rounded-2xl transition-all`}
              >
                <Library size={16} /> 
                My Library
              </Link>

              <Link 
                href="/" 
                className="flex items-center gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-foreground hover:bg-foreground/[0.03] rounded-2xl transition-all"
              >
                <ArrowLeftRight size={16} /> 
                Switch Portal
              </Link>

              <div className="h-px bg-border-theme my-2 mx-2 opacity-50" />

              <button 
                onClick={logout}
                className="w-full flex items-center gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/80 hover:text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-all text-left"
              >
                <LogOut size={16} /> 
                Terminate Session
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
