'use client'

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Loader2, PieChart } from 'lucide-react';
import { MetricCard } from '@/components/portal/PortalShell';

export default function LPDistributions() {
  const { data: distributions, isLoading } = useQuery({
    queryKey: ['lp', 'distributions'],
    queryFn: async () => {
      const res = await api.get('/deals/lp/distributions/');
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 size={32} className="text-[#F59F01] animate-spin" />
    </div>
  );

  const totalDist = distributions?.reduce((acc, d) => acc + parseFloat(d.amount_npr), 0) || 0;

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white">Distributions</h1>
        <p className="text-white/40 text-sm mt-1">Your distribution history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Total Distributed" 
          value={`NPR ${(totalDist / 1e6).toFixed(1)}M`} 
          icon={() => <PieChart size={18} />} 
          color="#16c784" 
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
            Distribution History
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] text-white/20 uppercase tracking-widest border-b border-white/5">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Fund</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold text-right">Amount (NPR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {distributions?.map((dist) => (
                <tr key={dist.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5 text-white/80">
                    {new Date(dist.distribution_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-white/80">
                    {dist.fund_name}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/50 uppercase">
                      {dist.distribution_type_display}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-bold text-[#16c784]">
                    NPR {(parseFloat(dist.amount_npr) / 1e6).toFixed(2)}M
                  </td>
                </tr>
              ))}
              {(!distributions || distributions.length === 0) && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-white/20 italic">
                    No distributions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
