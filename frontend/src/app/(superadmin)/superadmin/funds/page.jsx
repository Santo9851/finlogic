'use client'

/**
 * (superadmin)/funds/page.jsx
 * Fund Management for Superadmins.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Loader2,
  Filter,
  Edit,
  X,
  Save,
  Trash2,
  AlertCircle
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'RAISING', label: 'Raising' },
  { value: 'INVESTING', label: 'Investing' },
  { value: 'HARVESTING', label: 'Harvesting' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function SuperAdminFundsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFund, setSelectedFund] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch Funds
  const { data: funds = [], isLoading } = useQuery({
    queryKey: ['superadmin', 'funds'],
    queryFn: async () => {
      const res = await api.get('/superadmin/funds/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: (newFund) => api.post('/superadmin/funds/', newFund),
    onSuccess: () => {
      queryClient.invalidateQueries(['superadmin', 'funds']);
      toast.success('Fund created successfully');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to create fund')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/superadmin/funds/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['superadmin', 'funds']);
      toast.success('Fund updated successfully');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update fund')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/superadmin/funds/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['superadmin', 'funds']);
      toast.success('Fund deleted successfully');
    },
    onError: () => toast.error('Failed to delete fund')
  });

  // 3. Filtering
  const filteredFunds = useMemo(() => {
    return funds.filter(fund => {
      const matchesSearch = 
        fund.name.toLowerCase().includes(search.toLowerCase()) ||
        fund.legal_name.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || fund.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [funds, search, statusFilter]);

  const openModal = (fund = null) => {
    setSelectedFund(fund);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedFund(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Numeric conversions
    data.vintage_year = parseInt(data.vintage_year);
    data.target_size_npr = parseFloat(data.target_size_npr);
    data.preferred_return_pct = parseFloat(data.preferred_return_pct);
    data.carry_pct = parseFloat(data.carry_pct);

    if (selectedFund) {
      updateMutation.mutate({ id: selectedFund.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this fund? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Fund Management</h1>
          <p className="text-white/40 text-sm">Manage PE funds, economics, and status.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-500/10"
        >
          <Plus size={18} /> New Fund
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            type="text" 
            placeholder="Search funds..."
            className="w-full bg-[#0a0014] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-purple-500/40 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-white/30" />
          <select 
            className="bg-[#0a0014] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/40 transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Fund Name</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Vintage</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Target Size</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Hurdle/Carry</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredFunds.map(fund => (
              <tr key={fund.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{fund.name}</span>
                    <span className="text-white/30 text-xs">{fund.legal_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-white/60">
                  {fund.vintage_year}
                </td>
                <td className="px-6 py-4 text-white font-mono">
                  NPR {parseFloat(fund.target_size_npr).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-white/60">
                  {fund.preferred_return_pct}% / {fund.carry_pct}%
                </td>
                <td className="px-6 py-4">
                  <span className={`
                    text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border
                    ${fund.status === 'RAISING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                      fund.status === 'INVESTING' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-white/5 text-white/40 border-white/10'}
                  `}>
                    {fund.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => openModal(fund)}
                      className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(fund.id)}
                      className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredFunds.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-white/20 italic">
                  No funds found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0124] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {selectedFund ? 'Edit Fund' : 'Create New Fund'}
              </h3>
              <button onClick={closeModal} className="text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Display Name</label>
                  <input 
                    name="name"
                    defaultValue={selectedFund?.name}
                    required
                    placeholder="e.g. Growth Fund I"
                    className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Legal Name</label>
                  <input 
                    name="legal_name"
                    defaultValue={selectedFund?.legal_name}
                    required
                    placeholder="Full Registered Name"
                    className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Vintage Year</label>
                  <input 
                    name="vintage_year"
                    type="number"
                    defaultValue={selectedFund?.vintage_year || new Date().getFullYear()}
                    required
                    className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Target Size (NPR)</label>
                  <input 
                    name="target_size_npr"
                    type="number"
                    step="0.01"
                    defaultValue={selectedFund?.target_size_npr}
                    required
                    className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Pref. Return (%)</label>
                  <input 
                    name="preferred_return_pct"
                    type="number"
                    step="0.1"
                    defaultValue={selectedFund?.preferred_return_pct || 8.0}
                    required
                    className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Carry (%)</label>
                  <input 
                    name="carry_pct"
                    type="number"
                    step="0.1"
                    defaultValue={selectedFund?.carry_pct || 20.0}
                    required
                    className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Fund Status</label>
                  <select 
                    name="status"
                    defaultValue={selectedFund?.status || 'RAISING'}
                    className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none transition-all"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {(createMutation.isLoading || updateMutation.isLoading) ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <SaveIcon size={18} />
                  )}
                  {selectedFund ? 'Update Fund' : 'Create Fund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveIcon({ size }) {
  return <Save size={size} />;
}
