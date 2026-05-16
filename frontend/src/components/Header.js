'use client'

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard, 
  ChevronDown,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Menu,
  X,
  Library,
  Zap,
  Target,
  Users,
  BookOpen,
  Mail,
  Info
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import FinlogicLogo from '@/components/FinlogicLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

const NavDropdown = ({ category, isDark, accentTextClass }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div 
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted transition-all ${accentTextClass} ${isOpen ? 'text-foreground' : ''}`}
      >
        {category.name}
        <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute left-1/2 -translate-x-1/2 mt-4 w-72 rounded-[2rem] bg-background border border-border-theme shadow-[0_48px_96px_-24px_rgba(0,0,0,0.3)] overflow-hidden p-2 z-[100] theme-transition"
          >
            <div className="grid gap-1">
              {category.links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="group/item flex items-start gap-4 p-4 rounded-2xl hover:bg-foreground/[0.03] transition-all"
                >
                  <div className={`mt-1 p-2 rounded-xl bg-foreground/[0.03] text-text-muted group-hover/item:text-ls-compliment group-hover/item:bg-ls-compliment/10 transition-all`}>
                    {link.icon}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover/item:text-ls-compliment transition-colors">
                      {link.name}
                    </p>
                    <p className="text-[9px] leading-relaxed text-text-muted/60 font-medium">
                      {link.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Header() {
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const categories = [
    {
      name: 'Platform',
      links: [
        { name: 'Idea Validator', href: '/validate', icon: <Zap size={14} />, description: 'Institutional framework for project viability.' },
        ...(!user ? [
          { name: 'Entrepreneurs', href: '/for-entrepreneurs', icon: <Briefcase size={14} />, description: 'Scalability protocols and capital activation.' },
          { name: 'Investors', href: '/for-investors', icon: <TrendingUp size={14} />, description: 'Private mandates and strategic alignment.' }
        ] : [])
      ]
    },
    {
      name: 'Intelligence',
      links: [
        { name: 'Insights', href: '/insights', icon: <BookOpen size={14} />, description: 'Strategic perspectives on Nepal’s growth.' },
        { name: 'Philosophy', href: '/philosophy', icon: <Target size={14} />, description: 'The principles governing our vision.' },
      ]
    },
    {
      name: 'Firm',
      links: [
        { name: 'About Us', href: '/about', icon: <Info size={14} />, description: 'Orchestrating excellence since inception.' },
        { name: 'Contact', href: '/contact', icon: <Mail size={14} />, description: 'Establish bilateral communication.' },
      ]
    },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/auth/login';
    const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    if (roles.includes('super_admin')) return '/superadmin/dashboard';
    if (roles.includes('admin')) return '/gp/dashboard';
    if (roles.includes('entrepreneur')) return '/entrepreneur/dashboard';
    if (roles.includes('investor')) return '/lp/dashboard';
    if (roles.includes('gp_investor')) return '/gp-investor/dashboard';
    return '/';
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'entrepreneur': return <Briefcase size={14} className={isDark ? "text-ls-compliment" : "text-ls-secondary"} />;
      case 'investor': return <TrendingUp size={14} className="text-ls-secondary" />;
      case 'gp_investor': return <ShieldCheck size={14} className="text-[#8b5cf6]" />;
      case 'super_admin': return <ShieldCheck size={14} className="text-purple-400" />;
      case 'admin': return <ShieldCheck size={14} className="text-emerald-500" />;
      default: return null;
    }
  };

  const accentTextClass = isDark ? "hover:text-ls-compliment" : "hover:text-ls-secondary";
  const accentBgClass = isDark ? "bg-ls-compliment" : "bg-ls-secondary";
  const accentBadgeGradient = isDark ? "from-ls-compliment to-yellow-200" : "from-ls-secondary to-blue-300";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-theme bg-background/80 backdrop-blur-md text-foreground theme-transition print:hidden">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center group" aria-label="Finlogic Capital Home">
          <FinlogicLogo size={44} variant="full" className="block" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden space-x-12 xl:flex items-center">
          {categories.map((category) => (
            <NavDropdown 
              key={category.name} 
              category={category} 
              isDark={isDark} 
              accentTextClass={accentTextClass} 
            />
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-6">
          <ThemeToggle />
          
          <div className="h-6 w-px bg-border-theme hidden sm:block" />

          {user ? (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 pl-2 pr-2 py-1.5 rounded-full bg-foreground/[0.03] border border-border-theme hover:bg-foreground/[0.08] transition-all active:scale-95 theme-transition group"
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${accentBadgeGradient} flex items-center justify-center text-white shadow-lg`}>
                  <UserIcon size={16} strokeWidth={3} />
                </div>
                <div className="hidden sm:block text-left mr-1">
                  <p className="text-[10px] font-black leading-tight truncate max-w-[100px] uppercase tracking-tighter">
                    {user.first_name || user.username}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getRoleIcon(user.role)}
                    <span className="text-[8px] uppercase font-black tracking-widest text-text-muted/60">
                      {user.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <ChevronDown size={14} className={`text-text-muted transition-transform duration-500 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-64 rounded-[2.5rem] bg-background border border-border-theme shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] overflow-hidden p-4 z-[100] theme-transition"
                  >
                    <div className="px-5 py-4 border-b border-border-theme/50 mb-3 sm:hidden">
                      <p className="text-xs font-black truncate uppercase tracking-tight">{user.email}</p>
                      <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mt-1">{user.role}</p>
                    </div>
                    
                    <Link 
                      href={getDashboardLink()}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-foreground hover:bg-foreground/[0.03] rounded-2xl transition-all"
                    >
                      <LayoutDashboard size={18} className={isDark ? "text-ls-compliment" : "text-ls-secondary"} />
                      Dashboard
                    </Link>
                    
                    <Link 
                      href="/auth/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-foreground hover:bg-foreground/[0.03] rounded-2xl transition-all"
                    >
                      <UserIcon size={18} className={isDark ? "text-ls-compliment" : "text-ls-secondary"} />
                      Security
                    </Link>

                    {user && (
                      <Link 
                        href="/wisdom-hub"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-ls-compliment' : 'text-ls-secondary'} hover:bg-foreground/[0.03] rounded-2xl transition-all`}
                      >
                        <Library size={18} />
                        My Library
                      </Link>
                    )}

                    <div className="h-px bg-border-theme my-3 mx-2 opacity-50" />

                    <button 
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-all"
                    >
                      <LogOut size={18} />
                      Terminate Session
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link href="/auth/login" className={`hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted transition-all ${accentTextClass}`}>
                Access
              </Link>
              <Link 
                href="/auth/register" 
                className={`rounded-xl ${accentBgClass} px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-[1.05] shadow-2xl ${isDark ? 'shadow-ls-compliment/20' : 'shadow-ls-secondary/20'} active:scale-95`}
              >
                Join Network
              </Link>
            </div>
          )}
          
          {/* Mobile Menu Toggle Button */}
          <button
            className="xl:hidden p-3 bg-foreground/5 rounded-xl text-text-muted hover:text-foreground transition-all"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden border-t border-border-theme bg-background/98 backdrop-blur-xl overflow-hidden"
          >
            <nav className="flex flex-col px-6 py-10 space-y-4">
              {categories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === category.name ? null : category.name)}
                    className="w-full flex items-center justify-between py-4 text-xl font-black uppercase tracking-tight text-foreground transition-all"
                  >
                    {category.name}
                    <ChevronDown size={20} className={`transition-transform duration-300 ${activeAccordion === category.name ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {activeAccordion === category.name && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-foreground/[0.02] rounded-2xl"
                      >
                        <div className="flex flex-col p-4 space-y-4">
                          {category.links.map((link) => (
                            <Link
                              key={link.name}
                              href={link.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-4 py-2 group"
                            >
                              <div className="p-2 rounded-lg bg-foreground/5 text-text-muted group-hover:text-ls-compliment transition-colors">
                                {link.icon}
                              </div>
                              <span className="text-sm font-bold uppercase tracking-widest text-text-muted group-hover:text-foreground transition-colors">
                                {link.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <div className="h-px bg-border-theme my-6" />

              {user ? (
                <div className="space-y-6">
                  <Link 
                    href={getDashboardLink()}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-xl font-black uppercase tracking-tight flex items-center gap-4 transition-all ${accentTextClass}`}
                  >
                    <LayoutDashboard size={24} className={isDark ? "text-ls-compliment" : "text-ls-secondary"} /> Dashboard
                  </Link>
                  <Link 
                    href="/wisdom-hub"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-xl font-black uppercase tracking-tight flex items-center gap-4 transition-all ${accentTextClass}`}
                  >
                    <Library size={24} className={isDark ? "text-ls-compliment" : "text-ls-secondary"} /> My Library
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-xl font-black uppercase tracking-tight text-rose-500 flex items-center gap-4 text-left"
                  >
                    <LogOut size={24} /> Terminate Session
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <Link 
                    href="/auth/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-2xl font-black uppercase tracking-tighter ${isDark ? 'text-ls-compliment' : 'text-ls-secondary'}`}
                  >
                    Access Portal
                  </Link>
                  <Link 
                    href="/auth/register" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block w-full py-5 rounded-2xl ${accentBgClass} text-center text-xl font-black uppercase tracking-widest text-white shadow-2xl`}
                  >
                    Join Network
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
