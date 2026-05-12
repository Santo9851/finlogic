"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Mail, Phone, Send, ArrowRight, ChevronDown, Globe } from "lucide-react";
import Link from "next/link";
import { contactService } from "@/services/contact";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export default function ContactPage() {
   const [formStatus, setFormStatus] = useState("idle");
   const { resolvedTheme } = useTheme();
   const isDark = resolvedTheme === "dark";

   const handleSubmit = async (e) => {
      e.preventDefault();
      setFormStatus("submitting");
      
      const formData = new FormData(e.target);
      const fullName = formData.get("fullName").trim();
      const nameParts = fullName.split(' ');
      const first_name = nameParts[0];
      const last_name = nameParts.slice(1).join(' ') || ' ';

      const payload = {
         first_name,
         last_name,
         email: formData.get("email"),
         source: formData.get("subject"),
         notes: formData.get("message"),
      };

      try {
         await contactService.submitInquiry(payload);
         setFormStatus("success");
         e.target.reset();
         toast.success("Message sent successfully!");
      } catch (error) {
         console.error("Contact submission error:", error);
         setFormStatus("idle");
         toast.error("Failed to send inquiry. Please try again later.");
      }
   };

   // Theme-aware dynamic styles
   const accentClass = isDark ? "text-ls-compliment" : "text-ls-secondary";
   const accentBgClass = isDark ? "bg-ls-compliment/10" : "bg-ls-secondary/10";
   const accentBorderClass = isDark ? "border-ls-compliment/30" : "border-ls-secondary/30";
   const accentHoverClass = isDark ? "hover:text-ls-compliment" : "hover:text-ls-secondary";
   const accentButtonClass = isDark ? "bg-ls-compliment text-ls-primary-fixed" : "bg-ls-secondary text-white";

   return (
      <div className="bg-background text-foreground min-h-screen theme-transition">

         {/* Hero Section */}
         <section className="relative pt-32 pb-24 overflow-hidden">
            <div className="absolute inset-0 bg-abstract-gradient opacity-40 pointer-events-none" />
            <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
               <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`inline-block px-6 py-2 rounded-full border ${accentBorderClass} ${accentClass} text-[10px] font-black uppercase tracking-[0.3em] mb-8 ${accentBgClass} backdrop-blur-md`}
               >
                  Connect With Finlogic
               </motion.div>
               <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-8xl font-black mb-8 max-w-5xl mx-auto text-foreground tracking-tighter leading-none"
               >
                  Let&apos;s build the <span className={accentClass}>future together.</span>
               </motion.h1>
               <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-12 flex items-center justify-center font-medium leading-relaxed"
               >
                  <Globe className={`w-6 h-6 mr-3 ${accentClass} animate-pulse`} /> 
                  Institutionalising Private Equity in Nepal. Operating globally.
               </motion.p>
            </div>
         </section>

         {/* Main Content Areas */}
         <section className="pb-32">
            <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">

                  {/* Left Column: Contact Info */}
                  <div className="lg:col-span-4 space-y-16">
                     
                     <div className="space-y-10">
                        <div>
                           <h3 className="text-sm font-black uppercase tracking-[0.3em] text-text-muted mb-8 flex items-center gap-3">
                              <span className={`w-8 h-px ${isDark ? 'bg-ls-compliment/30' : 'bg-ls-secondary/30'}`} />
                              HQ Contact
                           </h3>
                           <div className="space-y-8">
                              <div className="flex items-start group">
                                 <div className={`w-12 h-12 rounded-2xl ${accentBgClass} border ${accentBorderClass} flex items-center justify-center mr-6 shrink-0 group-hover:scale-110 transition-transform`}>
                                    <MapPin className={`w-5 h-5 ${accentClass}`} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Our Location</p>
                                    <p className="text-sm font-bold text-foreground leading-relaxed">
                                       Finlogic Capital Limited<br />
                                       Kathmandu, Bagmati 44600<br />
                                       Nepal
                                    </p>
                                 </div>
                              </div>

                              <div className="flex items-center group">
                                 <div className={`w-12 h-12 rounded-2xl ${accentBgClass} border ${accentBorderClass} flex items-center justify-center mr-6 shrink-0 group-hover:scale-110 transition-transform`}>
                                    <Mail className={`w-5 h-5 ${accentClass}`} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Email Us</p>
                                    <a href="mailto:contact@finlogic.capital" className={`text-sm font-bold text-foreground ${accentHoverClass} transition-colors`}>contact@finlogic.capital</a>
                                 </div>
                              </div>

                              <div className="flex items-center group">
                                 <div className={`w-12 h-12 rounded-2xl ${accentBgClass} border ${accentBorderClass} flex items-center justify-center mr-6 shrink-0 group-hover:scale-110 transition-transform`}>
                                    <Phone className={`w-5 h-5 ${accentClass}`} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Call Us</p>
                                    <p className="text-sm font-bold text-foreground">+977-9851437351</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Quick Portals */}
                        <div className="space-y-6 pt-12 border-t border-border-theme">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted opacity-60">Specific Portals</h3>

                           <Link href="/entrepreneurs" className={`block p-8 rounded-[2rem] border border-border-theme bg-card ${isDark ? 'hover:border-ls-compliment/50' : 'hover:border-ls-secondary/50'} transition-all group theme-transition shadow-lg hover:shadow-2xl`}>
                              <h4 className={`font-black text-xl mb-2 group-hover:${accentClass} transition-colors text-foreground uppercase tracking-tight`}>Submit Project</h4>
                              <p className="text-sm text-text-muted/70 mb-6 font-medium">Founders seeking capital and institutional partnership.</p>
                              <div className={`text-[10px] font-black ${accentClass} flex items-center uppercase tracking-[0.2em]`}>
                                 Founders Portal <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" />
                              </div>
                           </Link>

                           <Link href="/investors#request-access" className="block p-8 rounded-[2rem] border border-border-theme bg-card hover:border-ls-secondary/50 transition-all group theme-transition shadow-lg hover:shadow-2xl">
                              <h4 className="font-black text-xl mb-2 group-hover:text-ls-secondary transition-colors text-foreground uppercase tracking-tight">Investor Access</h4>
                              <p className="text-sm text-text-muted/70 mb-6 font-medium">Institutional LPs and Family Offices.</p>
                              <div className="text-[10px] font-black text-ls-secondary flex items-center uppercase tracking-[0.2em]">
                                 LP Network <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" />
                              </div>
                           </Link>
                        </div>
                     </div>
                  </div>

                  {/* Right Column: Inquiry Form */}
                  <div className="lg:col-span-8">
                     <div className="bg-card border border-border-theme rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden theme-transition">
                        <div className={`absolute top-0 right-0 w-64 h-64 ${accentBgClass} blur-[120px] rounded-full -mr-32 -mt-32 opacity-50`} />
                        
                        <div className="relative z-10">
                           <h2 className="text-4xl font-black mb-4 text-foreground uppercase tracking-tight">General Inquiry</h2>
                           <p className="text-text-muted mb-12 text-lg font-medium leading-relaxed max-w-xl">
                              Use this form for press, strategic partnerships, or general corporate inquiries.
                           </p>

                           <form onSubmit={handleSubmit} className="space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-2">Full Name</label>
                                    <input name="fullName" required type="text" placeholder="John Doe" className={`w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-5 outline-none focus:border-${isDark ? 'ls-compliment' : 'ls-secondary'} focus:bg-foreground/[0.05] transition-all text-foreground font-medium placeholder:text-text-muted/20 shadow-inner`} />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-2">Email Address</label>
                                    <input name="email" required type="email" placeholder="john@company.com" className={`w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-5 outline-none focus:border-${isDark ? 'ls-compliment' : 'ls-secondary'} focus:bg-foreground/[0.05] transition-all text-foreground font-medium placeholder:text-text-muted/20 shadow-inner`} />
                                 </div>
                              </div>

                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-2">Inquiry Type</label>
                                 <div className="relative">
                                    <select name="subject" required defaultValue="" className={`w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-5 outline-none focus:border-${isDark ? 'ls-compliment' : 'ls-secondary'} focus:bg-foreground/[0.05] transition-all text-foreground appearance-none font-medium shadow-inner`}>
                                       <option value="" disabled hidden>Select category...</option>
                                       <option value="press" className="text-foreground bg-background">Press & Media</option>
                                       <option value="partnership" className="text-foreground bg-background">Strategic Partnership</option>
                                       <option value="career" className="text-foreground bg-background">Career Opportunities</option>
                                       <option value="other" className="text-foreground bg-background">General Support</option>
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/40 pointer-events-none" />
                                 </div>
                              </div>

                              <div className="space-y-3">
                                 <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] ml-2">Your Message</label>
                                 <textarea name="message" required rows={6} placeholder="How can we help you?" className={`w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-5 outline-none focus:border-${isDark ? 'ls-compliment' : 'ls-secondary'} focus:bg-foreground/[0.05] transition-all text-foreground resize-none font-medium placeholder:text-text-muted/20 shadow-inner leading-relaxed`}></textarea>
                              </div>

                              <div className="pt-6">
                                 <button
                                    disabled={formStatus !== "idle"}
                                    type="submit"
                                    className={`w-full rounded-2xl ${accentButtonClass} text-[11px] font-black uppercase tracking-[0.3em] py-6 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-2xl flex items-center justify-center gap-3`}
                                 >
                                    {formStatus === "idle" && (
                                       <>Transmit Message <Send className="w-5 h-5" /></>
                                    )}
                                    {formStatus === "submitting" && (
                                       <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    )}
                                    {formStatus === "success" && "Transmission Complete"}
                                 </button>
                              </div>

                              {formStatus === "success" && (
                                 <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center"
                                 >
                                    <p className="text-emerald-500 font-black text-xs uppercase tracking-widest">
                                       Thank you. A specialist will review your inquiry within 24 business hours.
                                    </p>
                                 </motion.div>
                              )}
                           </form>
                        </div>
                     </div>
                  </div>

               </div>
            </div>
         </section>

      </div>
   );
}
