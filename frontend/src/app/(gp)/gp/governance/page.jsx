'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Clock, 
  CheckCircle, 
  Trash2, 
  X,
  PieChart,
  Users,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function GPGovernancePage() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    expiry_date: '',
    status: 'DRAFT'
  });

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await api.get('/deals/admin/governance-proposals/');
      setProposals(res.data.results || res.data || []);
    } catch (err) {
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/deals/admin/governance-proposals/', newProposal);
      toast.success('Proposal created');
      setShowCreateModal(false);
      setNewProposal({ title: '', description: '', expiry_date: '', status: 'DRAFT' });
      fetchProposals();
    } catch (err) {
      toast.error('Failed to create proposal');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/deals/admin/governance-proposals/${id}/`, { status });
      toast.success(`Proposal status updated to ${status}`);
      fetchProposals();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/deals/admin/governance-proposals/${id}/`);
      toast.success('Proposal deleted');
      fetchProposals();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Governance & Voting Admin</h1>
          <p className="text-white/50 mt-1">Create and manage shareholder voting ballots and governance proposals.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#F59F01] hover:bg-[#F59F01]/90 text-black px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-[#F59F01]/20"
        >
          <Plus size={18} />
          Create New Proposal
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center py-20 text-white/30 italic">Loading proposals...</div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10 text-white/30 italic">
            No proposals found. Create your first governance ballot above.
          </div>
        ) : (
          proposals.map(prop => (
            <div key={prop.id} className="bg-[#08001a] border border-white/8 rounded-2x overflow-hidden group">
              <div className="p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                      prop.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                      prop.status === 'CLOSED' ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-white/40'
                    }`}>
                      {prop.status_display}
                    </span>
                    <h3 className="text-lg font-bold text-white">{prop.title}</h3>
                  </div>
                  <p className="text-sm text-white/50 line-clamp-2">{prop.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2 text-white/40">
                      <Clock size={14} className="text-amber-400" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Expires: {new Date(prop.expiry_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/40">
                      <Users size={14} className="text-blue-400" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">{prop.vote_stats?.total_votes} Shareholders Voted</span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-64 space-y-4 pt-4 md:pt-0">
                  <div className="bg-white/2 rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-white/40 uppercase">Live Tally</span>
                      <PieChart size={14} className="text-[#F59F01]" />
                    </div>
                    <div className="space-y-2">
                      {Object.entries(prop.vote_stats?.choices || {}).map(([choice, data]) => (
                        <div key={choice}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-white/60">{choice}</span>
                            <span className="text-white/80">{data.percent.toFixed(1)}%</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${choice === 'FOR' ? 'bg-emerald-500' : choice === 'AGAINST' ? 'bg-rose-500' : 'bg-white/30'}`} 
                              style={{ width: `${data.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-center justify-end gap-2 md:border-l border-white/5 md:pl-6">
                  {prop.status === 'DRAFT' && (
                    <button 
                      onClick={() => updateStatus(prop.id, 'ACTIVE')}
                      className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg group-hover:block"
                      title="Launch Ballot"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {prop.status === 'ACTIVE' && (
                    <button 
                      onClick={() => updateStatus(prop.id, 'CLOSED')}
                      className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg"
                      title="Close Voting"
                    >
                      <LockIcon size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(prop.id)}
                    className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#08001a] border border-white/10 w-full max-w-2xl rounded-3xl p-8 relative shadow-2xl">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 text-white/40 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Launch Governance Proposal</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 px-1">Proposal Title</label>
                  <input 
                    type="text" 
                    required
                    value={newProposal.title}
                    onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#F59F01]/50"
                  />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 px-1">Expiry Date & Time</label>
                   <input 
                    type="datetime-local" 
                    required
                    value={newProposal.expiry_date}
                    onChange={(e) => setNewProposal({...newProposal, expiry_date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#F59F01]/50"
                  />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 px-1">Initial Status</label>
                   <select 
                    value={newProposal.status}
                    onChange={(e) => setNewProposal({...newProposal, status: e.target.value})}
                    className="w-full bg-[#0a0014] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none"
                   >
                     <option value="DRAFT">Draft</option>
                     <option value="ACTIVE">Launch immediately</option>
                   </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 px-1">Detailed Description</label>
                  <textarea 
                    required
                    value={newProposal.description}
                    onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#F59F01]/50 h-32 resize-none"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-[#F59F01] text-black font-bold py-3 rounded-xl hover:bg-[#F59F01]/90 disabled:opacity-50 shadow-lg shadow-[#F59F01]/20"
              >
                {saving ? 'Saving...' : 'Deploy Proposal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LockIcon({ size }) {
  return (
    <svg 
      width={size} height={size} 
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}
