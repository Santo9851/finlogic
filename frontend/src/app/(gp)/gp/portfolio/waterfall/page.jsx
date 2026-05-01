'use client'

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { Loader2, Calculator, Download, ChevronRight } from 'lucide-react';
import { MetricCard } from '@/components/portal/PortalShell';

export default function WaterfallCalculator() {
  const [selectedInvestmentId, setSelectedInvestmentId] = useState('');
  const [exitProceeds, setExitProceeds] = useState('');
  const [result, setResult] = useState(null);

  const [investmentId, setInvestmentId] = useState('');

  const calculateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/deals/portfolio/waterfall/calculate/', data);
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
    }
  });

  const handleCalculate = (e) => {
    e.preventDefault();
    calculateMutation.mutate({
      investment_id: investmentId,
      exit_proceeds: exitProceeds
    });
  };

  const handleExport = () => {
    if (!result) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "LP Name,Share %,Proceeds (NPR)\n"
      + result.outputs.lp_breakdown.map(e => `${e.lp_name},${e.share_pct},${e.proceeds}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "waterfall_export.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white">Waterfall Calculator</h1>
        <p className="text-white/40 text-sm mt-1">Calculate exit distributions and GP carry</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleCalculate} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                Investment ID
              </label>
              <input
                type="text"
                value={investmentId}
                onChange={(e) => setInvestmentId(e.target.value)}
                placeholder="UUID of PEInvestment"
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-[#F59F01] outline-none transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                Exit Proceeds (NPR)
              </label>
              <input
                type="number"
                value={exitProceeds}
                onChange={(e) => setExitProceeds(e.target.value)}
                placeholder="e.g. 50000000"
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-[#F59F01] outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={calculateMutation.isPending}
              className="w-full bg-[#F59F01] hover:bg-[#F59F01]/90 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {calculateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
              Calculate Waterfall
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-2 gap-4">
                <MetricCard 
                  label="LP Total Proceeds" 
                  value={`NPR ${(result.outputs.totals.lp_total / 1e6).toFixed(2)}M`} 
                  icon={() => <Calculator size={18} />}
                  color="#16c784" 
                />
                <MetricCard 
                  label="GP Total Carry & Catchup" 
                  value={`NPR ${(result.outputs.totals.gp_total / 1e6).toFixed(2)}M`} 
                  icon={() => <Calculator size={18} />}
                  color="#F59F01" 
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Distribution Steps</h3>
                  <button onClick={handleExport} className="text-white/40 hover:text-white flex items-center gap-1 text-xs">
                    <Download size={14} /> Export CSV
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Return of Capital', val: result.outputs.steps.return_of_capital },
                    { label: 'Preferred Return', val: result.outputs.steps.preferred_return },
                    { label: 'GP Catchup', val: result.outputs.steps.gp_catchup },
                    { label: 'LP Carry Split', val: result.outputs.steps.lp_carry_split },
                    { label: 'GP Carry Split', val: result.outputs.steps.gp_carry_split },
                  ].map((step, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-white/60 text-sm">{step.label}</span>
                      <span className="text-white font-mono">NPR {(step.val / 1e6).toFixed(2)}M</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-white/[0.01]">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">LP Breakdown</h3>
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[10px] text-white/20 uppercase tracking-widest border-b border-white/5">
                      <th className="px-6 py-4">LP Name</th>
                      <th className="px-6 py-4">Share %</th>
                      <th className="px-6 py-4 text-right">Proceeds</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {result.outputs.lp_breakdown.map((lp, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-white/80">{lp.lp_name}</td>
                        <td className="px-6 py-4 text-white/60">{lp.share_pct.toFixed(2)}%</td>
                        <td className="px-6 py-4 text-right text-[#16c784] font-mono">
                          NPR {(lp.proceeds / 1e6).toFixed(2)}M
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center border border-dashed border-white/10 rounded-2xl p-12 text-white/20">
              <div className="text-center">
                <Calculator size={48} className="mx-auto mb-4 opacity-20" />
                <p>Enter an investment ID and exit proceeds to calculate the waterfall distribution.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
