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
  X
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import FinlogicLogo from '@/components/FinlogicLogo';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Investment Philosophy', href: '/philosophy' },
    { name: 'Insights', href: '/insights' },
    { name: 'Contact', href: '/contact' },
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
    
    // Check roles (handle both single role string and array)
    const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    
    if (roles.includes('super_admin') || roles.includes('admin')) return '/gp/dashboard';
    if (roles.includes('gp_investor')) return '/gp-investor/dashboard';
    if (roles.includes('investor')) return '/lp/dashboard';
    if (roles.includes('entrepreneur')) return '/entrepreneur/dashboard';
    
    return '/';
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'entrepreneur': return <Briefcase size={14} className="text-[#F59F01]" />;
      case 'investor': return <TrendingUp size={14} className="text-blue-400" />;
      case 'gp_investor': return <ShieldCheck size={14} className="text-[#8b5cf6]" />;
      case 'admin':
      case 'super_admin': return <ShieldCheck size={14} className="text-green-400" />;
      default: return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#100226]/80 backdrop-blur-md text-white">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center group" aria-label="Finlogic Capital Home">
          <FinlogicLogo size={44} variant="full" darkBg={true} />
        </Link>


        {/* Navigation */}
        <nav className="hidden space-x-8 xl:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-[#F59F01]"
            >
              {link.name}
            </Link>
          ))}
          {!user && (
            <>
              <Link href="/entrepreneurs" className="text-sm font-medium text-white/70 hover:text-[#F59F01] transition-colors">For Entrepreneurs</Link>
              <Link href="/investors" className="text-sm font-medium text-white/70 hover:text-[#F59F01] transition-colors">For Investors</Link>
            </>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F59F01] to-yellow-200 flex items-center justify-center text-[#100226]">
                  <UserIcon size={18} />
                </div>
                <div className="hidden sm:block text-left mr-1">
                  <p className="text-xs font-bold leading-tight truncate max-w-[100px]">
                    {user.first_name || user.username}
                  </p>
                  <div className="flex items-center gap-1">
                    {getRoleIcon(user.role)}
                    <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                      {user.role}
                    </span>
                  </div>
                </div>
                <ChevronDown size={14} className={`text-white/40 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#1a0b36] border border-white/10 shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-white/5 mb-2 sm:hidden">
                    <p className="text-sm font-bold truncate">{user.email}</p>
                    <p className="text-xs text-white/40 capitalize">{user.role}</p>
                  </div>
                  
                  <Link 
                    href={getDashboardLink()}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LayoutDashboard size={16} />
                    My Dashboard
                  </Link>
                  
                  <Link 
                    href="/auth/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <UserIcon size={16} />
                    Profile Settings
                  </Link>

                  <div className="h-px bg-white/5 my-2 mx-2" />

                  <button 
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:block text-sm font-semibold text-white/70 hover:text-[#F59F01] transition-colors">
                Login
              </Link>
              <Link 
                href="/auth/register" 
                className="rounded-full bg-[#F59F01] px-6 py-2 text-sm font-bold text-[#100226] transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#F59F01]/20 active:scale-95"
              >
                Sign Up
              </Link>
            </>
          )}
          
          {/* Always show Submit button for entrepreneurs or non-logged in */}
          {(!user || user.role === 'entrepreneur') && (
            <Link 
              href="/entrepreneurs/submit"
              className="hidden lg:flex items-center gap-2 rounded-full border border-[#F59F01]/30 px-6 py-2 text-sm font-bold text-[#F59F01] transition-all hover:bg-[#F59F01] hover:text-[#100226] hover:border-[#F59F01]"
            >
              Submit Project
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="xl:hidden ml-4 p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
            className="xl:hidden border-t border-white/10 bg-[#100226]/95 backdrop-blur-md overflow-hidden"
          >
            <nav className="flex flex-col px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium text-white/80 hover:text-[#F59F01]"
                >
                  {link.name}
                </Link>
              ))}
              {!user && (
                <>
                  <Link 
                    href="/entrepreneurs" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium text-white/80 hover:text-[#F59F01]"
                  >
                    For Entrepreneurs
                  </Link>
                  <Link 
                    href="/investors" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium text-white/80 hover:text-[#F59F01]"
                  >
                    For Investors
                  </Link>
                </>
              )}
              {(!user || user.role === 'entrepreneur') && (
                <Link 
                  href="/entrepreneurs/submit"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex justify-center items-center gap-2 rounded-full border border-[#F59F01]/30 px-6 py-3 mt-4 text-sm font-bold text-[#F59F01] transition-all hover:bg-[#F59F01] hover:text-[#100226]"
                >
                  Submit Project
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
