
import React, { useState, useEffect } from 'react';
import { 
  Star, AlertTriangle, Eye, Zap, Users, BarChart4, Compass, 
  ChevronRight, Search, Check, Edit3, CheckCircle2, Clock, X, FileText
} from 'lucide-react';
import Link from 'next/link';
import FileUploader from '@/components/portal/FileUploader';
import UBOFormTemplate from '@/components/compliance/UBOFormTemplate';
import { Printer } from 'lucide-react';

const GATE_METADATA = {
  AML_KYC: {
    title: "AML/KYC Clearance",
    info: "Institutional anti-money laundering protocol requiring identification of ultimate beneficial owners and source of funds.",
    subtasks: [
      { 
        id: 'ubo', 
        label: 'UBO Declaration', 
        help: 'Identify all individual shareholders with >5% equity. Mandatory for PMLA compliance.', 
        isMandatory: true,
        templateName: 'UBO_FORM',
        requiresFile: true
      },
      {
        id: 'pep_check',
        label: 'PEP Screening',
        help: 'Verify if any ultimate beneficial owners or directors are Politically Exposed Persons (PEPs).',
        isMandatory: false
      },
      {
        id: 'source_funds',
        label: 'Source of Funds Verification',
        help: 'Confirm and document the legitimacy of incoming promoter capital and funding sources.',
        isMandatory: false
      }
    ]
  },
  FITTA: {
    title: "FITTA Approval",
    info: "Verification of approval from the Department of Industry (DoI) or Investment Board Nepal (IBN) under the Foreign Investment and Technology Transfer Act.",
    subtasks: [
      {
        id: 'doi_approval',
        label: 'DoI / IBN Foreign Investment Approval',
        help: 'Formal FDI approval certificate from the Department of Industry or Investment Board Nepal.',
        isMandatory: true
      },
      {
        id: 'nrb_record',
        label: 'NRB Inward Remittance Recording',
        help: 'Official record of foreign investment inward remittance from Nepal Rastra Bank.',
        isMandatory: true
      }
    ]
  },
  FINANCIAL_AUDIT: {
    title: "Financial Audit Verification",
    info: "Validation of historical financial statements, tax clearance certificates, and independent audit integrity.",
    subtasks: [
      {
        id: 'three_years_audited',
        label: '3 Years Audited Financial Statements',
        help: 'Signed auditor reports and financial statements for the past three consecutive fiscal years.',
        isMandatory: true
      },
      {
        id: 'tax_clearance',
        label: 'Tax Clearance Certificate',
        help: 'Latest tax clearance certificate from the Inland Revenue Department (IRD).',
        isMandatory: true
      }
    ]
  },
  LEGAL_STRUCTURE: {
    title: "Legal Structure Validity",
    info: "Assessment of incorporation documents, MOA/AOA, and shareholding structure validity.",
    subtasks: [
      {
        id: 'ocr_certificate',
        label: 'Office of Company Registrar (OCR) Check',
        help: 'Valid Certificate of Incorporation and updated Share Register signed by OCR.',
        isMandatory: true
      },
      {
        id: 'moa_aoa',
        label: 'MOA & AOA Validity Check',
        help: 'Verify active Memorandum and Articles of Association including any capital amendments.',
        isMandatory: true
      }
    ]
  },
  SEBON_MAPPING: {
    title: "SEBON Mapping & Compliance",
    info: "Ensuring the deal structure aligns with the Specialized Investment Fund (SIF) Regulations 2019 and SEBON directives.",
    subtasks: [
      {
        id: 'sif_compliance',
        label: 'SIF Regulations 2019 Compliance',
        help: 'Validate deal mapping and structure against SEBON Specialized Investment Fund regulations.',
        isMandatory: true
      },
      {
        id: 'valuation_filing',
        label: 'Valuation Report Submission Ready',
        help: 'Approved independent third-party valuation report ready for filing with SEBON.',
        isMandatory: true
      }
    ]
  }
};

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
  
  const [localScores, setLocalScores] = useState(scoring?.criteria_scores || []);
  
  useEffect(() => {
    if (scoring?.criteria_scores) {
      setLocalScores(scoring.criteria_scores);
    }
  }, [scoring]);
  
  const showResults = !!scoring && (scoring.criteria_scores?.length > 0 || scoring.compliance_gates?.length > 0);
  const isProcessing = isTriggering || deal.analysis_progress?.Scoring === 'processing';

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
    return { label: 'High Risk / Reject', color: 'bg-rose-500', desc: 'Critical structural or team failures.' };
  };

  const rec = getRecommendation(parseFloat(currentTotal));

  if (!showResults) {
    return (
      <div className="py-24 text-center bg-card border border-border-theme border-dashed rounded-[3rem] space-y-8 theme-transition shadow-inner">
        <div className={`w-24 h-24 rounded-[2rem] bg-foreground/5 flex items-center justify-center mx-auto border border-border-theme shadow-inner ${isProcessing ? 'text-[#F59F01] animate-pulse' : 'text-text-muted/20'}`}>
          <Star size={48} />
        </div>
        <div className="max-w-md mx-auto px-8 space-y-4">
           <h3 className="text-foreground font-black text-2xl uppercase tracking-tight">
             {isProcessing ? 'Scoring in Progress' : 'Initialize FINLO Scoring'}
           </h3>
           <p className="text-text-muted text-sm leading-relaxed font-medium">
             {isProcessing 
               ? 'Our 5-pillar engine is currently synthesizing financials, legal scans, and operational audits. This typically takes 15-30 seconds.' 
               : 'Start the proprietary scoring engine to evaluate this project across 20 criteria in 5 key pillars.'}
           </p>
           <div className="pt-6">
             <button 
               onClick={onTrigger}
               disabled={isProcessing}
               className="px-10 py-4 bg-[#F59F01] text-ls-primary-fixed rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-2xl shadow-[#F59F01]/20 disabled:opacity-50 active:scale-95"
             >
               {isProcessing ? 'Executing Engine...' : 'Run FINLO Engine'}
             </button>
           </div>
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

    const logoSVG = `
      <div style="display:flex;align-items:center;gap:10px;">
        <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="84" height="14" rx="3" fill="#5B2FD4"/>
          <rect x="8" y="8" width="14" height="84" rx="3" fill="#5B2FD4"/>
          <rect x="26" y="60" width="28" height="28" rx="5" fill="#F59F01"/>
        </svg>
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
  <script>window.addEventListener('afterprint', function() { window.close(); });</script>
  <div class="page">
    <div class="header">
      <div>${logoSVG}<div class="dept">Regulatory Compliance Dept.</div></div>
      <div><div class="doc-title">UBO Declaration</div><div class="doc-version">Form Version: 2024.1.v</div></div>
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
    <div class="sec-header"><div class="sec-title">Beneficial Ownership &amp; Shareholding</div><div class="mandatory">Mandatory: All Shareholders &gt; 5%</div></div>
    <table>
      <thead><tr><th>Full Name of Shareholder / UBO</th><th>Citizenship / Passport #</th><th>Nationality</th><th style="text-align:center;">Ownership %</th></tr></thead>
      <tbody>${Array.from({length: 8}, () => '<tr><td></td><td></td><td></td><td></td></tr>').join('')}</tbody>
    </table>
    <p class="note">* <strong>Important:</strong> Please list all individual shareholders holding more than <strong>5% equity</strong> in the entity.</p>
    <div class="decl">
      <h2>Legal Declaration</h2>
      <p>I, the undersigned, acting in my capacity as an authorized representative of the aforementioned entity, hereby declare that the information provided herein is true, accurate, and complete to the best of my knowledge.</p>
    </div>
    <div class="sig-grid">
      <div><div class="sig-line"></div><div class="sig-label">Authorized Signature</div><div class="sig-sub">Name: __________________________</div></div>
      <div><div class="seal-box"><div class="seal-circle">Company Seal</div></div><div class="sig-label tr">Official Stamp</div></div>
    </div>
    <div class="doc-footer"><div><p>&copy; Finlogic Capital Limited</p></div><p>Confidential Document | Internal Use Only</p></div>
  </div>
</body></html>`);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 600);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 theme-transition">
       {/* UBO Form Template Modal */}
       {showUBOModal && (
         <div id="ubo-printable-container" className="fixed inset-0 z-[10000] bg-background/95 backdrop-blur-2xl flex flex-col items-center p-8 overflow-y-auto theme-transition">
            <div className="max-w-[210mm] w-full flex flex-col md:flex-row justify-between items-center gap-6 sticky top-0 bg-card/80 backdrop-blur-xl p-6 rounded-[2rem] border border-border-theme z-10 shadow-2xl">
               <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setShowUBOModal(false)}
                    className="p-4 bg-foreground/5 border border-border-theme rounded-2xl text-text-muted hover:text-foreground hover:bg-foreground/10 transition-all shadow-lg active:scale-95"
                  >
                     <X size={24} />
                  </button>
                  <div>
                     <h2 className="text-foreground font-black text-xl uppercase tracking-tight">Official UBO Template</h2>
                     <p className="text-text-muted/40 text-[10px] uppercase font-black tracking-widest mt-1">Institutional Compliance Framework</p>
                  </div>
               </div>
               
               <button 
                 onClick={printUBOForm}
                 className="flex items-center gap-3 px-8 py-4 bg-[#F59F01] text-ls-primary-fixed rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#F59F01]/30 hover:scale-[1.05] transition-all active:scale-95"
               >
                  <Printer size={18} />
                  Print Official Form
               </button>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 mt-10">
               <UBOFormTemplate deal={deal} />
            </div>
            
            <div className="mt-12 text-text-muted/20 text-[10px] font-black uppercase tracking-[0.4em] pb-12">
               Finlogic Capital Limited &bull; Operational Integrity
            </div>
         </div>
       )}

       {/* Warning Banner */}
      <div className="bg-[#F59F01]/5 border border-[#F59F01]/20 p-8 rounded-[2rem] flex gap-6 items-center shadow-xl">
         <div className="w-12 h-12 rounded-2xl bg-[#F59F01]/10 flex items-center justify-center text-[#F59F01] shadow-inner">
            <AlertTriangle size={28} className="animate-pulse" />
         </div>
         <p className="text-[#F59F01] text-[10px] font-black leading-relaxed uppercase tracking-[0.15em] flex-1">
           AI PRELIMINARY ANALYSIS — NOT INVESTMENT ADVICE. All scores are AI-generated suggestions. 
           Review, override, and validate each criterion before final IC submission.
         </p>
      </div>

      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 px-2 theme-transition">
         <div className="space-y-6">
            <div>
               <h3 className="text-5xl md:text-6xl font-black text-foreground tracking-tighter uppercase leading-none">FINLO Score</h3>
               <p className="text-text-muted text-lg mt-3 font-medium">Holistic Investment Thesis Evaluation Engine</p>
            </div>
            
            <div className="flex items-center gap-4">
               <div className={`${rec.color} px-6 py-2 rounded-full text-[10px] font-black text-ls-primary-fixed uppercase tracking-widest shadow-2xl shadow-current/20`}>
                 {rec.label}
               </div>
               <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{rec.desc}</p>
            </div>
         </div>

         <div className="flex gap-4">
            <div className="bg-card border border-border-theme px-14 py-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group theme-transition">
               <div className="absolute inset-0 bg-gradient-to-br from-[#F59F01]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-3 relative z-10 opacity-40">Weighted Grade</p>
               <div className="flex items-baseline justify-center gap-2 relative z-10">
                  <span className="text-7xl md:text-8xl font-black text-[#F59F01] tabular-nums tracking-tighter drop-shadow-2xl">{currentTotal}</span>
                  <span className="text-2xl font-black text-text-muted/20">/ 10</span>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
           {pillars.map(p => (
             <ScoringPillar 
               key={p.code} 
               pillar={p} 
               scores={localScores.filter(s => s.pillar === p.code)}
               onOverride={handleOverrideUpdate}
             />
           ))}
        </div>

        <div className="space-y-8 theme-transition">
            <div className="bg-card border border-border-theme rounded-[2.5rem] p-10 shadow-2xl theme-transition">
               <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] mb-10 border-b border-border-theme pb-6 opacity-60">Compliance Gates</h4>
               <div className="space-y-8">
                  {(scoring.compliance_gates || []).map(gate => (
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

            <div className="bg-card border border-border-theme rounded-[2.5rem] p-10 shadow-2xl theme-transition">
               <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] mb-8 border-b border-border-theme pb-6 opacity-60">Final Assessment</h4>
               <div className="space-y-6">
                  <textarea 
                     value={summary}
                     onChange={(e) => setSummary(e.target.value)}
                     placeholder="Enter final investment recommendation summary (min 100 words)..."
                     className="w-full h-56 bg-foreground/[0.03] border border-border-theme rounded-[1.5rem] p-6 text-sm text-foreground/80 placeholder:text-text-muted/20 focus:outline-none focus:border-[#F59F01]/50 transition-all font-serif leading-relaxed shadow-inner"
                  />
                  <div className="flex items-center justify-between px-2">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${wordCount >= 100 ? 'text-emerald-500' : 'text-text-muted/40'}`}>
                        {wordCount} / 100 words
                     </span>
                     {wordCount >= 100 && <CheckCircle2 size={16} className="text-emerald-500" />}
                  </div>
               </div>

               <button 
                 onClick={() => onApprove({ assessment_summary: summary })}
                 disabled={isApproving || wordCount < 100 || isApproved}
                 className="w-full mt-10 py-5 bg-[#F59F01] text-ls-primary-fixed rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-2xl shadow-[#F59F01]/30 disabled:opacity-30 disabled:hover:scale-100 active:scale-95"
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
    <div className={`bg-card border border-border-theme rounded-[2.5rem] overflow-hidden transition-all theme-transition shadow-xl hover:shadow-2xl ${isOpen ? 'ring-2 ring-[#F59F01]/30' : ''}`}>
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full p-8 flex items-center justify-between hover:bg-foreground/[0.02] transition-all"
       >
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 rounded-2xl bg-foreground/5 border border-border-theme flex items-center justify-center text-[#F59F01] shadow-inner">
                {pillar.icon}
             </div>
             <div className="text-left space-y-1">
                <h4 className="text-foreground font-black text-xl tracking-tight uppercase">{pillar.name}</h4>
                <p className="text-text-muted/40 text-[10px] font-black uppercase tracking-[0.2em]">Pillar Weight: {pillar.weight}</p>
             </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="text-right">
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1 opacity-40">Avg Score</p>
                <span className="text-3xl font-black text-foreground tabular-nums tracking-tighter">{avgScore.toFixed(1)}</span>
             </div>
             <ChevronRight size={24} className={`text-text-muted/40 transition-transform duration-500 ${isOpen ? 'rotate-90 text-[#F59F01]' : ''}`} />
          </div>
       </button>

       {isOpen && (
         <div className="p-8 pt-2 space-y-6 border-t border-border-theme/50 animate-in slide-in-from-top-4 duration-500">
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
    if (v >= 8) return 'bg-emerald-500 shadow-emerald-500/30';
    if (v >= 6) return 'bg-[#F59F01] shadow-[#F59F01]/30';
    if (v >= 4) return 'bg-orange-500 shadow-orange-500/30';
    return 'bg-rose-500 shadow-rose-500/30';
  };

  return (
    <div className="bg-foreground/[0.02] border border-border-theme rounded-[2rem] p-8 transition-all hover:bg-foreground/[0.04] shadow-sm">
       <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="flex-1 space-y-3">
             <h5 className="text-foreground font-black text-base uppercase tracking-tight">{score.criterion_id.replace(/_/g, ' ')}</h5>
             <p className="text-text-muted/70 text-sm leading-relaxed italic font-medium">"{score.ai_rationale}"</p>
             <div className="flex items-center gap-6 mt-6">
                <button 
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="text-[10px] font-black text-[#F59F01] uppercase tracking-[0.2em] flex items-center gap-2 hover:underline transition-all"
                >
                  <Search size={14} /> {showEvidence ? 'Hide Evidence' : 'View AI Evidence'}
                </button>
                <span className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] border border-border-theme px-3 py-1 rounded-full bg-background/50">
                  Confidence: {(score.ai_confidence * 100).toFixed(0)}%
                </span>
             </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
             {isEditing ? (
                <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border border-[#F59F01]/50 shadow-2xl">
                   <input 
                     type="number" 
                     min="1" 
                     max="10" 
                     value={val}
                     onChange={(e) => setVal(parseInt(e.target.value))}
                     className="w-16 bg-foreground/5 border-none rounded-xl p-3 text-foreground font-black text-xl text-center focus:ring-0"
                   />
                   <button 
                     onClick={() => {
                       onOverride({ scoreId: score.id, gp_score: val });
                       setIsEditing(false);
                     }}
                     className="p-3 bg-[#F59F01] text-ls-primary-fixed rounded-xl hover:scale-110 transition-all shadow-lg active:scale-95"
                   >
                     <Check size={20} strokeWidth={3} />
                   </button>
                </div>
             ) : (
                <div className="flex items-center gap-4">
                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-ls-primary-fixed font-black text-2xl shadow-2xl transition-all hover:scale-105 ${getScoreColor(val)}`}>
                     {val}
                   </div>
                   <button 
                     onClick={() => setIsEditing(true)}
                     className="p-3 text-text-muted/20 hover:text-[#F59F01] hover:bg-[#F59F01]/5 rounded-xl transition-all border border-transparent hover:border-[#F59F01]/20"
                   >
                     <Edit3 size={20} />
                   </button>
                </div>
             )}
          </div>
       </div>

       {showEvidence && (
         <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {(score.evidence_quotes || []).map((q, i) => (
              <div key={i} className="p-5 bg-card border-l-4 border-[#F59F01] rounded-r-2xl text-xs text-text-muted font-mono leading-relaxed shadow-sm italic">
                "{q}"
              </div>
            ))}
         </div>
       )}
    </div>
  );
}

