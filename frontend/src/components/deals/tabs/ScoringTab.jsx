
import React, { useState, useEffect } from 'react';
import { 
  Star, AlertTriangle, Eye, Zap, Users, BarChart4, Compass, 
  ChevronRight, Search, Check, Edit3, CheckCircle2, Clock, X, FileText
} from 'lucide-react';
import Link from 'next/link';
import FileUploader from '@/components/portal/FileUploader';
import UBOFormTemplate from '@/components/compliance/UBOFormTemplate';
import { Printer } from 'lucide-react';

export default function ScoringTab({ 
  deal, 
  onTrigger, 
  isTriggering, 
  onOverride, 
  onClearGate, 
  onResetGate,
  onApprove, 
  isApproving 
}) {
  const scoring = deal.latest_scoring;
  const [summary, setSummary] = useState('');
  const [showUBOModal, setShowUBOModal] = useState(false);
  
  // Local state for scores to allow immediate recalculation on override
  const [localScores, setLocalScores] = useState(scoring?.criteria_scores || []);
  
  const showResults = !!scoring;
  const isProcessing = isTriggering || deal.analysis_progress?.Scoring === 'processing';

  // Recalculate total score based on weights
  const calculateTotal = () => {
    const pillarWeights = { F: 0.20, I: 0.25, N: 0.20, L: 0.20, O: 0.15 };
    let total = 0;
    
    Object.keys(pillarWeights).forEach(code => {
      const pillarScores = localScores.filter(s => s.pillar === code);
      if (pillarScores.length > 0) {
        const avg = pillarScores.reduce((acc, s) => acc + (s.gp_score || s.ai_score), 0) / pillarScores.length;
        total += avg * pillarWeights[code];
      }
    });
    return total.toFixed(2);
  };

  const currentTotal = showResults ? calculateTotal() : "0.00";

  const getRecommendation = (score) => {
    if (score >= 8.5) return { label: 'Strong Conviction', color: 'bg-emerald-500', desc: 'Superior fundamentals and moat.' };
    if (score >= 7.0) return { label: 'Growth Standard', color: 'bg-[#F59F01]', desc: 'Strong deal with manageable risks.' };
    if (score >= 5.0) return { label: 'Speculative', color: 'bg-orange-500', desc: 'Requires significant risk mitigation.' };
    return { label: 'High Risk / Reject', color: 'bg-red-500', desc: 'Critical structural or team failures.' };
  };

  const rec = getRecommendation(parseFloat(currentTotal));

  if (!showResults) {
    return (
      <div className="py-20 text-center bg-white/5 border border-white/10 rounded-3xl space-y-6">
        <div className={`w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto border border-white/5 ${isProcessing ? 'text-[#F59F01] animate-pulse' : 'text-[#F59F01]/20'}`}>
          <Star size={40} />
        </div>
        <div className="max-w-md mx-auto px-6">
           <h3 className="text-white font-bold text-lg mb-2">
             {isProcessing ? 'Scoring in Progress' : 'Initialize FINLO Scoring'}
           </h3>
           <p className="text-white/40 text-sm mb-8 leading-relaxed">
             {isProcessing 
               ? 'Our 5-pillar engine is currently synthesizing financials, legal scans, and operational audits. This typically takes 15-30 seconds.' 
               : 'Start the proprietary scoring engine to evaluate this project across 20 criteria in 5 pillars.'}
           </p>
           <button 
             onClick={onTrigger}
             disabled={isProcessing}
             className="px-8 py-3 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
           >
             {isProcessing ? 'Executing Engine...' : 'Run FINLO Engine'}
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
  const isApproved = ['IC_REVIEW', 'TERM_SHEET', 'LOI_ISSUED', 'CONTRACT_SIGNED', 'CAPITAL_CALLED', 'CLOSED'].includes(deal.status);

  const handleOverrideUpdate = (data) => {
    setLocalScores(prev => prev.map(s => s.id === data.scoreId ? { ...s, gp_score: data.gp_score } : s));
    onOverride(data);
  };

  const printUBOForm = () => {
    const companyName = deal?.company_name || '__________________________';
    const sector = deal?.sector || '__________________________';
    const dateStr = new Date().toLocaleDateString();

    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) return;

    // Inline SVG logo matching FinlogicLogo.js exactly:
    // violet top-rail + left-rail L-shape, gold square bottom-left, wordmark stacked
    const logoSVG = `
      <div style="display:flex;align-items:center;gap:10px;">
        <!-- Icon mark -->
        <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="84" height="14" rx="3" fill="#5B2FD4"/>
          <rect x="8" y="8" width="14" height="84" rx="3" fill="#5B2FD4"/>
          <rect x="26" y="60" width="28" height="28" rx="5" fill="#F59F01"/>
        </svg>
        <!-- Wordmark -->
        <svg height="36" viewBox="0 0 220 84" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
          <text x="0" y="30" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="31" letter-spacing="0.5" fill="#3A138A">FINLOGIC</text>
          <text x="0" y="58" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="31" letter-spacing="0.5" fill="#3A138A">CAPITAL</text>
          <text x="1" y="80" font-family="Arial, sans-serif" font-weight="600" font-size="22" letter-spacing="3" fill="#6B3DD4">LIMITED</text>
        </svg>
      </div>`;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>UBO Declaration Form — Finlogic Capital</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; background: white; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4 portrait; margin: 15mm; }
    .page { padding: 8mm; max-width: 210mm; margin: 0 auto; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #5B2FD4; padding-bottom: 18px; margin-bottom: 20px; }
    .dept { font-family: Arial, sans-serif; font-size: 8px; color: #9ca3af; text-transform: uppercase; letter-spacing: 3px; font-weight: 700; margin-top: 8px; }
    .doc-title { font-family: Arial, sans-serif; font-size: 22px; font-weight: 900; color: #3A138A; text-transform: uppercase; letter-spacing: -1px; text-align: right; }
    .doc-version { font-family: Arial, sans-serif; font-size: 8px; color: #9ca3af; font-weight: 700; text-transform: uppercase; text-align: right; margin-top: 4px; }

    .intro { font-size: 11px; line-height: 1.8; color: #374151; margin-bottom: 16px; }
    .info-box { background: #f9fafb; padding: 14px; border-left: 4px solid #F59F01; margin-bottom: 18px; }
    .info-box h2 { font-family: Arial, sans-serif; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #9ca3af; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field label { font-family: Arial, sans-serif; display: block; font-size: 7px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
    .field p { font-family: Arial, sans-serif; font-size: 10px; font-weight: 700; color: #111; }

    .sec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .sec-title { font-family: Arial, sans-serif; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #3A138A; }
    .mandatory { font-family: Arial, sans-serif; font-size: 7px; font-weight: 900; text-transform: uppercase; color: #F59F01; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { background: #f9fafb; font-family: Arial, sans-serif; font-size: 8px; font-weight: 900; text-transform: uppercase; color: #6b7280; padding: 7px 10px; border: 1px solid #e5e7eb; text-align: left; }
    td { border: 1px solid #e5e7eb; padding: 8px; height: 28px; }
    .note { font-size: 8px; color: #9ca3af; font-style: italic; margin-top: 3px; }

    .decl h2 { font-family: Arial, sans-serif; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #3A138A; margin: 18px 0 8px; }
    .decl p { font-size: 10px; line-height: 1.8; font-style: italic; color: #4b5563; text-align: justify; margin-bottom: 8px; }

    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 14px; }
    .sig-line { height: 55px; border-bottom: 1px solid #d1d5db; margin-bottom: 8px; }
    .sig-label { font-family: Arial, sans-serif; font-size: 8px; font-weight: 900; text-transform: uppercase; }
    .sig-sub { font-family: Arial, sans-serif; font-size: 7px; color: #9ca3af; margin-top: 3px; }
    .seal-box { height: 55px; border-bottom: 1px solid #d1d5db; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
    .seal-circle { width: 60px; height: 60px; border: 2px dashed #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif; font-size: 6px; color: #d1d5db; text-transform: uppercase; font-weight: 900; text-align: center; }
    .tr { text-align: right; }

    .doc-footer { display: flex; justify-content: space-between; border-top: 1px solid #f3f4f6; padding-top: 12px; margin-top: 30px; }
    .doc-footer p { font-family: Arial, sans-serif; font-size: 6px; color: #d1d5db; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
  </style>
</head>
<body>
  <script>
    window.addEventListener('afterprint', function() { window.close(); });
  </script>
  <div class="page">

    <div class="header">
      <div>
        ${logoSVG}
        <div class="dept">Regulatory Compliance Dept.</div>
      </div>
      <div>
        <div class="doc-title">UBO Declaration</div>
        <div class="doc-version">Form Version: 2024.1.v</div>
      </div>
    </div>

    <p class="intro">Pursuant to the <strong>Prevention of Money Laundering Act (PMLA)</strong> and relevant <strong>SEBON</strong> regulations, this declaration is required to identify the <strong>Ultimate Beneficial Owners (UBO)</strong> of the entity seeking investment or partnership with Finlogic Capital Limited.</p>

    <div class="info-box">
      <h2>Declarant Information</h2>
      <div class="info-grid">
        <div class="field"><label>Entity Name</label><p>${companyName}</p></div>
        <div class="field"><label>Project Category</label><p>${sector}</p></div>
        <div class="field"><label>Registration No.</label><p>__________________________</p></div>
        <div class="field"><label>Date of Declaration</label><p>${dateStr}</p></div>
      </div>
    </div>

    <div class="sec-header">
      <div class="sec-title">Beneficial Ownership &amp; Shareholding</div>
      <div class="mandatory">Mandatory: All Shareholders &gt; 5%</div>
    </div>
    <table>
      <thead><tr>
        <th>Full Name of Shareholder / UBO</th>
        <th>Citizenship / Passport #</th>
        <th>Nationality</th>
        <th style="text-align:center;">Ownership %</th>
      </tr></thead>
      <tbody>${Array.from({length: 8}, () => '<tr><td></td><td></td><td></td><td></td></tr>').join('')}</tbody>
    </table>
    <p class="note">* <strong>Important:</strong> Please list all individual shareholders holding more than <strong>5% equity</strong> in the entity.</p>
    <p class="note" style="margin-top:3px;">* Ultimate Beneficial Owner (UBO) = any individual who ultimately owns or controls 25%+ of shares or voting rights.</p>

    <div class="decl">
      <h2>Legal Declaration</h2>
      <p>I, the undersigned, acting in my capacity as an authorized representative of the aforementioned entity, hereby declare that the information provided herein is true, accurate, and complete to the best of my knowledge. I acknowledge that Finlogic Capital Limited relies on this information for its compliance obligations under the laws of Nepal and international AML standards.</p>
      <p>I further agree to notify Finlogic Capital Limited immediately of any changes to the beneficial ownership structure as declared above. I understand that any false declaration may result in the termination of the engagement and may be reportable to regulatory authorities.</p>
    </div>

    <div class="sig-grid">
      <div>
        <div class="sig-line"></div>
        <div class="sig-label">Authorized Signature</div>
        <div class="sig-sub">Name: __________________________</div>
        <div class="sig-sub" style="margin-top:3px;">Title: __________________________</div>
      </div>
      <div>
        <div class="seal-box"><div class="seal-circle">Company Seal</div></div>
        <div class="sig-label tr">Official Stamp</div>
        <div class="sig-sub tr" style="margin-top:3px;">Date: ____ / ____ / 20____</div>
      </div>
    </div>

    <div class="doc-footer">
      <div><p>&copy; Finlogic Capital Limited</p><p>Institutional Integrity &amp; Governance Unit</p></div>
      <p>Confidential Document | Internal Use Only</p>
    </div>

  </div>
</body></html>`);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 600);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
       {/* UBO Form Template Modal */}
       {showUBOModal && (
         <div id="ubo-printable-container" className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex flex-col items-center p-8 overflow-y-auto">
            <div className="max-w-[210mm] w-full flex justify-between items-center mb-6 sticky top-0 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 z-10">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowUBOModal(false)}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                  >
                     <X size={20} />
                  </button>
                  <div>
                     <h2 className="text-white font-black text-lg uppercase tracking-tight">Official UBO Declaration Template</h2>
                     <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Ready for Printing & Signature</p>
                  </div>
               </div>
               
               <button 
                 onClick={printUBOForm}
                 className="flex items-center gap-2 px-6 py-3 bg-[#F59F01] text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#F59F01]/20 hover:scale-[1.05] transition-all"
               >
                  <Printer size={16} />
                  Print Declaration Form
               </button>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <UBOFormTemplate deal={deal} />
            </div>
            
            <div className="mt-8 text-white/20 text-[10px] font-black uppercase tracking-[0.3em] pb-12">
               Finlogic Capital Compliance Infrastructure
            </div>
         </div>
       )}

       {/* Warning Banner */}
      <div className="bg-[#F59F01]/10 border border-[#F59F01]/30 p-6 rounded-2xl flex gap-4 items-start">
         <AlertTriangle className="text-[#F59F01] shrink-0" size={24} />
         <p className="text-[#F59F01] text-[10px] font-bold leading-relaxed uppercase tracking-wider">
           AI PRELIMINARY ANALYSIS — NOT INVESTMENT ADVICE. All scores are AI-generated suggestions. 
           You are responsible for reviewing, overriding, and validating each score.
         </p>
      </div>

      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-2">
         <div className="space-y-4">
            <div>
               <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">FINLO Score</h3>
               <p className="text-white/40 text-sm mt-2 font-medium">Holistic Investment Thesis Evaluation</p>
            </div>
            
            <div className="flex items-center gap-3">
               <div className={`${rec.color} px-4 py-1.5 rounded-full text-[10px] font-black text-black uppercase tracking-widest shadow-lg shadow-white/5`}>
                 {rec.label}
               </div>
               <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{rec.desc}</p>
            </div>
         </div>

         <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 px-10 py-6 rounded-[32px] text-center shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-[#F59F01]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1 relative z-10">Total Grade</p>
               <div className="flex items-baseline justify-center gap-1 relative z-10">
                  <span className="text-6xl font-black text-[#F59F01] tabular-nums tracking-tighter">{currentTotal}</span>
                  <span className="text-xl font-bold text-white/20">/ 10</span>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           {pillars.map(p => (
             <ScoringPillar 
               key={p.code} 
               pillar={p} 
               scores={localScores.filter(s => s.pillar === p.code)}
               onOverride={handleOverrideUpdate}
             />
           ))}
        </div>

        <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
               <h4 className="text-xs font-black text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Compliance Gates</h4>
               <div className="space-y-6">
                  {scoring.compliance_gates.map(gate => (
                    <ComplianceGateRow 
                      key={gate.id} 
                      gate={gate} 
                      deal={deal}
                      onClear={(data) => onClearGate(data)} 
                      onReset={(data) => onResetGate(data)}
                      onViewUBO={() => setShowUBOModal(true)}
                    />
                  ))}
               </div>
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
                 {isApproved ? 'Deal Approved' : (isApproving ? 'Approving...' : 'Approve for IC Review')}
               </button>
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
         </div>
       )}
    </div>
  );
}

const GATE_METADATA = {
  'FITTA': {
    title: 'FITTA / FDI Approval',
    info: 'Required for foreign investment under the Foreign Investment and Technology Transfer Act. Mandatory for all foreign LPs.',
    subtasks: [
      { id: 'approval', label: 'FITTA Approval Obtained', help: 'The formal approval letter from DOI or FITTA branch.' },
      { id: 'automatic', label: 'Automatic Route Eligibility', help: 'Confirmation if the project qualifies for the NRB automatic approval route.' },
      { id: 'doi', label: 'DOI Intimation Letter', help: 'Acknowledgment letter from the Department of Industry regarding the FDI intimation.' }
    ]
  },
  'AML_KYC': {
    title: 'AML / KYC Verification',
    info: 'Prevention of Money Laundering Act (PMLA) compliance. Verification of Ultimate Beneficial Owners (UBO) is strictly mandatory.',
    subtasks: [
      { 
        id: 'ubo', 
        label: 'Signed UBO Declaration Form', 
        help: 'Signed UBO declaration form with citizenship/passport copies. This is a mandatory requirement for all deals.',
        isMandatory: true,
        templateName: 'UBO_Declaration_Form.pdf'
      }
    ]
  },
  'FINANCIAL_AUDIT': {
    title: 'Financial Due Diligence',
    info: 'Audit of historical financials and tax clearance. Verification of local accounting standards compliance.',
    subtasks: [
      { id: 'tax', label: '3-Year Tax Clearance Certificate', help: 'Valid tax clearance certificates for the last three fiscal years.' },
      { id: 'audit', label: 'Certified Audit Report', help: 'Audited financial statements from a licensed ICAN chartered accountant.' }
    ]
  },
  'LEGAL_STRUCTURE': {
    title: 'Legal Structure Validity',
    info: 'Review of Share Lagat, Article of Association, and corporate governance framework.',
    subtasks: [
      { id: 'ocr', label: 'OCR Share Lagat Updated', help: 'Current certified Share Lagat from the Office of Company Registrar.' },
      { id: 'aoa', label: 'AOA/MOA Amendments Verified', help: 'Verification of latest Memorandum and Articles of Association.' }
    ]
  },
  'SEBON_MAPPING': {
    title: 'SEBON Compliance & Mapping',
    info: 'Verification of SEBON private placement compliance and sector-specific mapping requirements.',
    subtasks: [
      { id: 'sebon_filing', label: 'SEBON Filing Completed', help: 'Evidence of submission to the Securities Board of Nepal.' },
      { id: 'sector_mapping', label: 'Sector Mapping Verified', help: 'Verification of business categories against SEBON approved lists.' }
    ]
  }
};

function SubTaskItem({ task, projectId, onChange, onViewTemplate }) {
  const [status, setStatus] = useState('PENDING'); // PENDING, FULFILLED, NOT_NEEDED
  const [notes, setNotes] = useState('');
  const [docId, setDocId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // For mandatory tasks, we only consider it "done" if status is FULFILLED AND docId is present
    const isDone = task.isMandatory 
      ? (status === 'FULFILLED' && !!docId)
      : (status === 'FULFILLED' || status === 'NOT_NEEDED');
    
    onChange(task.id, { status, notes, docId, isDone });
  }, [status, notes, docId, task.isMandatory]);

  const toggleStatus = (s) => {
    if (status === s) {
      setStatus('PENDING');
      setShowForm(false);
    } else {
      setStatus(s);
      setShowForm(true);
    }
  };

  return (
    <div className={`border rounded-[32px] p-6 transition-all ${
      status === 'FULFILLED' ? 'bg-[#10b981]/5 border-[#10b981]/20' : 
      status === 'NOT_NEEDED' ? 'bg-white/5 border-white/10 opacity-60' : 'bg-black/40 border-white/5 hover:border-white/20'
    }`}>
       <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
             <div className="flex items-center gap-2">
                <p className={`text-sm font-black uppercase tracking-tight ${status === 'FULFILLED' ? 'text-[#10b981]' : 'text-white'}`}>
                  {task.label}
                </p>
                {task.isMandatory && (
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black uppercase rounded-full">Mandatory</span>
                )}
             </div>
             <p className="text-[10px] text-white/40 leading-relaxed max-w-sm">{task.help}</p>
             
             {task.templateName && (
               <button 
                 onClick={onViewTemplate}
                 className="flex items-center gap-2 px-3 py-1.5 bg-[#F59F01]/10 border border-[#F59F01]/20 rounded-xl text-[#F59F01] text-[9px] font-black uppercase tracking-widest hover:bg-[#F59F01] hover:text-black transition-all"
               >
                  <FileText size={12} />
                  View & Print Official Template
               </button>
             )}
          </div>
          
          <div className="flex gap-2 shrink-0">
             {!task.isMandatory && (
               <button 
                 onClick={() => toggleStatus('NOT_NEEDED')}
                 className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                   status === 'NOT_NEEDED' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/20 hover:text-white'
                 }`}
               >
                 Not Needed
               </button>
             )}
             <button 
               onClick={() => toggleStatus('FULFILLED')}
               className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                 status === 'FULFILLED' ? 'bg-[#10b981] text-black' : 'bg-white/5 text-white/20 hover:text-[#10b981]'
               }`}
             >
                <Check size={16} strokeWidth={4} />
             </button>
          </div>
       </div>

       {showForm && (
         <div className="mt-6 pt-6 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                 {status === 'FULFILLED' ? 'Verification Notes' : 'Reason for Exemption'}
               </label>
               <textarea 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder={status === 'FULFILLED' ? "Enter reference numbers, approval dates..." : "Explain why this is not required..."}
                 className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-[#F59F01]/40 transition-all min-h-[80px]"
               />
            </div>

            {status === 'FULFILLED' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                   <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Evidence Document</label>
                   {task.isMandatory && !docId && <span className="text-[8px] text-red-400 font-bold animate-pulse italic">* Required to clear gate</span>}
                </div>
                <FileUploader 
                  projectId={projectId}
                  category="COMPLIANCE"
                  isLocal={true}
                  uploadUrl={`deals/projects/${projectId}/upload-local/`}
                  onSuccess={(id) => setDocId(id)}
                  label="Upload Signed Document"
                  description="Upload the signed & scanned template with ID copies"
                />
              </div>
            )}
         </div>
       )}
    </div>
  );
}

function ComplianceGateRow({ gate, deal, onClear, onReset, onViewUBO }) {
  const isCleared = gate.status === 'CLEARED';
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState(gate.notes || '');
  const [docId, setDocId] = useState(null);
  const [subtaskStates, setSubtaskStates] = useState({});
  const meta = GATE_METADATA[gate.gate_id] || { title: gate.gate_id.replace(/_/g, ' '), info: 'Standard verification required.', subtasks: [] };

  const handleSubtaskChange = (taskId, state) => {
    setSubtaskStates(prev => ({ ...prev, [taskId]: state }));
  };

  const isAllTasksDone = meta.subtasks.every(t => {
    const s = subtaskStates[t.id];
    return s && s.isDone;
  });

  const handleClear = () => {
    // Consolidate notes and documents
    const subtaskSummary = meta.subtasks.map(t => {
      const s = subtaskStates[t.id];
      return `[${t.label}]: ${s.status === 'FULFILLED' ? 'VERIFIED' : 'EXEMPT'} - ${s.notes}`;
    }).join('\n\n');

    const consolidatedNotes = `${notes}\n\n--- SUB-TASK BREAKDOWN ---\n${subtaskSummary}`;
    const consolidatedDocIds = meta.subtasks
      .map(t => subtaskStates[t.id]?.docId)
      .filter(id => !!id);
    
    if (docId) consolidatedDocIds.push(docId);

    onClear({ 
      gateId: gate.gate_id, 
      notes: consolidatedNotes, 
      document_ids: consolidatedDocIds 
    });
    setShowModal(false);
  };

  return (
    <div className="flex items-center justify-between group">
       <div className="space-y-1">
          <p className="text-white font-bold text-xs">{meta.title}</p>
          <span className={`text-[9px] font-black uppercase tracking-tighter ${isCleared ? 'text-[#10b981]' : 'text-white/20'}`}>
            {gate.status}
          </span>
       </div>
       <button 
         onClick={() => setShowModal(true)}
         className={`px-4 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
           isCleared 
             ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black' 
             : 'bg-white/5 border-white/10 text-white opacity-0 group-hover:opacity-100 hover:bg-[#F59F01] hover:text-black hover:border-[#F59F01]'
         }`}
       >
         {isCleared ? 'View Details' : 'Review & Clear'}
       </button>

       {showModal && (
         <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 md:p-12 bg-black/90 backdrop-blur-md overflow-y-auto">
            <div className="bg-[#111111] border border-white/10 p-10 rounded-[40px] max-w-2xl w-full shadow-2xl space-y-8 relative animate-in fade-in zoom-in duration-300 mb-12">
               <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-white/20 hover:text-white">
                  <X size={24} />
               </button>

               <div className="space-y-2">
                  <h3 className="text-white font-black text-3xl tracking-tight uppercase leading-none">{meta.title}</h3>
                  <div className="flex items-center gap-2 text-[#F59F01]">
                     {isCleared ? <CheckCircle2 size={12} className="text-[#10b981]" /> : <Star size={12} />}
                     <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isCleared ? 'text-[#10b981]' : ''}`}>
                       {isCleared ? 'Compliance Cleared' : 'Mandatory Gate'}
                     </span>
                  </div>
               </div>

               <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-white/60 text-xs leading-relaxed italic">"{meta.info}"</p>
               </div>

               {isCleared && (
                 <div className="p-6 bg-[#10b981]/5 border border-[#10b981]/20 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black text-[#10b981] uppercase tracking-widest">Verification Record</p>
                       <span className="text-[10px] text-[#10b981]/60 font-medium">
                          {gate.cleared_at ? new Date(gate.cleared_at).toLocaleString() : 'N/A'}
                       </span>
                    </div>
                    <pre className="text-xs text-white/80 leading-relaxed font-sans whitespace-pre-wrap">
                      {gate.notes}
                    </pre>
                 </div>
               )}

               {!isCleared && (
                 <>
                   {meta.subtasks.length > 0 && (
                     <div className="space-y-6">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Granular Sub-Verifications</p>
                        <div className="space-y-4">
                           {meta.subtasks.map(task => (
                             <SubTaskItem 
                               key={task.id} 
                               task={task} 
                               projectId={deal.id}
                               onChange={handleSubtaskChange}
                               onViewTemplate={onViewUBO}
                             />
                           ))}
                        </div>
                     </div>
                   )}

                   {meta.subtasks.length === 0 && (
                     <div className="space-y-6 pt-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Aggregate Verification Summary</p>
                        <div className="space-y-4">
                          <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Enter final summary or aggregate compliance notes..."
                            className="w-full h-32 bg-black/60 border border-white/5 rounded-3xl p-6 text-sm text-white focus:outline-none focus:border-[#F59F01] transition-all placeholder:text-white/10"
                          />
                          
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Additional General Evidence (Optional)</label>
                             <FileUploader 
                               projectId={deal.id}
                               category="COMPLIANCE"
                               isLocal={true}
                               uploadUrl={`deals/projects/${deal.id}/upload-local/`}
                               onSuccess={(id) => setDocId(id)}
                               label="Upload Final Compliance Bundle"
                             />
                          </div>
                        </div>
                     </div>
                   )}
                 </>
               )}

               <div className="flex gap-4 pt-4">
                  {isCleared ? (
                    <button 
                      onClick={() => {
                        if (confirm(`Are you sure you want to RESET the ${meta.title} gate? All verification records and linked documents for this gate will be disconnected.`)) {
                          onReset({ gateId: gate.gate_id });
                          setShowModal(false);
                        }
                      }}
                      className="flex-1 py-4 bg-white/5 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Reset Compliance Gate
                    </button>
                  ) : (
                    <button 
                      onClick={handleClear}
                      disabled={!isAllTasksDone}
                      className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all ${
                        isAllTasksDone 
                          ? 'bg-[#F59F01] text-black shadow-[#F59F01]/20 hover:scale-[1.02]' 
                          : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      {isAllTasksDone ? 'Clear Compliance Gate' : 'Pending Sub-Verifications'}
                    </button>
                  )}
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
