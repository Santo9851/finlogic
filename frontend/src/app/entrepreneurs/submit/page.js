"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight, ArrowLeft, Save, Check } from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { projectSubmissionSchema } from '@/lib/validations/project';
import { projectService } from '@/services/project';
import AuthGuard from '@/components/AuthGuard';

import ProgressBar from '@/components/project/ProgressBar';
import Step1Vision from '@/components/project/Step1Vision';
import Step2Growth from '@/components/project/Step2Growth';
import Step3Leadership from '@/components/project/Step3Leadership';
import Step4Insight from '@/components/project/Step4Insight';
import Step5Partnership from '@/components/project/Step5Partnership';
import Step6StandardInfo from '@/components/project/Step6StandardInfo';

const steps = [
  { id: 1, title: 'Vision', fields: ['problem_solving', 'target_market', 'competitors'] },
  { id: 2, title: 'Growth', fields: ['business_model', 'scale_plan', 'social_impact'] },
  { id: 3, title: 'Leadership', fields: ['background', 'team_members', 'experience'] },
  { id: 4, title: 'Insight', fields: ['revenue_metrics', 'growth_rate', 'gross_margins', 'customer_acquisition_cost', 'lifetime_value', 'feedback', 'risks'] },
  { id: 5, title: 'Partnerships', fields: ['existing_partners', 'supplier_relations', 'investor_expectations'] },
  { id: 6, title: 'Information', fields: ['company_name', 'website', 'contact_name', 'email', 'phone', 'funding_amount'] }
];

function SubmitProjectForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [projectId, setProjectId] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(projectSubmissionSchema),
    mode: 'onTouched',
    defaultValues: { has_pitch_deck: false, has_financial_model: false }
  });

  const nextStep = async () => {
    const fieldsToValidate = steps[currentStep - 1].fields;
    const isValid = await trigger(fieldsToValidate);
    if (isValid && currentStep < steps.length) {
      setCurrentStep(p => p + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) { setCurrentStep(p => p - 1); window.scrollTo(0, 0); }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const data = watch();
      const res = await projectService.saveDraft(projectId, {
        title: data.company_name || 'Draft Project',
        status: 'draft',
        submission_data: data
      });
      setProjectId(res.id);
      toast.success('Draft saved successfully');
    } catch {
      toast.error('Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const saved = await projectService.saveDraft(projectId, {
        title: data.company_name,
        status: 'draft',
        submission_data: data
      });
      const pid = saved.id;
      setProjectId(pid);

      if (data.pitch_deck_file) await projectService.uploadFile(pid, data.pitch_deck_file, 'pitch_deck');
      if (data.financial_model_file) await projectService.uploadFile(pid, data.financial_model_file, 'financial_model');

      await projectService.submitProject(pid);
      await projectService.calculateScore(pid);

      toast.success('Project submitted successfully!');
      setTimeout(() => router.push('/dashboard/entrepreneur'), 1500);
    } catch {
      toast.error('Submission failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-abstract-gradient text-white pb-20 pt-24">
      <Toaster position="top-right" theme="dark" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-[#F59F01] to-[#F59F01]/70 bg-clip-text text-transparent">
            Submit Your Project
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Share your vision with Finlogic Capital. Provide comprehensive details across our 5 core pillars to help us evaluate your potential.
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} steps={steps} />

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#F59F01] rounded-full filter blur-[128px] opacity-10 pointer-events-none" />

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="min-h-[400px]">
              {currentStep === 1 && <Step1Vision register={register} errors={errors} />}
              {currentStep === 2 && <Step2Growth register={register} errors={errors} />}
              {currentStep === 3 && <Step3Leadership register={register} errors={errors} />}
              {currentStep === 4 && <Step4Insight register={register} errors={errors} />}
              {currentStep === 5 && <Step5Partnership register={register} errors={errors} />}
              {currentStep === 6 && <Step6StandardInfo register={register} errors={errors} setValue={setValue} watch={watch} />}
            </div>

            {/* Navigation */}
            <div className="mt-12 pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
              <div>
                {currentStep > 1 ? (
                  <button type="button" onClick={prevStep}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors py-2 px-4">
                    <ArrowLeft className="w-4 h-4" /><span>Back</span>
                  </button>
                ) : <div />}
              </div>

              <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto gap-3">
                <button type="button" onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-colors border border-white/10 disabled:opacity-40">
                  {isSavingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Draft</span>
                </button>

                {currentStep < steps.length ? (
                  <button type="button" onClick={nextStep}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-[#F59F01] hover:bg-[#F59F01]/90 text-[#100226] font-semibold rounded-xl transition-all shadow-lg hover:shadow-[#F59F01]/25">
                    <span>Next Step</span><ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="submit" disabled={isSubmitting}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-[#F59F01] hover:bg-[#F59F01]/90 text-[#100226] font-semibold rounded-xl transition-all shadow-lg hover:shadow-[#F59F01]/25 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting...</span></>
                    ) : (
                      <><span>Submit Project</span><Check className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SubmitProjectPage() {
  return (
    <AuthGuard allowedRoles={['entrepreneur', 'admin', 'super_admin']}>
      <SubmitProjectForm />
    </AuthGuard>
  );
}
