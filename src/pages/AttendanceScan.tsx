import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Keyboard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BarcodeScanner from "@/components/BarcodeScanner";
import ScanFeedback from "@/components/ScanFeedback";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { api, BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import type { ScanResult, Session, ApiResponse, Attendance } from "@/utils/types";

export default function AttendanceScan() {
  const { eventId, sessionId } = useParams<{ eventId: string; sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [manualId, setManualId] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const processingRef = useRef(false);

  useEffect(() => {
    api.get<ApiResponse<Session>>(`/events/${eventId}/sessions/${sessionId}`)
      .then((res) => {
        setSession(res.data);
        setScanCount(res.data.attendances_count || 0);
      })
      .catch(() => toast.error("Session not found"));
  }, [eventId, sessionId]);

  const processScan = useCallback(
    async (studentId: string) => {
      if (processingRef.current) return;
      processingRef.current = true;

      // remove the 's' prefix of the scanned ID
      if (studentId.startsWith("S")) studentId = studentId.slice(1);

      try {
        const res = await fetch(
          `${BASE_URL}/sessions/${sessionId}/attendances/scan`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ student_id: studentId }),
          }
        );
        const data = await res.json();

        let result: ScanResult;
        if (res.status === 201) {
          result = { status: "success", ...data.data, message: data.message };
          setScanCount((c) => c + 1);
        } else if (res.status === 409) {
          result = {
            status: "duplicate",
            message: data.message,
            student_id: data.data.student_id,
            first_name: data.data.first_name,
            last_name: data.data.last_name,
            recorded_at: data.data.recorded_at,
          };
        } else {
          result = {
            status: "not_found",
            message: data.message || "Not registered",
            student_id: studentId,
          };
        }

        setScanResult(result);
        setRecentScans((prev) => [result, ...prev].slice(0, 10));
      } catch {
        toast.error("Scan failed. Check connection.");
      } finally {
        processingRef.current = false;
      }
    },
    [sessionId]
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      processScan(manualId.trim());
      setManualId("");
    }
  };

  const { videoRef, isScanning, error, startScanning, stopScanning } = useBarcodeScanner({
    onScan: processScan,
  });

  return (
    <div className="space-y-6">
      <ScanFeedback result={scanResult} onDismiss={() => setScanResult(null)} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/events/${eventId}/sessions`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {session?.name || "Scan Attendance"}
            </h1>
            <p className="text-muted-foreground">
              <Badge variant="secondary" className="mr-2">{scanCount} scanned</Badge>
              Point camera at student ID barcode
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/events/${eventId}/sessions/${sessionId}/attendances`}>
            <Users className="h-4 w-4 mr-2" />
            View All ({scanCount})
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scanner */}
        <div className="lg:col-span-2 space-y-4">
          <BarcodeScanner
            videoRef={videoRef}
            isScanning={isScanning}
            error={error}
            onStart={startScanning}
            onStop={stopScanning}
          />

          {/* Manual input fallback */}
          <Card>
            <CardContent className="pt-4">
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Type student ID manually..."
                    className="pl-9"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={!manualId.trim()}>
                  Scan
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recent scans sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
            {recentScans.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No scans yet. Start scanning to see results here.
              </p>
            ) : (
              recentScans.map((scan, i) => (
                <div key={i}>
                  {i > 0 && <Separator className="my-2" />}
                  <div className="flex items-center gap-2 text-sm">
                    {scan.status === "success" && (
                      <>
                        <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                        <span className="font-medium truncate">
                          {scan.student.first_name} {scan.student.last_name}
                        </span>
                        <span className="text-muted-foreground text-xs ml-auto">
                          {new Date(scan.recorded_at).toLocaleTimeString()}
                        </span>
                      </>
                    )}
                    {scan.status === "duplicate" && (
                      <>
                        <div className="h-2 w-2 rounded-full bg-yellow-500 shrink-0" />
                        <span className="truncate">
                          {scan.first_name} {scan.last_name}
                        </span>
                        <Badge variant="outline" className="text-xs ml-auto">Duplicate</Badge>
                      </>
                    )}
                    {scan.status === "not_found" && (
                      <>
                        <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                        <span className="font-mono text-xs">{scan.student_id}</span>
                        <Badge variant="destructive" className="text-xs ml-auto">Not found</Badge>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}