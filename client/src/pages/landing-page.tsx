import { useStartChat } from "@/hooks/use-chat";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, ShieldCheck, Layers, MessageSquare, Calendar, FileCheck } from "lucide-react";
import { useState } from "react";
import { StaqLogo } from "@/components/staq-logo";

export default function LandingPage() {
  const [_location, setLocation] = useLocation();
  const startChatMutation = useStartChat();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const result = await startChatMutation.mutateAsync({
        customerInfo: {}
      });
      setLocation(`/chat/${result.sessionId}`);
    } catch (error) {
      console.error("Failed to start chat", error);
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section - Midnight Background */}
      <section className="bg-midnight text-white">
        {/* Navigation */}
        <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <a href="/" data-testid="link-home">
            <StaqLogo height={40} variant="white" />
          </a>
        </nav>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6 text-white leading-tight">
              Is Your Sales Stack <br className="hidden md:block"/>
              <span className="text-[#00D4E8]">Working For You?</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Get an AI-powered audit of your sales and marketing technology. 
              Identify redundancies, gaps, and optimization opportunities in minutes.
            </p>

            <div className="flex flex-col items-center gap-6">
              <button
                onClick={handleStart}
                disabled={isStarting}
                data-testid="button-start-assessment"
                className="
                  group relative px-8 py-4 rounded-md font-semibold text-lg
                  bg-[#00B4C4] text-white shadow-cyan-lg
                  hover:bg-[#0099A8] hover:scale-[1.02] hover:shadow-cyan
                  active:scale-100
                  disabled:opacity-70 disabled:cursor-not-allowed
                  transition-brand
                "
              >
                <span className="flex items-center gap-2">
                  {isStarting ? "Starting..." : "Start Free Assessment"}
                  {!isStarting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </span>
              </button>
              
              <p className="text-sm text-gray-400">
                No credit card required • Takes 5-10 minutes
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Props Section - White Background */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-midnight mb-4">
              What You'll Get
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI analyzes your tech stack against best practices to surface actionable insights.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Stack Analysis",
                desc: "Real-time evaluation against industry benchmarks and best practices."
              },
              {
                icon: Layers,
                title: "Consolidation Opportunities",
                desc: "Identify overlapping tools to reduce spend and complexity."
              },
              {
                icon: ShieldCheck,
                title: "Unbiased Recommendations",
                desc: "Objective advice based on your specific business needs and goals."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white p-6 rounded-lg border-l-4 border-deep-cyan shadow-sm hover:shadow-md transition-brand"
              >
                <div className="w-12 h-12 bg-[#00B4C4]/10 rounded-lg flex items-center justify-center text-[#00B4C4] mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-midnight mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Light Gray Background */}
      <section className="py-20 bg-light-gray">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-midnight mb-4">
              How It Works
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-[#00B4C4]/30" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {[
                {
                  num: 1,
                  icon: MessageSquare,
                  title: "Quick Chat",
                  desc: "Answer a few questions about your sales tools and processes."
                },
                {
                  num: 2,
                  icon: FileCheck,
                  title: "AI Analysis",
                  desc: "Our AI evaluates your stack and identifies key opportunities."
                },
                {
                  num: 3,
                  icon: Calendar,
                  title: "Expert Review",
                  desc: "Schedule a screen share to review findings with our team."
                }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="text-center relative"
                >
                  <div className="w-12 h-12 bg-midnight text-white rounded-full flex items-center justify-center font-display font-bold text-lg mx-auto mb-4 relative z-10">
                    {step.num}
                  </div>
                  <div className="w-10 h-10 bg-[#00B4C4]/10 rounded-lg flex items-center justify-center text-[#00B4C4] mx-auto mb-3">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-midnight mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mt-16"
          >
            <button
              onClick={handleStart}
              disabled={isStarting}
              data-testid="button-start-assessment-secondary"
              className="
                px-8 py-4 rounded-md font-semibold text-lg
                bg-[#00B4C4] text-white shadow-cyan
                hover:bg-[#0099A8] hover:scale-[1.02]
                active:scale-100
                disabled:opacity-70 disabled:cursor-not-allowed
                transition-brand
              "
            >
              <span className="flex items-center gap-2">
                {isStarting ? "Starting..." : "Get Started Now"}
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer - Midnight Background */}
      <footer className="bg-midnight py-8">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <StaqLogo height={24} variant="white" />
            <span className="text-sm text-gray-500">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>
          <a 
            href="/admin" 
            className="text-xs text-gray-600 hover:text-gray-400 transition-brand"
            data-testid="link-admin"
          >
            Admin
          </a>
        </div>
      </footer>
    </div>
  );
}
