import { useRef, useEffect } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isScanning: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

export default function BarcodeScanner({ videoRef, isScanning, error, onStart, onStop }: Props) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-black">
        {/* Always mounted so videoRef is available before stream play starts */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${isScanning ? "" : "hidden"}`}
          playsInline
          muted
        />
        {isScanning ? (
          <>
            {/* Scanning guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-1/3 border-2 border-green-400 rounded-lg opacity-70">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br" />
              </div>
            </div>
            <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black/50 py-1">
              Point camera at barcode
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            {error ? (
              <>
                <CameraOff className="h-12 w-12 text-destructive" />
                <p className="text-sm text-destructive text-center px-4">{error}</p>
              </>
            ) : (
              <>
                <Camera className="h-12 w-12" />
                <p className="text-sm">Camera is off</p>
              </>
            )}
          </div>
        )}
      </div>
      <div className="p-3 flex justify-center">
        {isScanning ? (
          <Button variant="outline" size="sm" onClick={onStop}>
            <CameraOff className="h-4 w-4 mr-2" />
            Stop Camera
          </Button>
        ) : (
          <Button size="sm" onClick={onStart}>
            <Camera className="h-4 w-4 mr-2" />
            Start Camera
          </Button>
        )}
      </div>
    </Card>
  );
}