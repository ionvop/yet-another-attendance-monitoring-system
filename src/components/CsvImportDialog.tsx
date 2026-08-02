import { useState } from "react";
import { useParams } from "react-router-dom";
import { Upload, UserPlus } from "lucide-react";
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
import type { ImportResponse } from "@/utils/types";

interface Props {
  onImportComplete: () => void;
}

export default function CsvImportDialog({ onImportComplete }: Props) {
  const { eventId } = useParams<{ eventId: string }>();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState("insert_only");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);
      const res = await api.post<ImportResponse>(`/events/${eventId}/registrations/import`, formData);
      setResult(res);
      toast.success(`Imported ${res.data.imported} registrations`);
      onImportComplete();
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Registrations</DialogTitle>
          <DialogDescription>
            Upload a CSV file exported from Google Forms. Expected columns: Timestamp, Student ID,
            First Name, Last Name, Year Level, Course. You can configure custom column name aliases
            in the event settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>CSV File (.csv, max 5MB)</Label>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="space-y-2">
            <Label>Import Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="insert_only">Insert Only (skip duplicates)</SelectItem>
                <SelectItem value="upsert">Upsert (update existing)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? "Importing..." : "Start Import"}
          </Button>

          {result && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Import Results</h4>
                <div className="flex gap-3">
                  <Badge variant="default">{result.data.imported} imported</Badge>
                  {result.data.updated > 0 && (
                    <Badge variant="secondary">{result.data.updated} updated</Badge>
                  )}
                  {result.data.skipped > 0 && (
                    <Badge variant="outline">{result.data.skipped} skipped</Badge>
                  )}
                  {result.data.failed > 0 && (
                    <Badge variant="destructive">{result.data.failed} failed</Badge>
                  )}
                </div>

                {result.skipped_rows.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    <p className="font-medium">Skipped rows:</p>
                    {result.skipped_rows.slice(0, 5).map((r, i) => (
                      <p key={i}>Row {r.row}: {r.reason}</p>
                    ))}
                    {result.skipped_rows.length > 5 && (
                      <p>...and {result.skipped_rows.length - 5} more</p>
                    )}
                  </div>
                )}

                {result.failed_rows.length > 0 && (
                  <div className="text-xs text-destructive mt-2">
                    <p className="font-medium">Failed rows:</p>
                    {result.failed_rows.slice(0, 5).map((r, i) => (
                      <p key={i}>Row {r.row}: {r.reason}</p>
                    ))}
                    {result.failed_rows.length > 5 && (
                      <p>...and {result.failed_rows.length - 5} more</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}