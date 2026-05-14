'use client'

import { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Globe, 
  Save,
  Loader2,
  Lock,
  BadgeCheck,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import api from '@/services/api';
import Link from 'next/link';
import { toast } from 'sonner';

export default function GPInvestorProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile/');
      setProfileData(res.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Could not load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-12 theme-transition">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Identity Registry...</p>
    </div>
  );

  return (
    <div className="space-y-20 animate-in fade-in duration-1000 pb-32 max-w-7xl mx-auto">
      {/* Header - Institutional Profile Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border-theme pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
            <User size={14} /> Shareholder Identity Registry
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
            Identity <span className="italic">Ledger</span>
          </h1>
          <p className="text-xl text-text-muted font-serif font-light italic max-w-xl">
            Management company shareholder credentials, equity vesting protocols, and secure archival of personal identification data.
          </p>
        </div>
        <div className="flex items-center gap-6 px-10 py-5 bg-border-theme/20 border border-border-theme shadow-sm">
           <div className="space-y-1 text-right">
             <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Identity Identifier</p>
             <p className="text-[9px] text-text-muted/40 font-bold uppercase tracking-widest font-mono">GP-SH-2075-AUTH</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        {/* Left Col - Profile Summary Dossier */}
        <div className="md:col-span-1 space-y-12">
          <div className="bg-card border border-border-theme p-10 shadow-2xl relative group overflow-hidden theme-transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-ls-compliment/5 blur-[50px] rounded-full -mr-12 -mt-12 pointer-events-none" />
            <div className="w-24 h-24 border border-ls-compliment/40 bg-ls-compliment/5 flex items-center justify-center mx-auto mb-8 transition-all group-hover:border-ls-compliment">
              <TrendingUp size={40} className="text-ls-compliment opacity-40 group-hover:opacity-100 transition-all" />
            </div>
            <h3 className="text-2xl font-serif font-light text-foreground text-center uppercase tracking-tight group-hover:text-ls-compliment transition-all">{user?.first_name} {user?.last_name}</h3>
            <p className="text-ls-compliment text-[9px] font-bold uppercase tracking-[0.5em] text-center mt-3">GP Shareholder Entity</p>
            
            <div className="mt-12 pt-12 border-t border-border-theme space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">Ownership Status</span>
                <span className="text-ls-up text-[9px] font-bold border border-ls-up/20 bg-ls-up/5 px-3 py-1 uppercase tracking-widest">Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">Vesting Status</span>
                <span className="text-foreground text-[11px] font-serif italic">FULLY_VESTED</span>
              </div>
            </div>
          </div>

          <div className="bg-ls-primary text-ls-white p-10 shadow-2xl relative overflow-hidden group border-l-4 border-ls-compliment">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-ls-compliment/10 blur-[60px] rounded-full -mr-16 -mb-16 pointer-events-none" />
            <h4 className="text-ls-compliment font-bold text-[10px] uppercase tracking-[0.5em] mb-6 flex items-center gap-4">
              <Briefcase size={14} className="text-ls-compliment" /> Management Privileges
            </h4>
            <p className="text-base font-serif italic text-ls-white/60 leading-relaxed">
              Shareholder status grants full archival access to Fund intelligence, IR repositories, and management company financial declarations.
            </p>
          </div>
        </div>

        {/* Right Col - Archival Form */}
        <div className="md:col-span-2 space-y-12">
          <form className="bg-card border border-border-theme shadow-2xl theme-transition overflow-hidden">
            <div className="px-12 py-10 border-b border-border-theme bg-border-theme/10">
              <h3 className="text-[10px] font-bold text-text-muted flex items-center gap-4 uppercase tracking-[0.5em]">
                <User size={16} className="text-ls-compliment" /> Registry Ingestion
              </h3>
            </div>
            
            <div className="p-12 space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Given Name</label>
                  <input 
                    type="text"
                    defaultValue={user?.first_name}
                    className="w-full bg-border-theme/10 border border-border-theme p-5 text-foreground font-serif text-lg focus:border-ls-compliment outline-none transition-all placeholder:opacity-20"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Surname</label>
                  <input 
                    type="text"
                    defaultValue={user?.last_name}
                    className="w-full bg-border-theme/10 border border-border-theme p-5 text-foreground font-serif text-lg focus:border-ls-compliment outline-none transition-all placeholder:opacity-20"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Electronic Identification</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/20" size={18} />
                  <input 
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-border-theme/5 border border-border-theme/50 p-5 pl-16 text-text-muted/30 font-mono text-sm cursor-not-allowed uppercase tracking-widest"
                  />
                </div>
              </div>
            </div>

            <div className="px-12 py-10 bg-border-theme/10 border-t border-border-theme flex justify-end">
              <button 
                type="button"
                className="bg-ls-primary text-ls-white hover:bg-ls-white hover:text-ls-primary border border-ls-primary px-12 py-5 text-[10px] font-bold uppercase tracking-[0.4em] transition-all flex items-center gap-4 shadow-xl"
              >
                <Save size={16} />
                Authorize Update
              </button>
            </div>
          </form>

          <div className="bg-card border border-border-theme p-10 flex items-center justify-between shadow-2xl group hover:border-ls-compliment/40 transition-all duration-700">
            <div className="flex items-center gap-8">
              <div className="w-14 h-14 border border-ls-compliment/20 bg-ls-compliment/5 flex items-center justify-center text-ls-compliment group-hover:bg-ls-compliment group-hover:text-ls-primary transition-all duration-500">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-serif font-light text-foreground uppercase tracking-tight leading-none group-hover:text-ls-compliment transition-all">Governance Protocol</p>
                <p className="text-[9px] text-text-muted uppercase tracking-[0.4em] font-bold">Execution gateway for shareholder voting mandates.</p>
              </div>
            </div>
            <Link 
              href="/gp-investor/governance"
              className="px-10 py-4 border border-border-theme text-text-muted/40 hover:text-ls-compliment hover:border-ls-compliment/40 text-[9px] font-bold uppercase tracking-[0.4em] transition-all block shadow-lg"
            >
              Initiate Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
