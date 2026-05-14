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

  const getSummary = (text) => {
    if (!text) return "";
    // Remove disclaimer if exists
    const cleanText = text.replace(/\*This AI-generated educational analysis is provided by Finlogic Capital. It does not constitute investment advice, a solicitation to invest, or any guarantee of future funding.\*/g, '').trim();
    // Get first few sentences
    const sentences = cleanText.split(/[.!?]/).filter(s => s.trim().length > 10).slice(0, 3);
    return sentences.join('. ') + '.';
  };

  const handleShare = async () => {
    setShowShareModal(true);
  };

  const downloadShareCard = async () => {
    if (!cardRef.current) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#100226', // ls-primary
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `finlogic-validation-${id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Share card downloaded!");
    } catch (err) {
      toast.error("Failed to generate share card.");
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
            <Link 
              href="/validate"
              className="flex items-center space-x-2 text-text-muted hover:text-ls-compliment transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-bold uppercase tracking-widest text-xs">Back to Validator</span>
            </Link>

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
                <div className="prose dark:prose-invert prose-ls max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-text-muted prose-p:leading-relaxed prose-li:text-text-muted prose-strong:text-ls-compliment bg-card border border-border-theme rounded-[3rem] p-12 lg:p-20 shadow-xl print:shadow-none print:border-none print:p-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {report.report}
                  </ReactMarkdown>
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
                  {/* Share Card Preview */}
                  <div 
                    ref={cardRef}
                    className="aspect-[1.91/1] w-full bg-ls-primary rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden text-ls-white"
                  >
                    {/* Branded Background */}
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                      <Zap className="w-40 h-40 text-ls-compliment" />
                    </div>
                    
                    <div className="relative z-10 flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                           <Sparkles className="w-4 h-4 text-ls-compliment" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Finlogic AI</span>
                        </div>
                        <h4 className="text-2xl font-black">Idea Validated</h4>
                      </div>
                      <div className={`px-4 py-2 rounded-lg border text-xs font-black tracking-widest ${getVerdictStyles(report.verdict)} bg-transparent`}>
                        {report.verdict}
                      </div>
                    </div>

                    <div className="relative z-10">
                      <p className="text-sm italic line-clamp-3 opacity-70 mb-4 leading-relaxed">
                        "{getSummary(report.report)}"
                      </p>
                      <div className="flex items-center justify-between border-t border-white/10 pt-4">
                        <div className="text-[8px] uppercase tracking-widest opacity-40">
                          Validate your own idea at finlogiccapital.com
                        </div>
                        <div className="text-[10px] font-bold text-ls-compliment">
                          FINLOGIC CAPITAL
                        </div>
                      </div>
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
