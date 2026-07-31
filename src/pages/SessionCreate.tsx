import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SessionForm from "@/components/SessionForm";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Session, ApiResponse } from "@/utils/types";

export default function SessionCreate() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (data: { name: string; start_time: string; end_time: string }) => {
    setSaving(true);
    setErrors({});
    try {
      await api.post<ApiResponse<Session>>(`/events/${eventId}/sessions`, data);
      toast.success("Session created");
      navigate(`/events/${eventId}/sessions`);
    } catch (err: any) {
      if (err.errors) setErrors(err.errors);
      toast.error(err.message || "Failed to create session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/events/${eventId}/sessions`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Session</h1>
          <p className="text-muted-foreground">Create a new scanning session</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <CardDescription>Set the session name and time window.</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionForm
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