"use client";

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';

export default function Step6StandardInfo({ register, errors, setValue, watch }) {
  const pitchDeckFile = watch('pitch_deck_file');
  const financialModelFile = watch('financial_model_file');

  const onDropPitch = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length) {
      setValue('pitch_deck_file', acceptedFiles[0], { shouldValidate: true });
    }
  }, [setValue]);

  const onDropFinancial = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length) {
      setValue('financial_model_file', acceptedFiles[0], { shouldValidate: true });
    }
  }, [setValue]);

  const { getRootProps: getPitchProps, getInputProps: getPitchInputProps, isDragActive: pitchActive } = useDropzone({
    onDrop: onDropPitch,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  const { getRootProps: getFinProps, getInputProps: getFinInputProps, isDragActive: finActive } = useDropzone({
    onDrop: onDropFinancial,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  const removeFile = (fieldName) => {
    setValue(fieldName, null, { shouldValidate: true });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-inter text-white mb-2">Standard Information & Uploads</h2>
        <p className="text-gray-400 text-sm">Provide your contact details and related documents.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {/* Left Column: Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('company_name')}
              className={`w-full px-4 py-2 bg-gray-900/50 border ${errors.company_name ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            />
            {errors.company_name && <p className="mt-1 text-xs text-red-500">{errors.company_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Website
            </label>
            <input
              type="url"
              {...register('website')}
              placeholder="https://"
              className={`w-full px-4 py-2 bg-gray-900/50 border ${errors.website ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            />
             {errors.website && <p className="mt-1 text-xs text-red-500">{errors.website.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Primary Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('contact_name')}
              className={`w-full px-4 py-2 bg-gray-900/50 border ${errors.contact_name ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            />
             {errors.contact_name && <p className="mt-1 text-xs text-red-500">{errors.contact_name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                className={`w-full px-4 py-2 bg-gray-900/50 border ${errors.email ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
              />
               {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register('phone')}
                className={`w-full px-4 py-2 bg-gray-900/50 border ${errors.phone ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
              />
               {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-300 mb-1">
              Funding Amount Sought (NPR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('funding_amount', { valueAsNumber: true })}
              className={`w-full px-4 py-2 bg-gray-900/50 border ${errors.funding_amount ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            />
             {errors.funding_amount && <p className="mt-1 text-xs text-red-500">{errors.funding_amount.message}</p>}
          </div>
        </div>

        {/* Right Column: File Uploads */}
        <div className="space-y-6">
          
          {/* Pitch Deck Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Pitch Deck (PDF, max 10MB) <span className="text-red-500">*</span>
            </label>
            
            {pitchDeckFile ? (
               <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg">
                 <div className="flex items-center space-x-3 overflow-hidden">
                   <File className="w-6 h-6 text-[#B99555] flex-shrink-0" />
                   <span className="text-sm text-gray-200 truncate">{pitchDeckFile.name}</span>
                 </div>
                 <button 
                  type="button" 
                  onClick={() => removeFile('pitch_deck_file')}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
            ) : (
              <div 
                {...getPitchProps()} 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${pitchActive ? 'border-[#B99555] bg-[#B99555]/10' : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'}`}
              >
                <input {...getPitchInputProps()} />
                <Upload className="w-8 h-8 mx-auto mb-3 text-gray-500" />
                <p className="text-sm text-gray-300">Drag & drop your PDF here</p>
                <p className="text-xs text-gray-500 mt-1">or click to browse files</p>
              </div>
            )}
             {/* Hidden field for react-hook-form actual validation string if needed, or simply rely on file object presense before submit */}
          </div>

          {/* Financial Model Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Financial Model (Excel) <span className="text-gray-500 font-normal text-xs ml-1">(Optional)</span>
            </label>
            
            {financialModelFile ? (
               <div className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg">
                 <div className="flex items-center space-x-3 overflow-hidden">
                   <File className="w-6 h-6 text-green-500 flex-shrink-0" />
                   <span className="text-sm text-gray-200 truncate">{financialModelFile.name}</span>
                 </div>
                 <button 
                  type="button" 
                  onClick={() => removeFile('financial_model_file')}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
            ) : (
              <div 
                {...getFinProps()} 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${finActive ? 'border-[#B99555] bg-[#B99555]/10' : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'}`}
              >
                <input {...getFinInputProps()} />
                <Upload className="w-8 h-8 mx-auto mb-3 text-gray-500" />
                <p className="text-sm text-gray-300">Drag & drop your Excel file here</p>
                <p className="text-xs text-gray-500 mt-1">or click to browse files (.xls, .xlsx)</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
