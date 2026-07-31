import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScanResult } from "@/utils/types";

interface Props {
  result: ScanResult | null;
  onDismiss: () => void;
}

export default function ScanFeedback({ result, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (result) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [result, onDismiss]);

  if (!result) return null;

  const isSuccess = result.status === "success";
  const isDuplicate = result.status === "duplicate";
  const isNotFound = result.status === "not_found";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={cn(
          "relative rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-4 animate-in zoom-in-95 fade-in",
          isSuccess && "bg-green-50 border border-green-200",
          isDuplicate && "bg-yellow-50 border border-yellow-200",
          isNotFound && "bg-red-50 border border-red-200"
        )}
      >
        {isSuccess && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-800 mb-1">
              Welcome, {result.student.first_name} {result.student.last_name}
            </h2>
            <p className="text-sm text-green-600">
              {result.student.student_id} · {result.student.year_level} · {result.student.course}
            </p>
          </>
        )}

        {isDuplicate && (
          <>
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-yellow-800 mb-1">Already Scanned</h2>
            <p className="text-sm text-yellow-600">
              {result.first_name} {result.last_name} ({result.student_id}) was already recorded at{" "}
              {new Date(result.recorded_at).toLocaleTimeString()}
            </p>
          </>
        )}

        {isNotFound && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-1">Not Registered</h2>
            <p className="text-sm text-red-600">
              Student ID {result.student_id} is not registered for this event.
            </p>
          </>
        )}
      </div>
    </div>
  );
}