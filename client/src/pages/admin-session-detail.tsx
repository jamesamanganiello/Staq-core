import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Download, FileText, Database, Brain, StickyNote } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type SessionDetail = {
  log: {
    id: number;
    sessionId: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    extractedData: any;
    preliminaryAnalysis: any;
    adminNotes: string | null;
    adminNotesUpdatedAt: string | null;
  };
  customer: {
    companyName: string | null;
    contactName: string | null;
    contactEmail: string | null;
  } | null;
  messages: Array<{
    id: number;
    role: string;
    content: string;
    createdAt: string;
  }>;
};

export default function AdminSessionDetail() {
  const [match, params] = useRoute("/admin/sessions/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const sessionId = params?.id;

  const [notes, setNotes] = useState("");
  const [notesLastSaved, setNotesLastSaved] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<SessionDetail>({
    queryKey: ["/api/admin/sessions", sessionId],
    enabled: !!sessionId,
  });

  const notesMutation = useMutation({
    mutationFn: async (notes: string) => {
      return apiRequest("PATCH", `/api/admin/sessions/${sessionId}/notes`, { notes });
    },
    onSuccess: (response: any) => {
      setNotesLastSaved(response.adminNotesUpdatedAt);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", sessionId] });
    },
  });

  useEffect(() => {
    if (data?.log.adminNotes !== undefined) {
      setNotes(data.log.adminNotes || "");
      setNotesLastSaved(data.log.adminNotesUpdatedAt || null);
    }
  }, [data]);

  const debouncedSaveNotes = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          notesMutation.mutate(value);
        }, 1000);
      };
    })(),
    [sessionId]
  );

  const handleNotesChange = (value: string) => {
    setNotes(value);
    debouncedSaveNotes(value);
  };

  if (error) {
    setLocation("/admin");
    return null;
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  const { log, customer, messages } = data;
  const companyName = customer?.companyName || (log.extractedData?.company_context?.name) || "Unknown Company";
  const contactName = customer?.contactName || (log.extractedData?.contact?.name) || "Unknown Contact";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "abandoned":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"><AlertCircle className="w-3 h-3 mr-1" />Abandoned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const calculateDuration = () => {
    if (!log.startedAt) return "-";
    const start = new Date(log.startedAt);
    const end = log.completedAt ? new Date(log.completedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const exportTranscript = () => {
    let text = `Conversation Transcript\n`;
    text += `Company: ${companyName}\n`;
    text += `Contact: ${contactName}\n`;
    text += `Date: ${formatDate(log.startedAt)}\n`;
    text += `\n${"=".repeat(50)}\n\n`;
    
    messages.forEach((msg) => {
      const role = msg.role === "assistant" ? "Staq" : "Customer";
      const time = formatDate(msg.createdAt);
      text += `[${role}] (${time})\n${msg.content}\n\n`;
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${companyName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderExtractedData = (data: any) => {
    if (!data) return <p className="text-muted-foreground">No data extracted</p>;

    return (
      <div className="space-y-6">
        {data.contact && (
          <section>
            <h4 className="font-semibold mb-2">Contact Info</h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {data.contact.name || "-"}</p>
              <p><span className="text-muted-foreground">Email:</span> {data.contact.email || "-"}</p>
              <p><span className="text-muted-foreground">Role:</span> {data.contact.role || "-"}</p>
            </div>
          </section>
        )}

        {data.company_context && (
          <section>
            <h4 className="font-semibold mb-2">Company Info</h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {data.company_context.name || "-"}</p>
              <p><span className="text-muted-foreground">URL:</span> {data.company_context.url || "-"}</p>
              <p><span className="text-muted-foreground">Product:</span> {data.company_context.product || "-"}</p>
              <p><span className="text-muted-foreground">Target Customer:</span> {data.company_context.target_customer || "-"}</p>
              <p><span className="text-muted-foreground">Industry:</span> {data.company_context.industry_vertical || "-"}</p>
              <p><span className="text-muted-foreground">Sales Team Size:</span> {data.company_context.sales_team_size || "-"}</p>
            </div>
          </section>
        )}

        {data.crm && (
          <section>
            <h4 className="font-semibold mb-2">CRM</h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Platform:</span> {data.crm.name || "-"}</p>
              <p><span className="text-muted-foreground">Duration:</span> {data.crm.duration || "-"}</p>
              <p><span className="text-muted-foreground">Satisfaction:</span> {data.crm.satisfaction ? `${data.crm.satisfaction}/5` : "-"}</p>
            </div>
          </section>
        )}

        {data.tools && data.tools.length > 0 && (
          <section>
            <h4 className="font-semibold mb-2">Tool Stack</h4>
            <div className="space-y-2">
              {data.tools.map((tool: any, i: number) => (
                <div key={i} className="bg-muted/50 rounded-lg p-4 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{tool.name || "Unknown Tool"}</span>
                    {tool.satisfaction && (
                      <Badge variant="outline">{tool.satisfaction}/5</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {tool.category || "Uncategorized"}
                    {tool.seats && ` • ${tool.seats} seats`}
                    {tool.cost && ` • ${tool.cost}`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.pain_points && data.pain_points.length > 0 && (
          <section>
            <h4 className="font-semibold mb-2">Pain Points</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {data.pain_points.map((point: string, i: number) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </section>
        )}

        {data.logistics && (
          <section>
            <h4 className="font-semibold mb-2">Logistics</h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Availability:</span> {data.logistics.availability || "-"}</p>
              <p><span className="text-muted-foreground">Additional Attendees:</span> {data.logistics.additional_attendees || "-"}</p>
              <p><span className="text-muted-foreground">Priority Tools:</span> {data.logistics.priority_tools?.join(", ") || "-"}</p>
            </div>
          </section>
        )}
      </div>
    );
  };

  const renderPreliminaryAnalysis = (analysis: any) => {
    if (!analysis) return <p className="text-muted-foreground">No preliminary analysis available</p>;

    return (
      <div className="space-y-6">
        {analysis.estimated_health_score !== undefined && (
          <section>
            <h4 className="font-semibold mb-2">Health Score Estimate</h4>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">{analysis.estimated_health_score}</div>
              <div className="text-muted-foreground">/100</div>
            </div>
          </section>
        )}

        {analysis.red_flags && analysis.red_flags.length > 0 && (
          <section>
            <h4 className="font-semibold mb-2 text-destructive">Red Flags</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {analysis.red_flags.map((flag: string, i: number) => (
                <li key={i} className="text-destructive/80">{flag}</li>
              ))}
            </ul>
          </section>
        )}

        {analysis.focus_areas && analysis.focus_areas.length > 0 && (
          <section>
            <h4 className="font-semibold mb-2">Screen Share Focus Areas</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {analysis.focus_areas.map((area: string, i: number) => (
                <li key={i}>{area}</li>
              ))}
            </ul>
          </section>
        )}

        {analysis.questions_for_call && analysis.questions_for_call.length > 0 && (
          <section>
            <h4 className="font-semibold mb-2">Questions for Call</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {analysis.questions_for_call.map((q: string, i: number) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/admin/dashboard")}
            className="mb-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-xl" data-testid="text-company-name">
                {companyName}
              </h1>
              <p className="text-muted-foreground" data-testid="text-contact-name">
                {contactName}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {getStatusBadge(log.status || "in_progress")}
              <div className="text-muted-foreground">
                <span className="font-medium">Started:</span> {formatDate(log.startedAt)}
              </div>
              {log.completedAt && (
                <div className="text-muted-foreground">
                  <span className="font-medium">Completed:</span> {formatDate(log.completedAt)}
                </div>
              )}
              <div className="text-muted-foreground">
                <span className="font-medium">Duration:</span> {calculateDuration()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="transcript" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="transcript" data-testid="tab-transcript">
              <FileText className="w-4 h-4 mr-2" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="data" data-testid="tab-data">
              <Database className="w-4 h-4 mr-2" />
              Data
            </TabsTrigger>
            <TabsTrigger value="analysis" data-testid="tab-analysis">
              <Brain className="w-4 h-4 mr-2" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="notes" data-testid="tab-notes">
              <StickyNote className="w-4 h-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcript">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <CardTitle>Conversation Transcript</CardTitle>
                <Button variant="outline" size="sm" onClick={exportTranscript} data-testid="button-export">
                  <Download className="w-4 h-4 mr-2" />
                  Export as Text
                </Button>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No messages</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`p-4 rounded-lg ${
                          msg.role === "assistant" 
                            ? "bg-primary/5 border-l-4 border-primary" 
                            : "bg-muted/50 border-l-4 border-muted-foreground/30"
                        }`}
                        data-testid={`message-${msg.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">
                            {msg.role === "assistant" ? "Staq" : "Customer"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Extracted Data</CardTitle>
              </CardHeader>
              <CardContent>
                {renderExtractedData(log.extractedData)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Preliminary Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {renderPreliminaryAnalysis(log.preliminaryAnalysis)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <CardTitle>Admin Notes</CardTitle>
                {notesLastSaved && (
                  <span className="text-xs text-muted-foreground">
                    Last saved: {formatDate(notesLastSaved)}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Add notes for this session... (auto-saves)"
                  className="min-h-[300px] resize-y"
                  data-testid="textarea-admin-notes"
                />
                {notesMutation.isPending && (
                  <p className="text-xs text-muted-foreground mt-2">Saving...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
