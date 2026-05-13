'use client'

/**
 * (superadmin)/deals/page.jsx
 * Deal Management for Superadmins to manage ownership and collaborators.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Users,
  ShieldCheck,
  Loader2,
  Edit,
  X,
  CheckCircle2,
  Building2,
  Filter,
  Eye,
  CircleDollarSign,
  Briefcase,
  ChevronRight,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';
import InvestmentFinalizer from '@/components/admin/InvestmentFinalizer';
import CapitalCallWizard from '@/components/admin/CapitalCallWizard';
import { useTheme } from 'next-themes';

export default function SuperAdminDealsPage() {
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFinalizer, setShowFinalizer] = useState(false);
  const [showCapitalCallWizard, setShowCapitalCallWizard] = useState(false);
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState([]);

  // 1. Fetch Deals
  const { data: deals = [], isLoading: isLoadingDeals } = useQuery({
    queryKey: ['superadmin', 'deals'],
    queryFn: async () => {
      const res = await api.get('/superadmin/deals/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  // 2. Fetch Users (for assignment)
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['superadmin', 'users'],
    queryFn: async () => {
      const res = await api.get('/superadmin/users/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  const { data: funds = [] } = useQuery({
    queryKey: ['superadmin', 'funds'],
    queryFn: async () => {
      const res = await api.get('/deals/funds/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  // 3. Mutations
  const updateDealMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/superadmin/deals/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['superadmin', 'deals']);
      toast.success('Deal collaborators updated successfully');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update deal')
  });

  const requestRevisionMutation = useMutation({
    mutationFn: (id) => {
      const reason = window.prompt("Enter the reason for requesting a revision (this will be sent to the GP team):", "Legal conditions need update.");
      if (reason === null) throw new Error("Cancelled");
      return api.post(`/superadmin/deals/${id}/request-revision/`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['superadmin', 'deals']);
      toast.success('Revision request sent to GP team.');
    },
    onError: (err) => {
      if (err.message !== "Cancelled") {
        toast.error(err.response?.data?.detail || 'Failed to request revision');
      }
    }
  });

  // 4. Filtering
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      return deal.legal_name.toLowerCase().includes(search.toLowerCase()) || 
             (deal.ocr_registration_number && deal.ocr_registration_number.toLowerCase().includes(search.toLowerCase()));
    });
  }, [deals, search]);

  const gpUsers = useMemo(() => {
    return users.filter(user => user.roles?.includes('admin') || user.roles?.includes('super_admin'));
  }, [users]);

  const openModal = (deal) => {
    setSelectedDeal(deal);
    setSelectedCollaboratorIds(deal.collaborators || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedDeal(null);
    setSelectedCollaboratorIds([]);
    setIsModalOpen(false);
  };

  const handleToggleCollaborator = (userId) => {
    if (selectedCollaboratorIds.includes(userId)) {
      setSelectedCollaboratorIds(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedCollaboratorIds(prev => [...prev, userId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDeal) {
      updateDealMutation.mutate({ 
        id: selectedDeal.id, 
        data: { collaborators: selectedCollaboratorIds } 
      });
    }
  };

  if (isLoadingDeals || isLoadingUsers) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Deal Pipeline...</p>
    </div>
  );

  return (
    <div className="space-y-8 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
            <Briefcase size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Deal Management</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Manage Ownership Protocols & Cross-GP Collaborations</p>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-center theme-transition relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex-1 relative group w-full relative z-10">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/20 group-focus-within:text-purple-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by legal identity or registration record..."
            className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 pl-14 pr-6 text-foreground text-sm focus:border-purple-500/40 outline-none transition-all shadow-inner font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border-theme rounded-[3rem] overflow-hidden shadow-2xl theme-transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-foreground/[0.01] border-b border-border-theme">
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Transaction Entity</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Registry Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Primary Owner</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Collaborators</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/50">
              {filteredDeals.map(deal => (
                <tr key={deal.id} className="hover:bg-foreground/[0.01] transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-text-muted/20 group-hover:text-purple-500 transition-all shadow-inner">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground uppercase tracking-tight leading-tight">{deal.legal_name}</p>
                        <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest mt-1">{deal.sector || 'Uncategorized Sector'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <span className="text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-purple-500/5 text-purple-500 border border-purple-500/20 shadow-inner">
                      {deal.status_display}
                    </span>
                  </td>
                  <td className="px-10 py-7">
                    {deal.created_by_detail ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-foreground/5 border border-border-theme flex items-center justify-center text-[10px] font-black text-text-muted shadow-inner">
                          {deal.created_by_detail.first_name?.[0]}{deal.created_by_detail.last_name?.[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-foreground uppercase tracking-tighter">{deal.created_by_detail.first_name} {deal.created_by_detail.last_name}</span>
                          <span className="text-[8px] text-text-muted/40 font-black uppercase tracking-widest">Protocol Owner</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-text-muted/20 text-[10px] font-black uppercase italic">System Account</span>
                    )}
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex -space-x-3 items-center">
                      {deal.collaborators_detail?.map((collab, i) => (
                         <div key={collab.id} title={`${collab.first_name} ${collab.last_name}`} className="w-8 h-8 rounded-xl bg-purple-600 border-2 border-card flex items-center justify-center text-[9px] font-black text-white z-10 relative shadow-lg group-hover:scale-110 transition-all">
                           {collab.first_name?.[0]}{collab.last_name?.[0]}
                         </div>
                      ))}
                      {(!deal.collaborators_detail || deal.collaborators_detail.length === 0) && (
                        <span className="text-text-muted/20 text-[10px] font-black uppercase tracking-widest pl-2">Restricted</span>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {deal.status === 'CONTRACT_SIGNED' && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => requestRevisionMutation.mutate(deal.id)}
                            disabled={requestRevisionMutation.isPending}
                            className="px-4 py-2.5 bg-foreground/5 text-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-foreground/10 transition-all flex items-center gap-2 border border-border-theme active:scale-95 disabled:opacity-50"
                          >
                            <RotateCcw size={14} /> Request Revision
                          </button>
                          <button 
                            onClick={() => { setSelectedDeal(deal); setShowCapitalCallWizard(true); }}
                            className="px-6 py-2.5 bg-ls-compliment text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all flex items-center gap-2 shadow-lg shadow-ls-compliment/20 active:scale-95"
                          >
                            <CircleDollarSign size={14} /> Issue Call
                          </button>
                        </div>
                      )}
                      {deal.status === 'CAPITAL_CALLED' && (
                        <button 
                          onClick={() => { setSelectedDeal(deal); setShowFinalizer(true); }}
                          className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"
                        >
                          <ShieldCheck size={14} /> Finalize
                        </button>
                      )}
                      <Link
                        href={`/gp/deals/${deal.id}`}
                        className="p-3 text-text-muted/20 hover:text-purple-500 hover:bg-purple-500/5 rounded-xl border border-transparent hover:border-purple-500/20 transition-all active:scale-95 shadow-sm"
                      >
                        <Eye size={18} />
                      </Link>
                      <button 
                        onClick={() => openModal(deal)}
                        className="p-3 text-text-muted/20 hover:text-purple-500 hover:bg-purple-500/5 rounded-xl border border-transparent hover:border-purple-500/20 transition-all active:scale-95 shadow-sm"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDeals.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-10 py-32 text-center">
                    <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-theme shadow-inner">
                      <AlertCircle className="text-text-muted/10" size={40} />
                    </div>
                    <p className="text-text-muted font-black uppercase tracking-widest text-xs">No Deals Discovered</p>
                    <p className="text-text-muted/20 text-[10px] uppercase font-black tracking-[0.3em] mt-2">Adjust system constraints or verify backend synchronization</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Collaborators Modal */}
      {isModalOpen && selectedDeal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-12 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card border border-border-theme w-full max-w-2xl rounded-[3rem] p-12 relative shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] theme-transition">
            <button onClick={closeModal} className="absolute top-8 right-8 p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95">
              <X size={24} />
            </button>
            
            <div className="mb-10">
              <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">Collaborator Protocol</h2>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">Manage assignment for {selectedDeal.legal_name}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4 max-h-[25rem] overflow-y-auto pr-4 custom-scrollbar">
                <label className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.3em] ml-1">Available GP Staff Registry</label>
                {gpUsers.map(user => {
                  const isOwner = selectedDeal.created_by === user.id;
                  const isCollaborator = selectedCollaboratorIds.includes(user.id);
                  
                  return (
                    <div 
                      key={user.id} 
                      onClick={() => !isOwner && handleToggleCollaborator(user.id)}
                      className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${isOwner ? 'bg-foreground/5 border-border-theme opacity-50 cursor-not-allowed shadow-inner' : isCollaborator ? 'bg-purple-500/5 border-purple-500/30 cursor-pointer shadow-lg' : 'bg-foreground/[0.03] border-border-theme hover:border-purple-500/40 cursor-pointer shadow-sm'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black ${isCollaborator ? 'bg-purple-500 text-white shadow-lg' : 'bg-foreground/5 text-text-muted/40 shadow-inner'}`}>
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-black uppercase tracking-tight ${isCollaborator ? 'text-foreground' : 'text-foreground/70'}`}>{user.first_name} {user.last_name}</span>
                          <span className="text-text-muted/30 text-[9px] font-black uppercase tracking-widest">{user.email}</span>
                        </div>
                      </div>
                      <div>
                        {isOwner ? (
                          <span className="text-[8px] bg-purple-500/10 text-purple-500 px-3 py-1 rounded-lg border border-purple-500/20 font-black uppercase tracking-widest">Protocol Owner</span>
                        ) : isCollaborator ? (
                          <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                            <CheckCircle2 size={14} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg border-2 border-border-theme shadow-inner" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-10 flex gap-6">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 px-8 py-4 rounded-2xl border border-border-theme text-text-muted text-[10px] font-black uppercase tracking-widest hover:bg-foreground/5 hover:text-foreground transition-all shadow-sm active:scale-95"
                >
                  Terminate
                </button>
                <button 
                  type="submit"
                  disabled={updateDealMutation.isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {updateDealMutation.isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  Authorize Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showCapitalCallWizard && selectedDeal && (
        <CapitalCallWizard 
          deal={selectedDeal}
          onClose={() => { setShowCapitalCallWizard(false); setSelectedDeal(null); }}
          onRefresh={() => queryClient.invalidateQueries(['superadmin', 'deals'])}
        />
      )}
      {showFinalizer && selectedDeal && (
        <InvestmentFinalizer 
          deal={selectedDeal}
          funds={funds}
          onClose={() => { setShowFinalizer(false); setSelectedDeal(null); }}
          onRefresh={() => queryClient.invalidateQueries(['superadmin', 'deals'])}
        />
      )}
    </div>
  );
}
