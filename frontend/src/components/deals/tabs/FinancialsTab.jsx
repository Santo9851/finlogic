import React, { useState } from 'react';
import { BrainCircuit, Zap, CheckCircle2, AlertTriangle, Loader2, Edit3, Save, X, ExternalLink, Plus, Calendar, Trash2, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function FinancialsTab({ 
  deal, 
  onRunQoE, 
  isRunningQoE, 
  onVerify, 
  onUpdate,
  onUpdateQoE,
  onViewSource,
  fullAnalysisMutation,
  onCreate,
  onDelete,
  isSplitView = false
}) {
  const financials = deal.extracted_financials || [];
  const allVerified = financials.length > 0 && financials.every(f => f.is_verified_by_gp);
  const qoeReport = deal.qoe_reports?.[0];
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [isEditingQoE, setIsEditingQoE] = useState(false);
  const [tempQoE, setTempQoE] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState({
    fiscal_year_bs: '',
    revenue_npr: 0,
    ebitda_npr: 0,
    net_profit_npr: 0,
    total_assets_npr: 0,
    total_debt_npr: 0
  });

  const startEdit = (f) => {
    if (f.is_verified_by_gp) return; // Prevent editing verified rows
    setEditingId(f.id);
    setEditData({
      revenue_npr: f.revenue_npr,
      ebitda_npr: f.ebitda_npr,
      net_profit_npr: f.net_profit_npr,
      total_assets_npr: f.total_assets_npr,
      total_debt_npr: f.total_debt_npr,
    });
  };

  const handleSave = async (id) => {
    await onUpdate(id, editData);
    setEditingId(null);
  };

  const handleUpdateQoE = async () => {
    if (!qoeReport) return;
    await onUpdateQoE(qoeReport.id, { report_text: tempQoE });
    setIsEditingQoE(false);
  };

  const startEditingQoE = () => {
    setTempQoE(qoeReport?.report_text || '');
    setIsEditingQoE(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this financial record?')) {
      await onDelete(id);
    }
  };
  const handleCreate = async () => {
    if (!newData.fiscal_year_bs) return;
    await onCreate(newData);
    setIsAdding(false);
    setNewData({
      fiscal_year_bs: '',
      revenue_npr: 0,
      ebitda_npr: 0,
      net_profit_npr: 0,
      total_assets_npr: 0,
      total_debt_npr: 0
    });
  };

  const handleVerify = async (id) => {
    // If we are currently editing, save those changes too
    if (editingId === id) {
      await onVerify(id, editData);
      setEditingId(null);
    } else {
      await onVerify(id);
    }
  };

  const toggleCellVerify = async (f, field) => {
    const verified_fields = f.verified_fields || {};
    const updated = {
      ...verified_fields,
      [field]: !verified_fields[field]
    };
    await onUpdate(f.id, { verified_fields: updated });
  };

  return (
    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ${isSplitView ? 'pb-20' : ''}`}>
      {/* Main Financials Table */}
      <div className="bg-black/40 rounded-3xl border border-white/5 backdrop-blur-xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
           <div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                Extracted Financials
                {isSplitView && <span className="bg-[#F59F01] text-black text-[10px] px-2 py-0.5 rounded ml-2">Review Mode</span>}
              </h3>
              <p className="text-white/40 text-xs mt-1">Directly extracted from submitted documents</p>
           </div>
           <div className="flex items-center gap-4">
               <span className="text-[10px] text-white/30 font-black uppercase tracking-widest border border-white/10 px-3 py-1 rounded-full">
                {financials.length} Years Processed
              </span>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#F59F01] text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20"
              >
                <Plus className="w-3 h-3" />
                Add Year
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-white/5 text-white/20 uppercase text-[10px] font-bold tracking-widest border-b border-white/5">
              <tr>
                <th className="px-8 py-5">Fiscal Year</th>
                <th className="px-8 py-5 text-right">Revenue (NPR)</th>
                <th className="px-8 py-5 text-right">EBITDA (NPR)</th>
                <th className="px-8 py-5 text-right">Net Profit (NPR)</th>
                <th className="px-8 py-5 text-right">Total Assets (NPR)</th>
                <th className="px-8 py-5 text-right">Total Debt (NPR)</th>
                <th className="px-8 py-5 text-center">Actions</th>
              </tr>
            </thead>
             <tbody className="divide-y divide-white/5">
              {isAdding && (
                <tr className="bg-white/5 border-l-4 border-[#F59F01]">
                  <td className="px-8 py-6">
                    <input 
                      placeholder="e.g. 2080/81"
                      value={newData.fiscal_year_bs}
                      onChange={(e) => setNewData({...newData, fiscal_year_bs: e.target.value})}
                      className="bg-black/20 border border-white/10 rounded px-3 py-1 text-white w-24 focus:border-[#F59F01] outline-none"
                    />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <input 
                      type="number"
                      value={newData.revenue_npr}
                      onChange={(e) => setNewData({...newData, revenue_npr: e.target.value})}
                      className="bg-black/20 border border-white/10 rounded px-3 py-1 text-white text-right w-32 focus:border-[#F59F01] outline-none"
                    />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <input 
                      type="number"
                      value={newData.ebitda_npr}
                      onChange={(e) => setNewData({...newData, ebitda_npr: e.target.value})}
                      className="bg-black/20 border border-white/10 rounded px-3 py-1 text-white text-right w-32 focus:border-[#F59F01] outline-none"
                    />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <input 
                      type="number"
                      value={newData.net_profit_npr}
                      onChange={(e) => setNewData({...newData, net_profit_npr: e.target.value})}
                      className="bg-black/20 border border-white/10 rounded px-3 py-1 text-white text-right w-32 focus:border-[#F59F01] outline-none"
                    />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <input 
                      type="number"
                      value={newData.total_assets_npr}
                      onChange={(e) => setNewData({...newData, total_assets_npr: e.target.value})}
                      className="bg-black/20 border border-white/10 rounded px-3 py-1 text-white text-right w-32 focus:border-[#F59F01] outline-none"
                    />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <input 
                      type="number"
                      value={newData.total_debt_npr}
                      onChange={(e) => setNewData({...newData, total_debt_npr: e.target.value})}
                      className="bg-black/20 border border-white/10 rounded px-3 py-1 text-white text-right w-32 focus:border-[#F59F01] outline-none"
                    />
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={handleCreate} className="p-2 bg-[#F59F01] text-black rounded-lg hover:scale-110 transition-all">
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setIsAdding(false)} className="p-2 bg-white/5 text-white/40 rounded-lg hover:text-white transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {financials.sort((a, b) => b.fiscal_year_bs?.localeCompare(a.fiscal_year_bs) || 0).map((f) => (
                <tr key={f.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6 text-white font-black">{f.fiscal_year_bs}</td>
                  <td className="px-8 py-6 text-right font-mono">
                    {editingId === f.id ? (
                      <input 
                        type="number" 
                        value={editData.revenue_npr} 
                        onChange={(e) => setEditData({...editData, revenue_npr: e.target.value})}
                        className="bg-white/10 border border-white/10 rounded px-2 py-1 text-right w-32 focus:border-[#F59F01] outline-none"
                      />
                    ) : (
                      <div className="flex items-center justify-end gap-2 group/cell">
                        <span className="text-white/80">{Number(f.revenue_npr).toLocaleString()}</span>
                        {!f.is_verified_by_gp && (
                          <button 
                            onClick={() => toggleCellVerify(f, 'revenue')}
                            className={`opacity-0 group-hover/cell:opacity-100 transition-opacity ${f.verified_fields?.revenue ? 'text-[#10b981] opacity-100' : 'text-white/10'}`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right font-mono">
                    {editingId === f.id ? (
                      <input 
                        type="number" 
                        value={editData.ebitda_npr} 
                        onChange={(e) => setEditData({...editData, ebitda_npr: e.target.value})}
                        className="bg-white/10 border border-white/10 rounded px-2 py-1 text-right w-32 focus:border-[#F59F01] outline-none"
                      />
                    ) : (
                      <div className="flex items-center justify-end gap-2 group/cell">
                        <span className="text-[#10b981] font-bold">{Number(f.ebitda_npr).toLocaleString()}</span>
                        {!f.is_verified_by_gp && (
                          <button 
                            onClick={() => toggleCellVerify(f, 'ebitda')}
                            className={`opacity-0 group-hover/cell:opacity-100 transition-opacity ${f.verified_fields?.ebitda ? 'text-[#10b981] opacity-100' : 'text-white/10'}`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right font-mono">
                    {editingId === f.id ? (
                      <input 
                        type="number" 
                        value={editData.net_profit_npr} 
                        onChange={(e) => setEditData({...editData, net_profit_npr: e.target.value})}
                        className="bg-white/10 border border-white/10 rounded px-2 py-1 text-right w-32 focus:border-[#F59F01] outline-none"
                      />
                    ) : (
                      <div className="flex items-center justify-end gap-2 group/cell">
                        <span className="text-white/80">{Number(f.net_profit_npr).toLocaleString()}</span>
                        {!f.is_verified_by_gp && (
                          <button 
                            onClick={() => toggleCellVerify(f, 'net_profit')}
                            className={`opacity-0 group-hover/cell:opacity-100 transition-opacity ${f.verified_fields?.net_profit ? 'text-[#10b981] opacity-100' : 'text-white/10'}`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right font-mono">
                    {editingId === f.id ? (
                      <input 
                        type="number" 
                        value={editData.total_assets_npr} 
                        onChange={(e) => setEditData({...editData, total_assets_npr: e.target.value})}
                        className="bg-white/10 border border-white/10 rounded px-2 py-1 text-right w-32 focus:border-[#F59F01] outline-none"
                      />
                    ) : (
                      <div className="flex items-center justify-end gap-2 group/cell">
                        <span className="text-white/80">{Number(f.total_assets_npr).toLocaleString()}</span>
                        {!f.is_verified_by_gp && (
                          <button 
                            onClick={() => toggleCellVerify(f, 'total_assets')}
                            className={`opacity-0 group-hover/cell:opacity-100 transition-opacity ${f.verified_fields?.total_assets ? 'text-[#10b981] opacity-100' : 'text-white/10'}`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right font-mono">
                    {editingId === f.id ? (
                      <input 
                        type="number" 
                        value={editData.total_debt_npr} 
                        onChange={(e) => setEditData({...editData, total_debt_npr: e.target.value})}
                        className="bg-white/10 border border-white/10 rounded px-2 py-1 text-right w-32 focus:border-[#F59F01] outline-none"
                      />
                    ) : (
                      <div className="flex items-center justify-end gap-2 group/cell">
                        <div className="flex flex-col items-end">
                          <span className="text-rose-400/80">{Number(f.total_debt_npr).toLocaleString()}</span>
                          {f.raw_ai_output?.exchange_rate_used && (
                            <div className="flex items-center gap-1 text-[8px] text-white/20 font-mono mt-0.5">
                              <Calendar className="w-2 h-2" />
                              Converted @ {f.raw_ai_output.exchange_rate_used} ({f.raw_ai_output.exchange_rate_date || 'FY Avg'})
                            </div>
                          )}
                        </div>
                        {!f.is_verified_by_gp && (
                          <button 
                            onClick={() => toggleCellVerify(f, 'total_debt')}
                            className={`opacity-0 group-hover/cell:opacity-100 transition-opacity ${f.verified_fields?.total_debt ? 'text-[#10b981] opacity-100' : 'text-white/10'}`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                      {f.source_document && (
                        <button 
                          onClick={() => onViewSource(f.source_document)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                          title="View Source Document"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {editingId === f.id ? (
                        <>
                          <button onClick={() => handleSave(f.id)} className="p-2 bg-[#10b981]/10 text-[#10b981] rounded-lg hover:bg-[#10b981] hover:text-black transition-all">
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-white/5 text-white/40 rounded-lg hover:text-white transition-all">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        !f.is_verified_by_gp && (
                          <button onClick={() => startEdit(f)} className="p-2 bg-white/5 text-white/40 rounded-lg hover:text-[#F59F01] hover:bg-[#F59F01]/10 transition-all">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}

                      {f.is_verified_by_gp ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-[#10b981] text-[10px] font-black uppercase">
                            <Lock className="w-3 h-3" />
                            Verified
                          </div>
                          <button 
                            onClick={() => handleVerify(f.id)} 
                            className="text-white/10 hover:text-white transition-all"
                            title="Unverify to edit"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleVerify(f.id)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-[#F59F01] hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                          >
                            Verify
                          </button>
                          <button 
                            onClick={() => handleDelete(f.id)}
                            className="p-1.5 bg-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {financials.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-white/20 italic">No financial data extracted. Trigger AI extraction in the Data Room tab.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QoE Analysis Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
           <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Quality of Earnings (QoE)</h3>
              <p className="text-white/40 text-sm mt-1">Deep-dive AI analysis into financial reliability</p>
           </div>
            {!qoeReport && (
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={onRunQoE}
                  disabled={isRunningQoE || !allVerified}
                  className="px-8 py-3 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                >
                  {isRunningQoE ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4 inline mr-2" />}
                  Run QoE Analysis
                </button>
                {!allVerified && financials.length > 0 && (
                  <div className="flex items-center gap-2 text-rose-400 text-[10px] font-black uppercase bg-rose-400/10 px-4 py-2 rounded-xl border border-rose-400/20">
                    <AlertTriangle className="w-3 h-3" />
                    Verify all years to enable QoE analysis
                  </div>
                )}
                {financials.length === 0 && (
                  <div className="text-white/20 text-[10px] font-black uppercase">
                    Extraction required
                  </div>
                )}
              </div>
           )}
        </div>

        {qoeReport ? (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
             <div className="flex items-center gap-6">
                <button 
                  onClick={() => fullAnalysisMutation.mutate()}
                  disabled={fullAnalysisMutation.isLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 text-white/40 rounded-full text-[10px] font-black uppercase tracking-widest hover:text-white transition-all disabled:opacity-30"
                >
                   {fullAnalysisMutation.isLoading ? <div className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                   Run Full Analysis
                </button>
                <button 
                  onClick={isEditingQoE ? handleUpdateQoE : startEditingQoE}
                  className={`flex items-center gap-2 px-6 py-2 border rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    isEditingQoE ? 'bg-[#10b981] text-black border-[#10b981]' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                  }`}
                >
                  {isEditingQoE ? <Save className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                  {isEditingQoE ? 'Save Report' : 'Edit Report'}
                </button>
                {isEditingQoE && (
                  <button 
                    onClick={() => setIsEditingQoE(false)}
                    className="p-2 bg-white/5 text-white/40 rounded-full hover:text-white transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg ${
                  qoeReport.status === 'CLEAN' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 shadow-[#10b981]/10' :
                  qoeReport.status === 'CAUTION' ? 'bg-[#F59F01]/10 text-[#F59F01] border-[#F59F01]/20 shadow-[#F59F01]/10' :
                  'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/10'
                }`}>
                  {qoeReport.status === 'CLEAN' ? 'Green Flag (Clean)' : qoeReport.status === 'CAUTION' ? 'Yellow Flag (Caution)' : 'Red Flag (High Risk)'}
                </div>
                <span className="text-white/20 text-[10px] font-black uppercase tracking-tighter">
                  Last Analysis: {new Date(qoeReport.created_at).toLocaleString()}
                </span>
             </div>
             
              <div className="bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-xl article-body">
                {isEditingQoE ? (
                  <textarea 
                    value={tempQoE}
                    onChange={(e) => setTempQoE(e.target.value)}
                    className="w-full h-[500px] bg-transparent text-white/80 font-mono text-sm leading-relaxed p-4 border border-white/10 rounded-xl focus:border-[#F59F01] outline-none"
                    placeholder="Edit the Markdown report here..."
                  />
                ) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-8">
                          <table className="min-w-full border-collapse border border-white/10" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => <thead className="bg-white/5" {...props} />,
                      th: ({node, ...props}) => <th className="border border-white/10 px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest text-white/40" {...props} />,
                      td: ({node, ...props}) => <td className="border border-white/10 px-4 py-2 text-sm text-white/70" {...props} />,
                      p: ({node, ...props}) => <p className="leading-relaxed mb-4 text-white/70" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-xl font-black text-white mt-8 mb-4 tracking-tight" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className="text-white/60 text-sm" {...props} />,
                    }}
                  >
                    {qoeReport.report_text}
                  </ReactMarkdown>
                )}
              </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RiskMetric label="Revenue Recognition" status={qoeReport.status === 'HIGH_RISK' ? 'Red' : 'Green'} />
                <RiskMetric label="Related Party Ops" status="Yellow" />
                <RiskMetric label="EBITDA Adjustments" status={qoeReport.status === 'CLEAN' ? 'Green' : 'Yellow'} />
             </div>
          </div>
        ) : (
          <div className="py-20 text-center space-y-6 relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 mx-auto border border-white/5">
              <BrainCircuit className="w-10 h-10" />
            </div>
            <div className="max-w-xs mx-auto">
               <p className="text-white font-bold text-sm">Waiting for Analysis</p>
               <p className="text-white/20 text-xs mt-2 italic">Extraction must be completed before running QoE analysis.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RiskMetric({ label, status }) {
  const colors = {
    Green: 'bg-[#10b981]',
    Yellow: 'bg-[#F59F01]',
    Red: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-white/10'}`} />
      <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">{label}</span>
    </div>
  );
}

