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

   return (
      <div className="bg-background text-foreground min-h-screen theme-transition font-sans">
         {/* Hero Section */}
         <section className="relative pt-40 pb-24 overflow-hidden bg-ls-primary text-ls-white">
            <div className="absolute inset-0 z-0 opacity-30 grayscale mix-blend-luminosity">
               <img src="/images/redesign/harmony.png" className="w-full h-full object-cover" alt="Contact Hero" />
               <div className="absolute inset-0 bg-ls-primary/90" />
            </div>
            
            <div className="container mx-auto px-4 lg:px-8 relative z-10">
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-4xl space-y-8"
               >
                  <span className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Global Connectivity</span>
                  <h1 className="text-6xl md:text-8xl font-serif font-light leading-tight">Connect with <br /> Finlogic Capital</h1>
                  <p className="text-xl text-ls-white/70 max-w-2xl leading-relaxed md:text-2xl font-light">
                     Operating from the heart of Kathmandu, bridging local vision with institutional global standards.
                  </p>
               </motion.div>
            </div>
         </section>

         {/* Main Content Areas */}
         <section className="py-24 lg:py-40">
            <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-32">

                  {/* Left Column: Contact Info & Portals */}
                  <div className="lg:col-span-5 space-y-24">
                     
                     <div className="space-y-16">
                        <div className="space-y-6">
                           <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Our Headquarters</h2>
                           <h3 className="text-4xl font-serif font-light">Kathmandu, Nepal</h3>
                        </div>
                        
                        <div className="space-y-12">
                           <div className="flex items-start group">
                              <div className="w-12 h-12 flex items-center justify-center mr-8 border border-border-theme group-hover:border-ls-compliment transition-colors">
                                 <MapPin className="w-5 h-5 text-ls-compliment" />
                              </div>
                              <div className="space-y-2">
                                 <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Office Location</p>
                                 <p className="text-xl font-light leading-relaxed">
                                    Finlogic Capital Limited<br />
                                    Kathmandu, Bagmati 44600<br />
                                    Nepal
                                 </p>
                              </div>
                           </div>

                           <div className="flex items-center group">
                              <div className="w-12 h-12 flex items-center justify-center mr-8 border border-border-theme group-hover:border-ls-compliment transition-colors">
                                 <Mail className="w-5 h-5 text-ls-compliment" />
                              </div>
                              <div className="space-y-2">
                                 <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Electronic Mail</p>
                                 <a href="mailto:contact@finlogic.capital" className="text-xl font-light hover:text-ls-compliment transition-colors">contact@finlogic.capital</a>
                              </div>
                           </div>

                           <div className="flex items-center group">
                              <div className="w-12 h-12 flex items-center justify-center mr-8 border border-border-theme group-hover:border-ls-compliment transition-colors">
                                 <Phone className="w-5 h-5 text-ls-compliment" />
                              </div>
                              <div className="space-y-2">
                                 <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Direct Line</p>
                                 <p className="text-xl font-light">+977-9851437351</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Strategic Portals */}
                     <div className="space-y-10 pt-20 border-t border-border-theme">
                        <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-ls-compliment">Strategic Gateways</h3>
                        <div className="grid grid-cols-1 gap-6">
                           <Link href="/for-entrepreneurs" className="group border border-border-theme p-10 hover:bg-ls-primary hover:text-ls-white transition-all">
                              <h4 className="text-2xl font-serif font-light mb-4">Submit a Proposal</h4>
                              <p className="text-text-muted group-hover:text-ls-white/60 mb-8 font-light">For founders seeking institutional capital and strategic partnership.</p>
                              <div className="inline-flex items-center space-x-3 text-ls-compliment font-bold uppercase tracking-widest text-xs">
                                 <span>Founders Portal</span>
                                 <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                              </div>
                           </Link>

                           <Link href="/for-investors" className="group border border-border-theme p-10 hover:bg-ls-primary hover:text-ls-white transition-all">
                              <h4 className="text-2xl font-serif font-light mb-4">Investor Access</h4>
                              <p className="text-text-muted group-hover:text-ls-white/60 mb-8 font-light">For institutional LPs, family offices, and accredited investors.</p>
                              <div className="inline-flex items-center space-x-3 text-ls-compliment font-bold uppercase tracking-widest text-xs">
                                 <span>LP Network</span>
                                 <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                              </div>
                           </Link>
                        </div>
                     </div>
                  </div>

                  {/* Right Column: Inquiry Form */}
                  <div className="lg:col-span-7">
                     <div className="bg-card border border-border-theme p-12 md:p-20 shadow-2xl relative overflow-hidden theme-transition">
                        <div className="relative z-10">
                           <h2 className="text-4xl md:text-6xl font-serif font-light mb-8">General Inquiry</h2>
                           <p className="text-text-muted mb-16 text-xl font-light leading-relaxed max-w-xl">
                              For press requests, strategic partnerships, or general corporate inquiries, please complete the formal request below.
                           </p>

                           <form onSubmit={handleSubmit} className="space-y-12">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                 <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Full Name</label>
                                    <input name="fullName" required type="text" placeholder="Your Full Name" className="w-full bg-transparent border-b border-border-theme py-4 outline-none focus:border-ls-compliment transition-all text-xl font-light placeholder:text-text-muted/30" />
                                 </div>
                                 <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Email Address</label>
                                    <input name="email" required type="email" placeholder="john@company.com" className="w-full bg-transparent border-b border-border-theme py-4 outline-none focus:border-ls-compliment transition-all text-xl font-light placeholder:text-text-muted/30" />
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Inquiry Type</label>
                                 <div className="relative">
                                    <select name="subject" required defaultValue="" className="w-full bg-transparent border-b border-border-theme py-4 outline-none focus:border-ls-compliment transition-all text-xl font-light appearance-none">
                                       <option value="" disabled hidden>Select category...</option>
                                       <option value="press" className="bg-background">Press & Media</option>
                                       <option value="partnership" className="bg-background">Strategic Partnership</option>
                                       <option value="career" className="bg-background">Career Opportunities</option>
                                       <option value="other" className="bg-background">General Support</option>
                                    </select>
                                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/40 pointer-events-none" />
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <label className="text-[10px] font-bold text-ls-compliment uppercase tracking-[0.4em]">Your Message</label>
                                 <textarea name="message" required rows={6} placeholder="Describe your inquiry..." className="w-full bg-transparent border border-border-theme p-6 outline-none focus:border-ls-compliment transition-all text-xl font-light resize-none placeholder:text-text-muted/30 leading-relaxed"></textarea>
                              </div>

                              <div className="pt-10">
                                 <button
                                    disabled={formStatus !== "idle"}
                                    type="submit"
                                    className="w-full bg-ls-primary py-8 text-ls-white font-bold uppercase tracking-[0.4em] text-xs hover:bg-ls-compliment hover:text-ls-primary transition-all disabled:opacity-50"
                                 >
                                    {formStatus === "idle" && "Transmit Formal Request"}
                                    {formStatus === "submitting" && "Transmitting..."}
                                    {formStatus === "success" && "Transmission Complete"}
                                 </button>
                              </div>

                              {formStatus === "success" && (
                                 <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-8 bg-ls-compliment/10 border border-ls-compliment/30 text-center"
                                 >
                                    <p className="text-ls-compliment font-bold text-sm uppercase tracking-widest leading-relaxed">
                                       Your request has been received. A Finlogic specialist will review your inquiry within 24 business hours.
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
