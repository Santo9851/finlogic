import React, { useState, useEffect } from 'react';
import { BarChart4, Zap, Sparkles, Loader2 } from 'lucide-react';

const formatCompactNumber = (val) => {
  if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`;
  if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
  return val.toLocaleString();
};

export default function ModelingTab({ deal, onRunDCF, onRunLBO, isCalculating, onGenerateAI, isGeneratingAI }) {
  const [activeSubTab, setActiveSubTab] = useState('DCF');
  const valuations = deal.valuations || [];
  const latestDCF = valuations.find(v => v.model_type === 'DCF');
  const latestLBO = valuations.find(v => v.model_type === 'LBO');

  const isProcessing = deal.analysis_progress?.Valuation === 'processing';
  

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative theme-transition">
      {isProcessing && (
        <div className="absolute inset-0 z-50 bg-ls-primary/60 dark:bg-black/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
           <div className="w-16 h-16 rounded-full border-4 border-[#F59F01]/20 border-t-[#F59F01] animate-spin" />
           <div className="text-center">
              <p className="text-ls-white font-black text-lg uppercase tracking-tight">AI is Synthesizing Model</p>
              <p className="text-ls-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Generating DCF & LBO Assumptions...</p>
           </div>
        </div>
      )}

      <div className="flex items-center justify-between">
          <div className="flex bg-ls-primary/5 dark:bg-white/5 p-1 rounded-2xl border border-border-theme theme-transition">
            {['DCF', 'LBO'].map(t => (
              <button 
                key={t}
                onClick={() => setActiveSubTab(t)}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === t ? 'bg-[#F59F01] text-ls-primary shadow-lg shadow-[#F59F01]/20' : 'text-ls-primary/40 dark:text-white/40 hover:text-ls-primary dark:hover:text-white'}`}
              >
                {t} Analysis
              </button>
            ))}
          </div>
         {onGenerateAI && (
           <button
             onClick={onGenerateAI}
             disabled={isGeneratingAI}
             className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-purple-500/10 disabled:opacity-50"
           >
             {isGeneratingAI ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
             AI Generate Assumptions
           </button>
         )}
      </div>

      {activeSubTab === 'DCF' && (
        <DCFModel 
          model={latestDCF} 
          onRun={onRunDCF} 
          isCalculating={isCalculating} 
        />
      )}
      {activeSubTab === 'LBO' && (
        <LBOModel 
          model={latestLBO} 
          onRun={onRunLBO} 
          isCalculating={isCalculating} 
        />
      )}
    </div>
  );
}

