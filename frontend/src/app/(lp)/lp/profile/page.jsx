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

export default function LPProfilePage() {
  const { user } = useAuth();
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
      const res = await api.get('/auth/profile/');
      setProfileData(res.data);
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

  const handleKycUploadComplete = async (docData) => {
    try {
      // In a real scenario, you might want to create a LPDocumentAccess entry 
      // or a specific KYC record. For now, we'll just toast success.
      toast.success('KYC document submitted for verification');
      setTimeout(() => setShowKycModal(false), 2000);
    } catch (error) {
      toast.error('Failed to register KYC document');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/auth/profile/', {
        full_name: profileData.lp_profile?.full_name,
        organization: profileData.lp_profile?.organization,
        country: profileData.lp_profile?.country,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 size={32} className="text-[#0B6EC3] animate-spin" />
    </div>
  );

  const lp = profileData?.lp_profile;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your personal information and compliance status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Info & Stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[#0B6EC3]/20 flex items-center justify-center mx-auto mb-4 border border-[#0B6EC3]/30">
              <User size={32} className="text-[#0B6EC3]" />
            </div>
            <h3 className="text-white font-bold">{lp?.full_name || 'Investor'}</h3>
            <p className="text-white/30 text-xs mt-1">{user?.email}</p>
            
            <div className="mt-6 pt-6 border-t border-white/5 space-y-4 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/30">Member Since</span>
                <span className="text-white/60">{lp?.created_at ? new Date(lp.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/30">Investor Type</span>
                <span className="text-[#F59F01] font-bold uppercase tracking-tighter">Limited Partner</span>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 border transition-all ${
            lp?.accredited_status ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                lp?.accredited_status ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
              }`}>
                {lp?.accredited_status ? <BadgeCheck size={18} /> : <AlertCircle size={18} />}
              </div>
              <h4 className="text-white font-bold text-sm">KYC Status</h4>
            </div>
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              {lp?.accredited_status 
                ? 'Your account is verified and compliant with SEBON regulations. You have full access to all fund documents.'
                : 'Your KYC verification is currently pending or incomplete. Some fund documents may be restricted until verified.'}
            </p>
            <button 
              onClick={() => setShowKycModal(true)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border border-white/10"
            >
              {lp?.accredited_status ? 'Update KYC' : 'Complete KYC'}
            </button>
          </div>
        </div>

        {/* Right Col: Forms */}
        <div className="md:col-span-2 space-y-8">
          <form onSubmit={handleUpdateProfile} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/[0.01]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                <ShieldCheck size={16} className="text-[#0B6EC3]" /> Personal Information
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input 
                      type="text"
                      value={lp?.full_name || ''}
                      onChange={(e) => setProfileData({...profileData, lp_profile: {...lp, full_name: e.target.value}})}
                      className="w-full bg-[#0a0014] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-[#0B6EC3] outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Email Address</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/10" size={16} />
                    <input 
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white/30 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Organization / Entity</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    type="text"
                    value={lp?.organization || ''}
                    onChange={(e) => setProfileData({...profileData, lp_profile: {...lp, organization: e.target.value}})}
                    className="w-full bg-[#0a0014] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-[#0B6EC3] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input 
                      type="text"
                      value={lp?.country || ''}
                      onChange={(e) => setProfileData({...profileData, lp_profile: {...lp, country: e.target.value}})}
                      className="w-full bg-[#0a0014] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-[#0B6EC3] outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Timezone</label>
                  <select className="w-full bg-[#0a0014] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-[#0B6EC3] outline-none transition-all">
                    <option>Nepal (GMT+5:45)</option>
                    <option>London (GMT+0)</option>
                    <option>New York (GMT-5)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/10 flex justify-end">
              <button 
                type="submit"
                disabled={saving}
                className="bg-[#0B6EC3] hover:bg-[#0B6EC3]/80 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* KYC Modal */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0014] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">KYC Verification</h3>
                <p className="text-white/40 text-xs mt-1">Upload documents to verify your investor status.</p>
              </div>
              <button onClick={() => setShowKycModal(false)} className="text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="bg-[#0B6EC3]/5 border border-[#0B6EC3]/20 rounded-xl p-4 flex gap-3">
                <AlertCircle className="text-[#0B6EC3] shrink-0" size={18} />
                <p className="text-xs text-white/60 leading-relaxed">
                  Please upload a government-issued ID (Passport, Citizenship, or PAN card) and a recent proof of address for SEBON compliance.
                </p>
              </div>

              <FileUploader 
                fundId={userFunds[0]?.id} // Attach to the first fund found for context
                category="KYC"
                label="Select KYC Document"
                hideCategory={true}
                onSuccess={handleKycUploadComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
