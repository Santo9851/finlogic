import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, Loader2, Percent } from 'lucide-react';

export default function MonteCarloTab({ deal, onRun, isLoading, results }) {
  const [assumptions, setAssumptions] = useState({
    exit_multiple_mean: 3.0,
    exit_multiple_std: 0.5,
    growth_mean: 0.20,
    growth_std: 0.10,
    num_simulations: 10000
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#F59F01]" /> Simulation Parameters
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">Exit Multiple (Normal Dist)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 uppercase font-bold">Mean (x)</label>
                    <input 
                      type="number" step="0.1"
                      value={assumptions.exit_multiple_mean}
                      onChange={(e) => setAssumptions({...assumptions, exit_multiple_mean: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 uppercase font-bold">Std Dev</label>
                    <input 
                      type="number" step="0.05"
                      value={assumptions.exit_multiple_std}
                      onChange={(e) => setAssumptions({...assumptions, exit_multiple_std: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">Revenue Growth (Normal Dist)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 uppercase font-bold">Mean (%)</label>
                    <input 
                      type="number" step="0.01"
                      value={assumptions.growth_mean}
                      onChange={(e) => setAssumptions({...assumptions, growth_mean: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 uppercase font-bold">Std Dev</label>
                    <input 
                      type="number" step="0.01"
                      value={assumptions.growth_std}
                      onChange={(e) => setAssumptions({...assumptions, growth_std: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase font-bold">Iterations</label>
                <select 
                  value={assumptions.num_simulations}
                  onChange={(e) => setAssumptions({...assumptions, num_simulations: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                >
                  <option value={1000}>1,000</option>
                  <option value={5000}>5,000</option>
                  <option value={10000}>10,000</option>
                  <option value={50000}>50,000</option>
                </select>
              </div>

              <button 
                onClick={() => onRun({ num_simulations: assumptions.num_simulations, assumptions })}
                disabled={isLoading}
                className="w-full bg-[#F59F01] text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Run Risk Simulation'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {results ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Expected MOIC</p>
                  <p className="text-3xl font-black text-white tracking-tight">{results.statistics.expected_moic}x</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Expected IRR</p>
                  <p className="text-3xl font-black text-[#F59F01] tracking-tight">{results.statistics.expected_irr}%</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-center">
                  <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-widest mb-1">Probability of Loss</p>
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle size={18} className="text-rose-500" />
                    <p className="text-3xl font-black text-rose-500 tracking-tight">{results.statistics.prob_loss}%</p>
                  </div>
                </div>
              </div>

              {/* Histogram */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl">
                 <h4 className="text-xs font-black text-white mb-8 uppercase tracking-widest">Distribution of MOIC Outcomes</h4>
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={results.histogram}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                        <XAxis 
                          dataKey="bin" 
                          stroke="#ffffff30" 
                          fontSize={10} 
                          tickFormatter={(val) => `${val}x`}
                        />
                        <YAxis stroke="#ffffff30" fontSize={10} hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ fontSize: '10px', fontWeight: '800' }}
                          labelStyle={{ fontSize: '10px', color: '#F59F01', fontWeight: '900' }}
                          labelFormatter={(val) => `Exit Multiple: ${val}x`}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {results.histogram.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.bin < 1.0 ? '#f43f5e' : entry.bin > 2.0 ? '#10b981' : '#F59F01'} 
                              fillOpacity={0.8}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Percentiles */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h4 className="text-xs font-black text-white mb-6 uppercase tracking-widest">Confidence Intervals</h4>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(results.statistics.moic_percentiles).map(([p, val]) => (
                    <div key={p} className="text-center">
                      <p className="text-[10px] font-black text-white/20 uppercase mb-1">{p.replace('p', 'P')}</p>
                      <p className="text-sm font-bold text-white">{val}x</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 space-y-4">
               <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 border border-white/5">
                 <Percent size={32} />
               </div>
               <div className="max-w-xs">
                 <h4 className="text-white font-bold text-sm">No Simulation Data</h4>
                 <p className="text-white/20 text-xs mt-1">Configure your assumptions and click 'Run Risk Simulation' to generate Monte Carlo results.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
