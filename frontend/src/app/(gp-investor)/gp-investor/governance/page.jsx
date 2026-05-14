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
    <div className="h-[60vh] flex flex-col items-center justify-center gap-12 theme-transition">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Governance Protocol...</p>
    </div>
  );

  return (
    <div className="space-y-20 animate-in fade-in duration-1000 pb-32 max-w-7xl mx-auto">
      {/* Header - Institutional Governance Gateway */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border-theme pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
            <Gavel size={14} /> Governance Execution Gateway
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
            Strategic <span className="italic">Mandates</span>
          </h1>
          <p className="text-xl text-text-muted font-serif font-light italic max-w-2xl">
            Exercise shareholder authority through cryptographic ballot ingestion. Vote weight is calculated proportional to authenticated shareholding.
          </p>
        </div>
        <div className="flex items-center gap-6 px-10 py-5 bg-border-theme/20 border border-border-theme shadow-sm">
           <div className="space-y-1 text-right">
             <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Ballot Registry</p>
             <p className="text-[9px] text-text-muted/40 font-bold uppercase tracking-widest font-mono">GOV-PROT-2075-X</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-16">
        {proposals.length === 0 ? (
          <div className="bg-card border border-border-theme p-24 text-center shadow-2xl">
            <Lock size={32} className="text-text-muted/10 mb-10 mx-auto" />
            <h3 className="text-2xl font-serif font-light text-foreground uppercase tracking-tight">Registry Dormant</h3>
            <p className="text-text-muted/40 text-[10px] font-bold uppercase tracking-[0.4em] mt-4 font-serif italic">No active or historical mandates identified in sequence.</p>
          </div>
        ) : (
          proposals.map(prop => (
            <div key={prop.id} className="bg-card border border-border-theme shadow-2xl theme-transition overflow-hidden group">
              <div className="p-12">
                <div className="flex flex-col lg:flex-row gap-20">
                  <div className="flex-1 space-y-10">
                    <div className="flex items-center gap-8">
                      <span className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.3em] border ${
                        prop.status === 'ACTIVE' ? 'border-ls-up/30 bg-ls-up/5 text-ls-up' : 'border-border-theme bg-border-theme/10 text-text-muted/40'
                      }`}>
                        {prop.status_display}
                      </span>
                      <div className="flex items-center gap-3 text-text-muted/30 text-[10px] font-bold uppercase tracking-[0.3em] font-mono">
                        <Clock size={12} />
                        MATURITY: {new Date(prop.expiry_date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <h2 className="text-4xl font-serif font-light text-foreground tracking-tight uppercase leading-none group-hover:text-ls-compliment transition-all">{prop.title}</h2>
                      <div className="prose prose-invert prose-lg max-w-none text-text-muted/60 leading-relaxed font-serif italic">
                        {prop.description}
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-96 space-y-8 shrink-0">
                    {prop.status === 'ACTIVE' ? (
                      <div className="bg-border-theme/10 border border-border-theme p-10 shadow-inner">
                        <h3 className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em] mb-10 flex items-center gap-4 leading-none">
                          <Vote size={14} className="text-ls-compliment" /> Ballot Ingestion Protocol
                        </h3>
                        <div className="space-y-4">
                          {['FOR', 'AGAINST', 'ABSTAIN'].map(choice => (
                            <button
                              key={choice}
                              disabled={submittingVote === prop.id}
                              onClick={() => castVote(prop.id, choice)}
                              className={`w-full py-5 text-[10px] font-bold tracking-[0.3em] transition-all border uppercase ${
                                choice === 'FOR' ? 'border-ls-up/30 text-ls-up hover:bg-ls-up hover:text-ls-white' :
                                choice === 'AGAINST' ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-ls-white' :
                                'border-border-theme text-text-muted/50 hover:bg-ls-primary hover:text-ls-white'
                              }`}
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-ls-up/5 border border-ls-up/20 p-10 shadow-inner">
                        <h3 className="text-[10px] font-bold text-ls-up uppercase tracking-[0.4em] mb-8 flex items-center gap-4 leading-none">
                          <CheckCircle size={14} /> Verified Outcome
                        </h3>
                        <div className="space-y-6">
                          {Object.entries(prop.vote_stats?.choices || {}).map(([choice, data]) => (
                            <div key={choice} className="space-y-2">
                              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest font-mono">
                                <span className="text-text-muted/40">{choice}</span>
                                <span className="text-foreground">{data.percent.toFixed(1)}%</span>
                              </div>
                              <div className="h-px bg-border-theme relative overflow-hidden">
                                <div 
                                  className={`h-full absolute left-0 top-0 transition-all duration-1000 ${choice === 'FOR' ? 'bg-ls-up' : choice === 'AGAINST' ? 'bg-rose-500' : 'bg-text-muted/30'}`} 
                                  style={{ width: `${data.percent}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-6 border border-border-theme bg-foreground/[0.01] text-center">
                       <p className="text-[9px] text-text-muted/30 font-bold uppercase tracking-[0.3em] font-mono">
                         {prop.vote_stats?.total_votes} AUTHENTICATED_NODES
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cryptographic Audit Mandate */}
      <div className="bg-ls-primary p-12 shadow-2xl relative overflow-hidden group border-l-4 border-ls-compliment">
        <div className="absolute top-0 right-0 w-32 h-32 bg-ls-compliment/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="w-12 h-12 border border-ls-compliment/40 flex items-center justify-center text-ls-compliment flex-shrink-0 bg-ls-compliment/10">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-4">
            <h4 className="text-ls-white font-serif font-light text-xl uppercase tracking-widest leading-none">Cryptographic Audit Mandate</h4>
            <p className="text-[11px] text-ls-white/50 leading-relaxed font-serif italic max-w-4xl">
              All ballots cast are immutable, irreversible, and cryptographically linked to your institutional identity registry. The final tally is audited and permanently recorded in the management company's strategic board ledger under full governance oversight.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
