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

export default function EntrepreneurProfilePage() {
  const { user } = useAuth();
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
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 size={32} className="text-[#F59F01] animate-spin" />
    </div>
  );

  // For entrepreneurs, we check their KYB (Know Your Business) status
  const kybStatus = kybDocuments.length > 0 ? kybDocuments[0].status : 'NONE';
  const isKybVerified = kybStatus === 'VERIFIED';
  const isKybPending = kybStatus === 'PENDING';

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white">Founder Profile</h1>
        <p className="text-white/40 text-sm mt-1">Manage your professional profile and business verification.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
              <Rocket size={32} className="text-purple-400" />
            </div>
            <h3 className="text-white font-bold">{user?.first_name} {user?.last_name}</h3>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1 font-bold">Founder / Entrepreneur</p>
            
            <div className="mt-6 pt-6 border-t border-white/5 space-y-4 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/30">Account Status</span>
                <span className="text-emerald-400 font-bold uppercase tracking-tighter">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/30">Pillar</span>
                <span className="text-purple-400 font-bold uppercase tracking-tighter">Technology</span>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 border transition-all ${
            isKybVerified ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isKybVerified ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
              }`}>
                {isKybVerified ? <BadgeCheck size={18} /> : <AlertCircle size={18} />}
              </div>
              <h4 className="text-white font-bold text-sm">KYB Verification</h4>
            </div>
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              {isKybVerified 
                ? 'Your business has been verified. You can now receive investments and term sheets.'
                : 'Know Your Business (KYB) verification is required before you can receive funding. Please submit your registration documents.'}
            </p>
            <button 
              onClick={() => setShowKybModal(true)}
              className={`w-full py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border ${
                isKybVerified ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                isKybPending ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 cursor-wait' :
                'bg-white/5 hover:bg-white/10 text-white border-white/10'
              }`}
            >
              {isKybVerified ? 'View Verification' : isKybPending ? 'Verification Pending' : 'Start Verification'}
            </button>
          </div>
        </div>

        {/* Right Col */}
        <div className="md:col-span-2 space-y-8">
          <form className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-white/[0.01]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                <User size={16} className="text-purple-400" /> Professional Details
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">First Name</label>
                  <input 
                    type="text"
                    defaultValue={user?.first_name}
                    className="w-full bg-[#0a0014] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Last Name</label>
                  <input 
                    type="text"
                    defaultValue={user?.last_name}
                    className="w-full bg-[#0a0014] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-purple-500 outline-none transition-all"
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

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">LinkedIn Profile</label>
                <input 
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-[#0a0014] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-purple-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    type="text"
                    placeholder="e.g. Kathmandu, Nepal"
                    className="w-full bg-[#0a0014] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-purple-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/10 flex justify-end">
              <button 
                type="button"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all"
              >
                <Save size={16} />
                Save Profile
              </button>
            </div>
          </form>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Building2 size={14} className="text-purple-400" /> Current Submissions
            </h4>
            <p className="text-xs text-white/40 italic">You have no active project submissions. Start a new one from the dashboard.</p>
          </div>
        </div>
      </div>
    </div>

    {/* KYB Verification Modal */}
    {showKybModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-[#0a0014] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative">
          <button 
            onClick={() => setShowKybModal(false)}
            className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Startup Verification</h2>
            <p className="text-white/40 text-sm mb-8">Upload your company registration, TAX/PAN certificate, or incorporation documents.</p>
            
            <div className="bg-white/2 border border-white/5 rounded-2xl p-6">
              <FileUploader 
                isLocal={true}
                kycUrl="/deals/entrepreneur/kyc/upload/"
                onSuccess={() => {
                  toast.success('KYB document uploaded successfully');
                  fetchKybDocuments();
                  setShowKybModal(false);
                }}
              />
            </div>
            
            <div className="mt-8 space-y-4">
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Recent Submissions</h4>
              {kybDocuments.length === 0 ? (
                <p className="text-xs text-white/20 italic px-1">No documents submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {kybDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={16} className={doc.status === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'} />
                        <div>
                          <p className="text-xs font-bold text-white">{doc.document_type}</p>
                          <p className="text-[10px] text-white/40">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded ${
                        doc.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' :
                        doc.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-amber-500/10 text-amber-400'
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
      </div>
    )}
    </>
  );
}
