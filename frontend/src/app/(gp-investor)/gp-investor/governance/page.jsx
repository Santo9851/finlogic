'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  Vote,
  PieChart,
  Loader2,
  Lock,
  MessageSquare
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function GPInvestorGovernancePage() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingVote, setSubmittingVote] = useState(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await api.get('/deals/gp-investor/governance/proposals/');
      setProposals(res.data.results || res.data || []);
    } catch (err) {
      toast.error('Failed to load governance proposals');
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (proposalId, choice) => {
    setSubmittingVote(proposalId);
    try {
      await api.post('/deals/gp-investor/governance/vote/', {
        proposal_id: proposalId,
        choice
      });
      toast.success('Your vote has been recorded');
      fetchProposals();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to record vote';
      toast.error(msg);
    } finally {
      setSubmittingVote(null);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 size={32} className="text-[#16c784] animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Governance Portal</h1>
        <p className="text-white/40 text-sm mt-3 leading-relaxed max-w-2xl">
          Exercise your voting rights as a GP Management Company shareholder. Your vote weight is proportional to your shareholding.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {proposals.length === 0 ? (
          <div className="text-center py-24 bg-white/2 border border-dashed border-white/10 rounded-3xl">
            <Lock size={32} className="text-white/10 mb-4 mx-auto" />
            <p className="text-white/30 text-sm italic">No active or past proposals found.</p>
          </div>
        ) : (
          proposals.map(prop => (
            <div key={prop.id} className="bg-[#08001a] border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all shadow-2xl">
              <div className="p-8">
                <div className="flex flex-col lg:flex-row gap-10">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        prop.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                      }`}>
                        {prop.status_display}
                      </span>
                      <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                        <Clock size={12} />
                        Expires {new Date(prop.expiry_date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{prop.title}</h2>
                      <div className="prose prose-invert prose-sm max-w-none text-white/60 leading-relaxed">
                        {prop.description}
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-80 space-y-6 shrink-0">
                    {prop.status === 'ACTIVE' ? (
                      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Vote size={14} className="text-[#16c784]" /> Cast Your Ballot
                        </h3>
                        <div className="space-y-3">
                          {['FOR', 'AGAINST', 'ABSTAIN'].map(choice => (
                            <button
                              key={choice}
                              disabled={submittingVote === prop.id}
                              onClick={() => castVote(prop.id, choice)}
                              className={`w-full py-3 rounded-xl text-xs font-bold transition-all border ${
                                choice === 'FOR' ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' :
                                choice === 'AGAINST' ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' :
                                'border-white/10 text-white/50 hover:bg-white/5'
                              }`}
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#16c784]/5 rounded-2xl p-6 border border-[#16c784]/10">
                        <h3 className="text-xs font-bold text-[#16c784] uppercase tracking-widest mb-4 flex items-center gap-2">
                          <CheckCircle size={14} /> Final Result
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(prop.vote_stats?.choices || {}).map(([choice, data]) => (
                            <div key={choice}>
                              <div className="flex justify-between text-[10px] mb-1.5">
                                <span className="text-white/40 font-bold">{choice}</span>
                                <span className="text-white/80 font-bold">{data.percent.toFixed(1)}%</span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${choice === 'FOR' ? 'bg-emerald-500' : choice === 'AGAINST' ? 'bg-rose-500' : 'bg-white/30'}`} 
                                  style={{ width: `${data.percent}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 text-center">
                       <p className="text-[10px] text-white/30 font-medium">
                         {prop.vote_stats?.total_votes} Shareholders participating
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Advisory */}
      <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex gap-6">
        <ShieldCheck className="text-blue-400 shrink-0" size={24} />
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Trust & Immutability</p>
          <p className="text-xs text-white/40 leading-relaxed">
            All votes cast are immutable and cryptographically linked to your shareholder ID. The final tally is audited and recorded in the management company's board minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
