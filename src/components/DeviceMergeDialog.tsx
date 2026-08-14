import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Upload, ArrowLeft, Merge } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type {
  DeviceMergePreview,
  DeviceMergeResult,
  Session,
  SessionMapping,
  ApiResponse,
} from "@/utils/types";

interface Props {
  onMergeComplete: () => void;
}

type Step = "select" | "preview" | "result";

export default function DeviceMergeDialog({ onMergeComplete }: Props) {
  const { eventId } = useParams<{ eventId: string }>();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DeviceMergePreview | null>(null);
  const [result, setResult] = useState<DeviceMergeResult | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mapping, setMapping] = useState<SessionMapping>({});
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);

  const loadSessions = async () => {
    try {
      const res = await api.get<ApiResponse<Session[]>>(`/events/${eventId}/sessions`);
      setSessions(res.data);
    } catch {
      // Non-critical; mapping UI will just have fewer options.
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
    setPreview(null);
    setResult(null);
    setMapping({});

    if (!selectedFile) {
      setStep("select");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await api.post<{ data: DeviceMergePreview }>(
        `/events/${eventId}/reports/merge/preview`,
        formData
      );
      setPreview(res.data);
      setStep("preview");
      await loadSessions();
    } catch (err: any) {
      toast.error(err.message || "Failed to read device data");
      setStep("select");
    } finally {
      setLoading(false);
    }
  };

  const unmatchedSessions = useMemo(
    () => (preview?.sessions ?? []).filter((s) => s.status === "unmatched"),
    [preview]
  );

  const canMerge = useMemo(() => {
    // Every unmatched session must have a resolution chosen.
    return unmatchedSessions.every((s) => mapping[s.name] !== undefined);
  }, [unmatchedSessions, mapping]);

  const handleMerge = async () => {
    if (!file) return;
    setMerging(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("session_mapping", JSON.stringify(mapping));
      const res = await api.post<{ data: DeviceMergeResult }>(
        `/events/${eventId}/reports/merge`,
        formData
      );
      setResult(res.data);
      setStep("result");
      toast.success("Device data merged successfully");
      onMergeComplete();
    } catch (err: any) {
      toast.error(err.message || "Merge failed");
    } finally {
      setMerging(false);
    }
  };

  const resetDialog = () => {
    setStep("select");
    setFile(null);
    setPreview(null);
    setResult(null);
    setMapping({});
    setLoading(false);
    setMerging(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Merge className="h-4 w-4 mr-2" />
          Merge from Device
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "select" && "Merge Device Data"}
            {step === "preview" && "Review Merge"}
            {step === "result" && "Merge Results"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" &&
              "Upload a device data file exported from another device. Registrations and attendance will be merged into this device."}
            {step === "preview" &&
              "Review what will be merged. Resolve any session name conflicts below."}
            {step === "result" && "The merge is complete. Review the summary below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: File selection */}
          {step === "select" && (
            <>
              <div className="space-y-2">
                <Label>Device Data File (.json)</Label>
                <Input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Export this file from another device via the Reports page, then
                upload it here to merge its data into this device.
              </p>
            </>
          )}

          {/* Step 2: Preview + session mapping */}
          {step === "preview" && preview && (
            <>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Merge Preview</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {preview.total_registrations} registrations
                  </Badge>
                  <Badge variant="secondary">
                    {preview.total_attendances} attendance records
                  </Badge>
                  <Badge variant="default">
                    {preview.new_registrations_count} new registrations
                  </Badge>
                </div>
                {preview.source_event_name && (
                  <p className="text-xs text-muted-foreground">
                    Source event: {preview.source_event_name}
                  </p>
                )}
              </div>

              <Separator />

              {unmatchedSessions.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">
                      Session Conflicts ({unmatchedSessions.length})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      These sessions from the other device don't exist on this
                      device. Map each to an existing session or create it new.
                    </p>
                  </div>
                  {unmatchedSessions.map((s) => (
                    <div key={s.name} className="space-y-1.5">
                      <Label className="text-sm">
                        {s.name}
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          (from other device)
                        </span>
                      </Label>
                      <Select
                        value={mapping[s.name] ?? ""}
                        onValueChange={(v) =>
                          setMapping((prev) => ({ ...prev, [s.name]: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose how to handle this session" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="create">Create new session</SelectItem>
                          {sessions.map((existing) => (
                            <SelectItem key={existing.id} value={String(existing.id)}>
                              Map to: {existing.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  All sessions matched automatically. No conflicts to resolve.
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setStep("select"); setPreview(null); setFile(null); }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleMerge}
                  disabled={!canMerge || merging}
                  className="flex-1"
                >
                  {merging ? "Merging..." : "Confirm Merge"}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Results */}
          {step === "result" && result && (
            <>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Merge Results</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">
                    {result.registrations_created} registrations created
                  </Badge>
                  <Badge variant="secondary">
                    {result.sessions_created} sessions created
                  </Badge>
                  <Badge variant="default">
                    {result.attendances_created} attendance added
                  </Badge>
                  {result.attendances_skipped > 0 && (
                    <Badge variant="outline">
                      {result.attendances_skipped} skipped (already present)
                    </Badge>
                  )}
                </div>

                {result.errors.length > 0 && (
                  <div className="text-xs text-destructive mt-2">
                    <p className="font-medium">Errors:</p>
                    {result.errors.slice(0, 5).map((err, i) => (
                      <p key={i}>
                        {err.student_id} / {err.session}: {err.reason}
                      </p>
                    ))}
                    {result.errors.length > 5 && (
                      <p>...and {result.errors.length - 5} more</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setStep("select"); setPreview(null); setResult(null); setFile(null); }}
                >
                  Merge Another
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </>
          )}

          {loading && (
            <p className="text-sm text-muted-foreground">Reading device data...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
