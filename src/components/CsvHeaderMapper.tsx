import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CsvHeaderMapping } from "@/utils/types";

interface Props {
  detectedHeaders: string[];
  value: CsvHeaderMapping;
  onChange: (mapping: CsvHeaderMapping) => void;
  eventAliases: Record<string, string>;
}

interface HeaderDef {
  key: string;
  label: string;
  required: boolean;
}

const EXPECTED_HEADERS: HeaderDef[] = [
  { key: "timestamp", label: "Timestamp", required: false },
  { key: "student id", label: "Student ID", required: true },
  { key: "first name", label: "First Name", required: true },
  { key: "last name", label: "Last Name", required: true },
  { key: "year level", label: "Year Level", required: true },
  { key: "course", label: "Course", required: true },
];

/**
 * Auto-match a detected CSV header to an expected field.
 * Returns the column index, or null if no match.
 */
function autoMatch(
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

    // Match via event alias: alias maps CSV header → expected key
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

export default function CsvHeaderMapper({
  detectedHeaders,
  value,
  onChange,
  eventAliases,
}: Props) {
  // Detect duplicate column assignments
  const duplicateColumns = useMemo(() => {
    const seen = new Map<number, string[]>();
    for (const [key, idx] of Object.entries(value)) {
      if (idx !== null && idx !== undefined) {
        const existing = seen.get(idx) ?? [];
        existing.push(key);
        seen.set(idx, existing);
      }
    }
    const dupes = new Set<number>();
    for (const [idx, keys] of seen) {
      if (keys.length > 1) dupes.add(idx);
    }
    return dupes;
  }, [value]);

  const handleChange = (key: string, raw: string) => {
    const newMapping = { ...value };
    if (raw === "__skip__") {
      newMapping[key] = null;
    } else {
      newMapping[key] = parseInt(raw, 10);
    }
    onChange(newMapping);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Map each expected field to the corresponding column in your CSV file.
        Required fields are marked with <span className="text-destructive">*</span>.
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-x-3 gap-y-2 text-xs font-medium text-muted-foreground px-1">
        <span>Expected Field</span>
        <span>CSV Column</span>
      </div>

      {EXPECTED_HEADERS.map((header) => {
        const selectedIdx = value[header.key];
        const isDuplicate =
          selectedIdx !== null &&
          selectedIdx !== undefined &&
          duplicateColumns.has(selectedIdx);

        return (
          <div
            key={header.key}
            className="grid grid-cols-[1fr_1fr] gap-x-3 gap-y-1 items-center"
          >
            <Label className="text-sm truncate">
              {header.label}
              {header.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>

            <div className="space-y-1">
              <Select
                value={
                  selectedIdx !== null && selectedIdx !== undefined
                    ? String(selectedIdx)
                    : "__skip__"
                }
                onValueChange={(v) => handleChange(header.key, v)}
              >
                <SelectTrigger
                  className={isDuplicate ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__skip__">
                    {header.required ? "— Select —" : "Skip"}
                  </SelectItem>
                  {detectedHeaders.map((h, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {h || `(Column ${i + 1})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isDuplicate && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Multiple fields mapped to this column
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}