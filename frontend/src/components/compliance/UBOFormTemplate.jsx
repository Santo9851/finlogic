import React from 'react';
import FinlogicLogo from '../FinlogicLogo';

export default function UBOFormTemplate({ deal }) {
  return (
    <div className="bg-white text-black p-12 min-h-[297mm] mx-auto shadow-2xl font-serif print:shadow-none print:p-0" id="ubo-printable">
      
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-[#5B2FD4] pb-8 mb-8">
         <div className="space-y-4">
            <FinlogicLogo size={50} variant="full" darkBg={false} />
            <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-sans font-bold">
               Regulatory Compliance Dept.
            </div>
         </div>
         <div className="text-right space-y-1 font-sans">
            <h1 className="text-2xl font-black text-[#3A138A] uppercase tracking-tighter">UBO Declaration</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Form Version: 2024.1.v</p>
         </div>
      </div>

      {/* Intro */}
      <div className="space-y-6 mb-8 text-sm leading-relaxed text-gray-800">
         <p>
            Pursuant to the <strong>Prevention of Money Laundering Act (PMLA)</strong> and relevant <strong>SEBON</strong> regulations, 
            this declaration is required to identify the <strong>Ultimate Beneficial Owners (UBO)</strong> of the entity seeking investment or partnership with 
            Finlogic Capital Limited.
         </p>
         
         <div className="bg-gray-50 p-6 border-l-4 border-[#F59F01] space-y-4 font-sans">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Declarant Information</h2>
            <div className="grid grid-cols-2 gap-y-4 text-xs">
               <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Entity Name</p>
                  <p className="font-bold text-gray-900">{deal?.company_name || '__________________________'}</p>
               </div>
               <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Project Category</p>
                  <p className="font-bold text-gray-900">{deal?.sector || '__________________________'}</p>
               </div>
               <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Registration No.</p>
                  <p className="font-bold text-gray-900 italic">__________________________</p>
               </div>
               <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Date of Declaration</p>
                  <p className="font-bold text-gray-900">{new Date().toLocaleDateString()}</p>
               </div>
            </div>
         </div>
      </div>

      {/* UBO Table */}
      <div className="space-y-4 mb-10 font-sans">
         <div className="flex justify-between items-end">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#3A138A]">Beneficial Ownership &amp; Shareholding</h2>
            <p className="text-[9px] text-[#F59F01] font-black uppercase tracking-tighter">Mandatory: All Shareholders &gt; 5%</p>
         </div>
         <table className="w-full border-collapse border border-gray-200">
            <thead>
               <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-500">
                  <th className="border border-gray-200 p-3 text-left">Full Name of Shareholder / UBO</th>
                  <th className="border border-gray-200 p-3 text-left">Citizenship/Passport #</th>
                  <th className="border border-gray-200 p-3 text-left">Nationality</th>
                  <th className="border border-gray-200 p-3 text-center">Ownership %</th>
               </tr>
            </thead>
            <tbody className="text-[11px]">
               {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                 <tr key={i}>
                    <td className="border border-gray-200 p-4 h-12"></td>
                    <td className="border border-gray-200 p-4 h-12"></td>
                    <td className="border border-gray-200 p-4 h-12"></td>
                    <td className="border border-gray-200 p-4 h-12"></td>
                 </tr>
               ))}
            </tbody>
         </table>
         <div className="space-y-1">
            <p className="text-[9px] text-gray-400 italic">
               * <strong>Important:</strong> Please list all individual shareholders holding more than <strong>5% equity</strong> in the entity.
            </p>
            <p className="text-[9px] text-gray-400 italic">
               * Ultimate Beneficial Owner (UBO) refers to any individual who ultimately owns or controls 25% or more of the shares or voting rights.
            </p>
         </div>
      </div>

      {/* Declaration */}
      <div className="space-y-6 mb-12">
         <h2 className="text-xs font-black uppercase tracking-widest text-[#3A138A] font-sans">Legal Declaration</h2>
         <div className="text-[11px] leading-[1.8] text-justify space-y-4 italic text-gray-600">
            <p>
               I, the undersigned, acting in my capacity as an authorized representative of the aforementioned entity, 
               hereby declare that the information provided herein is true, accurate, and complete to the best of my knowledge. 
               I acknowledge that Finlogic Capital Limited relies on this information for its compliance obligations under the 
               laws of Nepal and international AML standards.
            </p>
            <p>
               I further agree to notify Finlogic Capital Limited immediately of any changes to the beneficial ownership 
               structure as declared above. I understand that any false declaration may result in the termination of the 
               engagement and may be reportable to regulatory authorities.
            </p>
         </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 pt-12 border-t border-gray-100 font-sans">
         <div className="space-y-8">
            <div className="h-20 border-b border-gray-300"></div>
            <div className="space-y-1">
               <p className="text-[10px] font-black uppercase text-gray-900">Authorized Signature</p>
               <p className="text-[9px] text-gray-400">Name: __________________________</p>
               <p className="text-[9px] text-gray-400">Title: __________________________</p>
            </div>
         </div>
         <div className="space-y-8">
            <div className="h-20 flex items-center justify-center border-b border-gray-300">
               <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center text-[8px] text-gray-300 uppercase font-black">
                  Company Seal
               </div>
            </div>
            <div className="space-y-1 text-right">
               <p className="text-[10px] font-black uppercase text-gray-900">Official Stamp</p>
               <p className="text-[9px] text-gray-400">Date: ____ / ____ / 20____</p>
            </div>
         </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t border-gray-100 flex justify-between items-end">
         <div className="text-[8px] text-gray-300 font-sans uppercase font-bold space-y-1">
            <p>© Finlogic Capital Limited</p>
            <p>Institutional Integrity & Governance Unit</p>
         </div>
         <div className="text-[8px] text-gray-300 font-sans font-bold uppercase">
            Confidential Document | Internal Use Only
         </div>
      </div>
      
      <style jsx global>{`
        @media print {
          /* 1. Hide everything by default */
          body * {
            visibility: hidden !important;
          }

          /* 2. Calibration for A4 Safe Zones - Show ONLY the container and its children */
          #ubo-printable-container, 
          #ubo-printable-container *,
          #ubo-printable, 
          #ubo-printable * {
            visibility: visible !important;
          }
          
          /* Force the container to the top-left of the physical page */
          #ubo-printable-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          #ubo-printable {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Specifically hide UI elements like buttons and sticky headers */
          button, .sticky, header, footer {
            display: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }
        }

        /* Screen Styles */
        #ubo-printable {
          max-width: 210mm;
          box-sizing: border-box;
        }
        #ubo-printable * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
