import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Search, Trash2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Attendance, ApiResponse, PaginationMeta } from "@/utils/types";

export default function SessionAttendanceList() {
  const { eventId, sessionId } = useParams<{ eventId: string; sessionId: string }>();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchAttendances = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: "25" };
      if (search) params.search = search;
      const res = await api.get<ApiResponse<Attendance[]>>(
        `/sessions/${sessionId}/attendances`,
        params
      );
      setAttendances(res.data);
      setMeta(res.meta || null);
    } catch {
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }, [sessionId, page, search]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/sessions/${sessionId}/attendances/${id}`);
      toast.success("Attendance record removed");
      fetchAttendances();
    } catch {
      toast.error("Failed to delete record");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/events/${eventId}/sessions`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Attendance Records</h1>
            <p className="text-muted-foreground">
              {meta ? `${meta.total} records` : "Session attendance list"}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to={`/events/${eventId}/sessions/${sessionId}/scan`}>
            <ScanLine className="h-4 w-4 mr-2" />
            Scan Mode
          </Link>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by ID or name..."
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Student ID</th>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Year Level</th>
                    <th className="text-left px-4 py-3 font-medium">Course</th>
                    <th className="text-left px-4 py-3 font-medium">Recorded At</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-t animate-pulse">
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-muted rounded w-3/4" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : attendances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    attendances.map((att) => (
                      <tr key={att.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">
                          {att.student?.student_id}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {att.student?.first_name} {att.student?.last_name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{att.student?.year_level}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{att.student?.course}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(att.recorded_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Attendance Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove the attendance record for {att.student?.first_name}{" "}
                                  {att.student?.last_name}? This is for correcting mis-scans.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(att.id)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">{meta.total} total</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {meta.current_page} of {meta.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}