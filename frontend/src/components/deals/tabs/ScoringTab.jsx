import React, { useState } from 'react';
import { 
  Star, AlertTriangle, Eye, Zap, Users, BarChart4, Compass, 
  ChevronRight, Search, Check, Edit3, CheckCircle2, Clock 
} from 'lucide-react';
import Link from 'next/link';

export default function ScoringTab({ 
  deal, 
  onTrigger, 
  isTriggering, 
  onOverride, 
  onClearGate, 
  onApprove, 
  isApproving 
}) {
  const scoring = deal.latest_scoring;
  const [summary, setSummary] = useState('');

  if (!scoring) {
    return (
      <div className="py-20 text-center bg-white/5 border border-white/10 rounded-3xl space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-[#F59F01]/20 mx-auto border border-white/5">
          <Star size={40} />
        </div>
        <div className="max-w-md mx-auto px-6">
           <h3 className="text-white font-bold text-lg mb-2">Initialize FINLO Scoring</h3>
           <p className="text-white/40 text-sm mb-8 leading-relaxed">
             Start the proprietary scoring engine to evaluate this project across 20 criteria in 5 pillars.
           </p>
           <button 
             onClick={onTrigger}
             disabled={isTriggering}
             className="px-8 py-3 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
           >
             {isTriggering ? 'Executing Engine...' : 'Run FINLO Engine'}
           </button>
        </div>
      </div>
    );
  }

  const pillars = [
    { code: 'F', name: 'Foresight', weight: '20%', icon: <Eye size={18} /> },
    { code: 'I', name: 'Insight', weight: '25%', icon: <Zap size={18} /> },
    { code: 'N', name: 'Nexus', weight: '20%', icon: <Users size={18} /> },
    { code: 'L', name: 'Logic', weight: '20%', icon: <BarChart4 size={18} /> },
    { code: 'O', name: 'Odyssey', weight: '15%', icon: <Compass size={18} /> },
  ];

  const wordCount = summary.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isApproved = deal.status === 'GP_APPROVED';

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Warning Banner */}
      <div className="bg-[#F59F01]/10 border border-[#F59F01]/30 p-6 rounded-2xl flex gap-4 items-start">
         <AlertTriangle className="text-[#F59F01] shrink-0" size={24} />
         <p className="text-[#F59F01] text-xs font-bold leading-relaxed uppercase tracking-wider">
           AI PRELIMINARY ANALYSIS — NOT INVESTMENT ADVICE. All scores are AI-generated suggestions. 
           You are responsible for reviewing, overriding, and validating each score.
         </p>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between px-2">
         <div>
            <h3 className="text-3xl font-black text-white tracking-tighter uppercase">FINLO Deal Score</h3>
            <p className="text-white/40 text-sm mt-1">Proprietary Investment Framework</p>
         </div>
         <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-3xl text-center shadow-2xl">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Weighted Total</p>
            <div className="text-5xl font-black text-[#F59F01] tabular-nums">{scoring.total_deal_score}</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scoring Pillars */}
        <div className="lg:col-span-2 space-y-4">
           {pillars.map(p => (
             <ScoringPillar 
               key={p.code} 
               pillar={p} 
               scores={scoring.criteria_scores.filter(s => s.pillar === p.code)}
               onOverride={onOverride}
             />
           ))}
        </div>

        {/* Sidebar: Compliance & Approval */}
        <div className="space-y-8">
           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Compliance Gates</h4>
              <div className="space-y-6">
                 {scoring.compliance_gates.map(gate => (
                   <ComplianceGateRow key={gate.id} gate={gate} onClear={(notes) => onClearGate({ gateId: gate.gate_id, notes })} />
                 ))}
              </div>
           </div>

           {/* Nepal Regulatory Checklist */}
           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Nepal Regulatory</h4>
              <div className="space-y-4">
                 <RegulatoryItem label="FITTA Approval" status={deal.regulatory_checklist?.fitta_approval_obtained} required={deal.regulatory_checklist?.fitta_approval_required} />
                 <RegulatoryItem label="NRB Approval" status={deal.regulatory_checklist?.nrb_approval_obtained} required={deal.regulatory_checklist?.nrb_approval_required} />
                 <RegulatoryItem label="SEBON Compliant" status={deal.regulatory_checklist?.sebon_reporting_compliant} required={true} />
              </div>
              <Link href={`/gp/deals/${deal.id}/regulatory`} className="block mt-6 text-center text-[9px] font-black text-[#F59F01] uppercase tracking-widest hover:opacity-70 transition-opacity">
                Manage Detailed Checklist
              </Link>
           </div>

           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">

              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Final Assessment</h4>
              <div className="space-y-4">
                 <textarea 
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Enter final investment recommendation summary (min 100 words)..."
                    className="w-full h-48 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#F59F01]/50 transition-all font-serif"
                 />
                 <div className="flex items-center justify-between px-1">
                    <span className={`text-[10px] font-bold ${wordCount >= 100 ? 'text-[#10b981]' : 'text-white/20'}`}>
                       {wordCount} / 100 words
                    </span>
                    {wordCount >= 100 && <CheckCircle2 size={14} className="text-[#10b981]" />}
                 </div>
              </div>

              <button 
                onClick={() => onApprove({ assessment_summary: summary })}
                disabled={isApproving || wordCount < 100 || isApproved}
                className="w-full mt-8 py-4 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-30 disabled:hover:scale-100"
              >
                {isApproved ? 'Deal Approved' : (isApproving ? 'Approving...' : 'Approve for LP Visibility')}
              </button>
              
              {!isApproved && wordCount < 100 && (
                <p className="text-[10px] text-white/20 text-center mt-4 italic">
                  * 100 words minimum required for approval
                </p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function ScoringPillar({ pillar, scores, onOverride }) {
  const [isOpen, setIsOpen] = useState(false);
  const avgScore = scores.reduce((acc, s) => acc + (s.gp_score || s.ai_score), 0) / (scores.length || 1);

  return (
    <div className={`bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all ${isOpen ? 'ring-1 ring-[#F59F01]/30' : ''}`}>
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
       >
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#F59F01]">
                {pillar.icon}
             </div>
             <div className="text-left">
                <h4 className="text-white font-black text-lg tracking-tight uppercase">{pillar.name}</h4>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Weight: {pillar.weight}</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-[10px] text-white/20 uppercase font-black mb-1">Average</p>
                <span className="text-2xl font-black text-white tabular-nums">{avgScore.toFixed(1)}</span>
             </div>
             <ChevronRight size={20} className={`text-white/20 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </div>
       </button>

       {isOpen && (
         <div className="p-6 pt-0 space-y-4 border-t border-white/5 mt-4">
            {scores.map(s => (
              <CriterionRow key={s.id} score={s} onOverride={onOverride} />
            ))}
         </div>
       )}
    </div>
  );
}

function CriterionRow({ score, onOverride }) {
  const [val, setVal] = useState(score.gp_score || score.ai_score);
  const [isEditing, setIsEditing] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  const getScoreColor = (v) => {
    if (v >= 8) return 'bg-[#10b981]';
    if (v >= 6) return 'bg-yellow-500';
    if (v >= 4) return 'bg-[#F59F01]';
    return 'bg-red-500';
  };

  return (
    <div className="bg-black/20 border border-white/5 rounded-2xl p-6 transition-all hover:border-white/10">
       <div className="flex items-start justify-between gap-8">
          <div className="flex-1 space-y-2">
             <h5 className="text-white font-bold text-sm capitalize">{score.criterion_id.replace(/_/g, ' ')}</h5>
             <p className="text-white/50 text-xs leading-relaxed italic line-clamp-2">{score.ai_rationale}</p>
             <div className="flex items-center gap-4 mt-4">
                <button 
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="text-[9px] font-black text-[#F59F01] uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
                >
                  <Search size={12} /> {showEvidence ? 'Hide Evidence' : 'View AI Evidence'}
                </button>
                <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded">
                  Confidence: {(score.ai_confidence * 100).toFixed(0)}%
                </span>
             </div>
          </div>

          <div className="flex items-center gap-4">
             {isEditing ? (
                <div className="flex items-center gap-2">
                   <input 
                     type="number" 
                     min="1" 
                     max="10" 
                     value={val}
                     onChange={(e) => setVal(parseInt(e.target.value))}
                     className="w-16 bg-white/5 border border-[#F59F01]/50 rounded-lg p-2 text-white font-black text-center"
                   />
                   <button 
                     onClick={() => {
                       onOverride({ scoreId: score.id, gp_score: val });
                       setIsEditing(false);
                     }}
                     className="p-2 bg-[#F59F01] text-black rounded-lg hover:scale-105 transition-all"
                   >
                     <Check size={16} />
                   </button>
                </div>
             ) : (
                <div className="flex items-center gap-3">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg ${getScoreColor(val)}`}>
                     {val}
                   </div>
                   <button 
                     onClick={() => setIsEditing(true)}
                     className="p-2 text-white/20 hover:text-white transition-colors"
                   >
                     <Edit3 size={18} />
                   </button>
                </div>
             )}
          </div>
       </div>

       {showEvidence && (
         <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {(score.evidence_quotes || []).map((q, i) => (
              <div key={i} className="p-3 bg-white/5 border-l-2 border-[#F59F01]/50 rounded-r-xl text-[11px] text-white/60 leading-relaxed font-mono">
                "{q}"
              </div>
            ))}
            {(!score.evidence_quotes || score.evidence_quotes.length === 0) && (
              <p className="text-[10px] text-white/20 italic">No specific evidence quotes extracted.</p>
            )}
         </div>
       )}
    </div>
  );
}

