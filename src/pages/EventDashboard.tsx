import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Users, Clock, BarChart3, Pencil, Trash2, Plus, Upload, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Event, ApiResponse } from "@/utils/types";

export default function EventDashboard() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiResponse<Event>>(`/events/${eventId}`)
      .then((res) => setEvent(res.data))
      .catch(() => {
        toast.error("Event not found");
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [eventId, navigate]);

  const handleDelete = async () => {
    try {
      await api.delete(`/events/${eventId}`);
      toast.success("Event deleted");
      navigate("/");
    } catch {
      toast.error("Failed to delete event");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
          {event.description && (
            <p className="text-muted-foreground mt-1">{event.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/events/${eventId}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{event.name}" and all its registrations,
                  sessions, and attendance records. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registrations
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event.registrations_count ?? 0}</div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" asChild>
                <Link to={`/events/${eventId}/registrations`}>
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Import CSV
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/events/${eventId}/registrations/new`}>
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sessions
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event.sessions_count ?? 0}</div>
            <Button size="sm" variant="outline" className="mt-3" asChild>
              <Link to={`/events/${eventId}/sessions`}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Manage Sessions
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reports
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">&nbsp;</div>
            <Button size="sm" variant="outline" className="mt-3" asChild>
              <Link to={`/events/${eventId}/reports`}>
                <BarChart3 className="h-3.5 w-3.5 mr-1" />
                View Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}