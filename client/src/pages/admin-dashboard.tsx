import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Clock, CheckCircle, AlertCircle, BarChart3, Users } from "lucide-react";
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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  avgSatisfaction: number | null;
  totalRatings: number;
};

function getBarColor(avg: number | null): string {
  if (avg === null) return "#9ca3af";
  if (avg >= 4.0) return "#22c55e";
  if (avg >= 3.0) return "#eab308";
  return "#ef4444";
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"sessions" | "analytics">("sessions");

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

  const insights = insightsData?.insights || [];

  const mentionChartData = {
    labels: insights.map(t => t.name),
    datasets: [{
      label: "Mentions",
      data: insights.map(t => t.mentions),
      backgroundColor: "#00B4C4",
      borderRadius: 4,
    }],
  };

  const toolsWithRatings = insights.filter(t => t.avgSatisfaction !== null);
  const satisfactionChartData = {
    labels: toolsWithRatings.map(t => t.name),
    datasets: [{
      label: "Avg Satisfaction",
      data: toolsWithRatings.map(t => t.avgSatisfaction),
      backgroundColor: toolsWithRatings.map(t => getBarColor(t.avgSatisfaction)),
      borderRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const satisfactionChartOptions = {
    ...chartOptions,
    scales: {
      y: { 
        beginAtZero: true,
        max: 5,
        ticks: { stepSize: 1 },
      },
    },
  };

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

      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("sessions")}
            data-testid="tab-sessions"
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "sessions"
                ? "border-[#00B4C4] text-[#00B4C4]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users className="w-4 h-4" />
            Intake Sessions
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            data-testid="tab-analytics"
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "analytics"
                ? "border-[#00B4C4] text-[#00B4C4]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Tool Analytics
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "sessions" && (
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
                <div className="text-center py-12 text-gray-500">Loading sessions...</div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No sessions found</div>
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
                          <TableCell className="text-gray-500 text-sm">{formatDate(session.startedAt)}</TableCell>
                          <TableCell className="text-gray-500 text-sm">{formatDate(session.completedAt)}</TableCell>
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
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {insightsLoading ? (
              <div className="text-center py-12 text-gray-500">Loading analytics...</div>
            ) : insights.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    No tool data yet. Complete some intakes to see analytics.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-midnight">Tool Mention Frequency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <Bar data={mentionChartData} options={chartOptions} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-midnight">Average Satisfaction by Tool</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="inline-block w-3 h-3 rounded-sm bg-green-500 mr-1"></span> 4.0-5.0 (Great)
                      <span className="inline-block w-3 h-3 rounded-sm bg-yellow-500 ml-3 mr-1"></span> 3.0-3.9 (Mixed)
                      <span className="inline-block w-3 h-3 rounded-sm bg-red-500 ml-3 mr-1"></span> 1.0-2.9 (Low)
                    </p>
                  </CardHeader>
                  <CardContent>
                    {toolsWithRatings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No satisfaction ratings yet.
                      </div>
                    ) : (
                      <div className="h-[300px]">
                        <Bar data={satisfactionChartData} options={satisfactionChartOptions} />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-midnight">Detailed Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-midnight font-semibold">Tool</TableHead>
                          <TableHead className="text-midnight font-semibold text-center">Mentions</TableHead>
                          <TableHead className="text-midnight font-semibold text-center">Ratings</TableHead>
                          <TableHead className="text-midnight font-semibold text-center">Avg Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insights.map((tool) => (
                          <TableRow key={tool.name} data-testid={`tool-row-${tool.name.toLowerCase().replace(/\s+/g, "-")}`}>
                            <TableCell className="font-medium text-midnight">{tool.name}</TableCell>
                            <TableCell className="text-center">{tool.mentions}</TableCell>
                            <TableCell className="text-center">{tool.totalRatings}</TableCell>
                            <TableCell className="text-center">
                              {tool.avgSatisfaction !== null ? (
                                <Badge 
                                  style={{ 
                                    backgroundColor: getBarColor(tool.avgSatisfaction),
                                    color: tool.avgSatisfaction >= 3.0 && tool.avgSatisfaction < 4.0 ? "black" : "white"
                                  }}
                                >
                                  {tool.avgSatisfaction.toFixed(1)}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
