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
    <div className="space-y-8 pb-20 theme-transition">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Waterfall Calculator</h1>
        <p className="text-text-muted text-sm mt-1 font-medium">Calculate exit distributions and GP carry</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleCalculate} className="bg-card border border-border-theme rounded-2xl p-6 space-y-6 shadow-xl theme-transition">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">
                Investment ID
              </label>
              <input
                type="text"
                value={investmentId}
                onChange={(e) => setInvestmentId(e.target.value)}
                placeholder="UUID of PEInvestment"
                className="w-full bg-foreground/5 border border-border-theme rounded-xl p-4 text-foreground focus:border-[#F59F01] outline-none transition-all placeholder:text-text-muted/20"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">
                Exit Proceeds (NPR)
              </label>
              <input
                type="number"
                value={exitProceeds}
                onChange={(e) => setExitProceeds(e.target.value)}
                placeholder="e.g. 50000000"
                className="w-full bg-foreground/5 border border-border-theme rounded-xl p-4 text-foreground focus:border-[#F59F01] outline-none transition-all placeholder:text-text-muted/20"
                required
              />
            </div>

            <button
              type="submit"
              disabled={calculateMutation.isPending}
              className="w-full bg-[#F59F01] hover:bg-[#F59F01]/90 text-ls-primary-fixed font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-[#F59F01]/20 active:scale-95"
            >
              {calculateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
              Calculate Waterfall
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="bg-card border border-border-theme rounded-2xl p-6 shadow-xl theme-transition">
                <div className="flex justify-between items-center mb-6 border-b border-border-theme pb-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Distribution Steps</h3>
                  <button onClick={handleExport} className="text-text-muted hover:text-[#F59F01] flex items-center gap-1.5 text-xs font-bold transition-colors">
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
                    <div key={idx} className="flex justify-between items-center border-b border-border-theme pb-3 last:border-0 last:pb-0">
                      <span className="text-text-muted text-sm font-medium">{step.label}</span>
                      <span className="text-foreground font-mono font-bold">NPR {(step.val / 1e6).toFixed(2)}M</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border-theme rounded-2xl overflow-hidden shadow-2xl theme-transition">
                <div className="p-4 border-b border-border-theme bg-foreground/[0.01]">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest px-2">LP Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[10px] text-text-muted/40 uppercase tracking-widest border-b border-border-theme bg-foreground/[0.02]">
                        <th className="px-6 py-4">LP Name</th>
                        <th className="px-6 py-4">Share %</th>
                        <th className="px-6 py-4 text-right">Proceeds</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-theme">
                      {result.outputs.lp_breakdown.map((lp, idx) => (
                        <tr key={idx} className="hover:bg-foreground/[0.02] transition-colors">
                          <td className="px-6 py-4 text-foreground font-bold">{lp.lp_name}</td>
                          <td className="px-6 py-4 text-text-muted font-medium">{lp.share_pct.toFixed(2)}%</td>
                          <td className="px-6 py-4 text-right text-emerald-600 dark:text-[#16c784] font-mono font-black">
                            NPR {(lp.proceeds / 1e6).toFixed(2)}M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center border border-dashed border-border-theme rounded-[2rem] p-12 text-text-muted/20 bg-card/50 theme-transition">
              <div className="text-center">
                <Calculator size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-foreground/40 mb-2">Ready to Calculate</h3>
                <p className="max-w-xs mx-auto text-sm">Enter an investment ID and exit proceeds to calculate the waterfall distribution.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
