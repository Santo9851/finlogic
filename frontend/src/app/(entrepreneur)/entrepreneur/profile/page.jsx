'use client'

import { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  ShieldCheck, 
  Mail, 
  Save,
  Loader2,
  Lock,
  BadgeCheck,
  Rocket,
  MapPin,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';
import FileUploader from '@/components/portal/FileUploader';

import { useTheme } from 'next-themes';

export default function EntrepreneurProfilePage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [kybDocuments, setKybDocuments] = useState([]);
  const [showKybModal, setShowKybModal] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchKybDocuments();
  }, []);

  const fetchKybDocuments = async () => {
    try {
      const res = await api.get('/deals/entrepreneur/kyc/');
      setKybDocuments(res.data.results || res.data || []);
    } catch (error) {
      console.error('Failed to fetch KYB documents:', error);
    }
  };

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

  // For entrepreneurs, we check their KYB (Know Your Business) status
  const kybStatus = kybDocuments.length > 0 ? kybDocuments[0].status : 'NONE';
  const isKybVerified = kybStatus === 'VERIFIED';
  const isKybPending = kybStatus === 'PENDING';

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8 pb-20 theme-transition animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Founder Profile</h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Manage your professional profile and business verification.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border-theme rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden theme-transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[40px] rounded-full -mr-12 -mt-12 pointer-events-none" />
            
            <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6 border border-purple-500/30 shadow-inner">
              <Rocket size={32} className="text-purple-500" />
            </div>
            <h3 className="text-foreground font-black uppercase tracking-tight">{user?.first_name} {user?.last_name}</h3>
            <p className="text-text-muted text-[10px] uppercase tracking-[0.2em] mt-1 font-black opacity-40">Founder / Entrepreneur</p>
            
            <div className="mt-8 pt-8 border-t border-border-theme/50 space-y-4 text-left">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-text-muted/40">Account Status</span>
                <span className="text-emerald-500 shadow-sm shadow-emerald-500/20">Active</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-text-muted/40">Pillar</span>
                <span className="text-purple-500 shadow-sm shadow-purple-500/20">Technology</span>
              </div>
            </div>
          </div>

          <div className={`rounded-[2rem] p-8 border theme-transition shadow-xl relative overflow-hidden ${
            isKybVerified ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                isKybVerified ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
              }`}>
                {isKybVerified ? <BadgeCheck size={20} /> : <AlertCircle size={20} />}
              </div>
              <h4 className="text-foreground font-black uppercase tracking-tight text-sm">KYB Verification</h4>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed mb-8 opacity-70 font-medium relative z-10">
              {isKybVerified 
                ? 'Your business has been verified. You can now receive investments and term sheets.'
                : 'Know Your Business (KYB) verification is required before you can receive funding. Please submit your registration documents.'}
            </p>
            <button 
              onClick={() => setShowKybModal(true)}
              className={`w-full py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border shadow-lg active:scale-95 ${
                isKybVerified ? 'bg-emerald-500 text-white border-transparent' :
                isKybPending ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 cursor-wait' :
                (isDark ? 'bg-ls-compliment' : 'bg-ls-secondary') + ' text-white border-transparent'
              }`}
            >
              {isKybVerified ? 'View Verification' : isKybPending ? 'Verification Pending' : 'Start Verification Protocol'}
            </button>
          </div>
        </div>

        {/* Right Col */}
        <div className="md:col-span-2 space-y-8">
          <form className="bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl theme-transition">
            <div className="p-8 border-b border-border-theme/50 bg-foreground/[0.01]">
              <h3 className="text-sm font-black text-foreground flex items-center gap-3 uppercase tracking-widest">
                <User size={18} className="text-purple-500" /> Professional Identity Details
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
                <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] px-1 opacity-60">Identity Email (Registry)</label>
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

              <div className="space-y-2">
                <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] px-1 opacity-60">Professional Profile (LinkedIn)</label>
                <input 
                  type="url"
                  placeholder="https://linkedin.com/in/institutional-identity"
                  className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl py-3.5 px-5 text-foreground text-sm focus:border-ls-compliment/40 outline-none transition-all shadow-inner font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] px-1 opacity-60">Geographic Jurisdiction</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
                  <input 
                    type="text"
                    placeholder="e.g. Kathmandu, Nepal"
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl py-3.5 pl-11 pr-5 text-foreground text-sm focus:border-ls-compliment/40 outline-none transition-all shadow-inner font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-foreground/[0.02] border-t border-border-theme/50 flex justify-end">
              <button 
                type="button"
                className={`flex items-center gap-3 ${isDark ? 'bg-ls-compliment' : 'bg-ls-secondary'} text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95`}
              >
                <Save size={18} />
                Synchronize Profile
              </button>
            </div>
          </form>

          <div className="bg-card border border-border-theme rounded-[2rem] p-8 shadow-xl theme-transition">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground mb-6 flex items-center gap-3 opacity-60">
              <Building2 size={16} className="text-purple-500" /> Registry of Active Submissions
            </h4>
            <p className="text-[11px] text-text-muted/40 font-black uppercase tracking-widest italic text-center py-4">No active project submissions discovered.</p>
          </div>
        </div>
      </div>
    </div>

    {/* KYB Verification Modal */}
    {showKybModal && (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-12 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500">
        <div className="bg-card border border-border-theme w-full max-w-2xl rounded-[3rem] p-12 relative shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] theme-transition">
          <button 
            onClick={() => setShowKybModal(false)}
            className="absolute top-8 right-8 p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95"
          >
            <X size={24} />
          </button>
          
          <div className="mb-10">
            <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">Startup Verification</h2>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">
              Ingest institutional documentation: Registration, TAX/PAN certificate, or articles of incorporation.
            </p>
          </div>
          
          <div className="bg-foreground/[0.03] border border-border-theme rounded-2xl p-8 shadow-inner">
            <FileUploader 
              isLocal={true}
              uploadUrl="/deals/entrepreneur/kyc/upload/"
              onSuccess={() => {
                toast.success('KYB document uploaded successfully');
                fetchKybDocuments();
                setShowKybModal(false);
              }}
            />
          </div>
          
          <div className="mt-12 space-y-6">
            <h4 className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] px-1">Registry Audit History</h4>
            {kybDocuments.length === 0 ? (
              <p className="text-[11px] text-text-muted/20 font-black uppercase tracking-widest italic px-1">No protocol submissions discovered.</p>
            ) : (
              <div className="space-y-4">
                {kybDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-5 bg-foreground/[0.01] rounded-2xl border border-border-theme/50 shadow-sm transition-all hover:border-ls-compliment/20">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                        doc.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-foreground uppercase tracking-tight">{doc.document_type}</p>
                        <p className="text-[9px] text-text-muted/40 font-black uppercase tracking-widest mt-1 font-mono">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-inner ${
                      doc.status === 'VERIFIED' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' :
                      doc.status === 'REJECTED' ? 'bg-rose-500/5 text-rose-500 border-rose-500/20' :
                      'bg-amber-500/5 text-amber-500 border-amber-500/20'
                    }`}>
                      {doc.status_display}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
