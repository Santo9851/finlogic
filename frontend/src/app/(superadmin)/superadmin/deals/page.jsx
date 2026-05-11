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
  CircleDollarSign
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';
import InvestmentFinalizer from '@/components/admin/InvestmentFinalizer';
import CapitalCallWizard from '@/components/admin/CapitalCallWizard';

export default function SuperAdminDealsPage() {
  const queryClient = useQueryClient();
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
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Deal Ownership Management</h1>
          <p className="text-white/40 text-sm">Manage GP assignments and visibility for all platform deals.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            type="text" 
            placeholder="Search by legal name..."
            className="w-full bg-[#0a0014] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-purple-500/40 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Deal</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Created By (Owner)</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Collaborators</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredDeals.map(deal => (
              <tr key={deal.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{deal.legal_name}</span>
                    <span className="text-white/30 text-xs">{deal.sector}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20 uppercase">
                     {deal.status_display}
                   </span>
                </td>
                <td className="px-6 py-4">
                  {deal.created_by_detail ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">
                        {deal.created_by_detail.first_name?.[0]}{deal.created_by_detail.last_name?.[0]}
                      </div>
                      <span className="text-white/70 text-xs">{deal.created_by_detail.first_name} {deal.created_by_detail.last_name}</span>
                    </div>
                  ) : (
                    <span className="text-white/30 text-xs italic">System / Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex -space-x-2">
                    {deal.collaborators_detail?.map((collab, i) => (
                       <div key={collab.id} title={`${collab.first_name} ${collab.last_name}`} className="w-6 h-6 rounded-full bg-blue-500/20 border border-[#0d0124] flex items-center justify-center text-[10px] text-blue-400 z-10 relative">
                         {collab.first_name?.[0]}{collab.last_name?.[0]}
                       </div>
                    ))}
                    {(!deal.collaborators_detail || deal.collaborators_detail.length === 0) && (
                      <span className="text-white/30 text-xs italic pl-2">None</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {deal.status === 'CONTRACT_SIGNED' && (
                      <button 
                        onClick={() => { setSelectedDeal(deal); setShowCapitalCallWizard(true); }}
                        className="px-4 py-2 bg-[#F59F01] text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#F59F01]/90 transition-all flex items-center gap-2"
                      >
                        <CircleDollarSign size={14} /> Issue Call
                      </button>
                    )}
                    {deal.status === 'CAPITAL_CALLED' && (
                      <button 
                        onClick={() => { setSelectedDeal(deal); setShowFinalizer(true); }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2"
                      >
                        <ShieldCheck size={14} /> Finalize
                      </button>
                    )}
                    <Link
                      href={`/gp/deals/${deal.id}`}
                      className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all inline-flex items-center gap-2"
                    >
                      <Eye size={16} /> <span className="text-xs">View</span>
                    </Link>
                    <button 
                      onClick={() => openModal(deal)}
                      className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all inline-flex items-center gap-2"
                    >
                      <Edit size={16} /> <span className="text-xs">Manage</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredDeals.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-white/20 italic">
                  No deals found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Collaborators Modal */}
      {isModalOpen && selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0124] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Manage Collaborators</h3>
                <p className="text-white/40 text-xs mt-1">{selectedDeal.legal_name}</p>
              </div>
              <button onClick={closeModal} className="text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Available GP Staff</label>
                {gpUsers.map(user => {
                  const isOwner = selectedDeal.created_by === user.id;
                  const isCollaborator = selectedCollaboratorIds.includes(user.id);
                  
                  return (
                    <div 
                      key={user.id} 
                      onClick={() => !isOwner && handleToggleCollaborator(user.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isOwner ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' : isCollaborator ? 'bg-purple-500/10 border-purple-500/30 cursor-pointer' : 'bg-[#060010] border-white/10 hover:border-white/20 cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isCollaborator ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/40'}`}>
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm ${isCollaborator ? 'text-white' : 'text-white/70'}`}>{user.first_name} {user.last_name}</span>
                          <span className="text-white/30 text-[10px]">{user.email}</span>
                        </div>
                      </div>
                      <div>
                        {isOwner ? (
                          <span className="text-[10px] bg-white/10 text-white/60 px-2 py-1 rounded border border-white/5 uppercase">Primary Owner</span>
                        ) : isCollaborator ? (
                          <CheckCircle2 size={18} className="text-purple-400" />
                        ) : (
                          <div className="w-4 h-4 rounded border border-white/20" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-6 border-t border-white/10 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updateDealMutation.isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {updateDealMutation.isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  Save Assignments
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
