import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, ArrowRight } from "lucide-react";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

interface CompletionScreenProps {
  data: {
    contact?: { name: string; email: string; role: string };
    company_context?: { 
      name: string; 
      url: string; 
      product: string;
      target_customer: string;
      industry_vertical: string;
    };
  };
}

const CALENDLY_URL = import.meta.env.VITE_CALENDLY_URL || "https://calendly.com/PLACEHOLDER";

export function CompletionScreen({ data }: CompletionScreenProps) {
  const name = data?.contact?.name || "there";

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  const openCalendly = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url: CALENDLY_URL });
    } else {
      window.open(CALENDLY_URL, "_blank");
    }
  };

  const steps = [
    "I'll review your responses and prep for our call",
    "You'll get a calendar invite with a prep checklist",
    "On the call, we'll screen share through your CRM together",
    "Within 24 hours, you'll receive your full health check report"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="w-full mt-6"
      data-testid="completion-screen"
    >
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Card Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Success Icon */}
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#10B981]/10 mx-auto"
            >
              <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
            </motion.div>
            
            <h2 
              className="text-2xl md:text-3xl font-display font-bold text-midnight"
              data-testid="text-completion-title"
            >
              You're all set, {name}!
            </h2>
            
            <p 
              className="text-gray-500 text-lg"
              data-testid="text-completion-subtitle"
            >
              Here's what happens next:
            </p>
          </div>

          {/* Steps List */}
          <div className="bg-light-gray rounded-lg p-5 md:p-6">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4"
                  data-testid={`step-${index + 1}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-midnight text-white font-bold flex items-center justify-center text-sm">
                    {index + 1}
                  </div>
                  <p className="font-medium text-midnight pt-1">{step}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <button 
              onClick={openCalendly}
              data-testid="button-schedule-screen-share"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#00B4C4] text-white font-semibold text-lg rounded-md hover:bg-[#0099A8] transition-brand shadow-cyan hover:shadow-cyan-lg"
            >
              <Calendar className="w-5 h-5" />
              Schedule Your Screen Share
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
