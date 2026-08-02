import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  aliases: Record<string, string>;
  onChange: (aliases: Record<string, string>) => void;
  disabled?: boolean;
}

const EXPECTED_HEADERS = ["timestamp", "student id", "first name", "last name", "year level", "course"];

export default function CsvAliasEditor({ aliases, onChange, disabled }: Props) {
  const entries = Object.entries(aliases);

  const updateEntry = (index: number, key: string, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = [key, value];
    onChange(Object.fromEntries(newEntries));
  };

  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    onChange(Object.fromEntries(newEntries));
  };

  const addEntry = () => {
    onChange({ ...aliases, "": "" });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Map non-standard CSV column headers to the expected names. The expected headers are:
        <code className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded">
          {EXPECTED_HEADERS.join(", ")}
        </code>
      </div>

      {entries.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>CSV Header Name</span>
            <span>Maps To</span>
            <span className="w-8" />
          </div>
          {entries.map(([key, value], index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <Input
                value={key}
                onChange={(e) => updateEntry(index, e.target.value, value)}
                placeholder="e.g. Student Number"
                disabled={disabled}
              />
              <Input
                value={value}
                onChange={(e) => updateEntry(index, key, e.target.value)}
                placeholder="e.g. student id"
                disabled={disabled}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeEntry(index)}
                disabled={disabled}
                className="h-10 w-8 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addEntry}
        disabled={disabled}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Alias
      </Button>
    </div>
  );
}