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
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 size={32} className="text-[#16c784] animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white">Shareholder Profile</h1>
        <p className="text-white/40 text-sm mt-1">Manage your GP management company shareholder account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[#16c784]/20 flex items-center justify-center mx-auto mb-4 border border-[#16c784]/30">
              <TrendingUp size={32} className="text-[#16c784]" />
            </div>
            <h3 className="text-white font-bold">{user?.first_name} {user?.last_name}</h3>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1 font-bold text-[#16c784]">GP Shareholder</p>
            
            <div className="mt-6 pt-6 border-t border-white/5 space-y-4 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/30">Ownership Status</span>
                <span className="text-emerald-400 font-bold uppercase tracking-tighter">Verified</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/30">Vesting Status</span>
                <span className="text-white/60">Fully Vested</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Briefcase size={14} className="text-[#16c784]" /> Management Access
            </h4>
            <p className="text-[10px] text-white/40 leading-relaxed">
              As a shareholder, you have viewing access to all Fund performances, IR documents, and Management Company financial reports.
            </p>
          </div>
        </div>

        {/* Right Col */}
        <div className="md:col-span-2 space-y-8">
          <form className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/[0.01]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                <User size={16} className="text-[#16c784]" /> Personal Information
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">First Name</label>
                  <input 
                    type="text"
                    defaultValue={user?.first_name}
                    className="w-full bg-[#0a0014] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-[#16c784] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Last Name</label>
                  <input 
                    type="text"
                    defaultValue={user?.last_name}
                    className="w-full bg-[#0a0014] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-[#16c784] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/10" size={16} />
                  <input 
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white/30 text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/10 flex justify-end">
              <button 
                type="button"
                className="bg-[#16c784] hover:bg-[#16c784]/80 text-black font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all"
              >
                <Save size={16} />
                Update Account
              </button>
            </div>
          </form>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Governance Portal</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Manage your voting rights</p>
              </div>
            </div>
            <Link 
              href="/gp-investor/governance"
              className="text-white/20 hover:text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg border border-white/10 transition-all block"
            >
              Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
