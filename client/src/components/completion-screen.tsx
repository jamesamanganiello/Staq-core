import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CompletionScreenProps {
  data: {
    contact?: { name: string; email: string; role: string };
    company?: { name: string; url: string; industry: string; description: string };
    tools?: {
      crm: string;
      conversation_intel: { name: string; satisfaction: number | null };
      sales_engagement: { name: string; satisfaction: number | null };
      sales_navigator: { name: string; satisfaction: number | null };
      data_provider: { name: string; satisfaction: number | null };
      other: string[];
    };
    primary_goal?: string;
  };
}

const CALENDLY_URL = import.meta.env.VITE_CALENDLY_URL || "https://calendly.com/placeholder";

export function CompletionScreen({ data }: CompletionScreenProps) {
  const [showCalendly, setShowCalendly] = useState(false);
  
  const name = data?.contact?.name || "there";
  const crmName = data?.tools?.crm || "your CRM";
  
  const toolsToReview: string[] = [];
  if (data?.tools?.conversation_intel?.name && data.tools.conversation_intel.name !== "None") {
    toolsToReview.push(data.tools.conversation_intel.name);
  }
  if (data?.tools?.sales_engagement?.name && data.tools.sales_engagement.name !== "None") {
    toolsToReview.push(data.tools.sales_engagement.name);
  }
  if (data?.tools?.sales_navigator?.name && data.tools.sales_navigator.name !== "None") {
    toolsToReview.push("Sales Navigator");
  }
  if (data?.tools?.data_provider?.name && data.tools.data_provider.name !== "None") {
    toolsToReview.push(data.tools.data_provider.name);
  }
  
  const toolsSummary = toolsToReview.length > 0 
    ? toolsToReview.slice(0, 2).join(" and ") 
    : "your sales tools";

  const steps = [
    {
      number: "1",
      title: "Schedule a 45-minute screen share",
      description: "Pick a time that works for you"
    },
    {
      number: "2", 
      title: "We'll review your stack together",
      description: "Walk through your tools and workflows live"
    },
    {
      number: "3",
      title: "Get your full health score + action plan",
      description: "Delivered within 24 hours of our call"
    }
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full mt-6"
        data-testid="completion-screen"
      >
        <Card className="border-0 bg-gradient-to-br from-white to-primary/5 shadow-xl">
          <div className="h-1.5 bg-gradient-to-r from-primary to-accent w-full" />
          
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-3">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto"
              >
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </motion.div>
              
              <h2 
                className="text-2xl md:text-3xl font-display font-bold text-foreground"
                data-testid="text-completion-title"
              >
                Thanks {name}! You're all set.
              </h2>
              
              <p 
                className="text-muted-foreground text-lg max-w-md mx-auto"
                data-testid="text-completion-summary"
              >
                We'll review your {crmName} setup and dig into {toolsSummary} on the call.
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl p-5 md:p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                What happens next
              </h3>
              
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-4"
                    data-testid={`step-${step.number}`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                      {step.number}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                size="lg"
                className="w-full"
                onClick={() => setShowCalendly(true)}
                data-testid="button-schedule-audit"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Your Audit
              </Button>
            </motion.div>

            <p className="text-center text-sm text-muted-foreground">
              45 minutes • Screen share • No prep needed
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {showCalendly && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowCalendly(false)}
          data-testid="modal-calendly-overlay"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl h-[80vh] bg-white rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-calendly-content"
          >
            <div className="absolute top-3 right-3 z-10">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowCalendly(false)}
                data-testid="button-close-calendly"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <iframe
              src={CALENDLY_URL}
              className="w-full h-full border-0 rounded-xl"
              title="Schedule a call"
              data-testid="iframe-calendly"
            />
          </motion.div>
        </div>
      )}
    </>
  );
}
