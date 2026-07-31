import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SessionCard from "@/components/SessionCard";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Session, ApiResponse } from "@/utils/types";

export default function SessionsList() {
  const { eventId } = useParams<{ eventId: string }>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Session[]>>(`/events/${eventId}/sessions`);
      setSessions(res.data);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/events/${eventId}/sessions/${id}`);
      toast.success("Session deleted");
      fetchSessions();
    } catch {
      toast.error("Failed to delete session");
    }
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
            <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
            <p className="text-muted-foreground">Manage attendance scanning sessions</p>
          </div>
        </div>
        <Button asChild>
          <Link to={`/events/${eventId}/sessions/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Session
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-5 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No sessions yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Create sessions (e.g. Morning, Afternoon) to start scanning attendance.
            </p>
            <Button asChild>
              <Link to={`/events/${eventId}/sessions/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              eventId={eventId!}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}