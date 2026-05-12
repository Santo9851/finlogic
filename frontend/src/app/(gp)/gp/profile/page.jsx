'use client'

import { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  ShieldCheck, 
  Mail, 
  Globe, 
  Save,
  Loader2,
  Lock,
  BadgeCheck,
  Settings,
  Users
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';

import { useTheme } from 'next-themes';

export default function GPProfilePage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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
    <div className="h-[60vh] flex items-center justify-center theme-transition">
      <Loader2 size={32} className="text-ls-compliment animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 theme-transition animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Admin Settings</h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Manage your administrator profile and platform preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border-theme rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden theme-transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-ls-compliment/5 blur-[40px] rounded-full -mr-12 -mt-12 pointer-events-none" />
            
            <div className="w-20 h-20 rounded-full bg-ls-compliment/10 flex items-center justify-center mx-auto mb-6 border border-ls-compliment/30 shadow-inner">
              <Settings size={32} className="text-ls-compliment" />
            </div>
            <h3 className="text-foreground font-black uppercase tracking-tight">{user?.first_name} {user?.last_name}</h3>
            <p className="text-text-muted text-[10px] uppercase tracking-[0.2em] mt-1 font-black opacity-40">General Partner Admin</p>
            
            <div className="mt-8 pt-8 border-t border-border-theme/50 space-y-4 text-left">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-text-muted/40">User ID</span>
                <span className="text-text-muted font-mono text-[9px] opacity-70">{user?.id?.substring(0, 12)}...</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-text-muted/40">Access Level</span>
                <span className="text-ls-compliment shadow-sm shadow-ls-compliment/20">Institutional Admin</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border-theme rounded-[2rem] p-8 shadow-xl theme-transition relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-ls-compliment/10 flex items-center justify-center text-ls-compliment shadow-inner">
                <Users size={20} />
              </div>
              <h4 className="text-foreground font-black uppercase tracking-tight text-sm">Team Access</h4>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed opacity-70 font-medium">
              You possess full administrative authorization for the <span className="text-foreground font-bold">Fund Management</span> and <span className="text-foreground font-bold">Deal Flow</span> protocols.
            </p>
          </div>
        </div>

        {/* Right Col */}
        <div className="md:col-span-2 space-y-8">
          <form className="bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl theme-transition">
            <div className="p-8 border-b border-border-theme/50 bg-foreground/[0.01]">
              <h3 className="text-sm font-black text-foreground flex items-center gap-3 uppercase tracking-widest">
                <User size={18} className="text-ls-compliment" /> Administrator Identity Info
              </h3>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] px-1 opacity-60">First Name</label>
                  <input 
                    type="text"
                    defaultValue={user?.first_name}
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl py-3.5 px-5 text-foreground text-sm focus:border-ls-compliment/40 outline-none transition-all shadow-inner font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] px-1 opacity-60">Last Name</label>
                  <input 
                    type="text"
                    defaultValue={user?.last_name}
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl py-3.5 px-5 text-foreground text-sm focus:border-ls-compliment/40 outline-none transition-all shadow-inner font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] px-1 opacity-60">Identity Email (Admin Registry)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
                  <input 
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-foreground/[0.01] border border-border-theme/30 rounded-xl py-3.5 pl-11 pr-5 text-text-muted/40 text-sm cursor-not-allowed font-medium italic"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-foreground/[0.02] border-t border-border-theme/50 flex justify-end">
              <button 
                type="button"
                className={`flex items-center gap-3 ${isDark ? 'bg-ls-compliment' : 'bg-ls-secondary'} text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-ls-compliment/10 active:scale-95`}
              >
                <Save size={18} />
                Update Admin Profile
              </button>
            </div>
          </form>

          <div className="bg-card border border-border-theme rounded-[2rem] p-8 flex items-center justify-between shadow-xl theme-transition relative overflow-hidden">
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
                <Lock size={22} />
              </div>
              <div>
                <p className="text-sm font-black text-foreground uppercase tracking-tight">Two-Factor Authentication</p>
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1 opacity-40 italic">Mandatory Security Protocol for Admins</p>
              </div>
            </div>
            <button className="text-text-muted hover:text-foreground text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl border border-border-theme transition-all shadow-lg active:scale-95 relative z-10">
              Configure Protocol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
