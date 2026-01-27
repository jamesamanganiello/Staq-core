import { useStartChat } from "@/hooks/use-chat";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Layers, BarChart3, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [_location, setLocation] = useLocation();
  const startChatMutation = useStartChat();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      // For MVP, we're skipping the intake form and starting anonymous chat
      // In production, you'd show a dialog to collect customerInfo first
      const result = await startChatMutation.mutateAsync({
        customerInfo: {
          // Optional: Prefilled data or empty
        }
      });
      setLocation(`/chat/${result.sessionId}`);
    } catch (error) {
      console.error("Failed to start chat", error);
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-white to-blue-50/30 flex flex-col">
      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 font-display font-bold text-2xl text-primary">
          <Layers className="w-8 h-8 text-accent" />
          STAQ<span className="text-foreground/80 font-medium">Audit</span>
        </div>
        <button 
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          onClick={() => window.open('https://staq.ai', '_blank')}
        >
          About Us
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            AI-Powered Stack Analysis
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-accent">
            Is Your Sales Stack <br className="hidden md:block"/> Working For You?
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Get an instant, AI-driven audit of your sales and marketing technology. 
            Identify redundancies, gaps, and optimization opportunities in minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="
                group relative px-8 py-4 rounded-xl font-semibold text-lg
                bg-primary text-primary-foreground shadow-lg shadow-primary/25
                hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5
                active:translate-y-0 active:shadow-md
                disabled:opacity-70 disabled:cursor-not-allowed
                transition-all duration-200 ease-out overflow-hidden
              "
            >
              <span className="relative z-10 flex items-center gap-2">
                {isStarting ? "Initializing..." : "Start Free Assessment"}
                {!isStarting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            <p className="text-sm text-muted-foreground mt-4 sm:mt-0 sm:ml-4">
              No credit card required • Takes 2 minutes
            </p>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full text-left"
        >
          {[
            {
              icon: BarChart3,
              title: "Instant Analysis",
              desc: "Our AI analyzes your toolset in real-time against industry benchmarks."
            },
            {
              icon: Layers,
              title: "Stack Consolidation",
              desc: "Identify overlapping tools to reduce spend and complexity."
            },
            {
              icon: ShieldCheck,
              title: "Unbiased Audit",
              desc: "Objective recommendations based on your specific business needs."
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/50 py-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} STAQ. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