function SubTaskItem({ task, projectId, onChange, onViewTemplate }) {
  const [status, setStatus] = useState('PENDING');
  const [notes, setNotes] = useState('');
  const [docId, setDocId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const hasInput = !!docId || notes.trim().length > 0;
    const isDone = task.isMandatory 
      ? (status === 'FULFILLED' && (task.requiresFile ? !!docId : hasInput))
      : (status === 'FULFILLED' || status === 'NOT_NEEDED');
    
    onChange(task.id, { status, notes, docId, isDone });
  }, [status, notes, docId, task.isMandatory, task.requiresFile]);

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
    <div className={`border-[2px] rounded-[2.5rem] p-8 transition-all duration-500 theme-transition ${
      status === 'FULFILLED' ? 'bg-emerald-500/5 border-emerald-500/30 shadow-xl' : 
      status === 'NOT_NEEDED' ? 'bg-foreground/5 border-border-theme opacity-40 grayscale shadow-inner' : 'bg-foreground/[0.02] border-border-theme hover:border-foreground/10 shadow-lg'
    }`}>
       <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3">
             <div className="flex items-center gap-3">
                <p className={`text-base font-black uppercase tracking-tight ${status === 'FULFILLED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                  {task.label}
                </p>
                {task.isMandatory && (
                  <span className="px-3 py-1 bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-rose-500/20">Mandatory</span>
                )}
             </div>
             <p className="text-[11px] text-text-muted leading-relaxed max-w-md font-medium">{task.help}</p>
             
             {task.templateName && (
               <button 
                 onClick={onViewTemplate}
                 className="flex items-center gap-2 px-5 py-2.5 bg-[#F59F01]/10 border border-[#F59F01]/30 rounded-xl text-[#F59F01] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#F59F01] hover:text-ls-primary-fixed transition-all shadow-xl shadow-[#F59F01]/10 mt-4 active:scale-95"
               >
                  <FileText size={16} />
                  View & Print Template
               </button>
             )}
          </div>
          
          <div className="flex gap-3 shrink-0 self-end sm:self-start">
             {!task.isMandatory && (
               <button 
                 onClick={() => toggleStatus('NOT_NEEDED')}
                 className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                   status === 'NOT_NEEDED' ? 'bg-foreground text-background' : 'bg-foreground/5 text-text-muted/40 hover:text-foreground'
                 }`}
               >
                 Exempt
               </button>
             )}
             <button 
               onClick={() => toggleStatus('FULFILLED')}
               className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-2xl ${
                 status === 'FULFILLED' ? 'bg-emerald-500 text-white' : 'bg-foreground/5 text-text-muted/20 hover:text-emerald-500 hover:bg-emerald-500/10'
               }`}
             >
                <Check size={24} strokeWidth={4} />
             </button>
          </div>
       </div>

       {showForm && (
         <div className="mt-8 pt-8 border-t border-border-theme space-y-6 animate-in fade-in slide-in-from-top-6 duration-700">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-1">
                  Verification Audit Log
               </label>
               <textarea 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder={status === 'FULFILLED' ? "Reference numbers, approval dates, key person names..." : "Explain precisely why this requirement is being waived..."}
                 className="w-full bg-background border border-border-theme rounded-2xl p-6 text-sm text-foreground focus:outline-none focus:border-[#F59F01] transition-all min-h-[120px] shadow-inner font-medium"
               />
            </div>

            {status === 'FULFILLED' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                   <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Evidence Bundle</label>
                    {task.isMandatory && task.requiresFile && !docId && <span className="text-[9px] text-rose-500 font-black animate-pulse uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full">* Evidence Required</span>}
                    {task.isMandatory && !task.requiresFile && !docId && !notes.trim() && <span className="text-[9px] text-[#F59F01] font-black uppercase tracking-widest bg-[#F59F01]/10 px-3 py-1 rounded-full">* Comment or File Required</span>}
                </div>
                <div className="bg-background p-6 rounded-[2rem] border border-border-theme shadow-inner">
                  <FileUploader 
                    projectId={projectId}
                    category="COMPLIANCE"
                    isLocal={true}
                    uploadUrl={`deals/projects/${projectId}/upload-local/`}
                    onSuccess={(id) => setDocId(id)}
                    label="Upload Executed Document"
                    description="Upload the scanned declaration with necessary ID attachments (PDF/JPG)"
                  />
                </div>
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
    const subtaskSummary = meta.subtasks.map(t => {
      const s = subtaskStates[t.id];
      return `[${t.label}]: ${s.status === 'FULFILLED' ? 'VERIFIED' : 'EXEMPT'} - ${s.notes}`;
    }).join('\n\n');

    const consolidatedNotes = `${notes}\n\n--- COMPLIANCE SUB-TASK AUDIT ---\n${subtaskSummary}`;
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
    <div className="flex items-center justify-between group py-2">
       <div className="space-y-2">
          <p className="text-foreground font-black text-sm uppercase tracking-tight">{meta.title}</p>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isCleared ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-text-muted/20'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${isCleared ? 'text-emerald-500' : 'text-text-muted/40'}`}>
              {gate.status}
            </span>
          </div>
       </div>
       <button 
         onClick={() => setShowModal(true)}
         className={`px-6 py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
           isCleared 
             ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white' 
             : 'bg-foreground/5 border-border-theme text-foreground opacity-40 group-hover:opacity-100 hover:bg-[#F59F01] hover:text-ls-primary-fixed hover:border-[#F59F01]'
         }`}
       >
         {isCleared ? 'View Audit' : 'Clear Gate'}
       </button>

       {showModal && (
         <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 md:p-12 bg-background/90 backdrop-blur-3xl overflow-y-auto theme-transition">
            <div className="bg-card border border-border-theme p-12 rounded-[4rem] max-w-3xl w-full max-h-[85vh] overflow-y-auto pr-6 shadow-2xl space-y-10 relative animate-in fade-in zoom-in duration-500 mb-20 theme-transition scrollbar-thin">
               <button onClick={() => setShowModal(false)} className="absolute top-12 right-12 text-text-muted/20 hover:text-foreground transition-all p-3 hover:bg-foreground/5 rounded-2xl border border-border-theme/50">
                  <X size={28} />
               </button>

               <div className="space-y-4">
                  <div className="flex items-center gap-4 text-[#F59F01]">
                     {isCleared ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Star size={20} />}
                     <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${isCleared ? 'text-emerald-500' : ''}`}>
                       {isCleared ? 'Verification Successful' : 'Compliance Requirement'}
                     </span>
                  </div>
                  <h3 className="text-foreground font-black text-4xl md:text-5xl tracking-tight uppercase leading-none">{meta.title}</h3>
               </div>

               <div className="bg-foreground/[0.02] p-8 rounded-[2rem] border border-border-theme shadow-inner">
                  <p className="text-text-muted font-medium text-sm leading-relaxed italic">"{meta.info}"</p>
               </div>

               {isCleared && (
                 <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] space-y-6 shadow-xl">
                    <div className="flex items-center justify-between border-b border-emerald-500/10 pb-4">
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Institutional Verification Log</p>
                       <span className="text-[10px] text-emerald-600/40 font-black uppercase tracking-widest">
                          {gate.cleared_at ? new Date(gate.cleared_at).toLocaleString() : 'N/A'}
                       </span>
                    </div>
                    <pre className="text-sm text-foreground/80 leading-relaxed font-sans whitespace-pre-wrap font-medium">
                      {gate.notes}
                    </pre>
                 </div>
               )}

               {!isCleared && (
                 <div className="space-y-10">
                   {meta.subtasks.length > 0 && (
                     <div className="space-y-8">
                        <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.4em] text-center">Structural Due Diligence Checklist</p>
                        <div className="space-y-6">
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
                     <div className="space-y-8 pt-10 border-t border-border-theme">
                        <p className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.4em] text-center">Aggregate Verification Bundle</p>
                        <div className="space-y-6">
                           <textarea 
                             value={notes}
                             onChange={(e) => setNotes(e.target.value)}
                             placeholder="Enter comprehensive compliance findings or aggregate notes here..."
                             className="w-full h-48 bg-foreground/[0.02] border border-border-theme rounded-[2.5rem] p-8 text-sm text-foreground focus:outline-none focus:border-[#F59F01] transition-all placeholder:text-text-muted/30 shadow-inner font-medium"
                           />
                           
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] ml-1">Consolidated Evidence (Optional)</label>
                              <div className="bg-background p-6 rounded-[2.5rem] border border-border-theme shadow-inner">
                                <FileUploader 
                                  projectId={deal.id}
                                  category="COMPLIANCE"
                                  isLocal={true}
                                  uploadUrl={`deals/projects/${deal.id}/upload-local/`}
                                  onSuccess={(id) => setDocId(id)}
                                  label="Upload Compliance Package"
                                />
                              </div>
                           </div>
                        </div>
                     </div>
                   )}
                 </div>
               )}

               <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  {isCleared ? (
                    <button 
                      onClick={() => {
                        if (confirm(`CRITICAL: Are you sure you want to RESET the ${meta.title} gate? This will disconnect all verified records and evidence.`)) {
                          onReset({ gateId: gate.gate_id });
                          setShowModal(false);
                        }
                      }}
                      className="flex-1 py-5 bg-rose-500/5 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95"
                    >
                      Reset Compliance Status
                    </button>
                  ) : (
                    <button 
                      onClick={handleClear}
                      disabled={!isAllTasksDone}
                      className={`flex-1 py-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_32px_64px_-16px_rgba(245,159,1,0.2)] transition-all active:scale-95 ${
                        isAllTasksDone 
                          ? 'bg-[#F59F01] text-ls-primary-fixed hover:scale-[1.02]' 
                          : 'bg-foreground/5 text-text-muted/20 cursor-not-allowed border border-border-theme'
                      }`}
                    >
                      {isAllTasksDone ? 'Finalize & Clear Gate' : 'Awaiting Documentation'}
                    </button>
                  )}
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
