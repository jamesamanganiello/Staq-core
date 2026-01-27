import { motion } from "framer-motion";
import { CheckCircle2, Building2, User, Layers, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AuditReportProps {
  data: {
    contact?: { name: string; company: string; role: string };
    stack?: { 
      crm: string; 
      sales_engagement: string; 
      conversation_intel: string; 
      data_provider: string;
    };
    analysis?: string;
  };
}

export function AuditReport({ data }: AuditReportProps) {
  if (!data) return null;

  const stackItems = [
    { label: "CRM", value: data.stack?.crm || "Not detected", icon: Building2 },
    { label: "Sales Engagement", value: data.stack?.sales_engagement || "Not detected", icon: User },
    { label: "Conversation Intel", value: data.stack?.conversation_intel || "Not detected", icon: FileText },
    { label: "Data Provider", value: data.stack?.data_provider || "Not detected", icon: Layers },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="w-full mt-8"
    >
      <Card className="border-accent/20 bg-gradient-to-br from-white to-accent/5 overflow-hidden shadow-lg shadow-accent/5">
        <div className="h-2 bg-gradient-to-r from-primary to-accent w-full" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display text-primary">Audit Complete</CardTitle>
              <CardDescription>
                Preliminary analysis for {data.contact?.company || "your company"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Analysis Section */}
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
            <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> 
              Executive Summary
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              {data.analysis || "The analysis of your current stack configuration suggests opportunities for consolidation and integration improvement."}
            </p>
          </div>

          {/* Stack Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stackItems.map((item) => (
              <div 
                key={item.label}
                className="flex items-start gap-3 p-3 rounded-lg bg-white border border-border shadow-sm"
              >
                <div className="p-2 bg-muted rounded-md text-primary/70 mt-0.5">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="font-semibold text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Footer */}
          <div className="text-center pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-3">Want a deeper dive into optimization?</p>
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm">
              Schedule Expert Consultation
            </button>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
