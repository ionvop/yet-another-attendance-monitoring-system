import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { toast } from "sonner";
import CsvAliasEditor from "@/components/CsvAliasEditor";
import type { Event, ApiResponse } from "@/utils/types";

export default function EventEdit() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [csvColumnAliases, setCsvColumnAliases] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.get<ApiResponse<Event>>(`/events/${eventId}`)
      .then((res) => {
        setName(res.data.name);
        setDescription(res.data.description || "");
        setCsvColumnAliases(res.data.csv_column_aliases || {});
      })
      .catch(() => {
        toast.error("Event not found");
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [eventId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api.put<ApiResponse<Event>>(`/events/${eventId}`, {
        name,
        description: description || null,
        csv_column_aliases: Object.fromEntries(
          Object.entries(csvColumnAliases).filter(([key]) => key.trim() !== "")
        ),
      });
      toast.success("Event updated");
      navigate(`/events/${eventId}`);
    } catch (err: any) {
      if (err.errors) setErrors(err.errors);
      toast.error(err.message || "Failed to update event");
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
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${eventId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Event</h1>
          <p className="text-muted-foreground">Update event details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Edit the event name and description.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={255}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description[0]}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(`/events/${eventId}`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !name.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSV Column Aliases</CardTitle>
          <CardDescription>
            Configure alternative column names for CSV imports. When uploading a CSV, headers matching
            these aliases will be mapped to the expected column names.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CsvAliasEditor
            aliases={csvColumnAliases}
            onChange={setCsvColumnAliases}
            disabled={saving}
          />
          {errors.csv_column_aliases && (
            <p className="text-sm text-destructive mt-2">{errors.csv_column_aliases[0]}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}