import React, { useState } from 'react';
import { BarChart4, Zap } from 'lucide-react';

export default function ModelingTab({ deal, onRunDCF, onRunLBO, isCalculating }) {
  const [activeSubTab, setActiveSubTab] = useState('DCF');
  const valuations = deal.valuations || [];
  const latestDCF = valuations.find(v => v.model_type === 'DCF');
  const latestLBO = valuations.find(v => v.model_type === 'LBO');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
         <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            {['DCF', 'LBO'].map(t => (
              <button 
                key={t}
                onClick={() => setActiveSubTab(t)}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === t ? 'bg-[#F59F01] text-black shadow-lg shadow-[#F59F01]/20' : 'text-white/40 hover:text-white'}`}
              >
                {t} Analysis
              </button>
            ))}
         </div>
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
       <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Assumptions</h4>
          <div className="grid grid-cols-1 gap-4">
             <ValInput label="Current Revenue (NPR)" value={inputs.current_revenue} onChange={v => setInputs({...inputs, current_revenue: parseFloat(v)})} />
             <ValInput label="Revenue Growth (%)" value={inputs.revenue_growth_rate * 100} onChange={v => setInputs({...inputs, revenue_growth_rate: v/100})} isPct />
             <ValInput label="EBITDA Margin (%)" value={inputs.ebitda_margin * 100} onChange={v => setInputs({...inputs, ebitda_margin: v/100})} isPct />
             <ValInput label="WACC (%)" value={inputs.wacc * 100} onChange={v => setInputs({...inputs, wacc: v/100})} isPct />
             <ValInput label="Terminal Growth (%)" value={inputs.terminal_growth_rate * 100} onChange={v => setInputs({...inputs, terminal_growth_rate: v/100})} isPct />
             <ValInput label="Net Debt (NPR)" value={inputs.net_debt} onChange={v => setInputs({...inputs, net_debt: parseFloat(v)})} />
          </div>
          <button 
            onClick={() => onRun(inputs)}
            disabled={isCalculating}
            className="w-full mt-6 py-4 bg-[#F59F01] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
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

              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-white/5">
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Year</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Revenue</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">EBITDA</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">FCF</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">PV of FCF</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {model.outputs.projections.map(p => (
                         <tr key={p.year} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-white/60">{p.year}</td>
                            <td className="px-6 py-4 text-xs font-mono text-white text-right">{p.revenue.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-white text-right">{p.ebitda.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-[#10b981] text-right">{p.fcf.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-[#F59F01] text-right">{p.pv_fcf.toLocaleString()}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
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
    debt_financing: [
       { name: "Senior Term Loan", amount: 2000000, rate: 0.12 },
       { name: "Mezzanine Debt", amount: 1000000, rate: 0.18 }
    ]
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
       <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Transaction Inputs</h4>
          <div className="grid grid-cols-1 gap-4">
             <ValInput label="Entry EBITDA (NPR)" value={inputs.entry_ebitda} onChange={v => setInputs({...inputs, entry_ebitda: parseFloat(v)})} />
             <ValInput label="Entry Multiple" value={inputs.entry_multiple} onChange={v => setInputs({...inputs, entry_multiple: parseFloat(v)})} />
             <ValInput label="Exit Multiple" value={inputs.exit_multiple} onChange={v => setInputs({...inputs, exit_multiple: parseFloat(v)})} />
             <ValInput label="Revenue Growth (%)" value={inputs.revenue_growth * 100} onChange={v => setInputs({...inputs, revenue_growth: v/100})} isPct />
             <div className="space-y-2 mt-4">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Debt Structure</p>
                {inputs.debt_financing.map((d, i) => (
                  <div key={i} className="flex gap-2">
                     <input className="flex-1 bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-white" value={d.name} disabled />
                     <input className="w-24 bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-white text-right" value={d.amount.toLocaleString()} disabled />
                  </div>
                ))}
             </div>
          </div>
          <button 
            onClick={() => onRun(inputs)}
            disabled={isCalculating}
            className="w-full mt-6 py-4 bg-[#F59F01] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
          >
            {isCalculating ? 'Modeling Returns...' : 'Run LBO Analysis'}
          </button>
       </div>

       <div className="xl:col-span-2 space-y-8">
          {model ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <OutputCard label="Exit Equity Value" value={model.outputs.exit_equity} />
                 <OutputCard label="MOIC" value={model.outputs.moic} isRaw />
                 <OutputCard label="IRR (%)" value={model.outputs.irr * 100} isPct highlight />
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
       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">{label}</label>
       <div className="relative">
          <input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#F59F01]/50 transition-all font-mono"
          />
          {isPct && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs">%</span>}
       </div>
    </div>
  );
}

function OutputCard({ label, value, isPct, isRaw, highlight }) {
  return (
    <div className={`p-6 rounded-3xl border border-white/10 shadow-xl ${highlight ? 'bg-[#F59F01] text-black border-transparent' : 'bg-white/5 text-white'}`}>
       <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${highlight ? 'text-black/40' : 'text-white/20'}`}>{label}</p>
       <div className="text-2xl font-black tabular-nums">
          {isPct ? `${value.toFixed(1)}%` : (isRaw ? value.toFixed(2) : `NPR ${value.toLocaleString()}`)}
       </div>
    </div>
  );
}
