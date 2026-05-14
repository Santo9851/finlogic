'use client';

import { useState, useEffect } from 'react';
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
  Info
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

  const handleFieldChange = async (qNum, field, value) => {
    const updatedAnswers = {
      ...answers,
      [qNum]: {
        ...(answers[qNum] || {}),
        [field]: value
      }
    };
    setAnswers(updatedAnswers);

    if (session) {
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
      <div className="container mx-auto px-4 py-20 min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-12"
        >
          {/* Hero Card */}
          <div className="relative overflow-hidden rounded-[3rem] bg-card p-12 lg:p-20 border border-border-theme shadow-2xl">
            <div className="absolute top-0 right-0 p-8">
              <Sparkles className={`w-12 h-12 text-ls-compliment ${isDark ? 'opacity-20' : 'opacity-10'}`} />
            </div>
            <div className="relative z-10 space-y-6">
              <h1 className="text-5xl lg:text-7xl font-black tracking-tight">
                Idea <span className="text-ls-compliment">Validator</span>
              </h1>
              <p className="text-xl text-text-muted max-w-2xl leading-relaxed">
                Analyze your business idea through the lens of our five philosophical pillars. 
                Get brutally honest, constructive feedback and an adversarial risk assessment 
                to prepare for institutional-grade scaling.
              </p>
              
              <div className="flex flex-wrap gap-8 pt-6">
                {user ? (
                  <>
                    <div className={`rounded-2xl p-6 border border-border-theme ${isDark ? 'bg-background/50 backdrop-blur-md' : 'bg-background shadow-sm'}`}>
                      <div className="text-sm text-text-muted uppercase tracking-widest mb-1">Your Quota</div>
                      <div className="text-3xl font-black text-ls-compliment">
                        {quota?.remaining_validations} Analyses Left
                      </div>
                      <div className="text-xs text-text-muted mt-2">
                        Resets quarterly (1 free analysis)
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <button 
                        onClick={startNewValidation}
                        disabled={quota?.remaining_validations <= 0}
                        className={`w-full sm:w-auto flex items-center justify-center space-x-3 px-10 py-5 rounded-full font-bold transition-all ${
                          quota?.remaining_validations > 0 
                          ? 'bg-ls-compliment text-ls-primary hover:scale-105 shadow-lg shadow-ls-compliment/20' 
                          : 'bg-border-theme text-text-muted cursor-not-allowed'
                        }`}
                      >
                        <span>Start New Analysis</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>

                      <Link 
                        href="/validate/history"
                        className="w-full sm:w-auto flex items-center justify-center space-x-3 px-10 py-5 rounded-full font-bold border border-border-theme hover:bg-card transition-all"
                      >
                        <Clock className="w-5 h-5" />
                        <span>View History</span>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                    <Link 
                      href="/auth/login?redirect=/validate"
                      className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-ls-compliment text-ls-primary px-12 py-5 rounded-full font-black hover:scale-105 transition-all shadow-xl shadow-ls-compliment/20"
                    >
                      <span>Login to Start Analysis</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="text-sm text-text-muted">
                      Join Finlogic to access institutional-grade business validation.
                    </p>
                  </div>
                )}
              </div>

              {!user && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-border-theme mt-12">
                  {[
                    { title: 'Institutional Framework', desc: 'Analyzed across our 5 philosophical pillars.' },
                    { title: 'Adversarial Review', desc: 'A ruthless "Red Team" assessment of your risks.' },
                    { title: 'Branded Reports', desc: 'Shareable PDF & card for institutional partners.' }
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center space-x-2 text-ls-compliment">
                        <CheckCircle2 className="w-4 h-4" />
                        <h4 className="text-sm font-bold uppercase tracking-wider">{item.title}</h4>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {quota?.remaining_validations <= 0 && (
                <div className="flex items-start space-x-3 text-ls-secondary bg-ls-secondary/5 p-4 rounded-xl border border-ls-secondary/20 max-w-lg">
                  <AlertCircle className="w-5 h-5 mt-1 shrink-0" />
                  <p className="text-sm">
                    You have exhausted your quarterly quota. Please contact 
                    <a href="mailto:info@finlogiccapital.com" className="font-bold underline ml-1">info@finlogiccapital.com</a> 
                    to purchase additional validation credits.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="container mx-auto px-4 py-20 min-h-screen flex items-center justify-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl space-y-8"
        >
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-ls-compliment/10 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-ls-compliment" />
            </div>
          </div>
          <h2 className="text-5xl font-black">Analysis Submitted!</h2>
          <p className="text-xl text-text-muted">
            Our AI engine (the Sovereign Venture Architect) is now analyzing your submission. 
            This usually takes 2-3 minutes. You will receive an email once your report is ready.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href={`/validate/report/${session.id}`}
              className="flex items-center space-x-2 bg-ls-compliment text-ls-primary px-8 py-4 rounded-full font-bold hover:scale-105 transition-all"
            >
              <span>View Live Status</span>
              <Clock className="w-5 h-5" />
            </Link>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 rounded-full border border-border-theme font-bold hover:bg-card transition-all"
            >
              Back to Dashboard
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
      <div className="min-h-screen bg-background text-foreground theme-transition pb-40">
        {/* Progress Bar & Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border-theme">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl bg-ls-compliment/10 text-ls-compliment`}>
                  <currentPillar.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-ls-compliment">
                    Step {currentStep} / 5
                  </h3>
                  <h4 className="text-2xl font-black">
                    {lang === 'en' ? currentPillar.name_en : currentPillar.name_ne}
                  </h4>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link 
                  href="/validate/history"
                  className="px-4 py-2 rounded-full border border-border-theme text-[10px] font-black uppercase tracking-widest hover:bg-card transition-all flex items-center gap-2"
                >
                  <Clock size={12} />
                  History
                </Link>
                <button 
                  onClick={() => setLang(l => l === 'en' ? 'ne' : 'en')}
                  className="px-4 py-2 rounded-full border border-border-theme text-[10px] font-black uppercase tracking-widest hover:bg-card transition-all"
                >
                  {lang === 'en' ? 'नेपाली' : 'English'}
                </button>
                {saving && (
                  <span className="text-xs text-ls-compliment flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-ls-compliment animate-pulse" />
                    <span>Auto-saving...</span>
                  </span>
                )}
              </div>
            </div>

            <div className="h-2 w-full bg-border-theme rounded-full overflow-hidden">
              <motion.div 
                initial={false}
                animate={{ width: `${(currentStep / 5) * 100}%` }}
                className="h-full bg-ls-compliment"
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-16"
              >
                {stepQuestions.map((q, idx) => (
                  <div key={q.id} className="space-y-6">
                    <div className="space-y-3">
                      <h5 className="text-sm font-mono text-text-muted">Question {q.id}</h5>
                      <h2 className="text-2xl lg:text-3xl font-bold leading-tight">
                        {q.question_ne}<br/>
                        <span className="text-text-muted text-xl lg:text-2xl font-medium">{q.question_en}</span>
                      </h2>
                    </div>

                    {/* Hint / Example Box */}
                    <div className="flex items-start space-x-3 p-5 rounded-2xl bg-ls-compliment/5 border border-ls-compliment/10">
                      <Info className="w-5 h-5 text-ls-compliment shrink-0 mt-1" />
                      <div className="text-sm space-y-1">
                        <div className="font-bold text-ls-compliment uppercase tracking-widest text-[10px]">Contextual Example</div>
                        <p className="text-text-muted italic">{q.hint_ne}</p>
                        <p className="text-text-muted">{q.hint_en}</p>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {q.options.map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() => handleFieldChange(q.id, 'selected_option', opt.val)}
                          className={`flex items-center justify-between p-5 rounded-2xl border text-left transition-all ${
                            answers[q.id]?.selected_option === opt.val
                            ? 'border-ls-compliment bg-ls-compliment/5 shadow-md ring-1 ring-ls-compliment'
                            : 'border-border-theme hover:border-ls-compliment/50 bg-card'
                          }`}
                        >
                          <span className="font-medium">{opt.ne} / {opt.en}</span>
                          {answers[q.id]?.selected_option === opt.val && <CheckCircle2 className="w-5 h-5 text-ls-compliment" />}
                        </button>
                      ))}
                    </div>

                    {answers[q.id]?.selected_option === 'Other' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Please specify:</label>
                        <input 
                          type="text"
                          value={answers[q.id]?.other_text || ''}
                          onChange={(e) => handleFieldChange(q.id, 'other_text', e.target.value)}
                          placeholder="Type your response..."
                          className="w-full bg-card border border-border-theme rounded-xl p-4 focus:border-ls-compliment outline-none"
                        />
                      </motion.div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Elaborate (15-50 words):</label>
                        <textarea 
                          value={answers[q.id]?.free_text_response || ''}
                          onChange={(e) => handleFieldChange(q.id, 'free_text_response', e.target.value)}
                          placeholder="Share more details about this aspect of your business..."
                          rows={4}
                          className="w-full bg-card border border-border-theme rounded-2xl p-6 focus:border-ls-compliment outline-none resize-none leading-relaxed"
                        />
                      </div>

                    </div>

                    {idx < stepQuestions.length - 1 && (
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-border-theme to-transparent my-12" />
                    )}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-ls-secondary/10 border border-ls-secondary/20 text-ls-secondary rounded-xl flex items-center space-x-3">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-12 border-t border-border-theme">
              <button 
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center space-x-2 px-8 py-4 rounded-full font-bold transition-all ${
                  currentStep === 1 ? 'opacity-0 pointer-events-none' : 'border border-border-theme hover:bg-card'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous Pillar</span>
              </button>

              {currentStep < 5 ? (
                <button 
                  onClick={nextStep}
                  className="flex items-center space-x-2 bg-foreground text-background px-10 py-4 rounded-full font-bold hover:bg-ls-compliment hover:text-ls-primary transition-all"
                >
                  <span>Next Pillar</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center space-x-2 bg-ls-compliment text-ls-primary px-12 py-5 rounded-full font-black hover:scale-105 transition-all shadow-xl shadow-ls-compliment/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-ls-primary/20 border-t-ls-primary rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Analysis</span>
                      <ArrowRight className="w-5 h-5" />
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
