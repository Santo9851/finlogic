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
    if (f.is_verified_by_gp) return;
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
    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 theme-transition ${isSplitView ? 'pb-20' : ''}`}>
      {/* Main Financials Table */}
      <div className="bg-card rounded-[2.5rem] border border-border-theme shadow-2xl overflow-hidden theme-transition">
        <div className="p-8 border-b border-border-theme flex items-center justify-between bg-foreground/[0.02]">
           <div>
              <h3 className="text-xl font-black text-foreground tracking-tight uppercase flex items-center gap-2">
                Extracted Financials
                {isSplitView && <span className="bg-[#F59F01] text-ls-primary-fixed text-[10px] px-2 py-0.5 rounded-full ml-2">Review Mode</span>}
              </h3>
              <p className="text-text-muted text-xs mt-1 font-medium">Directly extracted from submitted documents</p>
           </div>
           <div className="flex items-center gap-4">
               <span className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest border border-border-theme px-4 py-1.5 rounded-full bg-background/50">
                {financials.length} Years Processed
              </span>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#F59F01] text-ls-primary-fixed rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#F59F01]/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Year
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-foreground/[0.02] text-text-muted/40 uppercase text-[10px] font-black tracking-[0.2em] border-b border-border-theme">
              <tr>
                <th className="px-8 py-6">Fiscal Year</th>
                <th className="px-8 py-6 text-right">Revenue (NPR)</th>
                <th className="px-8 py-6 text-right">EBITDA (NPR)</th>
                <th className="px-8 py-6 text-right">Net Profit (NPR)</th>
                <th className="px-8 py-6 text-right">Total Assets (NPR)</th>
                <th className="px-8 py-6 text-right">Total Debt (NPR)</th>
                <th className="px-8 py-6 text-center">Actions</th>
              </tr>
            </thead>
             <tbody className="divide-y divide-border-theme">
              {isAdding && (
                <tr className="bg-[#F59F01]/5 border-l-4 border-[#F59F01] animate-in slide-in-from-left-2 duration-300">
                  <td className="px-8 py-6">
                    <input 
                      placeholder="2080/81"
                      value={newData.fiscal_year_bs}
                      onChange={(e) => setNewData({...newData, fiscal_year_bs: e.target.value})}
                      className="bg-background border border-border-theme rounded-xl px-4 py-2 text-foreground w-32 focus:border-[#F59F01] outline-none shadow-inner font-black uppercase text-xs"
                    />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <input 
                      type="number"
                      value={newData.revenue_npr}
                      onChange={(e) => setNewData({...newData, revenue_npr: e.target.value})}
                      className="bg-background border border-border-theme rounded-xl px-4 py-2 text-foreground text-right w-36 focus:border-[#F59F01] outline-none shadow-inner font-mono"
                    />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <input 
                      type="number"
                      value={newData.ebitda_npr}
                      onChange={(e) => setNewData({...newData, ebitda_npr: e.target.value})}
                      className="bg-background border border-border-theme rounded-xl px-4 py-2 text-foreground text-right w-36 focus:border-[#F59F01] outline-none shadow-inner font-mono"
                    />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <input 
                      type="number"
                      value={newData.net_profit_npr}
                      onChange={(e) => setNewData({...newData, net_profit_npr: e.target.value})}
                      className="bg-background border border-border-theme rounded-xl px-4 py-2 text-foreground text-right w-36 focus:border-[#F59F01] outline-none shadow-inner font-mono"
                    />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <input 
                      type="number"
                      value={newData.total_assets_npr}
                      onChange={(e) => setNewData({...newData, total_assets_npr: e.target.value})}
                      className="bg-background border border-border-theme rounded-xl px-4 py-2 text-foreground text-right w-36 focus:border-[#F59F01] outline-none shadow-inner font-mono"
                    />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <input 
                      type="number"
                      value={newData.total_debt_npr}
                      onChange={(e) => setNewData({...newData, total_debt_npr: e.target.value})}
                      className="bg-background border border-border-theme rounded-xl px-4 py-2 text-foreground text-right w-36 focus:border-[#F59F01] outline-none shadow-inner font-mono"
                    />
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={handleCreate} className="p-3 bg-[#F59F01] text-ls-primary-fixed rounded-xl hover:scale-110 transition-all shadow-lg shadow-[#F59F01]/20">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setIsAdding(false)} className="p-3 bg-foreground/5 text-text-muted rounded-xl hover:text-foreground transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {financials.sort((a, b) => b.fiscal_year_bs?.localeCompare(a.fiscal_year_bs) || 0).map((f) => (
                <tr key={f.id} className="hover:bg-foreground/[0.01] transition-colors group">
                  <td className="px-8 py-6 text-foreground font-black text-base">{f.fiscal_year_bs}</td>
                  <td className="px-8 py-6 text-right font-mono">
                    {editingId === f.id ? (
                      <input 
                        type="number" 
                        value={editData.revenue_npr} 
                        onChange={(e) => setEditData({...editData, revenue_npr: e.target.value})}
                        className="bg-background border border-border-theme rounded-xl px-4 py-1.5 text-right w-36 focus:border-[#F59F01] outline-none shadow-inner"
                      />
                    ) : (
                      <div className="flex items-center justify-end gap-3 group/cell">
                        <span className="text-foreground/80 font-medium">{Number(f.revenue_npr).toLocaleString()}</span>
                        {!f.is_verified_by_gp && (
                          <button 
                            onClick={() => toggleCellVerify(f, 'revenue')}
                            className={`opacity-0 group-hover/cell:opacity-100 transition-all p-1 rounded-lg hover:bg-[#10b981]/10 ${f.verified_fields?.revenue ? 'text-emerald-500 opacity-100' : 'text-text-muted/20'}`}
                          >
                            <CheckCircle2 className="w-4 h-4" size={16} />
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
                        className="bg-background border border-border-theme rounded-xl px-4 py-1.5 text-right w-36 focus:border-[#F59F01] outline-none shadow-inner"
                      />
                    ) : (
                      <div className="flex items-center justify-end gap-3 group/cell">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">{Number(f.ebitda_npr).toLocaleString()}</span>
                        {!f.is_verified_by_gp && (
                          <button 
                            onClick={() => toggleCellVerify(f, 'ebitda')}
                            className={`opacity-0 group-hover/cell:opacity-100 transition-all p-1 rounded-lg hover:bg-[#10b981]/10 ${f.verified_fields?.ebitda ? 'text-emerald-500 opacity-100' : 'text-text-muted/20'}`}
                          >
                            <CheckCircle2 className="w-4 h-4" size={16} />
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
                        className="bg-background border border-border-theme rounded-xl px-4 py-1.5 text-right w-36 focus:border-[#F59F01] outline-none shadow-inner"
                      />
                    ) : (
                      <div className="flex items-center justify-end gap-3 group/cell">
                        <span className="text-foreground/80 font-medium">{Number(f.net_profit_npr).toLocaleString()}</span>
                        {!f.is_verified_by_gp && (
                          <button 
                            onClick={() => toggleCellVerify(f, 'net_profit')}
                            className={`opacity-0 group-hover/cell:opacity-100 transition-all p-1 rounded-lg hover:bg-[#10b981]/10 ${f.verified_fields?.net_profit ? 'text-emerald-500 opacity-100' : 'text-text-muted/20'}`}
                          >
                            <CheckCircle2 className="w-4 h-4" size={16} />
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
                        className="bg-background border border-border-theme rounded-xl px-4 py-1.5 text-right w-36 focus:border-[#F59F01] outline-none shadow-inner"
                      />
                    ) : (
                      <div className="flex items-center justify-end gap-3 group/cell">
                        <span className="text-foreground/80 font-medium">{Number(f.total_assets_npr).toLocaleString()}</span>
                        {!f.is_verified_by_gp && (
                          <button 
                            onClick={() => toggleCellVerify(f, 'total_assets')}
                            className={`opacity-0 group-hover/cell:opacity-100 transition-all p-1 rounded-lg hover:bg-[#10b981]/10 ${f.verified_fields?.total_assets ? 'text-emerald-500 opacity-100' : 'text-text-muted/20'}`}
                          >
                            <CheckCircle2 className="w-4 h-4" size={16} />
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
                        className="bg-background border border-border-theme rounded-xl px-4 py-1.5 text-right w-36 focus:border-[#F59F01] outline-none shadow-inner"
                      />
                    ) : (
                      <div className="flex items-center justify-end gap-3 group/cell">
                        <div className="flex flex-col items-end">
                          <span className="text-rose-600 dark:text-rose-400 font-bold">{Number(f.total_debt_npr).toLocaleString()}</span>
                          {f.raw_ai_output?.exchange_rate_used && (
                            <div className="flex items-center gap-1 text-[8px] text-text-muted/40 font-black uppercase mt-1">
                              <Calendar className="w-2.5 h-2.5" />
                              Conv @ {f.raw_ai_output.exchange_rate_used} ({f.raw_ai_output.exchange_rate_date || 'FY Avg'})
                            </div>
                          )}
                        </div>
                        {!f.is_verified_by_gp && (
                          <button 
                            onClick={() => toggleCellVerify(f, 'total_debt')}
                            className={`opacity-0 group-hover/cell:opacity-100 transition-all p-1 rounded-lg hover:bg-[#10b981]/10 ${f.verified_fields?.total_debt ? 'text-emerald-500 opacity-100' : 'text-text-muted/20'}`}
                          >
                            <CheckCircle2 className="w-4 h-4" size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-3">
                      {f.source_document && (
                        <button 
                          onClick={() => onViewSource(f.source_document)}
                          className="p-2.5 bg-foreground/5 hover:bg-foreground/10 border border-border-theme rounded-xl text-text-muted hover:text-foreground transition-all shadow-sm"
                          title="View Source Document"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      
                      {editingId === f.id ? (
                        <>
                          <button onClick={() => handleSave(f.id)} className="p-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2.5 bg-foreground/5 text-text-muted rounded-xl hover:text-foreground transition-all shadow-sm">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        !f.is_verified_by_gp && (
                          <button onClick={() => startEdit(f)} className="p-2.5 bg-foreground/5 text-text-muted border border-border-theme rounded-xl hover:text-[#F59F01] hover:bg-[#F59F01]/10 hover:border-[#F59F01]/30 transition-all shadow-sm">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )
                      )}

                      {f.is_verified_by_gp ? (
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                            <Lock className="w-3.5 h-3.5" />
                            Verified
                          </div>
                          <button 
                            onClick={() => handleVerify(f.id)} 
                            className="text-text-muted/40 hover:text-rose-500 transition-all"
                            title="Unverify to edit"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleVerify(f.id)}
                            className="px-5 py-2 bg-foreground/5 border border-border-theme hover:bg-emerald-500 hover:text-white hover:border-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                          >
                            Verify
                          </button>
                          <button 
                            onClick={() => handleDelete(f.id)}
                            className="p-2.5 bg-foreground/5 text-text-muted/40 hover:text-rose-500 hover:bg-rose-500/10 border border-border-theme rounded-xl transition-all shadow-sm"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {financials.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Calendar className="w-12 h-12 text-text-muted" />
                      <p className="text-text-muted font-bold uppercase tracking-[0.2em] text-[10px]">No financial data extracted. Trigger AI extraction in the Data Room tab.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QoE Analysis Section */}
      <div className="space-y-10 theme-transition">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h3 className="text-3xl font-black text-foreground tracking-tight uppercase">Quality of Earnings (QoE)</h3>
              <p className="text-text-muted text-sm mt-1 font-medium">Deep-dive AI analysis into financial reliability</p>
           </div>
            {!qoeReport && (
              <div className="flex flex-col items-end gap-3">
                <button 
                  onClick={onRunQoE}
                  disabled={isRunningQoE || !allVerified}
                  className="px-10 py-4 bg-[#F59F01] text-ls-primary-fixed rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-2xl shadow-[#F59F01]/20 disabled:opacity-50 disabled:grayscale disabled:scale-100 active:scale-95"
                >
                  {isRunningQoE ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5 inline mr-3" />}
                  Run QoE Analysis
                </button>
                {!allVerified && financials.length > 0 && (
                  <div className="flex items-center gap-3 text-rose-500 text-[10px] font-black uppercase bg-rose-500/5 px-6 py-2.5 rounded-2xl border border-rose-500/20 shadow-xl">
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                    Verify all years to enable QoE analysis
                  </div>
                )}
                {financials.length === 0 && (
                  <div className="text-text-muted/40 text-[10px] font-black uppercase tracking-[0.2em]">
                    Extraction required
                  </div>
                )}
              </div>
           )}
        </div>

        {qoeReport ? (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-1000">
             <div className="flex flex-wrap items-center gap-6">
                <button 
                  onClick={() => fullAnalysisMutation.mutate()}
                  disabled={fullAnalysisMutation.isLoading}
                  className="flex items-center gap-3 px-8 py-2.5 bg-foreground/5 border border-border-theme text-text-muted hover:text-foreground hover:bg-foreground/10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-lg"
                >
                   {fullAnalysisMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-[#F59F01]" />}
                   Run Full Analysis
                </button>
                <button 
                  onClick={isEditingQoE ? handleUpdateQoE : startEditingQoE}
                  className={`flex items-center gap-3 px-8 py-2.5 border rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                    isEditingQoE ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-foreground/5 border-border-theme text-text-muted hover:text-foreground'
                  }`}
                >
                  {isEditingQoE ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {isEditingQoE ? 'Save Report' : 'Edit Report'}
                </button>
                {isEditingQoE && (
                  <button 
                    onClick={() => setIsEditingQoE(false)}
                    className="p-3 bg-foreground/5 text-text-muted hover:text-foreground rounded-full transition-all border border-border-theme shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-2xl theme-transition ${
                  qoeReport.status === 'CLEAN' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                  qoeReport.status === 'CAUTION' ? 'bg-[#F59F01]/10 text-[#F59F01] border-[#F59F01]/20' :
                  'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}>
                  {qoeReport.status === 'CLEAN' ? 'Green Flag (Clean)' : qoeReport.status === 'CAUTION' ? 'Yellow Flag (Caution)' : 'Red Flag (High Risk)'}
                </div>
                <span className="text-text-muted/30 text-[10px] font-black uppercase tracking-tighter">
                  Last Analysis: {new Date(qoeReport.created_at).toLocaleString()}
                </span>
             </div>
             
              <div className="bg-card p-10 rounded-[3rem] border border-border-theme shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] article-body theme-transition">
                {isEditingQoE ? (
                  <textarea 
                    value={tempQoE}
                    onChange={(e) => setTempQoE(e.target.value)}
                    className="w-full h-[600px] bg-background text-foreground font-mono text-sm leading-relaxed p-8 border border-border-theme rounded-[2rem] focus:border-[#F59F01] outline-none shadow-inner"
                    placeholder="Edit the Markdown report here..."
                  />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-12 shadow-2xl rounded-2xl border border-border-theme">
                            <table className="min-w-full border-collapse" {...props} />
                          </div>
                        ),
                        thead: ({node, ...props}) => <thead className="bg-foreground/[0.03]" {...props} />,
                        th: ({node, ...props}) => <th className="border border-border-theme px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-muted" {...props} />,
                        td: ({node, ...props}) => <td className="border border-border-theme px-6 py-4 text-sm text-foreground/70 font-medium" {...props} />,
                        p: ({node, ...props}) => <p className="leading-relaxed mb-6 text-foreground/70 text-base" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-2xl font-black text-foreground mt-12 mb-6 tracking-tight uppercase" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-3" {...props} />,
                        li: ({node, ...props}) => <li className="text-foreground/60 text-base" {...props} />,
                      }}
                    >
                      {qoeReport.report_text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <RiskMetric label="Revenue Recognition" status={qoeReport.status === 'HIGH_RISK' ? 'Red' : 'Green'} />
                <RiskMetric label="Related Party Ops" status="Yellow" />
                <RiskMetric label="EBITDA Adjustments" status={qoeReport.status === 'CLEAN' ? 'Green' : 'Yellow'} />
             </div>
          </div>
        ) : (
          <div className="py-24 text-center space-y-8 bg-card border border-border-theme border-dashed rounded-[3rem] shadow-inner theme-transition">
            <div className="w-24 h-24 rounded-[2rem] bg-foreground/5 flex items-center justify-center text-text-muted/20 mx-auto border border-border-theme shadow-inner">
              <BrainCircuit className="w-12 h-12" />
            </div>
            <div className="max-w-xs mx-auto space-y-3">
               <p className="text-foreground font-black text-lg uppercase tracking-widest">Waiting for Analysis</p>
               <p className="text-text-muted/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">Extraction must be completed before running QoE analysis.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RiskMetric({ label, status }) {
  const colors = {
    Green: 'bg-emerald-500 shadow-emerald-500/50',
    Yellow: 'bg-[#F59F01] shadow-[#F59F01]/50',
    Red: 'bg-rose-500 shadow-rose-500/50',
  };

  return (
    <div className="flex items-center gap-4 bg-card border border-border-theme px-6 py-4 rounded-[1.5rem] shadow-lg theme-transition">
      <div className={`w-3 h-3 rounded-full ${colors[status] || 'bg-foreground/10'} shadow-[0_0_12px] animate-pulse`} />
      <span className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
}
