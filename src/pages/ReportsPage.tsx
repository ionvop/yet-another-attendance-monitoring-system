import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { api, BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import DeviceMergeDialog from "@/components/DeviceMergeDialog";
import type { ReportData, ReportSession, Session, ApiResponse } from "@/utils/types";

export default function ReportsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [report, setReport] = useState<ReportData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<Session[]>>(`/events/${eventId}/sessions`);
      setSessions(res.data);
    } catch {
      toast.error("Failed to load sessions");
    }
  }, [eventId]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | string[]> = {};
      if (selectedSessions.length > 0) {
        params["session_ids[]"] = selectedSessions;
      }
      const res = await api.get<{ data: ReportData }>(
        `/events/${eventId}/reports/attendance`,
        params as Record<string, string>
      );
      setReport(res.data);
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [eventId, selectedSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = () => {
    const params = new URLSearchParams();
    selectedSessions.forEach((id) => params.append("session_ids[]", id));
    const url = `${BASE_URL}/events/${eventId}/reports/attendance/export${params.toString() ? "?" + params.toString() : ""}`;
    window.open(url, "_blank");
    toast.success("Export started");
  };

  const handleDeviceExport = () => {
    const url = `${BASE_URL}/events/${eventId}/reports/device/export`;
    window.open(url, "_blank");
    toast.success("Device data export started");
  };

  const toggleSession = (id: string) => {
    setSelectedSessions((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Attendance Report</h1>
            <p className="text-muted-foreground">
              {report?.event.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DeviceMergeDialog onMergeComplete={fetchReport} />
          <Button variant="outline" onClick={handleDeviceExport}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Device Data
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Session filter */}
      {sessions.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`session-${s.id}`}
                    checked={selectedSessions.length === 0 || selectedSessions.includes(String(s.id))}
                    onCheckedChange={() => toggleSession(String(s.id))}
                  />
                  <Label htmlFor={`session-${s.id}`} className="text-sm cursor-pointer">
                    {s.name}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedSessions.length === 0
                ? "All sessions selected"
                : `${selectedSessions.length} session(s) selected`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Registered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.total_registered}</div>
              </CardContent>
            </Card>
            {report.summary.per_session.map((s) => (
              <Card key={s.session}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.session}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600">{s.present}</span>
                    <span className="text-sm text-muted-foreground">present</span>
                    <span className="text-lg font-semibold text-red-500 ml-2">{s.absent}</span>
                    <span className="text-sm text-muted-foreground">absent</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Attendance matrix table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Student ID</th>
                        <th className="text-left px-4 py-3 font-medium">Name</th>
                        <th className="text-left px-4 py-3 font-medium">Year</th>
                        <th className="text-left px-4 py-3 font-medium">Course</th>
                        {report.sessions.map((s) => (
                          <th key={s.id} className="text-center px-4 py-3 font-medium">
                            {s.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.map((row, i) => (
                        <tr key={i} className="border-t hover:bg-muted/30">
                          <td className="px-4 py-2 font-mono text-xs">{row.student_id}</td>
                          <td className="px-4 py-2">
                            {row.last_name}, {row.first_name}
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant="secondary" className="text-xs">{row.year_level}</Badge>
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant="outline" className="text-xs">{row.course}</Badge>
                          </td>
                          {report.sessions.map((s) => {
                            const timestamp = row.attendance[s.name];
                            return (
                              <td key={s.id} className="px-4 py-2 text-center">
                                {timestamp ? (
                                  <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                                    {new Date(timestamp).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-red-500 border-red-200 text-xs">
                                    Absent
                                  </Badge>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {loading && !report && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                <div className="h-8 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}