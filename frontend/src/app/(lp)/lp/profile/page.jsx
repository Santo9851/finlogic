'use client'

import { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  ShieldCheck, 
  Globe, 
  Calendar,
  Save,
  Loader2,
  Lock,
  BadgeCheck,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';
import FileUploader from '@/components/portal/FileUploader';
import { useTheme } from 'next-themes';

export default function LPProfilePage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [userFunds, setUserFunds] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchFunds();
  }, []);

  const fetchProfile = async () => {
    try {
      const [authRes, lpRes] = await Promise.all([
        api.get('auth/profile/'),
        api.get('lp/profile/')
      ]);
      setProfileData({ ...authRes.data, lp_profile: lpRes.data });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Could not load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFunds = async () => {
    try {
      const res = await api.get('/deals/funds/');
      setUserFunds(res.data);
    } catch (error) {
      console.error('Failed to fetch funds:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('lp/profile/', {
        full_name: profileData.lp_profile?.full_name,
        organization: profileData.lp_profile?.organization,
        country: profileData.lp_profile?.country,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center theme-transition">
      <Loader2 size={32} className="text-ls-secondary animate-spin" />
    </div>
  );

  const lp = profileData?.lp_profile;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 theme-transition animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Account Settings</h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Manage your personal information and compliance status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Info & Stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border-theme rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden theme-transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#0B6EC3]/5 blur-[40px] rounded-full -mr-12 -mt-12 pointer-events-none" />
            
            <div className="w-20 h-20 rounded-full bg-[#0B6EC3]/10 flex items-center justify-center mx-auto mb-6 border border-[#0B6EC3]/30 shadow-inner">
              <User size={32} className="text-[#0B6EC3]" />
            </div>
            <h3 className="text-foreground font-black uppercase tracking-tight">{lp?.full_name || 'Investor'}</h3>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mt-1 opacity-40">{user?.email}</p>
            
            <div className="mt-8 pt-8 border-t border-border-theme/50 space-y-4 text-left">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-text-muted/40">Member Since</span>
                <span className="text-text-muted/60">{lp?.created_at ? new Date(lp.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-text-muted/40">Investor Type</span>
                <span className="text-ls-compliment font-black">Limited Partner</span>
              </div>
            </div>
          </div>

          <div className={`rounded-[2rem] p-8 border theme-transition shadow-xl relative overflow-hidden ${
            lp?.accredited_status ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                lp?.accredited_status ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
              }`}>
                {lp?.accredited_status ? <BadgeCheck size={20} /> : <AlertCircle size={20} />}
              </div>
              <h4 className="text-foreground font-black uppercase tracking-tight text-sm">KYC Status</h4>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed mb-8 opacity-70 font-medium relative z-10">
              {lp?.accredited_status 
                ? 'Your account is verified and compliant with SEBON regulations. You have full access to all fund documents.'
                : 'Your KYC verification is currently pending or incomplete. Some fund documents may be restricted until verified.'}
            </p>
            <button 
              onClick={() => setShowKycModal(true)}
              className="w-full py-4 bg-foreground/[0.03] hover:bg-foreground/[0.08] text-foreground text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-border-theme shadow-lg active:scale-95"
            >
              {lp?.accredited_status ? 'Update KYC Registry' : 'Complete KYC Protocol'}
            </button>
          </div>
        </div>

        {/* Right Col: Forms */}
        <div className="md:col-span-2 space-y-8">
          <form onSubmit={handleUpdateProfile} className="bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl theme-transition">
            <div className="p-8 border-b border-border-theme/50 bg-foreground/[0.01]">
              <h3 className="text-sm font-black text-foreground flex items-center gap-3 uppercase tracking-widest">
                <ShieldCheck size={18} className="text-[#0B6EC3]" /> Personal Identity Protocol
              </h3>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] px-1 opacity-60">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
                    <input 
                      type="text"
                      value={lp?.full_name || ''}
                      onChange={(e) => setProfileData({...profileData, lp_profile: {...lp, full_name: e.target.value}})}
                      className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl py-3.5 pl-11 pr-5 text-foreground text-sm focus:border-[#0B6EC3]/40 outline-none transition-all shadow-inner font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] px-1 opacity-60">Identity Email</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
                    <input 
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-foreground/[0.01] border border-border-theme/30 rounded-xl py-3.5 pl-11 pr-5 text-text-muted/40 text-sm cursor-not-allowed font-medium italic"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] px-1 opacity-60">Organization / Legal Entity</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
                  <input 
                    type="text"
                    value={lp?.organization || ''}
                    onChange={(e) => setProfileData({...profileData, lp_profile: {...lp, organization: e.target.value}})}
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl py-3.5 pl-11 pr-5 text-foreground text-sm focus:border-[#0B6EC3]/40 outline-none transition-all shadow-inner font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] px-1 opacity-60">Country of Residence</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
                    <input 
                      type="text"
                      value={lp?.country || ''}
                      onChange={(e) => setProfileData({...profileData, lp_profile: {...lp, country: e.target.value}})}
                      className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl py-3.5 pl-11 pr-5 text-foreground text-sm focus:border-[#0B6EC3]/40 outline-none transition-all shadow-inner font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] px-1 opacity-60">Operational Timezone</label>
                  <select className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl py-3.5 px-5 text-foreground text-sm focus:border-[#0B6EC3]/40 outline-none transition-all shadow-inner font-medium appearance-none">
                    <option className="bg-background">Nepal (GMT+5:45)</option>
                    <option className="bg-background">London (GMT+0)</option>
                    <option className="bg-background">New York (GMT-5)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-8 bg-foreground/[0.02] border-t border-border-theme/50 flex justify-end">
              <button 
                type="submit"
                disabled={saving}
                className={`flex items-center gap-3 ${isDark ? 'bg-ls-compliment' : 'bg-ls-secondary'} text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50`}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Commit Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* KYC Modal */}
      {showKycModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-12 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card border border-border-theme rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] theme-transition relative">
            <div className="p-10 border-b border-border-theme/50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">KYC Verification Protocol</h3>
                <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Upload institutional documents to verify investor registry status.</p>
              </div>
              <button onClick={() => setShowKycModal(false)} className="p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="bg-[#0B6EC3]/5 border border-[#0B6EC3]/20 rounded-2xl p-6 flex gap-4 shadow-inner">
                <AlertCircle className="text-[#0B6EC3] shrink-0" size={20} />
                <p className="text-[11px] text-text-muted font-medium leading-relaxed opacity-80">
                  Please upload a government-issued ID (Passport, Citizenship, or PAN card) and a recent proof of address for SEBON compliance requirements.
                </p>
              </div>

              <div className="bg-foreground/[0.03] border border-border-theme rounded-2xl p-8 shadow-inner">
                <FileUploader 
                  category="KYC"
                  isLocal={true}
                  uploadUrl="lp/kyc/upload/"
                  onSuccess={() => {
                    setShowKycModal(false);
                    fetchProfile();
                  }}
                  label="Ingest Identification Record (Passport/Citizenship)"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
