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
      toast.success('Registry Updated');
    } catch (error) {
      toast.error('Failed to update registry');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-12 theme-transition">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Identity Ledger...</p>
    </div>
  );

  const lp = profileData?.lp_profile;

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-32 theme-transition animate-in fade-in duration-700">
      
      {/* Header - Institutional Identity */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border-theme pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
            <ShieldCheck size={14} /> Strategic Identity Registry
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
            Investor <span className="italic">Ledger</span>
          </h1>
          <p className="text-xl text-text-muted font-serif font-light italic max-w-xl">
            Formalized management of personal institutional identifiers and compliance-verified wealth credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-12">
        {/* Left Col - Credential Snapshot */}
        <div className="space-y-12">
          <div className="bg-card border border-border-theme p-12 text-center relative overflow-hidden theme-transition group shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ls-compliment/5 blur-[50px] rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <div className="w-24 h-24 border border-border-theme flex items-center justify-center mx-auto mb-10 group-hover:border-ls-compliment transition-all">
              <User size={40} className="text-ls-compliment" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-serif font-light text-foreground tracking-tight uppercase leading-none">
                {lp?.full_name?.split(' ')[0]} <span className="italic">{lp?.full_name?.split(' ').slice(1).join(' ')}</span>
              </h3>
              <p className="text-[9px] text-text-muted uppercase tracking-[0.4em] font-bold opacity-40 font-mono">{user?.email}</p>
            </div>
            
            <div className="mt-12 pt-12 border-t border-border-theme space-y-6 text-left">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.3em]">
                <span className="text-text-muted/40">Ledger Entry</span>
                <span className="text-text-muted/60 font-mono">{lp?.created_at ? new Date(lp.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.3em]">
                <span className="text-text-muted/40">Credential Class</span>
                <span className="text-ls-compliment px-3 py-1 bg-ls-compliment/5 border border-ls-compliment/20 shadow-sm">Limited Partner</span>
              </div>
            </div>
          </div>

          {/* Compliance Card */}
          <div className={`p-10 border theme-transition shadow-xl relative overflow-hidden group ${
            lp?.accredited_status ? 'bg-ls-up/5 border-ls-up/20' : 'bg-ls-compliment/5 border-ls-compliment/20'
          }`}>
            <div className="flex items-center gap-6 mb-10 relative z-10">
              <div className={`w-12 h-12 border flex items-center justify-center shadow-inner transition-colors ${
                lp?.accredited_status ? 'bg-ls-up/10 border-ls-up/40 text-ls-up' : 'bg-ls-compliment/10 border-ls-compliment/40 text-ls-compliment'
              }`}>
                {lp?.accredited_status ? <BadgeCheck size={24} /> : <AlertCircle size={24} />}
              </div>
              <h4 className="text-foreground font-serif font-light uppercase tracking-tight text-lg italic">KYC Compliance</h4>
            </div>
            <p className="text-base font-serif italic text-text-muted leading-relaxed mb-12 opacity-80 relative z-10">
              {lp?.accredited_status 
                ? 'Your account maintains full ledger authorization and compliance with SEBON international standards.'
                : 'Your institutional KYC status is currently pending initialization. Strategic document access may be restricted.'}
            </p>
            <button 
              onClick={() => setShowKycModal(true)}
              className="w-full py-6 text-[10px] font-bold uppercase tracking-[0.4em] transition-all border border-border-theme hover:bg-ls-primary hover:text-ls-white shadow-lg active:scale-95"
            >
              {lp?.accredited_status ? 'Audit Credentials' : 'Initialize Protocol'}
            </button>
          </div>
        </div>

        {/* Right Col - Registry Forms */}
        <div className="space-y-12">
          <form onSubmit={handleUpdateProfile} className="border border-border-theme bg-card shadow-2xl overflow-hidden theme-transition">
            <div className="p-10 border-b border-border-theme bg-border-theme/10">
              <h3 className="text-[10px] font-bold text-text-muted flex items-center gap-4 uppercase tracking-[0.5em]">
                <ShieldCheck size={16} className="text-ls-compliment" /> Strategic Identity Protocol
              </h3>
            </div>
            
            <div className="p-12 md:p-16 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className="text-[9px] text-text-muted font-bold uppercase tracking-[0.4em] px-1 opacity-60">Full Legal Name</label>
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
                    <input 
                      type="text"
                      value={lp?.full_name || ''}
                      onChange={(e) => setProfileData({...profileData, lp_profile: {...lp, full_name: e.target.value}})}
                      className="w-full bg-foreground/[0.02] border border-border-theme p-6 pl-16 text-foreground text-base font-serif italic focus:border-ls-compliment outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] text-text-muted font-bold uppercase tracking-[0.4em] px-1 opacity-60">Identity Email (Immutable)</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
                    <input 
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-foreground/[0.01] border border-border-theme/30 p-6 pl-16 text-text-muted/40 text-base font-serif italic cursor-not-allowed opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] text-text-muted font-bold uppercase tracking-[0.4em] px-1 opacity-60">Legal Entity / Organization</label>
                <div className="relative">
                  <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
                  <input 
                    type="text"
                    value={lp?.organization || ''}
                    onChange={(e) => setProfileData({...profileData, lp_profile: {...lp, organization: e.target.value}})}
                    className="w-full bg-foreground/[0.02] border border-border-theme p-6 pl-16 text-foreground text-base font-serif italic focus:border-ls-compliment outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className="text-[9px] text-text-muted font-bold uppercase tracking-[0.4em] px-1 opacity-60">Primary Jurisdiction</label>
                  <div className="relative">
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
                    <input 
                      type="text"
                      value={lp?.country || ''}
                      onChange={(e) => setProfileData({...profileData, lp_profile: {...lp, country: e.target.value}})}
                      className="w-full bg-foreground/[0.02] border border-border-theme p-6 pl-16 text-foreground text-base font-serif italic focus:border-ls-compliment outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] text-text-muted font-bold uppercase tracking-[0.4em] px-1 opacity-60">Operational Timezone</label>
                  <select className="w-full bg-foreground/[0.02] border border-border-theme p-6 text-foreground text-base font-serif italic focus:border-ls-compliment outline-none transition-all shadow-inner appearance-none">
                    <option className="bg-ls-primary">Nepal (GMT+5:45)</option>
                    <option className="bg-ls-primary">London (GMT+0)</option>
                    <option className="bg-ls-primary">New York (GMT-5)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-10 bg-border-theme/10 border-t border-border-theme flex justify-end">
              <button 
                type="submit"
                disabled={saving}
                className="flex items-center gap-6 bg-ls-compliment text-ls-primary px-12 py-6 text-[10px] font-bold uppercase tracking-[0.5em] transition-all hover:bg-ls-white shadow-xl shadow-ls-compliment/10 disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Synchronize Ledger
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Compliance Protocol Modal */}
      {showKycModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-12 bg-ls-primary/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card border border-border-theme w-full max-w-3xl p-16 md:p-24 relative shadow-2xl theme-transition overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-ls-compliment/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
            
            <button 
              onClick={() => setShowKycModal(false)}
              className="absolute top-12 right-12 p-4 text-text-muted hover:text-ls-compliment transition-all active:scale-95 border border-border-theme hover:border-ls-compliment"
            >
              <X size={28} />
            </button>
            
            <div className="mb-16 space-y-6">
              <h2 className="text-5xl font-serif font-light text-foreground tracking-tight leading-tight uppercase">Compliance <span className="italic">Protocol</span></h2>
              <p className="text-xl font-serif italic text-text-muted leading-relaxed max-w-2xl">
                Please commit institutional identification records for audit: Passport, Government Registry, or Professional Wealth Credentials.
              </p>
            </div>
            
            <div className="p-12 border border-ls-compliment/20 bg-ls-compliment/5 flex gap-8 mb-16 shadow-inner">
              <AlertCircle className="text-ls-compliment shrink-0" size={28} />
              <p className="text-base font-serif italic text-text-muted leading-relaxed opacity-80">
                Identification must be government-issued and valid for at least 6 months. Operational addresses must match the primary jurisdiction in the ledger.
              </p>
            </div>

            <div className="bg-foreground/[0.02] border border-border-theme p-12 shadow-inner">
              <FileUploader 
                category="KYC"
                isLocal={true}
                uploadUrl="lp/kyc/upload/"
                onSuccess={() => {
                  toast.success('KYC documentation ingested successfully');
                  setShowKycModal(false);
                  fetchProfile();
                }}
                label="Ingest Identification Record (Passport/Citizenship)"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
