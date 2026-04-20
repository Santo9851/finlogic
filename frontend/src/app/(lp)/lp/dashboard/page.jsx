'use client'

/**
 * (lp)/dashboard/page.jsx
 * Dashboard for Limited Partners.
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  PieChart, 
  Wallet, 
  ArrowUpRight, 
  FileText, 
  TrendingUp, 
  Loader2,
  Building2,
  History,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import api from '@/services/api';
import { MetricCard } from '@/components/portal/PortalShell';

export default function LPDashboard() {
  const [selectedFundId, setSelectedFundId] = useState(null);

  // 1. Fetch LP Dashboard Summary
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['lp', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/deals/lp/dashboard/');
      return res.data;
    }
  });

  const funds = dashboard?.funds || [];
  const selectedFund = useMemo(() => {
    if (selectedFundId) return funds.find(f => f.id === selectedFundId);
    return funds[0];
  }, [funds, selectedFundId]);

  // 2. Fetch Fund Details (for selected fund)
  const { data: fundDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['lp', 'fund', selectedFund?.id],
    queryFn: async () => {
      const res = await api.get(`/deals/lp/fund/${selectedFund.id}/`);
      return res.data;
    },
    enabled: !!selectedFund?.id
  });

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 size={32} className="text-[#F59F01] animate-spin" />
    </div>
  );

  const commitment = selectedFund?.my_commitment;

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Fund Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Investor Portal</h1>
          <p className="text-white/40 text-sm mt-1">Welcome back, {dashboard?.lp_profile?.full_name}</p>
        </div>

        {funds.length > 1 && (
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {funds.map(fund => (
              <button
                key={fund.id}
                onClick={() => setSelectedFundId(fund.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  (selectedFundId === fund.id || (!selectedFundId && fund === funds[0]))
                    ? 'bg-[#F59F01] text-black shadow-lg shadow-[#F59F01]/20'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {fund.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedFund ? (
        <div className="p-20 text-center border border-dashed border-white/10 rounded-2xl text-white/20">
          No fund commitments found.
        </div>
      ) : (
        <>
          {/* Action Required Alert */}
          {selectedFund.pending_action_count > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Actions Required</p>
                  <p className="text-xs text-white/50">You have {selectedFund.pending_action_count} document(s) awaiting your acknowledgment.</p>
                </div>
              </div>
              <a 
                href="/lp/documents" 
                className="bg-amber-500 text-black text-[10px] font-bold px-4 py-2 rounded-lg hover:scale-105 transition-all"
              >
                Go to Vault
              </a>
            </div>
          )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              label="Committed Capital" 
              value={`NPR ${(dashboard?.total_committed_npr / 1e6).toFixed(1)}M`} 
              icon={Wallet} 
              color="#F59F01" 
            />
            <MetricCard 
              label="Capital Called" 
              value={`NPR ${(dashboard?.total_called_npr / 1e6).toFixed(1)}M`} 
              icon={ArrowUpRight} 
              color="#0B6EC3" 
            />
            <MetricCard 
              label="Total Distributions" 
              value={`NPR ${(dashboard?.total_distributed_npr / 1e6).toFixed(1)}M`} 
              icon={PieChart} 
              color="#16c784" 
            />
            <MetricCard 
              label="Current NAV" 
              value={`NPR ${(dashboard?.nav_npr / 1e6).toFixed(1)}M`} 
              icon={TrendingUp} 
              color="#8b5cf6" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'TVPI', value: dashboard?.total_called_npr > 0 ? (dashboard?.nav_npr / dashboard?.total_called_npr).toFixed(2) + 'x' : '0.00x', sub: 'Gross MOIC' },
                  { label: 'DPI', value: dashboard?.total_called_npr > 0 ? (dashboard?.total_distributed_npr / dashboard?.total_called_npr).toFixed(2) + 'x' : '0.00x', sub: 'Cash Returned' },
                  { label: 'RVPI', value: dashboard?.total_called_npr > 0 ? ((dashboard?.nav_npr - dashboard?.total_distributed_npr) / dashboard?.total_called_npr).toFixed(2) + 'x' : '0.00x', sub: 'Residual Val.' },
                  { label: 'Net IRR', value: '18.4%', sub: 'Since Inception' },
                ].map((m, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-2xl group hover:border-[#F59F01]/30 transition-all">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">{m.label}</p>
                    <p className="text-xl font-bold text-white group-hover:text-[#F59F01] transition-colors">{m.value}</p>
                    <p className="text-[10px] text-white/20 mt-1">{m.sub}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                    <Building2 size={16} className="text-[#0B6EC3]" /> Portfolio Companies
                  </h3>
                  <span className="text-[10px] text-white/40">{fundDetail?.approved_deals?.length || 0} Assets</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[10px] text-white/20 uppercase tracking-widest border-b border-white/5">
                        <th className="px-6 py-4 font-semibold">Company Name</th>
                        <th className="px-6 py-4 font-semibold">Sector</th>
                        <th className="px-6 py-4 font-semibold">Stage</th>
                        <th className="px-6 py-4 font-semibold text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {fundDetail?.approved_deals?.map((deal, i) => (
                        <tr key={deal.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/20 border border-white/10">
                                {deal.legal_name.substring(0, 1)}
                              </div>
                              <span className="text-white font-medium group-hover:text-[#F59F01] transition-colors">
                                {deal.status === 'CLOSED' ? deal.legal_name : 'Project ' + (i + 1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/50">
                              {deal.sector}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">
                              {deal.status_display}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button className="text-white/20 hover:text-white transition-colors">
                              <ChevronRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!fundDetail?.approved_deals || fundDetail.approved_deals.length === 0) && (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-white/20 italic">
                            No investments to display yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-[#0B6EC3]/5 border border-[#0B6EC3]/20 rounded-2xl p-6 space-y-6">
                <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-widest border-b border-white/10 pb-4">
                  <FileText size={16} className="text-[#0B6EC3]" /> Recent Documents
                </h3>
                
                <div className="space-y-4">
                  {(dashboard?.recent_documents || []).map((doc, idx) => (
                    <div key={idx} className="flex items-start gap-3 group cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#0B6EC3]/20 group-hover:text-[#0B6EC3] transition-all border border-white/10">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-[#0B6EC3] transition-colors">{doc.title}</p>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">
                            {new Date(doc.publish_date || doc.uploaded_at).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-white/10">{(doc.file_size / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!dashboard?.recent_documents || dashboard.recent_documents.length === 0) && (
                    <p className="text-xs text-white/20 text-center py-4 italic">No recent documents</p>
                  )}
                </div>
                
                <a 
                  href="/lp/documents"
                  className="block w-full py-3 bg-white/5 hover:bg-white/10 text-white text-center text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-white/10"
                >
                  View Document Vault
                </a>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-white/40 flex items-center gap-2 uppercase tracking-widest px-2">
                  <History size={14} /> Fund Activity
                </h3>
                
                <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                  {(dashboard?.activity_feed || []).map((act, idx) => (
                    <div key={idx} className="relative">
                      <div 
                        className="absolute -left-[21px] top-1 w-2 h-2 rounded-full border-2 border-[#060010]" 
                        style={{ backgroundColor: act.type === 'CAPITAL_CALL' ? '#F59F01' : '#16c784' }} 
                      />
                      <p className="text-xs font-semibold text-white">{act.title}</p>
                      <div className="flex justify-between items-center mt-0.5">
                        <span className="text-[10px] text-white/20 uppercase tracking-tighter">
                          {new Date(act.date).toLocaleDateString()}
                        </span>
                        <span className={`text-[10px] font-bold ${act.type === 'CAPITAL_CALL' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {act.type === 'CAPITAL_CALL' ? '-' : '+'} NPR {(act.amount / 1e6).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!dashboard?.activity_feed || dashboard.activity_feed.length === 0) && (
                    <p className="text-xs text-white/20 italic pl-2">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
