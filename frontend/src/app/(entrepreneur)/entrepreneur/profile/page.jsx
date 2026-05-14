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
    <div className="h-[60vh] flex flex-col items-center justify-center gap-12 theme-transition">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Identity Hub...</p>
    </div>
  );

  const kybStatus = kybDocuments.length > 0 ? kybDocuments[0].status : 'NONE';
  const isKybVerified = kybStatus === 'VERIFIED';
  const isKybPending = kybStatus === 'PENDING';

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-16 pb-32 theme-transition animate-in fade-in duration-700">
        
        {/* Header - Institutional Identity */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border-theme pb-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
              <ShieldCheck size={14} /> Strategic Identity Registry
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
              Founder <span className="italic">Profile</span>
            </h1>
            <p className="text-xl text-text-muted font-serif font-light italic max-w-xl">
              Management of professional institutional credentials and strategic asset verification protocols.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-12">
          {/* Left Col - Credential Snapshot */}
          <div className="space-y-12">
            <div className="bg-card border border-border-theme p-12 text-center relative overflow-hidden theme-transition group shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ls-compliment/5 blur-[50px] rounded-full -mr-16 -mt-16 pointer-events-none" />
              
              <div className="w-24 h-24 border border-border-theme flex items-center justify-center mx-auto mb-10 group-hover:border-ls-compliment transition-all">
                <Rocket size={40} className="text-ls-compliment" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-serif font-light text-foreground tracking-tight uppercase leading-none">
                  {user?.first_name} <span className="italic">{user?.last_name}</span>
                </h3>
                <p className="text-[10px] text-text-muted uppercase tracking-[0.4em] font-bold opacity-40">IDENT-REF: FR-0{user?.id}</p>
              </div>
              
              <div className="mt-12 pt-12 border-t border-border-theme space-y-6 text-left">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.3em]">
                  <span className="text-text-muted/40">Ledger Status</span>
                  <span className="text-ls-up px-3 py-1 bg-ls-up/5 border border-ls-up/20 shadow-sm">Verified Active</span>
                </div>
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.3em]">
                  <span className="text-text-muted/40">Strategic Pillar</span>
                  <span className="text-ls-compliment px-3 py-1 bg-ls-compliment/5 border border-ls-compliment/20 shadow-sm">Technology</span>
                </div>
              </div>
            </div>

            {/* Verification Status Card */}
            <div className={`p-10 border theme-transition shadow-xl relative overflow-hidden group ${
              isKybVerified ? 'bg-ls-up/5 border-ls-up/20' : 'bg-ls-compliment/5 border-ls-compliment/20'
            }`}>
              <div className="flex items-center gap-6 mb-10 relative z-10">
                <div className={`w-12 h-12 border flex items-center justify-center shadow-inner transition-colors ${
                  isKybVerified ? 'bg-ls-up/10 border-ls-up/40 text-ls-up' : 'bg-ls-compliment/10 border-ls-compliment/40 text-ls-compliment'
                }`}>
                  {isKybVerified ? <BadgeCheck size={24} /> : <AlertCircle size={24} />}
                </div>
                <h4 className="text-foreground font-serif font-light uppercase tracking-tight text-lg italic">Verification Protocol</h4>
              </div>
              <p className="text-base font-serif italic text-text-muted leading-relaxed mb-12 opacity-80 relative z-10">
                {isKybVerified 
                  ? 'Your institutional identity has been successfully authenticated in our primary ledger. You are authorized to receive strategic term sheets.'
                  : 'Know Your Business (KYB) ingestion is required for full protocol authorization. Please commit your registry documentation.'}
              </p>
              <button 
                onClick={() => setShowKybModal(true)}
                className={`w-full py-6 text-[10px] font-bold uppercase tracking-[0.4em] transition-all border shadow-lg active:scale-95 ${
                  isKybVerified ? 'bg-ls-up text-ls-primary border-ls-up hover:bg-ls-white' :
                  isKybPending ? 'bg-ls-compliment/20 text-ls-compliment border-ls-compliment/30 cursor-wait' :
                  'bg-ls-compliment text-ls-primary border-ls-compliment hover:bg-ls-white'
                }`}
              >
                {isKybVerified ? 'Audit Credentials' : isKybPending ? 'Ingestion Pending' : 'Initialize Protocol'}
              </button>
            </div>
          </div>

          {/* Right Col - Registry Form */}
          <div className="space-y-12">
            <form className="border border-border-theme bg-card shadow-2xl overflow-hidden theme-transition">
              <div className="p-10 border-b border-border-theme bg-border-theme/10">
                <h3 className="text-[10px] font-bold text-text-muted flex items-center gap-4 uppercase tracking-[0.5em]">
                  <User size={16} className="text-ls-compliment" /> Professional Identity Ingestion
                </h3>
              </div>
              
              <div className="p-12 md:p-16 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="text-[9px] text-text-muted font-bold uppercase tracking-[0.4em] px-1 opacity-60">Legal First Name</label>
                    <input 
                      type="text"
                      defaultValue={user?.first_name}
                      className="w-full bg-foreground/[0.02] border border-border-theme p-6 text-foreground text-base font-serif italic focus:border-ls-compliment outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] text-text-muted font-bold uppercase tracking-[0.4em] px-1 opacity-60">Legal Last Name</label>
                    <input 
                      type="text"
                      defaultValue={user?.last_name}
                      className="w-full bg-foreground/[0.02] border border-border-theme p-6 text-foreground text-base font-serif italic focus:border-ls-compliment outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] text-text-muted font-bold uppercase tracking-[0.4em] px-1 opacity-60">Registry Email (Immutable)</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
                    <input 
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-foreground/[0.01] border border-border-theme/30 p-6 pl-16 text-text-muted/40 text-base font-serif italic cursor-not-allowed opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] text-text-muted font-bold uppercase tracking-[0.4em] px-1 opacity-60">Strategic Profile Reference (LinkedIn)</label>
                  <input 
                    type="url"
                    placeholder="https://linkedin.com/in/institutional-identity"
                    className="w-full bg-foreground/[0.02] border border-border-theme p-6 text-foreground text-base font-serif italic focus:border-ls-compliment outline-none transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] text-text-muted font-bold uppercase tracking-[0.4em] px-1 opacity-60">Primary Jurisdiction</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
                    <input 
                      type="text"
                      placeholder="e.g. Kathmandu, Federal Republic of Nepal"
                      className="w-full bg-foreground/[0.02] border border-border-theme p-6 pl-16 text-foreground text-base font-serif italic focus:border-ls-compliment outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="p-10 bg-border-theme/10 border-t border-border-theme flex justify-end">
                <button 
                  type="button"
                  className="flex items-center gap-6 bg-ls-compliment text-ls-primary px-12 py-6 text-[10px] font-bold uppercase tracking-[0.5em] transition-all hover:bg-ls-white shadow-xl shadow-ls-compliment/10"
                >
                  <Save size={18} />
                  Synchronize Registry
                </button>
              </div>
            </form>

            <div className="border border-border-theme bg-card p-12 shadow-xl theme-transition">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.5em] text-text-muted mb-10 flex items-center gap-4 opacity-60">
                <Building2 size={16} className="text-ls-compliment" /> Recent Pipeline Ledger
              </h4>
              <p className="text-base font-serif italic text-text-muted/40 text-center py-12 border border-dashed border-border-theme">No historical submission records discovered in this cycle.</p>
            </div>
          </div>
        </div>
      </div>

      {/* KYB Verification Protocol Modal */}
      {showKybModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-12 bg-ls-primary/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card border border-border-theme w-full max-w-3xl p-16 md:p-24 relative shadow-2xl theme-transition overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-ls-compliment/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
            
            <button 
              onClick={() => setShowKybModal(false)}
              className="absolute top-12 right-12 p-4 text-text-muted hover:text-ls-compliment transition-all active:scale-95 border border-border-theme hover:border-ls-compliment"
            >
              <X size={28} />
            </button>
            
            <div className="mb-16 space-y-6">
              <h2 className="text-5xl font-serif font-light text-foreground tracking-tight leading-tight uppercase">Ingestion <span className="italic">Protocol</span></h2>
              <p className="text-xl font-serif italic text-text-muted leading-relaxed max-w-2xl">
                Please commit institutional documentation for audit: Articles of Incorporation, Strategic Tax Certificates, or Government Registries.
              </p>
            </div>
            
            <div className="bg-foreground/[0.02] border border-border-theme p-12 shadow-inner mb-16">
              <FileUploader 
                isLocal={true}
                uploadUrl="/deals/entrepreneur/kyc/upload/"
                onSuccess={() => {
                  toast.success('KYB documentation ingested successfully');
                  fetchKybDocuments();
                  setShowKybModal(false);
                }}
              />
            </div>
            
            <div className="space-y-10">
              <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5em] pb-6 border-b border-border-theme">Verification Audit History</h4>
              {kybDocuments.length === 0 ? (
                <p className="text-base font-serif italic text-text-muted/20 text-center py-12">No historical protocol submissions found.</p>
              ) : (
                <div className="space-y-px bg-border-theme border border-border-theme">
                  {kybDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-8 bg-card transition-all hover:bg-ls-primary group">
                      <div className="flex items-center gap-8">
                        <div className={`w-14 h-14 border flex items-center justify-center transition-all ${
                          doc.status === 'VERIFIED' ? 'bg-ls-up/10 border-ls-up/40 text-ls-up' : 'bg-ls-compliment/10 border-ls-compliment/40 text-ls-compliment'
                        }`}>
                          <ShieldCheck size={24} />
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-serif font-light text-foreground group-hover:text-ls-white uppercase tracking-tight leading-none">{doc.document_type}</p>
                          <p className="text-[9px] text-text-muted/60 group-hover:text-ls-white/40 font-bold uppercase tracking-[0.4em] font-mono">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-[0.3em] px-6 py-2 border shadow-inner transition-all ${
                        doc.status === 'VERIFIED' ? 'bg-ls-up/5 text-ls-up border-ls-up/20 group-hover:bg-ls-white group-hover:text-ls-primary' :
                        doc.status === 'REJECTED' ? 'bg-red-500/5 text-red-500 border-red-500/20' :
                        'bg-ls-compliment/5 text-ls-compliment border-ls-compliment/20 group-hover:bg-ls-white group-hover:text-ls-primary'
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
