import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, LogOut, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
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
import { useState } from "react";

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

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery<{ sessions: Session[] }>({
    queryKey: ["/api/admin/sessions"],
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout", {});
    setLocation("/admin");
  };

  if (error) {
    setLocation("/admin");
    return null;
  }

  const sessions = data?.sessions || [];
  const filteredSessions = statusFilter === "all" 
    ? sessions 
    : sessions.filter(s => s.status === statusFilter);

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
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Staq Admin</h1>
              <p className="text-xs text-muted-foreground">Intake Sessions</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <CardTitle>Intake Sessions</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter:</span>
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
              <div className="text-center py-12 text-muted-foreground">
                Loading sessions...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No sessions found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>CRM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow 
                        key={session.id} 
                        className="cursor-pointer hover-elevate"
                        onClick={() => setLocation(`/admin/sessions/${session.id}`)}
                        data-testid={`row-session-${session.id}`}
                      >
                        <TableCell className="font-medium">{session.companyName}</TableCell>
                        <TableCell>{session.contactName}</TableCell>
                        <TableCell>{getStatusBadge(session.status || "in_progress")}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(session.startedAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(session.completedAt)}
                        </TableCell>
                        <TableCell>
                          {session.crmType ? (
                            <Badge variant="outline">{session.crmType}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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