function ComplianceGateRow({ gate, onClear }) {
  const isCleared = gate.status === 'CLEARED';
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');

  return (
    <div className="flex items-center justify-between group">
       <div className="space-y-1">
          <p className="text-white font-bold text-xs capitalize">{gate.gate_id.replace(/_/g, ' ')}</p>
          <span className={`text-[9px] font-black uppercase tracking-tighter ${isCleared ? 'text-[#10b981]' : 'text-white/20'}`}>
            {gate.status}
          </span>
       </div>
       {isCleared ? (
         <CheckCircle2 size={18} className="text-[#10b981]" />
       ) : (
         <button 
           onClick={() => setShowModal(true)}
           className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-[#F59F01] hover:text-black hover:border-[#F59F01]"
         >
           Clear
         </button>
       )}

       {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
               <h3 className="text-white font-black text-xl tracking-tight uppercase">Clear {gate.gate_id.replace(/_/g, ' ')}</h3>
               <p className="text-white/40 text-xs leading-relaxed">
                  Confirm that this compliance gate has been manually verified and cleared. This action will be logged in the audit trail.
               </p>
               <textarea 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder="Enter verification notes..."
                 className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-[#F59F01]"
               />
               <div className="flex gap-4">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-white/40 text-xs font-black uppercase">Cancel</button>
                  <button 
                    onClick={() => {
                      onClear(notes);
                      setShowModal(false);
                    }}
                    className="flex-1 py-3 bg-[#F59F01] text-black rounded-xl text-xs font-black uppercase shadow-lg shadow-[#F59F01]/20"
                  >
                    Confirm Clear
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}

function RegulatoryItem({ label, status, required }) {
  if (!required) return null;
  return (
    <div className="flex items-center justify-between">
       <span className="text-[10px] text-white/60">{label}</span>
       {status ? (
         <CheckCircle2 size={14} className="text-[#10b981]" />
       ) : (
         <Clock size={14} className="text-[#F59F01]" />
       )}
    </div>
  );
}
