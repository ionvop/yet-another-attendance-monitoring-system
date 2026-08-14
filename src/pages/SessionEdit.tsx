import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SessionForm from "@/components/SessionForm";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Session, ApiResponse } from "@/utils/types";

export default function SessionEdit() {
  const { eventId, sessionId } = useParams<{ eventId: string; sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<ApiResponse<Session>>(`/events/${eventId}/sessions/${sessionId}`)
      .then((res) => setSession(res.data))
      .catch(() => {
        toast.error("Session not found");
        navigate(`/events/${eventId}/sessions`);
      })
      .finally(() => setLoading(false));
  }, [eventId, sessionId, navigate]);

  const handleSubmit = async (data: { name: string; start_time: string }) => {
    setSaving(true);
    setErrors({});
    try {
      await api.put<ApiResponse<Session>>(`/events/${eventId}/sessions/${sessionId}`, data);
      toast.success("Session updated");
      navigate(`/events/${eventId}/sessions`);
    } catch (err: any) {
      if (err.errors) setErrors(err.errors);
      toast.error(err.message || "Failed to update session");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/events/${eventId}/sessions`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Session</h1>
          <p className="text-muted-foreground">{session?.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <CardDescription>Update the session name and time window.</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionForm
            initialData={
              session
                ? { name: session.name, start_time: session.start_time }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/events/${eventId}/sessions`)}
            saving={saving}
            errors={errors}
          />
        </CardContent>
      </Card>
    </div>
  );
}