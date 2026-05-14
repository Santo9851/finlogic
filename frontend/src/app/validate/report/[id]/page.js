'use client';

import { useState, useEffect, use, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Download, 
  Share2, 
  RefreshCcw, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Sparkles,
  Zap,
  Info,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AuthGuard from '@/components/AuthGuard';
import { validatorService } from '@/services/validator';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import FinlogicLogo from '@/components/FinlogicLogo';

export default function ValidationReportPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const cardRef = useRef(null);

  const [session, setSession] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState(null);
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSession = async () => {
    try {
      const data = await validatorService.getSession(id);
      setSession(data);
      if (data.status === 'completed') {
        setReport({ report: data.polished_report, verdict: data.verdict });
      } else if (data.status === 'processing' || data.status === 'submitted') {
        setPolling(true);
      }
    } catch (err) {
      setError("Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [id]);

  useEffect(() => {
    let interval;
    if (polling) {
      interval = setInterval(async () => {
        try {
          const statusData = await validatorService.pollStatus(id);
          if (statusData.status === 'completed') {
            setPolling(false);
            const fullData = await validatorService.getPolishedReport(id);
            setReport(fullData);
            setSession(prev => ({ ...prev, status: 'completed', verdict: fullData.verdict }));
          } else if (statusData.status === 'failed') {
            setPolling(false);
            setSession(prev => ({ ...prev, status: 'failed', progress_text: statusData.progress_text }));
          } else {
            setSession(prev => ({ ...prev, progress_text: statusData.progress_text }));
          }
        } catch (err) {
          console.error("Polling failed:", err);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [polling, id]);

  const getVerdictStyles = (verdict) => {
    switch (verdict) {
      case 'VIABLE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'DEAD ON ARRIVAL':
        return 'bg-ls-secondary/10 text-ls-secondary border-ls-secondary/20';
      default:
        return 'bg-ls-compliment/10 text-ls-compliment border-ls-compliment/20';
    }
  };

  const getSummary = (text, limit = 550) => {
    if (!text) return "";
    
    // Specifically target Section 1: The Architect's Verdict
    const verdictMatch = text.match(/1\.\s+\*\*The Architect’s Verdict\*\*([\s\S]*?)(?=2\.\s+\*\*|$)/i);
    let cleanText = verdictMatch ? verdictMatch[1] : text;

    // Remove markdown characters, redundant headers, and the leading '1.'
    cleanText = cleanText
      .replace(/\*This AI-generated educational analysis is provided by Finlogic Capital\. It does not constitute investment advice, a solicitation to invest, or any guarantee of future funding\.\*/g, '')
      .replace(/^[1.\s]*/, '') // Strip leading '1.' or numbering
      .replace(/The Architect’s Verdict[:\s]*/gi, '')
      .replace(/Verdict[:\s]*(VIABLE|PIVOT REQUIRED|DEAD ON ARRIVAL)[:\s]*/gi, '')
      .replace(/-{3,}/g, '') // Strip markdown horizontal rules (---)
      .replace(/[#*`_]/g, '') // Strip basic markdown
      .replace(/\[\[.*?\]\]/g, '') // Strip internal placeholders
      .trim();
    
    if (cleanText.length <= limit) return cleanText;
    const lastSpace = cleanText.lastIndexOf(' ', limit);
    return cleanText.substring(0, lastSpace > 0 ? lastSpace : limit) + "...";
  };

  const handleShare = async () => {
    setShowShareModal(true);
  };

  const downloadShareCard = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);
    try {
      // Standardize the capture environment
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#100226',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 15000, // Increase timeout for images
        onclone: (clonedDoc) => {
          // NUCLEAR OPTION: Remove ALL existing style/link tags to stop the crash
          try {
            const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styles.forEach(s => s.remove());

            // Inject premium PORTRAIT styles
            const safeStyles = clonedDoc.createElement('style');
            safeStyles.innerHTML = `
              * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-print-color-adjust: exact; }
              [data-share-card] { 
                display: flex !important; 
                flex-direction: column !important; 
                background-color: #100226 !important;
                color: #FDF6FF !important;
                padding: 4rem !important;
                position: relative !important;
                width: 1200px !important;
                height: 1500px !important;
              }
              .card-header { display: flex; flex-direction: column; gap: 2.5rem; margin-bottom: 3.5rem; }
              .brand-row { display: flex; justify-content: space-between; align-items: center; }
              .verdict-seal { 
                padding: 1.25rem 2.5rem; 
                border: 3px solid #F59F01; 
                border-radius: 1.25rem; 
                background: rgba(245, 159, 1, 0.08);
                text-align: center;
              }
              .verdict-label { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4em; color: #F59F01; margin-bottom: 0.5rem; }
              .verdict-value { font-size: 28px; font-weight: 900; letter-spacing: -0.02em; }
              
              .card-body { flex: 1; display: flex; flex-direction: column; gap: 2.5rem; }
              .section-marker { display: flex; items-center; gap: 1rem; }
              .marker-line { h-px: 1px; flex: 1; background: rgba(245, 159, 1, 0.3); }
              .report-title { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.6em; color: #F59F01; }
              
              .architect-content { 
                font-size: 34px; 
                line-height: 1.6; 
                font-style: italic; 
                color: rgba(255, 255, 255, 0.95);
                border-left: 8px solid #F59F01;
                padding-left: 3.5rem;
                margin: 0;
                display: -webkit-box;
                -webkit-line-clamp: 12;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
              
              .card-footer { 
                margin-top: 5rem; 
                padding-top: 3rem; 
                border-top: 1px solid rgba(255, 255, 255, 0.1);
              }
              .disclaimer-text { font-size: 11px; line-height: 1.7; text-transform: uppercase; letter-spacing: 0.15em; color: #F59F01; opacity: 0.7; font-weight: 600; }
              
              .zap-bg { position: absolute; bottom: -100px; right: -100px; opacity: 0.02; width: 600px; height: 600px; }
            `;
            clonedDoc.head.appendChild(safeStyles);
          } catch (e) {
            console.warn("Style isolation failed:", e);
          }

          const card = clonedDoc.querySelector('[data-share-card]');
          if (card) {
            card.style.transform = 'none';
            card.style.display = 'flex';
            card.style.visibility = 'visible';
            card.style.position = 'relative';
            card.style.width = '1200px';
            card.style.height = '1500px';
          }
        }
      });
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `finlogic-validation-${id}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Share card downloaded!");
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Format error detected. Please use the 'Copy Link' option for the best sharing experience.");
    } finally {
      setIsCapturing(false);
    }
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/validate/share/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Public link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-ls-compliment/20 border-t-ls-compliment animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-foreground theme-transition pb-40 print:bg-white print:text-black print:pb-0">
        {/* Header */}
        <div className="bg-background/80 backdrop-blur-xl border-b border-border-theme sticky top-0 z-50 print:hidden">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link 
                href="/validate"
                className="flex items-center space-x-2 text-text-muted hover:text-ls-compliment transition-colors group"
              >
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="font-bold uppercase tracking-widest text-xs">Back</span>
              </Link>
              <Link 
                href="/validate/history"
                className="flex items-center space-x-2 text-text-muted hover:text-ls-compliment transition-colors group border-l border-border-theme pl-6"
              >
                <Clock className="w-4 h-4" />
                <span className="font-bold uppercase tracking-widest text-xs">View History</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={handleShare}
                className="p-2 rounded-full border border-border-theme hover:bg-card transition-all text-text-muted"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center space-x-2 bg-foreground text-background px-6 py-2 rounded-full font-bold hover:bg-ls-compliment hover:text-ls-primary transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Save as PDF</span>
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-12">
            {polling ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[3rem] bg-card border border-border-theme p-12 lg:p-20 text-center space-y-8"
              >
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-ls-compliment/10 border-t-ls-compliment animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-ls-compliment" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black">Architecting Your Analysis</h2>
                  <p className="text-xl text-text-muted max-w-lg mx-auto">
                    The Sovereign Venture Architect is currently dismantling your submission 
                    to find the core truth. This takes a few minutes.
                  </p>
                </div>
                <div className="bg-background/50 rounded-2xl p-6 border border-border-theme inline-block min-w-[300px]">
                  <div className="text-xs font-bold uppercase tracking-[0.3em] text-ls-compliment mb-2">Current Status</div>
                  <div className="text-lg font-mono flex items-center justify-center space-x-3">
                    <RefreshCcw className="w-4 h-4 animate-spin text-ls-compliment" />
                    <span>{session?.progress_text || "Initializing..."}</span>
                  </div>
                </div>
              </motion.div>
            ) : session?.status === 'failed' ? (
              <div className="rounded-3xl bg-ls-secondary/5 border border-ls-secondary/20 p-12 text-center space-y-6">
                <AlertTriangle className="w-16 h-16 text-ls-secondary mx-auto" />
                <h2 className="text-3xl font-black text-ls-secondary">Analysis Interrupted</h2>
                <p className="text-text-muted max-w-md mx-auto">{session.progress_text}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 rounded-full bg-ls-secondary text-white font-bold"
                >
                  Retry Analysis
                </button>
              </div>
            ) : report ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                {/* Verdict Hero */}
                <div className="rounded-[3rem] bg-card border border-border-theme p-12 lg:p-16 relative overflow-hidden print:border-none print:shadow-none">
                  <div className="absolute -right-20 -top-20 opacity-5 print:hidden">
                    <Zap className="w-80 h-80 text-ls-compliment" />
                  </div>
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-2xl bg-ls-compliment/10 flex items-center justify-center text-ls-compliment print:hidden">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h1 className="text-3xl lg:text-4xl font-black">Strategic Validation Report</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4">
                        <div className="text-xs font-bold uppercase tracking-[0.4em] text-text-muted">The Architect's Verdict</div>
                        <div className={`inline-flex items-center space-x-3 px-8 py-4 rounded-2xl border text-3xl font-black tracking-tighter ${getVerdictStyles(report.verdict)}`}>
                          {report.verdict === 'VIABLE' ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                          <span>{report.verdict}</span>
                        </div>
                      </div>
                      <div className="p-6 bg-background/50 rounded-2xl border border-border-theme italic text-text-muted leading-relaxed relative print:bg-white print:text-black">
                        <span className="absolute -top-3 left-6 px-2 bg-card text-[10px] font-bold uppercase tracking-[0.2em] text-ls-compliment print:hidden">Summary</span>
                        {getSummary(report.report)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analysis Content */}
                <div className="prose dark:prose-invert article-body max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-text-muted prose-p:leading-relaxed prose-li:text-text-muted prose-strong:text-ls-compliment bg-card border border-border-theme rounded-[3rem] p-12 lg:p-20 shadow-xl print:shadow-none print:border-none print:p-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {report.report?.replace(/\*This AI-generated educational analysis is provided by Finlogic Capital\. It does not constitute investment advice, a solicitation to invest, or any guarantee of future funding\.\*/g, '').trim()}
                  </ReactMarkdown>
                </div>

                {/* Print Only Footer - Branded Disclaimer */}
                <div className="hidden print:block mt-32 pt-12 border-t border-border-theme/30 text-center space-y-4 page-break-before-always">
                  <div className="flex items-center justify-center space-x-3 mb-6">
                    <FinlogicLogo size={32} darkBg={true} />
                    <span className="text-lg font-black tracking-[0.2em] text-ls-compliment">FINLOGIC CAPITAL</span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed max-w-4xl mx-auto uppercase tracking-[0.15em] opacity-60">
                    This strategic validation report is a confidential AI-generated educational analysis. 
                    It is intended for informational purposes only and does not constitute financial, legal, 
                    or investment advice by Finlogic Capital Limited or its affiliates.
                  </p>
                  <div className="pt-6 flex items-center justify-center space-x-10 text-[10px] text-text-muted/40 uppercase tracking-widest">
                    <span>Generated: {new Date().toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Verified via Sovereign Venture Architect</span>
                    <span>•</span>
                    <span>© {new Date().getFullYear()} Finlogic Capital</span>
                  </div>
                </div>

                {/* Risk Panel Teaser */}
                <div className="bg-ls-secondary/5 border border-ls-secondary/20 rounded-[2rem] p-8 lg:p-12 space-y-6 print:hidden">
                  <div className="flex items-center space-x-3 text-ls-secondary">
                    <ShieldAlert className="w-6 h-6" />
                    <h3 className="text-xl font-bold">Constructive Risk Assessment</h3>
                  </div>
                  <p className="text-text-muted">
                    Your analysis identifies several key structural and operational risks. 
                    Refer to the <strong>Strategic Validation (SWOT)</strong> section above for a detailed breakdown 
                    of threats that require your immediate leadership attention.
                  </p>
                </div>

                {/* Footer Navigation */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 print:hidden">
                  <Link 
                    href="/validate"
                    className="flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-ls-compliment text-ls-primary font-bold hover:scale-105 transition-all"
                  >
                    <span>Analyze Another Idea</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link 
                    href="/validate/history"
                    className="flex items-center justify-center space-x-2 px-8 py-4 rounded-full border border-border-theme font-bold hover:bg-card transition-all"
                  >
                    <Clock className="w-4 h-4" />
                    <span>View Validation History</span>
                  </Link>
                </div>

                {/* Permanent Disclaimer */}
                <div className="p-8 rounded-3xl bg-background border border-border-theme text-center text-xs text-text-muted leading-relaxed print:text-black">
                  <div className="font-bold uppercase tracking-widest mb-2">Notice</div>
                  This is an AI-generated educational analysis by Finlogic Capital. It does not constitute investment advice, a solicitation to invest, or any guarantee of future funding.
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-20 text-text-muted">
                Report not found or still being initialized.
              </div>
            )}
          </div>
        </div>

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowShareModal(false)}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-card border border-border-theme w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-border-theme flex items-center justify-between">
                  <h3 className="text-xl font-bold">Share Analysis</h3>
                  <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-background rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  {/* Institutional Portrait Brief Preview */}
                  <div 
                    ref={cardRef}
                    data-share-card
                    style={{ backgroundColor: '#100226', color: '#FDF6FF', borderColor: 'rgba(255,255,255,0.1)' }}
                    className="aspect-[1/1.25] w-full max-w-[500px] mx-auto rounded-[3rem] p-12 flex flex-col justify-between relative overflow-hidden border shadow-2xl"
                  >
                    {/* Branded Background Watermark */}
                    <div className="absolute -right-20 -bottom-20 opacity-[0.02] zap-bg">
                      <Zap size={600} style={{ color: '#F59F01' }} />
                    </div>
                    
                    {/* Header: Identity Row */}
                    <div className="relative z-10 space-y-10 card-header">
                      <div className="flex items-center justify-between brand-row">
                         <FinlogicLogo size={56} darkBg={true} variant="full" />
                         <div 
                           className="verdict-seal"
                           style={{ borderColor: report.verdict === 'VIABLE' ? '#16c784' : '#F59F01' }}
                         >
                            <div className="verdict-label">Verdict</div>
                            <div className="verdict-value" style={{ color: report.verdict === 'VIABLE' ? '#16c784' : '#F59F01' }}>
                               {report.verdict}
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4 section-marker">
                         <div className="h-px flex-1 bg-ls-compliment/30 marker-line" />
                         <span className="text-[10px] font-black uppercase tracking-[0.5em] text-ls-compliment report-title">Sovereign Venture Architect</span>
                         <div className="h-px flex-1 bg-ls-compliment/30 marker-line" />
                      </div>
                    </div>

                    {/* Body: Pure Strategic Verdict */}
                    <div className="relative z-10 flex-1 flex flex-col justify-center card-body">
                      <p className="architect-content">
                        {getSummary(report.report, 500)}
                      </p>
                    </div>

                    {/* Footer: Branded Disclaimer */}
                    <div className="relative z-10 card-footer">
                      <p className="disclaimer-text" style={{ color: '#F59F01' }}>
                        THIS IS AN AI-GENERATED STRATEGIC ANALYSIS BY FINLOGIC CAPITAL. IT DOES NOT CONSTITUTE FINANCIAL OR INVESTMENT ADVICE. 
                        CONFIDENTIAL EDUCATIONAL DOCUMENT • VERIFIED VIA SOVEREIGN VENTURE ARCHITECT
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={downloadShareCard}
                      disabled={isCapturing}
                      className="flex items-center justify-center space-x-2 bg-ls-compliment text-ls-primary px-6 py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isCapturing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>Download PNG</span>
                    </button>
                    <button 
                      onClick={copyPublicLink}
                      className="flex items-center justify-center space-x-2 border border-border-theme px-6 py-4 rounded-xl font-bold hover:bg-background transition-all"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? "Copied!" : "Copy Link"}</span>
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-center text-text-muted">
                    Public links only show the verdict card, not your full strategic analysis.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
