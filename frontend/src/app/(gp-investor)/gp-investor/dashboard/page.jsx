'use client'

/**
 * (gp-investor)/dashboard/page.jsx
 * Dashboard for GP Investors (shareholders in the management company).
 */
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  FileCheck, 
  ShieldCheck, 
  Gavel,
  ArrowUpRight,
  Loader2,
  ExternalLink,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import api from '@/services/api';
import { MetricCard } from '@/components/portal/PortalShell';

export default function GPInvestorDashboard() {
  // 1. Fetch GP Investor Dashboard Data
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['gp-investor', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/deals/gp-investor/dashboard/');
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 size={32} className="text-[#F59F01] animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">GP Investor Portal</h1>
        <p className="text-white/40 text-sm mt-1">Management Company Shareholder Overview</p>
      </div>

      {/* Shareholding Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Your Shares" 
          value={dashboard?.shareholder?.shares_held?.toLocaleString() || '0'} 
          icon={Users} 
          color="#F59F01" 
        />
        <MetricCard 
          label="Ownership %" 
          value={`${dashboard?.shareholder?.ownership_percentage || '0'}%`} 
          icon={ShieldCheck} 
          color="#0B6EC3" 
        />
        <MetricCard 
          label="Dividends Received" 
          value={`NPR ${(dashboard?.shareholder?.total_dividends_npr / 1e5).toFixed(1)}L`} 
          icon={ArrowUpRight} 
          color="#16c784" 
        />
        <MetricCard 
          label="Total AUM" 
          value={`NPR ${(dashboard?.total_committed_npr / 1e7).toFixed(1)}Cr`} 
          icon={BarChart3} 
          color="#8b5cf6" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Fund Performance & Governance */}
        <div className="lg:col-span-2 space-y-8">
          {/* Fund Performance Table */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                <BarChart3 size={16} className="text-[#F59F01]" /> Fund Performance Summary
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] text-white/20 uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-4 font-semibold">Fund Name</th>
                    <th className="px-6 py-4 font-semibold">Vintage</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Committed</th>
                    <th className="px-6 py-4 font-semibold text-right">NAV Multiple</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dashboard?.funds?.map((fund) => (
                    <tr key={fund.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <span className="text-white font-medium group-hover:text-[#F59F01] transition-colors">
                          {fund.name}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-white/40">{fund.vintage_year}</td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-white/40 uppercase font-bold tracking-tighter">
                          {fund.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-white/40">NPR {(fund.committed_capital_npr / 1e7).toFixed(1)}Cr</td>
                      <td className="px-6 py-5 text-right font-bold text-[#16c784]">1.25x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dividend History */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                <TrendingUp size={16} className="text-[#16c784]" /> Dividend History
              </h3>
            </div>
            <div className="p-6">
              {dashboard?.shareholder?.dividend_history?.length > 0 ? (
                <div className="space-y-4">
                  {dashboard?.shareholder?.dividend_history.map((div, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                      <div>
                        <p className="text-sm font-bold text-white">NPR {div.amount_npr.toLocaleString()}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">{div.fiscal_year} • {div.payment_date}</p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {div.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/30 italic">No dividend distributions recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Internal IR Updates */}
        <div className="space-y-8">
          {/* Internal Documents */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-widest border-b border-white/10 pb-4 mb-6">
              <FileCheck size={16} className="text-[#0B6EC3]" /> Internal Shareholder Data
            </h3>
            
            <div className="space-y-3">
              {dashboard?.internal_documents?.length > 0 ? (
                dashboard.internal_documents.map((doc) => (
                  <div key={doc.id} className="bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between group cursor-pointer transition-all">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{doc.title}</p>
                      <p className="text-[10px] text-white/20 uppercase tracking-tighter mt-0.5">{doc.document_type.replace('_', ' ')}</p>
                    </div>
                    <ChevronRight size={14} className="text-white/20 group-hover:text-[#F59F01] transition-colors" />
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-white/30 uppercase tracking-widest text-center py-4">No internal documents</p>
              )}
            </div>
          </div>

          <div className="bg-[#8b5cf6]/5 border border-[#8b5cf6]/20 rounded-2xl p-6">
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <Gavel size={14} className="text-[#8b5cf6]" /> Voting Portal
            </h4>
            <p className="text-[10px] text-white/40 leading-relaxed mb-4">
              Access the electronic voting system for management company decisions.
            </p>
            <button className="w-full py-2 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 text-[#8b5cf6] text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border border-[#8b5cf6]/20">
              Open Voting System
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