function DCFModel({ model, onRun, isCalculating }) {
  const [inputs, setInputs] = useState({
    current_revenue: 1000000,
    revenue_growth_rate: 0.15,
    ebitda_margin: 0.20,
    tax_rate: 0.25,
    projection_years: 5,
    wacc: 0.12,
    terminal_growth_rate: 0.03,
    net_debt: 200000
  });

  useEffect(() => {
    if (model?.assumptions) {
      setInputs(model.assumptions);
    }
  }, [model]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
       <div className="bg-card border border-border-theme rounded-3xl p-8 shadow-2xl space-y-6 theme-transition">
          <h4 className="text-xs font-black text-ls-primary dark:text-white uppercase tracking-widest mb-8 border-b border-border-theme pb-4">Assumptions</h4>
          <div className="grid grid-cols-1 gap-4">
             <ValInput label="Current Revenue (NPR)" value={inputs.current_revenue} onChange={v => setInputs({...inputs, current_revenue: parseFloat(v)})} />
             <ValInput label="Revenue Growth (%)" value={inputs.revenue_growth_rate * 100} onChange={v => setInputs({...inputs, revenue_growth_rate: v/100})} isPct />
             <ValInput label="EBITDA Margin (%)" value={inputs.ebitda_margin * 100} onChange={v => setInputs({...inputs, ebitda_margin: v/100})} isPct />
             <ValInput label="WACC (%)" value={inputs.wacc * 100} onChange={v => setInputs({...inputs, wacc: v/100})} isPct />
             <ValInput label="Terminal Growth (%)" value={inputs.terminal_growth_rate * 100} onChange={v => setInputs({...inputs, terminal_growth_rate: v/100})} isPct />
             <ValInput label="Tax Rate (%)" value={inputs.tax_rate * 100} onChange={v => setInputs({...inputs, tax_rate: v/100})} isPct />
             <ValInput label="Projection Years" value={inputs.projection_years} onChange={v => setInputs({...inputs, projection_years: parseInt(v) || 5})} />
             <ValInput label="Net Debt (NPR)" value={inputs.net_debt} onChange={v => setInputs({...inputs, net_debt: parseFloat(v)})} />
          </div>
          <button 
            onClick={() => onRun(inputs)}
            disabled={isCalculating}
            className="w-full mt-6 py-4 bg-[#F59F01] text-ls-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
          >
            {isCalculating ? 'Recalculating...' : 'Update DCF Model'}
          </button>
       </div>

       <div className="xl:col-span-2 space-y-8">
          {model ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <OutputCard label="Enterprise Value" value={model.outputs.enterprise_value} />
                 <OutputCard label="Equity Value" value={model.outputs.equity_value} highlight />
              </div>
              <div className="grid grid-cols-1 gap-4">
                 <OutputCard label="Revenue CAGR" value={model.outputs.revenue_cagr * 100} isPct />
              </div>

              <div className="bg-card border border-border-theme rounded-3xl overflow-hidden shadow-2xl theme-transition">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-ls-primary/5 dark:bg-white/5">
                          <th className="px-6 py-4 text-[10px] font-black text-ls-primary/30 dark:text-white/30 uppercase tracking-widest">Year</th>
                          <th className="px-6 py-4 text-[10px] font-black text-ls-primary/30 dark:text-white/30 uppercase tracking-widest text-right">Revenue</th>
                          <th className="px-6 py-4 text-[10px] font-black text-ls-primary/30 dark:text-white/30 uppercase tracking-widest text-right">EBITDA</th>
                          <th className="px-6 py-4 text-[10px] font-black text-ls-primary/30 dark:text-white/30 uppercase tracking-widest text-right">FCF</th>
                          <th className="px-6 py-4 text-[10px] font-black text-ls-primary/30 dark:text-white/30 uppercase tracking-widest text-right">PV FCF</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-ls-primary/5 dark:divide-white/5">
                       {model.outputs.projections.map(p => (
                         <tr key={p.year} className="hover:bg-ls-primary/5 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-ls-primary/60 dark:text-white/60">{p.year}</td>
                            <td className="px-6 py-4 text-xs font-mono text-ls-primary/40 dark:text-white/40 text-right">{p.revenue.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-ls-primary/40 dark:text-white/40 text-right">{p.ebitda.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-[#10b981] text-right">{p.fcf.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-ls-primary dark:text-white text-right">{p.pv_fcf.toLocaleString()}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              {/* AI Insights & Methodology */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#F59F01]/5 border border-[#F59F01]/20 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                       <Zap className="w-4 h-4 text-[#F59F01]" />
                       <h5 className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">AI Rationale</h5>
                    </div>
                    <p className="text-xs text-ls-primary/70 dark:text-white/70 leading-relaxed italic">
                       "{model.ai_rationale || 'AI assumptions generated based on historical growth patterns and Nepal market risk premiums.'}"
                    </p>
                 </div>
                 <div className="bg-card border border-border-theme rounded-3xl p-6 theme-transition">
                    <h5 className="text-[10px] font-black text-ls-primary/30 dark:text-white/30 uppercase tracking-widest mb-4">Calculation Methodology</h5>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center border-b border-border-theme pb-2">
                          <span className="text-[10px] text-ls-primary/40 dark:text-white/40 font-bold uppercase">Terminal Value</span>
                          <span className="text-[10px] font-mono text-ls-primary/60 dark:text-white/60">Gordon Growth Model</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-border-theme pb-2">
                          <span className="text-[10px] text-ls-primary/40 dark:text-white/40 font-bold uppercase">Discounting</span>
                          <span className="text-[10px] font-mono text-ls-primary/60 dark:text-white/60">WACC (Present Value)</span>
                       </div>
                       <p className="text-[9px] text-text-muted leading-tight mt-2">
                          Enterprise Value = Sum(PV of FCFs) + PV(Terminal Value). Equity Value = EV - Net Debt.
                       </p>
                    </div>
                 </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-3xl space-y-4 opacity-40">
               <BarChart4 size={48} />
               <p className="text-sm font-bold">Configure assumptions and run the model</p>
            </div>
          )}
       </div>
    </div>
  );
}

function LBOModel({ model, onRun, isCalculating }) {
  const [inputs, setInputs] = useState({
    entry_revenue: 5000000,
    entry_ebitda: 1000000,
    entry_multiple: 8.0,
    exit_multiple: 10.0,
    exit_year: 5,
    revenue_growth: 0.1,
    ebitda_margin: 0.22,
    tax_rate: 0.25,
    buyout_percentage: 100,
    target_irr: 19,
    target_moic: 2.75,
    debt_financing: [
       { name: "Senior Term Loan", amount: 2000000, rate: 0.12 },
       { name: "Mezzanine Debt", amount: 1000000, rate: 0.18 }
    ]
  });

  useEffect(() => {
    if (model?.assumptions) {
      setInputs(model.assumptions);
    }
  }, [model]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
       <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Transaction Inputs</h4>
          <div className="grid grid-cols-1 gap-4">
             <ValInput label="Entry EBITDA (NPR)" value={inputs.entry_ebitda} onChange={v => setInputs({...inputs, entry_ebitda: parseFloat(v)})} />
             <ValInput label="EBITDA Margin (%)" value={inputs.ebitda_margin * 100} onChange={v => setInputs({...inputs, ebitda_margin: v/100})} isPct />
             <ValInput label="Entry Multiple" value={inputs.entry_multiple} onChange={v => setInputs({...inputs, entry_multiple: parseFloat(v)})} />
             <ValInput label="Exit Multiple" value={inputs.exit_multiple} onChange={v => setInputs({...inputs, exit_multiple: parseFloat(v)})} />
             <ValInput label="Revenue Growth (%)" value={inputs.revenue_growth * 100} onChange={v => setInputs({...inputs, revenue_growth: v/100})} isPct />
             <ValInput label="Tax Rate (%)" value={inputs.tax_rate * 100} onChange={v => setInputs({...inputs, tax_rate: v/100})} isPct />
             <ValInput label="Buyout Stake (%)" value={inputs.buyout_percentage} onChange={v => setInputs({...inputs, buyout_percentage: parseFloat(v)})} isPct />
             <ValInput label="Target IRR (%)" value={inputs.target_irr} onChange={v => setInputs({...inputs, target_irr: parseFloat(v)})} isPct />
             <ValInput label="Target MOIC (x)" value={inputs.target_moic} onChange={v => setInputs({...inputs, target_moic: parseFloat(v)})} isRaw />
             <ValInput label="Exit Year" value={inputs.exit_year} onChange={v => setInputs({...inputs, exit_year: parseInt(v) || 5})} />
             <div className="space-y-2 mt-4">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Debt Structure</p>
                 {inputs.debt_financing.map((d, i) => (
                   <div key={i} className="flex gap-2">
                      <input 
                        className="flex-1 bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-white/40" 
                        value={d.name} 
                        readOnly 
                      />
                      <input 
                        className="w-24 bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-white text-right focus:border-[#F59F01]/50" 
                        value={d.amount} 
                        type="number"
                        onChange={(e) => {
                          const newDebt = [...inputs.debt_financing];
                          newDebt[i] = { ...newDebt[i], amount: parseFloat(e.target.value) || 0 };
                          setInputs({ ...inputs, debt_financing: newDebt });
                        }}
                      />
                   </div>
                 ))}
             </div>
          </div>
          <button 
            onClick={() => onRun(inputs)}
            disabled={isCalculating}
            className="w-full mt-6 py-4 bg-[#F59F01] text-ls-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
          >
            {isCalculating ? 'Modeling Returns...' : 'Run LBO Analysis'}
          </button>
       </div>

       <div className="xl:col-span-2 space-y-8">
          {model ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <OutputCard label="GP Entry Equity" value={model.outputs.gp_entry_equity || model.outputs.entry_equity} />
                 <OutputCard label="GP Exit Equity" value={model.outputs.gp_exit_equity || model.outputs.exit_equity} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <OutputCard label="MOIC" value={model.outputs.moic} isRaw highlight={model.outputs.moic >= (inputs.target_moic || 3.0)} />
                 <OutputCard label="IRR (%)" value={model.outputs.irr * 100} isPct highlight={model.outputs.irr * 100 >= (inputs.target_irr || 30)} />
                 <OutputCard label="Revenue CAGR" value={model.outputs.revenue_cagr * 100} isPct />
                 <OutputCard label="Exit Year" value={inputs.exit_year} isRaw />
              </div>
              <div className="grid grid-cols-1 gap-4">
                 <OutputCard label="Total Enterprise Value (Exit)" value={model.outputs.exit_ev} />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-white/5">
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Year</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">EBITDA</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Cash for Paydown</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Remaining Debt</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {model.outputs.projections.map(p => (
                         <tr key={p.year} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-white/60">{p.year}</td>
                            <td className="px-6 py-4 text-xs font-mono text-white text-right">{p.ebitda.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-[#10b981] text-right">{p.fcf.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-white/40 text-right">{p.remaining_debt.toLocaleString()}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              {/* AI Insights & Methodology */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-[#F59F01]/5 border border-[#F59F01]/20 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                       <Zap className="w-4 h-4 text-[#F59F01]" />
                       <h5 className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">AI Rationale</h5>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed italic">
                       "{model.ai_rationale || 'LBO assumptions generated based on cash flow stability and target debt-service coverage ratios.'}"
                    </p>
                 </div>
                 <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <h5 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">LBO Logic</h5>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-[10px] text-white/40 font-bold uppercase">Debt Paydown</span>
                          <span className="text-[10px] font-mono text-white/60">Waterfall Basis (CFADS)</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-[10px] text-white/40 font-bold uppercase">Exit Value</span>
                          <span className="text-[10px] font-mono text-white/60">EBITDA x Exit Multiple</span>
                       </div>
                       <p className="text-[9px] text-white/20 leading-tight mt-2">
                          Returns driven by operational growth, multiple expansion, and deleveraging (debt paydown).
                       </p>
                    </div>
                 </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-3xl space-y-4 opacity-40">
               <Zap size={48} />
               <p className="text-sm font-bold">Configure LBO parameters and run modeling</p>
            </div>
          )}
       </div>
    </div>
  );
}

function ValInput({ label, value, onChange, isPct }) {
  return (
    <div className="space-y-1.5">
       <label className="text-[10px] font-black text-ls-primary/30 dark:text-white/30 uppercase tracking-widest ml-1">{label}</label>
       <div className="relative">
          <input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-ls-primary/10 dark:bg-black/20 border border-border-theme rounded-xl p-3 text-sm text-ls-primary dark:text-white focus:outline-none focus:border-[#F59F01]/50 transition-all font-mono"
          />
          {isPct && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-xs">%</span>}
       </div>
    </div>
  );
}

function OutputCard({ label, value, isPct, isRaw, highlight }) {
  return (
    <div className={`p-4 rounded-3xl border border-border-theme shadow-xl min-h-[90px] flex flex-col justify-center theme-transition ${highlight ? 'bg-[#F59F01] text-ls-primary border-transparent' : 'bg-card text-ls-primary dark:text-white'}`}>
       <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${highlight ? 'text-ls-primary/40' : 'text-text-muted'}`}>{label}</p>
       <div className="text-xl font-black tabular-nums truncate">
          {isPct ? `${value.toFixed(1)}%` : (isRaw ? value.toFixed(2) : `NPR ${value >= 1000000 ? formatCompactNumber(value) : value.toLocaleString()}`)}
       </div>
    </div>
  );
}
