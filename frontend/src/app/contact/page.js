"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Mail, Phone, Clock, Send, ArrowRight, Building } from "lucide-react";
import Link from "next/link";
import { contactService } from "@/services/contact";
import { toast } from "sonner";

export default function ContactPage() {
   const [formStatus, setFormStatus] = useState("idle");

   const handleSubmit = async (e) => {
      e.preventDefault();
      setFormStatus("submitting");
      
      const formData = new FormData(e.target);
      const fullName = formData.get("fullName").trim();
      const nameParts = fullName.split(' ');
      const first_name = nameParts[0];
      const last_name = nameParts.slice(1).join(' ') || ' '; // API requires last_name

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
      } catch (error) {
         console.error("Contact submission error:", error);
         setFormStatus("idle");
         toast?.error("Failed to send inquiry. Please try again later.");
      }
   };

   return (
      <div className="bg-ls-primary text-ls-white min-h-screen">

         {/* Header */}
         <section className="relative pt-32 pb-16 overflow-hidden">
            <div className="absolute inset-0 bg-abstract-gradient opacity-20 pointer-events-none" />
            <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
               <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-block px-4 py-1 rounded-full border border-ls-compliment/30 text-ls-compliment text-sm font-bold uppercase tracking-widest mb-6 bg-ls-compliment/10"
               >
                  Connect With Us
               </motion.div>
               <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-bold mb-6 max-w-4xl mx-auto"
               >
                  Let's build the <span className="text-ls-compliment">future together.</span>
               </motion.h1>
               <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl text-ls-white/70 max-w-2xl mx-auto mb-12 flex items-center justify-center font-medium"
               >
                  <MapPin className="w-5 h-5 mr-2 text-ls-compliment" /> Headquartered in Kathmandu, Nepal. Operating globally.
               </motion.p>
            </div>
         </section>

         {/* Main Content Areas */}
         <section className="py-16">
            <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
               <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">

                  {/* Left Column: Contact Info & Specific CTAs */}
                  <div className="w-full lg:w-1/3 space-y-12">

                     {/* Office Info */}
                     <div>
                        <h3 className="text-2xl font-bold mb-6 flex items-center">
                           <Building className="w-6 h-6 mr-3 text-ls-compliment" /> Headquarters
                        </h3>
                        <div className="space-y-6 text-ls-white/70">
                           <div className="flex items-start">
                              <MapPin className="w-5 h-5 mr-4 mt-1 shrink-0 text-ls-white/40" />
                              <p>Finlogic Capital Limited<br />Kathmandu, Bagmati 44600<br />Nepal</p>
                           </div>
                           <div className="flex items-center">
                              <Mail className="w-5 h-5 mr-4 shrink-0 text-ls-white/40" />
                              <a href="mailto:contact@finlogic.capital" className="hover:text-ls-compliment transition-colors">contact@finlogic.capital</a>
                           </div>
                           <div className="flex items-center">
                              <Phone className="w-5 h-5 mr-4 shrink-0 text-ls-white/40" />
                              <span>+977-9851437351</span>
                           </div>
                           <div className="flex items-center">
                              <Clock className="w-5 h-5 mr-4 shrink-0 text-ls-white/40" />
                              <span>Mon-Fri, 9:00 AM - 6:00 PM NPT</span>
                           </div>
                        </div>
                     </div>

                     {/* Specific Action Portals */}
                     <div className="space-y-4 pt-8 border-t border-ls-supporting/20">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-ls-white/40 mb-4">Specific Inquiries</h3>

                        <Link href="/entrepreneurs" className="block glass-card p-6 rounded-2xl hover:border-ls-compliment/50 transition-all group">
                           <h4 className="font-bold text-lg mb-1 group-hover:text-ls-compliment transition-colors">Submit a Project</h4>
                           <p className="text-sm text-ls-white/50 mb-4">For founders seeking capital and partnership.</p>
                           <div className="text-xs font-bold text-ls-compliment flex items-center uppercase tracking-widest">
                              Go to Founders Portal <ArrowRight className="w-3 h-3 ml-2 transform group-hover:translate-x-1 transition-transform" />
                           </div>
                        </Link>

                        <Link href="/investors#request-access" className="block glass-card p-6 rounded-2xl hover:border-ls-compliment/50 transition-all group">
                           <h4 className="font-bold text-lg mb-1 group-hover:text-ls-compliment transition-colors">Investor Access</h4>
                           <p className="text-sm text-ls-white/50 mb-4">Request access to our co-investment vehicles.</p>
                           <div className="text-xs font-bold text-ls-compliment flex items-center uppercase tracking-widest">
                              Go to Investors Portal <ArrowRight className="w-3 h-3 ml-2 transform group-hover:translate-x-1 transition-transform" />
                           </div>
                        </Link>
                     </div>

                  </div>

                  {/* Right Column: General Inquiry Form */}
                  <div className="w-full lg:w-2/3">
                     <div className="glass-card rounded-[2rem] p-8 md:p-12 h-full">
                        <h2 className="text-3xl font-bold mb-2">General Inquiry</h2>
                        <p className="text-ls-white/50 mb-10">Use this form for press, partnerships, or general questions not related to funding or investing.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-xs font-bold text-ls-white/40 uppercase tracking-widest pl-2">Full Name</label>
                                 <input name="fullName" required type="text" className="w-full bg-ls-supporting/10 border border-ls-supporting/30 rounded-xl px-5 py-4 outline-none focus:border-ls-compliment focus:bg-ls-supporting/20 transition-all text-ls-white" />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-xs font-bold text-ls-white/40 uppercase tracking-widest pl-2">Email Address</label>
                                 <input name="email" required type="email" className="w-full bg-ls-supporting/10 border border-ls-supporting/30 rounded-xl px-5 py-4 outline-none focus:border-ls-compliment focus:bg-ls-supporting/20 transition-all text-ls-white" />
                              </div>
                           </div>

                           <div className="space-y-2">
                              <label className="text-xs font-bold text-ls-white/40 uppercase tracking-widest pl-2">Subject</label>
                              <select name="subject" required defaultValue="" className="w-full bg-ls-supporting/10 border border-ls-supporting/30 rounded-xl px-5 py-4 outline-none focus:border-ls-compliment focus:bg-ls-supporting/20 transition-all text-ls-white appearance-none">
                                 <option value="" disabled hidden>Select an inquiry type...</option>
                                 <option value="press" className="text-ls-primary">Press & Media</option>
                                 <option value="partnership" className="text-ls-primary">Strategic Partnership</option>
                                 <option value="career" className="text-ls-primary">Career Opportunities</option>
                                 <option value="other" className="text-ls-primary">Other</option>
                              </select>
                           </div>

                           <div className="space-y-2">
                              <label className="text-xs font-bold text-ls-white/40 uppercase tracking-widest pl-2">Message</label>
                              <textarea name="message" required rows={5} className="w-full bg-ls-supporting/10 border border-ls-supporting/30 rounded-xl px-5 py-4 outline-none focus:border-ls-compliment focus:bg-ls-supporting/20 transition-all text-ls-white resize-none"></textarea>
                           </div>

                           <button
                              disabled={formStatus !== "idle"}
                              type="submit"
                              className="w-full rounded-xl bg-ls-white text-ls-primary font-bold py-5 transition-all hover:bg-ls-white/90 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center mt-4"
                           >
                              {formStatus === "idle" && (
                                 <>Send Inquiry <Send className="w-4 h-4 ml-2" /></>
                              )}
                              {formStatus === "submitting" && (
                                 <div className="w-6 h-6 border-4 border-ls-primary/30 border-t-ls-primary rounded-full animate-spin"></div>
                              )}
                              {formStatus === "success" && "Response Received!"}
                           </button>

                           {formStatus === "success" && (
                              <motion.p
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className="text-center text-ls-compliment font-bold text-sm mt-4"
                              >
                                 Thank you for reaching out. A member of our team will contact you shortly.
                              </motion.p>
                           )}
                        </form>
                     </div>
                  </div>

               </div>
            </div>
         </section>

      </div>
   );
}
