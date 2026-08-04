import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Upload, ArrowLeft } from "lucide-react";
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
import CsvHeaderMapper from "@/components/CsvHeaderMapper";
import { api } from "@/lib/api";
import { readCsvHeaders } from "@/utils/csv";
import { toast } from "sonner";
import type { ImportResponse, CsvHeaderMapping, Event, ApiResponse } from "@/utils/types";

interface Props {
  onImportComplete: () => void;
}

type Step = "select" | "map" | "result";

export default function CsvImportDialog({ onImportComplete }: Props) {
  const { eventId } = useParams<{ eventId: string }>();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState("insert_only");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);

  // Header detection
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [readingHeaders, setReadingHeaders] = useState(false);

  // Event aliases for auto-match
  const [eventAliases, setEventAliases] = useState<Record<string, string>>({});

  // Column mapping state
  const [mapping, setMapping] = useState<CsvHeaderMapping>({});

  // Fetch event aliases when dialog opens
  useEffect(() => {
    if (open && eventId) {
      api
        .get<ApiResponse<Event>>(`/events/${eventId}`)
        .then((res) => {
          setEventAliases(res.data.csv_column_aliases ?? {});
        })
        .catch(() => {
          // Non-critical; proceed without aliases
        });
    }
  }, [open, eventId]);

  // Auto-match when detectedHeaders or eventAliases change
  useEffect(() => {
    if (detectedHeaders.length === 0) return;

    const autoMapping: CsvHeaderMapping = {};
    const expectedKeys = [
      "timestamp",
      "student id",
      "first name",
      "last name",
      "year level",
      "course",
    ];

    for (const key of expectedKeys) {
      autoMapping[key] = autoMatchColumn(key, detectedHeaders, eventAliases);
    }

    setMapping(autoMapping);
  }, [detectedHeaders, eventAliases]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
    setResult(null);

    if (!selectedFile) {
      setStep("select");
      setDetectedHeaders([]);
      return;
    }

    setReadingHeaders(true);
    try {
      const headers = await readCsvHeaders(selectedFile);
      setDetectedHeaders(headers);
      setStep("map");
    } catch {
      toast.error("Failed to read CSV headers");
      setDetectedHeaders([]);
    } finally {
      setReadingHeaders(false);
    }
  };

  const canImport = useMemo(() => {
    const requiredKeys = ["student id", "first name", "last name", "year level", "course"];
    const assignedColumns = new Set<number>();

    for (const key of requiredKeys) {
      const idx = mapping[key];
      if (idx === null || idx === undefined) return false;
      if (assignedColumns.has(idx)) return false; // duplicate column
      assignedColumns.add(idx);
    }

    return true;
  }, [mapping]);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);
      formData.append("mapping", JSON.stringify(mapping));
      const res = await api.post<ImportResponse>(
        `/events/${eventId}/registrations/import`,
        formData,
      );
      setResult(res);
      setStep("result");
      toast.success(`Imported ${res.data.imported} registrations`);
      onImportComplete();
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleBack = () => {
    setStep("select");
    setDetectedHeaders([]);
    setMapping({});
    setResult(null);
  };

  const resetDialog = () => {
    setStep("select");
    setFile(null);
    setMode("insert_only");
    setDetectedHeaders([]);
    setMapping({});
    setResult(null);
    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "select" && "Import Registrations"}
            {step === "map" && "Map CSV Columns"}
            {step === "result" && "Import Results"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" &&
              "Upload a CSV file exported from Google Forms. Expected columns: Timestamp, Student ID, First Name, Last Name, Year Level, Course."}
            {step === "map" &&
              `Detected ${detectedHeaders.length} column(s) in "${file?.name}". Match each expected field to a CSV column.`}
            {step === "result" && "Review the import summary below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: File selection */}
          {step === "select" && (
            <>
              <div className="space-y-2">
                <Label>CSV File (.csv, max 5MB)</Label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
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
                disabled={!file || readingHeaders}
                className="w-full"
              >
                {readingHeaders ? "Reading headers..." : "Start Import"}
              </Button>
            </>
          )}

          {/* Step 2: Column mapping */}
          {step === "map" && (
            <>
              <CsvHeaderMapper
                detectedHeaders={detectedHeaders}
                value={mapping}
                onChange={setMapping}
                eventAliases={eventAliases}
              />

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!canImport || importing}
                  className="flex-1"
                >
                  {importing ? "Importing..." : "Import"}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Results */}
          {step === "result" && result && (
            <>
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

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Import Another
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Auto-match an expected header key to a detected CSV column index.
 * Returns the column index, or null if no match.
 */
function autoMatchColumn(
  expectedKey: string,
  detectedHeaders: string[],
  aliases: Record<string, string>,
): number | null {
  const normalizedExpected = expectedKey.toLowerCase().trim();

  for (let i = 0; i < detectedHeaders.length; i++) {
    const normalizedDetected = detectedHeaders[i].toLowerCase().trim();

    // Exact match
    if (normalizedDetected === normalizedExpected) {
      return i;
    }

    // Match via event alias: alias key → expected target
    for (const [aliasKey, aliasTarget] of Object.entries(aliases)) {
      if (
        aliasTarget.toLowerCase().trim() === normalizedExpected &&
        normalizedDetected === aliasKey.toLowerCase().trim()
      ) {
        return i;
      }
    }
  }

  return null;
}