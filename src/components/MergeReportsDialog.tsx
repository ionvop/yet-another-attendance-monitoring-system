import { useState } from "react";
import { useParams } from "react-router-dom";
import { Merge, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { BASE_URL } from "@/lib/api";
import { toast } from "sonner";

export default function MergeReportsDialog() {
  const { eventId } = useParams<{ eventId: string }>();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error("Please select at least two report files to merge.");
      return;
    }

    setMerging(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files[]", file));

      const response = await fetch(`${BASE_URL}/events/${eventId}/reports/merge`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Merge failed";
        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged-attendance.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Merged report downloaded");
      setOpen(false);
      setFiles([]);
    } catch (err: any) {
      toast.error(err.message || "Merge failed");
    } finally {
      setMerging(false);
    }
  };

  const resetDialog = () => {
    setFiles([]);
    setMerging(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetDialog();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Merge className="h-4 w-4 mr-2" />
          Merge Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Merge Reports</DialogTitle>
          <DialogDescription>
            Select the attendance report (.xlsx) exported from each device. The
            reports are merged into a single file, marking a student present for
            a session if any device recorded them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Report Files (.xlsx)</Label>
            <Input
              type="file"
              accept=".xlsx"
              multiple
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="secondary" className="shrink-0">
                      {index + 1}
                    </Badge>
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleMerge}
            disabled={files.length < 2 || merging}
            className="w-full"
          >
            {merging ? "Merging..." : "Merge & Download"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
