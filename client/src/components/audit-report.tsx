import { motion } from "framer-motion";
import { CheckCircle2, Building2, User, Layers, FileText, Target, AlertTriangle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ToolInfo {
  name: string;
  satisfaction: number | null;
}

interface AuditReportProps {
  data: {
    contact?: { name: string; email: string; role: string };
    company?: { name: string; url: string; industry: string; description: string };
    team?: { size: string; composition: string };
    sales_motion?: {
      inbound_outbound_ratio: string;
      deal_velocity: string;
      deal_size: string;
      buyer_linkedin_activity: string;
      call_heavy: string;
      ops_owner: string;
      current_mode: string;
    };
    tools?: {
      crm: string;
      conversation_intel: ToolInfo;
      sales_engagement: ToolInfo;
      sales_navigator: ToolInfo;
      data_provider: ToolInfo;
      other: string[];
    };
    primary_goal?: string;
    analysis?: {
      tool_fit_signals: string[];
      potential_mismatches: string[];
      flags_for_call: string[];
      recommended_focus_areas: string[];
    };
  };
}

export function AuditReport({ data }: AuditReportProps) {
  if (!data) return null;

  const tools = data.tools;
  const analysis = data.analysis;

  const toolItems = [
    { label: "CRM", value: tools?.crm || "Not detected", satisfaction: null },
    { label: "Sales Engagement", value: tools?.sales_engagement?.name || "Not detected", satisfaction: tools?.sales_engagement?.satisfaction },
    { label: "Conversation Intel", value: tools?.conversation_intel?.name || "Not detected", satisfaction: tools?.conversation_intel?.satisfaction },
    { label: "Sales Navigator", value: tools?.sales_navigator?.name || "Not detected", satisfaction: tools?.sales_navigator?.satisfaction },
    { label: "Data Provider", value: tools?.data_provider?.name || "Not detected", satisfaction: tools?.data_provider?.satisfaction },
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
              <CardTitle className="text-2xl font-display text-primary">Intake Complete</CardTitle>
              <CardDescription>
                Preliminary analysis for {data.company?.name || data.contact?.name || "your company"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Company & Contact Info */}
          {(data.contact || data.company) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.contact && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-border shadow-sm">
                  <div className="p-2 bg-muted rounded-md text-primary/70 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</p>
                    <p className="font-semibold text-foreground">{data.contact.name}</p>
                    <p className="text-sm text-muted-foreground">{data.contact.role}</p>
                  </div>
                </div>
              )}
              {data.company && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-border shadow-sm">
                  <div className="p-2 bg-muted rounded-md text-primary/70 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</p>
                    <p className="font-semibold text-foreground">{data.company.name}</p>
                    <p className="text-sm text-muted-foreground">{data.company.industry}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Primary Goal */}
          {data.primary_goal && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
              <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" /> 
                Primary Goal
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {data.primary_goal}
              </p>
            </div>
          )}

          {/* Stack Grid */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Current Tech Stack
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {toolItems.map((item) => (
                <div 
                  key={item.label}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border border-border shadow-sm"
                >
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="font-semibold text-foreground text-sm">{item.value}</p>
                  </div>
                  {item.satisfaction && (
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {item.satisfaction}/5
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Sections */}
          {analysis && (
            <div className="space-y-4">
              {/* Tool Fit Signals */}
              {analysis.tool_fit_signals?.length > 0 && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Tool-Fit Signals
                  </h4>
                  <ul className="space-y-1">
                    {analysis.tool_fit_signals.map((signal, i) => (
                      <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Potential Mismatches */}
              {analysis.potential_mismatches?.length > 0 && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Potential Mismatches
                  </h4>
                  <ul className="space-y-1">
                    {analysis.potential_mismatches.map((mismatch, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        {mismatch}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Focus Areas */}
              {analysis.recommended_focus_areas?.length > 0 && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Recommended Focus Areas
                  </h4>
                  <ul className="space-y-1">
                    {analysis.recommended_focus_areas.map((area, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Flags for Call */}
              {analysis.flags_for_call?.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-xl border border-border">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Topics for Screen Share Call
                  </h4>
                  <ul className="space-y-1">
                    {analysis.flags_for_call.map((flag, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-muted-foreground mt-1">•</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* CTA Footer */}
          <div className="text-center pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-3">Ready to schedule your screen share call?</p>
            <button 
              data-testid="button-schedule-call"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm"
            >
              Schedule Call
            </button>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
