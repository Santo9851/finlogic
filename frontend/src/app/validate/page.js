'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Target, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  History
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import AuthGuard from '@/components/AuthGuard';
import { validatorService } from '@/services/validator';
import { useAuth } from '@/lib/AuthContext';

const STEPS = [
  { id: 1, name_en: 'Unconventional Vision', name_ne: 'अपरम्परागत दृष्टिकोण', icon: Zap },
  { id: 2, name_en: 'Wisdom-Backed Growth', name_ne: 'ज्ञानमा आधारित वृद्धि', icon: Target },
  { id: 3, name_en: 'Leadership Activation', name_ne: 'नेतृत्व सक्रियता', icon: ShieldCheck },
  { id: 4, name_en: 'Deep Insight', name_ne: 'गहिरो अन्तर्दृष्टि', icon: BookOpen },
  { id: 5, name_en: 'Harmonious Partnerships', name_ne: 'सामञ्जस्यपूर्ण साझेदारी', icon: Users },
];

export default function IdeaValidatorPage() {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === "dark";

  const [lang, setLang] = useState('en'); // 'en' or 'ne'
  const [quota, setQuota] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const autoSaveTimeout = useRef(null);

  useEffect(() => {
    setMounted(true);
    if (authLoading) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        const [quotaData, questionsData, sessionsRes] = await Promise.all([
          validatorService.getQuota(),
          validatorService.getQuestions(),
          validatorService.listSessions(),
        ]);

        setQuota(quotaData);
        setQuestions(questionsData);

        // Resume last draft session if exists (handling potential pagination)
        const sessions = sessionsRes.results || sessionsRes;
        const draftSession = Array.isArray(sessions) ? sessions.find(s => s.status === 'draft') : null;
        if (draftSession) {
          const fullSession = await validatorService.getSession(draftSession.id);
          setSession(fullSession);
          setCurrentStep(fullSession.current_step || 1);
          
          // Map session answers to local state
          const mappedAnswers = {};
          fullSession.answers?.forEach(ans => {
            mappedAnswers[ans.question_number] = {
              selected_option: ans.selected_option,
              other_text: ans.other_text,
              free_text_response: ans.free_text_response
            };
          });
          setAnswers(mappedAnswers);
        }
      } catch (err) {
        console.error("Initialization failed:", err);
        setError("Failed to load initial data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, authLoading]);

  const startNewValidation = async () => {
    if (quota?.remaining_validations <= 0) return;
    
    setLoading(true);
    try {
      const newSession = await validatorService.createSession();
      setSession(newSession);
      setCurrentStep(1);
      setAnswers({});
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not start a new analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (qNum, field, value) => {
    const updatedAnswers = {
      ...answers,
      [qNum]: {
        ...(answers[qNum] || {}),
        [field]: value
      }
    };
    setAnswers(updatedAnswers);

    if (session) {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
      
      autoSaveTimeout.current = setTimeout(async () => {
        const stepQuestions = questions.filter(q => q.step === currentStep);
        const stepAnswers = stepQuestions.map(q => ({
          question_number: q.id,
          ...updatedAnswers[q.id]
        }));

        try {
          setSaving(true);
          await validatorService.saveStep(session.id, currentStep, stepAnswers);
        } catch (err) {
          console.error("Auto-save failed:", err);
        } finally {
          setSaving(false);
        }
      }, 1000); // 1s debounce to save bandwidth and prevent race conditions
    }
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!session) return;

    // Validation: ensure all questions are answered
    const unanswered = questions.filter(q => !answers[q.id]?.selected_option);
    if (unanswered.length > 0) {
      setError(`Validation Incomplete: ${unanswered.length} questions require your input before analysis can proceed.`);
      // Move to the step of the first unanswered question
      const firstUnanswered = unanswered[0];
      setCurrentStep(firstUnanswered.step);
      return;
    }

    setSubmitting(true);
    try {
      await validatorService.submitSession(session.id);
      setIsCompleted(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-ls-compliment/20 border-t-ls-compliment animate-spin"></div>
      </div>
    );
  }

  if (!session && !isCompleted) {
    return (
      <div className="bg-background text-foreground min-h-screen theme-transition selection:bg-ls-compliment/30 font-sans">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 bg-ls-primary text-ls-white overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-30 grayscale mix-blend-luminosity">
            <img src="/images/redesign/leadership.png" className="w-full h-full object-cover" alt="Validator Hero" />
            <div className="absolute inset-0 bg-ls-primary/80" />
          </div>
          
          <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-bold uppercase tracking-[0.5em] text-ls-compliment"
            >
              Institutional Innovation Framework
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-serif font-light leading-tight"
            >
              Idea <span className="italic">Validator</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-ls-white/70 max-w-3xl mx-auto font-light leading-relaxed font-serif"
            >
              A ruthless adversarial assessment of vision, leadership, and market resilience—designed for the institutional-grade entrepreneur.
            </motion.p>
          </div>
        </section>

        <div className="container mx-auto px-4 lg:px-8 -mt-16 relative z-20 pb-32">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            {/* Dashboard Card */}
            <div className="bg-card border border-border-theme shadow-2xl overflow-hidden rounded-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Left: Metadata & Status */}
                <div className="lg:col-span-4 bg-ls-primary/5 p-12 border-r border-border-theme flex flex-col justify-between">
                  <div className="space-y-10">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Registry ID</div>
                      <div className="font-mono text-sm opacity-60">FLC-VAL-{user?.id?.substring(0,8).toUpperCase() || 'ANON'}</div>
                    </div>

                    {user ? (
                      <div className="space-y-6">
                        <div className="p-8 border border-ls-compliment/20 bg-ls-compliment/5 rounded-lg">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-ls-compliment mb-2">Available Credits</div>
                          <div className="text-4xl font-serif font-light text-foreground">
                            {quota?.remaining_validations} <span className="text-sm uppercase tracking-widest font-sans font-bold text-text-muted">Analyses</span>
                          </div>
                        </div>
                        <p className="text-xs text-text-muted italic">
                          "Growth without wisdom is merely expansion. Validation is the architecture of success."
                        </p>
                      </div>
                    ) : (
                      <div className="p-8 border border-border-theme bg-background/50 rounded-lg">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Access Status</div>
                        <div className="text-xl font-serif font-light">Restricted Access</div>
                      </div>
                    )}
                  </div>

                  <div className="pt-12">
                    <Sparkles className="w-8 h-8 text-ls-compliment opacity-40" />
                  </div>
                </div>

                {/* Right: Actions & Info */}
                <div className="lg:col-span-8 p-12 lg:p-16 space-y-12">
                  <div className="space-y-6">
                    <h2 className="text-3xl font-serif font-light">Prepare for Sovereignty</h2>
                    <p className="text-text-muted leading-relaxed">
                      Our 25-question framework subjects your business concept to the same rigor used by institutional partners. We don't just validate ideas; we architect them for the frontier market.
                    </p>
                  </div>

                  {user ? (
                    <div className="flex flex-wrap gap-6 pt-4">
                      <button 
                        onClick={startNewValidation}
                        disabled={quota?.remaining_validations <= 0}
                        className={`group flex items-center space-x-6 px-12 py-6 transition-all ${
                          quota?.remaining_validations > 0 
                          ? 'bg-ls-primary text-ls-white hover:bg-ls-supporting' 
                          : 'bg-border-theme text-text-muted cursor-not-allowed'
                        }`}
                      >
                        <span className="text-sm font-bold uppercase tracking-[0.3em]">Begin Assessment</span>
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2 text-ls-compliment" />
                      </button>

                      <Link 
                        href="/validate/history"
                        className="flex items-center space-x-6 px-12 py-6 border border-border-theme hover:bg-ls-primary/5 transition-all"
                      >
                        <span className="text-sm font-bold uppercase tracking-[0.3em]">Vault History</span>
                        <Clock className="w-5 h-5 opacity-40" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-10">
                       <Link 
                        href="/auth/login?redirect=/validate"
                        className="inline-flex items-center space-x-6 bg-ls-primary text-ls-white px-12 py-6 hover:bg-ls-supporting transition-all"
                      >
                        <span className="text-sm font-bold uppercase tracking-[0.3em]">Identify for Access</span>
                        <ArrowRight className="w-5 h-5 text-ls-compliment" />
                      </Link>
                      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border-theme">
                        <div className="space-y-2">
                           <div className="text-[10px] font-bold uppercase tracking-widest text-ls-compliment">Phase I</div>
                           <div className="text-sm font-serif italic">Philosophical Alignment</div>
                        </div>
                        <div className="space-y-2">
                           <div className="text-[10px] font-bold uppercase tracking-widest text-ls-compliment">Phase II</div>
                           <div className="text-sm font-serif italic">Adversarial Risk Audit</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {quota?.remaining_validations <= 0 && user && (
                    <div className="p-6 bg-ls-down/5 border border-ls-down/20 flex items-center space-x-4">
                      <AlertCircle className="w-5 h-5 text-ls-down" />
                      <p className="text-xs text-text-muted">
                        Quota exhausted. Contact <span className="text-foreground font-bold">intelligence@finlogiccapital.com</span> for institutional expansion.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-ls-primary text-ls-white flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl text-center space-y-12"
        >
          <div className="flex justify-center">
             <div className="w-32 h-32 border border-ls-compliment/20 flex items-center justify-center relative">
                <CheckCircle2 className="w-12 h-12 text-ls-compliment" />
                <div className="absolute inset-0 border border-ls-compliment/10 scale-125 animate-pulse" />
             </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-5xl md:text-7xl font-serif font-light">Submission Logged</h2>
            <p className="text-xl text-ls-white/60 font-serif italic max-w-xl mx-auto leading-relaxed">
              "The Sovereign Venture Architect is now scrutinizing your vision. Precision takes time."
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-8 pt-8">
            <Link 
              href={`/validate/report/${session.id}`}
              className="group flex items-center space-x-6 bg-ls-compliment text-ls-primary px-12 py-6 transition-all hover:bg-ls-white"
            >
              <span className="text-xs font-bold uppercase tracking-[0.3em]">Audit Status</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
            </Link>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs font-bold uppercase tracking-[0.3em] border-b border-ls-white/20 pb-2 hover:border-ls-compliment transition-all"
            >
              Return to Vault
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentPillar = STEPS.find(s => s.id === currentStep);
  const stepQuestions = questions.filter(q => q.step === currentStep);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-foreground theme-transition pb-40 font-sans">
        {/* Editorial Header */}
        <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border-theme">
          <div className="container mx-auto px-4 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center space-x-8">
                <div className="w-16 h-16 border border-ls-compliment/20 flex items-center justify-center text-ls-compliment">
                  <currentPillar.icon className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-ls-compliment mb-2">
                    Phase 0{currentStep} — Strategy Audit
                  </div>
                  <h4 className="text-3xl font-serif font-light">
                    {lang === 'en' ? currentPillar.name_en : currentPillar.name_ne}
                  </h4>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="hidden md:flex flex-col items-end mr-4">
                   <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Audit Progress</div>
                   <div className="text-xs font-mono opacity-60">{Math.round((currentStep / 5) * 100)}% Complete</div>
                </div>
                
                <Link 
                  href="/validate/history"
                  className="hidden sm:flex items-center space-x-3 px-6 py-3 border border-border-theme text-[10px] font-bold uppercase tracking-widest hover:bg-card transition-all"
                >
                  <History className="w-4 h-4" />
                  <span>Vault History</span>
                </Link>
                
                <button 
                  onClick={() => setLang(l => l === 'en' ? 'ne' : 'en')}
                  className="px-6 py-3 border border-border-theme text-[10px] font-bold uppercase tracking-widest hover:bg-card transition-all"
                >
                  {lang === 'en' ? 'NEP' : 'ENG'}
                </button>

                {saving && (
                  <div className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-widest text-ls-compliment">
                    <span className="w-1.5 h-1.5 rounded-full bg-ls-compliment animate-pulse" />
                    <span>Syncing Vault</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 h-0.5 w-full bg-border-theme overflow-hidden">
              <motion.div 
                initial={false}
                animate={{ width: `${(currentStep / 5) * 100}%` }}
                className="h-full bg-ls-compliment"
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto space-y-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-24"
              >
                {stepQuestions.map((q, idx) => (
                  <div key={q.id} className="space-y-12">
                    <div className="space-y-8">
                      <div className="inline-block border-l-2 border-ls-compliment pl-6">
                         <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Item Ref: 0{q.id}</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-serif font-light leading-tight">
                        {q.question_ne}<br/>
                        <span className="text-text-muted italic">{q.question_en}</span>
                      </h2>
                    </div>

                    {/* Context Box - Editorial style */}
                    <div className="flex items-start space-x-6 p-10 border border-border-theme bg-ls-primary/5 italic font-serif text-lg leading-relaxed text-text-muted">
                      <Info className="w-6 h-6 text-ls-compliment shrink-0 mt-1" />
                      <div className="space-y-4">
                        <p>"{q.hint_ne}"</p>
                        <p>"{q.hint_en}"</p>
                      </div>
                    </div>

                    <div className="grid gap-px bg-border-theme border border-border-theme overflow-hidden">
                      {q.options.map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() => handleFieldChange(q.id, 'selected_option', opt.val)}
                          className={`flex items-center justify-between p-8 text-left transition-all group ${
                            answers[q.id]?.selected_option === opt.val
                            ? 'bg-ls-primary text-ls-white'
                            : 'bg-card hover:bg-ls-primary/5'
                          }`}
                        >
                          <span className="text-lg font-serif">{opt.ne} / {opt.en}</span>
                          <div className={`w-6 h-6 border transition-all flex items-center justify-center ${
                            answers[q.id]?.selected_option === opt.val
                            ? 'border-ls-compliment bg-ls-compliment'
                            : 'border-border-theme group-hover:border-ls-compliment'
                          }`}>
                             {answers[q.id]?.selected_option === opt.val && <CheckCircle2 className="w-4 h-4 text-ls-primary" />}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Strategic Elaboration</label>
                        <textarea 
                          value={answers[q.id]?.free_text_response || ''}
                          onChange={(e) => handleFieldChange(q.id, 'free_text_response', e.target.value)}
                          placeholder="Provide the institutional rationale for this choice..."
                          rows={4}
                          className="w-full bg-transparent border-b border-border-theme py-6 text-xl font-serif italic outline-none focus:border-ls-compliment transition-all placeholder:opacity-30 resize-none"
                        />
                      </div>
                    </div>

                    {idx < stepQuestions.length - 1 && (
                      <div className="flex items-center justify-center py-12">
                         <div className="w-12 h-px bg-ls-compliment/20" />
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-20 border-t border-border-theme">
              <button 
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`group flex items-center space-x-4 transition-all ${
                  currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-text-muted hover:text-foreground'
                }`}
              >
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-2" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Previous Phase</span>
              </button>

              {currentStep < 5 ? (
                <button 
                  onClick={nextStep}
                  className="group flex items-center space-x-6 bg-ls-primary text-ls-white px-16 py-6 hover:bg-ls-supporting transition-all"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Advance Phase</span>
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-2 text-ls-compliment" />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="group flex items-center space-x-8 bg-ls-compliment text-ls-primary px-16 py-6 hover:bg-ls-primary hover:text-ls-white transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="flex items-center space-x-4">
                      <div className="w-5 h-5 border-2 border-ls-primary/20 border-t-ls-primary rounded-full animate-spin" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Logging Audit</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Commit Analysis</span>
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
