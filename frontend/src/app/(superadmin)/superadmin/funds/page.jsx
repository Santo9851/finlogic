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
  AlertCircle,
  Building2,
  ChevronRight
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

const STATUS_OPTIONS = [
  { value: 'RAISING', label: 'Raising' },
  { value: 'INVESTING', label: 'Investing' },
  { value: 'HARVESTING', label: 'Harvesting' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function SuperAdminFundsPage() {
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Fund Vehicles...</p>
    </div>
  );

  return (
    <div className="space-y-8 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
            <Building2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Fund Vehicles</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Manage Institutional Economics & Deployment Status</p>
          </div>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-xl active:scale-95"
        >
          <Plus size={18} /> New Fund Vehicle
        </button>
      </div>

      {/* Filters Panel */}
      <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-center theme-transition relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex-1 relative group w-full relative z-10">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/20 group-focus-within:text-purple-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search funds by name or legal identity..."
            className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 pl-14 pr-6 text-foreground text-sm focus:border-purple-500/40 outline-none transition-all shadow-inner font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4 bg-foreground/[0.03] p-1.5 rounded-2xl border border-border-theme shadow-inner relative z-10">
          <Filter size={16} className="ml-4 text-text-muted/40" />
          <select 
            className="bg-transparent border-none py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-text-muted outline-none focus:text-foreground transition-all cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all" className="bg-background">All Institutional Statuses</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-background">{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border-theme rounded-[3rem] overflow-hidden shadow-2xl theme-transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-foreground/[0.01] border-b border-border-theme">
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Fund Specification</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Vintage</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Target (NPR)</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Hurdle / Carry</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/50">
              {filteredFunds.map(fund => (
                <tr key={fund.id} className="hover:bg-foreground/[0.01] transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner group-hover:scale-110 transition-transform">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground uppercase tracking-tight leading-tight">{fund.name}</p>
                        <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest mt-1 truncate max-w-[200px]">{fund.legal_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-text-muted font-mono text-xs">
                    {fund.vintage_year}
                  </td>
                  <td className="px-10 py-7 text-foreground font-black tracking-tighter text-sm">
                    रू {parseFloat(fund.target_size_npr).toLocaleString()}
                  </td>
                  <td className="px-10 py-7 text-text-muted/60 text-[10px] font-black uppercase tracking-widest">
                    <span className="text-purple-500/80">{fund.preferred_return_pct}%</span> / <span className="text-ls-compliment">{fund.carry_pct}%</span>
                  </td>
                  <td className="px-10 py-7">
                    <span className={`
                      text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-inner
                      ${fund.status === 'RAISING' ? 'bg-blue-500/5 text-blue-500 border-blue-500/20' : 
                        fund.status === 'INVESTING' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' :
                        'bg-foreground/5 text-text-muted/40 border-border-theme'}
                    `}>
                      {fund.status}
                    </span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => openModal(fund)}
                        className="p-3 text-text-muted/20 hover:text-purple-500 hover:bg-purple-500/5 rounded-xl border border-transparent hover:border-purple-500/20 transition-all active:scale-95 shadow-sm"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(fund.id)}
                        className="p-3 text-text-muted/20 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl border border-transparent hover:border-rose-500/20 transition-all active:scale-95 shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFunds.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-10 py-32 text-center">
                    <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-theme shadow-inner">
                      <AlertCircle className="text-text-muted/10" size={40} />
                    </div>
                    <p className="text-text-muted font-black uppercase tracking-widest text-xs">No Fund Records Discovered</p>
                    <p className="text-text-muted/20 text-[10px] uppercase font-black tracking-[0.3em] mt-2">Initialize a new institutional vehicle to begin deployment</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-12 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card border border-border-theme w-full max-w-2xl rounded-[3rem] p-12 relative shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] theme-transition overflow-y-auto max-h-[90vh]">
            <button onClick={closeModal} className="absolute top-8 right-8 p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95">
              <X size={24} />
            </button>
            
            <div className="mb-10">
              <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">
                {selectedFund ? 'Configure Fund' : 'New Fund Vehicle'}
              </h2>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">Define economic structure & institutional parameters</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Institutional Name</label>
                  <input 
                    name="name"
                    defaultValue={selectedFund?.name}
                    required
                    placeholder="Growth Fund I"
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm focus:border-purple-500 outline-none shadow-inner transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Legal Entity Registry</label>
                  <input 
                    name="legal_name"
                    defaultValue={selectedFund?.legal_name}
                    required
                    placeholder="Full Registered Identity"
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm focus:border-purple-500 outline-none shadow-inner transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Vintage Year</label>
                  <input 
                    name="vintage_year"
                    type="number"
                    defaultValue={selectedFund?.vintage_year || new Date().getFullYear()}
                    required
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm focus:border-purple-500 outline-none shadow-inner transition-all font-medium"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Target Notional Size (NPR)</label>
                  <input 
                    name="target_size_npr"
                    type="number"
                    step="0.01"
                    defaultValue={selectedFund?.target_size_npr}
                    required
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm focus:border-purple-500 outline-none shadow-inner transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Pref. Return (%)</label>
                  <input 
                    name="preferred_return_pct"
                    type="number"
                    step="0.1"
                    defaultValue={selectedFund?.preferred_return_pct || 8.0}
                    required
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm focus:border-purple-500 outline-none shadow-inner transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Carry / Performance (%)</label>
                  <input 
                    name="carry_pct"
                    type="number"
                    step="0.1"
                    defaultValue={selectedFund?.carry_pct || 20.0}
                    required
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm focus:border-purple-500 outline-none shadow-inner transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Vehicle Status</label>
                  <select 
                    name="status"
                    defaultValue={selectedFund?.status || 'RAISING'}
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm focus:border-purple-500 outline-none shadow-inner appearance-none transition-all font-medium"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-background">{opt.label}</option>
                    ))}
                  </select>
                </div>
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
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {(createMutation.isLoading || updateMutation.isLoading) ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {selectedFund ? 'Update Records' : 'Initialize Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
