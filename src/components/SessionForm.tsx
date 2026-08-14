import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  initialData?: { name: string; start_time: string };
  onSubmit: (data: { name: string; start_time: string }) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  errors: Record<string, string[]>;
}

export default function SessionForm({ initialData, onSubmit, onCancel, saving, errors }: Props) {
  const [name, setName] = useState(initialData?.name || "");
  const [startTime, setStartTime] = useState(
    initialData?.start_time
      ? new Date(initialData.start_time).toISOString().slice(0, 16)
      : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      start_time: new Date(startTime).toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Session Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning"
          required
          maxLength={255}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="start_time">Start Time *</Label>
        <Input
          id="start_time"
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
        {errors.start_time && <p className="text-sm text-destructive">{errors.start_time[0]}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name.trim() || !startTime}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}