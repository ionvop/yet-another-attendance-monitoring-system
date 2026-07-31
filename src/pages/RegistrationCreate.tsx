import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RegistrationForm from "@/components/RegistrationForm";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Registration, ApiResponse } from "@/utils/types";

export default function RegistrationCreate() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (data: Record<string, string>) => {
    setSaving(true);
    setErrors({});
    try {
      await api.post<ApiResponse<Registration>>(`/events/${eventId}/registrations`, data);
      toast.success("Registration added");
      navigate(`/events/${eventId}/registrations`);
    } catch (err: any) {
      if (err.errors) setErrors(err.errors);
      toast.error(err.message || "Failed to add registration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/events/${eventId}/registrations`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Registration</h1>
          <p className="text-muted-foreground">Manually add a student registration</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
          <CardDescription>Enter the student's registration information.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm
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