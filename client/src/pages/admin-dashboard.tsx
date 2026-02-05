import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Clock, CheckCircle, AlertCircle, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { StaqLogo } from "@/components/staq-logo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";

type Session = {
  id: number;
  sessionId: string;
  companyName: string;
  contactName: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  crmType: string | null;
};

type ToolInsight = {
  name: string;
  mentions: number;
  ratings: Record<number, number>;
};

// Mini pie chart component using conic gradient
function SatisfactionPieChart({ ratings }: { ratings: Record<number, number> }) {
  const total = Object.values(ratings).reduce((sum, count) => sum + count, 0);
  if (total === 0) return <span className="text-gray-400 text-sm">No ratings</span>;
  
  const colors: Record<number, string> = {
    1: "#ef4444", // red
    2: "#f97316", // orange
    3: "#eab308", // yellow
    4: "#84cc16", // light green
    5: "#22c55e", // green
  };
  
  // Build conic gradient
  let gradientParts: string[] = [];
  let currentPercent = 0;
  
  for (let i = 1; i <= 5; i++) {
    const count = ratings[i] || 0;
    if (count > 0) {
      const percent = (count / total) * 100;
      gradientParts.push(`${colors[i]} ${currentPercent}% ${currentPercent + percent}%`);
      currentPercent += percent;
    }
  }
  
  const gradient = `conic-gradient(${gradientParts.join(", ")})`;
  
  return (
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-full"
        style={{ background: gradient }}
        title={Object.entries(ratings).map(([r, c]) => `Rating ${r}: ${c}`).join(", ")}
      />
      <div className="flex flex-wrap gap-1">
        {[1, 2, 3, 4, 5].map((r) => {
          const count = ratings[r] || 0;
          if (count === 0) return null;
          return (
            <span 
              key={r}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: colors[r], color: r <= 2 ? "white" : "black" }}
            >
              {r}: {count}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery<{ sessions: Session[] }>({
    queryKey: ["/api/admin/sessions"],
  });
  
  const { data: insightsData, isLoading: insightsLoading } = useQuery<{ insights: ToolInsight[] }>({
    queryKey: ["/api/admin/tool-insights"],
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout", {});
    setLocation("/admin");
  };

  useEffect(() => {
    if (error) {
      setLocation("/admin");
    }
  }, [error, setLocation]);

  if (error) {
    return null;
  }

  const sessions = data?.sessions || [];
  const filteredSessions = statusFilter === "all" 
    ? sessions 
    : sessions.filter(s => s.status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="status-completed border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="status-in-progress border-0">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "abandoned":
        return (
          <Badge className="status-abandoned border-0">
            <AlertCircle className="w-3 h-3 mr-1" />
            Abandoned
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-light-gray">
      {/* Header - Midnight */}
      <header className="bg-midnight sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <StaqLogo height={32} variant="white" />
            <div className="h-6 w-px bg-gray-600" />
            <span className="text-sm text-gray-400">Admin Dashboard</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout} 
            data-testid="button-logout"
            className="border-gray-600 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Tool Insights Section */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#00B4C4]" />
            <CardTitle className="text-midnight">Tool Insights</CardTitle>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading insights...</div>
            ) : !insightsData?.insights || insightsData.insights.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tool data yet. Complete some intakes to see insights.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insightsData.insights.map((tool) => (
                  <div 
                    key={tool.name}
                    className="border rounded-md p-4 bg-white"
                    data-testid={`tool-insight-${tool.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-midnight">{tool.name}</span>
                      <Badge variant="outline" className="border-[#00B4C4] text-[#00B4C4]">
                        {tool.mentions} mention{tool.mentions !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <SatisfactionPieChart ratings={tool.ratings} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intake Sessions Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-midnight">Intake Sessions</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Filter:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                Loading sessions...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No sessions found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-midnight font-semibold">Company</TableHead>
                      <TableHead className="text-midnight font-semibold">Contact</TableHead>
                      <TableHead className="text-midnight font-semibold">Status</TableHead>
                      <TableHead className="text-midnight font-semibold">Started</TableHead>
                      <TableHead className="text-midnight font-semibold">Completed</TableHead>
                      <TableHead className="text-midnight font-semibold">CRM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow 
                        key={session.id} 
                        className="cursor-pointer table-row-hover transition-brand"
                        onClick={() => setLocation(`/admin/sessions/${session.id}`)}
                        data-testid={`row-session-${session.id}`}
                      >
                        <TableCell className="font-medium text-midnight">{session.companyName}</TableCell>
                        <TableCell>{session.contactName}</TableCell>
                        <TableCell>{getStatusBadge(session.status || "in_progress")}</TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {formatDate(session.startedAt)}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {formatDate(session.completedAt)}
                        </TableCell>
                        <TableCell>
                          {session.crmType ? (
                            <Badge variant="outline" className="border-[#00B4C4] text-[#00B4C4]">
                              {session.crmType}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
