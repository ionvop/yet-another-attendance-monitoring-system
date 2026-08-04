/**
 * Reads the first line of a CSV file and returns the parsed headers.
 * Handles quoted fields (e.g., "Last Name, Jr.").
 */
export function readCsvHeaders(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const firstLine = text.split("\n")[0] ?? "";
      resolve(parseCsvLine(firstLine));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    // Read only the first ~4KB — enough for any reasonable header row
    reader.readAsText(file.slice(0, 4096));
  });
}

/**
 * Parses a single CSV line into an array of values.
 * Handles quoted fields containing commas.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}