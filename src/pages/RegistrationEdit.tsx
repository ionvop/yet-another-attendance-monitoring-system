import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RegistrationForm from "@/components/RegistrationForm";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Registration, ApiResponse } from "@/utils/types";

export default function RegistrationEdit() {
  const { eventId, registrationId } = useParams<{ eventId: string; registrationId: string }>();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<ApiResponse<Registration>>(`/events/${eventId}/registrations/${registrationId}`)
      .then((res) => setRegistration(res.data))
      .catch(() => {
        toast.error("Registration not found");
        navigate(`/events/${eventId}/registrations`);
      })
      .finally(() => setLoading(false));
  }, [eventId, registrationId, navigate]);

  const handleSubmit = async (data: Record<string, string>) => {
    setSaving(true);
    setErrors({});
    try {
      await api.put<ApiResponse<Registration>>(
        `/events/${eventId}/registrations/${registrationId}`,
        data
      );
      toast.success("Registration updated");
      navigate(`/events/${eventId}/registrations`);
    } catch (err: any) {
      if (err.errors) setErrors(err.errors);
      toast.error(err.message || "Failed to update registration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/events/${eventId}/registrations`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Registration</h1>
          <p className="text-muted-foreground">
            {registration?.first_name} {registration?.last_name} ({registration?.student_id})
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
          <CardDescription>Update the student's registration information.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm
            initialData={registration || undefined}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/events/${eventId}/registrations`)}
            saving={saving}
            errors={errors}
          />
        </CardContent>
      </Card>
    </div>
  );
}