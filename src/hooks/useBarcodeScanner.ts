import { useState, useRef, useCallback, useEffect } from "react";
import { scanImageData, setModuleArgs } from "@undecaf/zbar-wasm";

// Point ZBar to the WASM file served from Laravel's public directory
setModuleArgs({
  locateFile: (filename: string) => `/${filename}`,
});

interface BarcodeDetectorOptions {
  formats: string[];
}

interface DetectedBarcode {
  rawValue: string;
  format: string;
  cornerPoints: { x: number; y: number }[];
  boundingBox: DOMRectReadOnly;
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats(): Promise<string[]>;
  detect(image: HTMLVideoElement | ImageBitmap): Promise<DetectedBarcode[]>;
}

interface UseBarcodeScannerOptions {
  onScan: (studentId: string) => void;
}

const BARCODE_FORMATS = [
  "code_128",
  "code_39",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "qr_code",
];

function hasNativeBarcodeDetector(): boolean {
  return "BarcodeDetector" in window;
}

export function useBarcodeScanner({ onScan }: UseBarcodeScannerOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const cooldownRef = useRef(false);

  const stopScanning = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  /**
   * Extract ImageData from the current video frame using a hidden canvas.
   */
  const captureFrame = useCallback((): ImageData | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, []);

  const startScanning = useCallback(async () => {
    setError(null);

    const useNative = hasNativeBarcodeDetector();

    // Initialize native detector upfront if available
    if (useNative && !detectorRef.current) {
      detectorRef.current = new BarcodeDetector({
        formats: BARCODE_FORMATS,
      });
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);

      // ── Native BarcodeDetector detection loop ──
      const detectNative = async () => {
        if (
          !videoRef.current ||
          !detectorRef.current ||
          videoRef.current.readyState < 2
        ) {
          rafRef.current = requestAnimationFrame(detectNative);
          return;
        }

        try {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          if (barcodes.length > 0 && !cooldownRef.current) {
            cooldownRef.current = true;
            setLastScanned(barcodes[0].rawValue);
            onScan(barcodes[0].rawValue);
            setTimeout(() => {
              cooldownRef.current = false;
            }, 2000);
          }
        } catch {
          // Detection can fail on some frames, ignore
        }

        rafRef.current = requestAnimationFrame(detectNative);
      };

      // ── ZBar WASM fallback detection loop ──
      const detectZbar = async () => {
        if (cooldownRef.current) {
          rafRef.current = requestAnimationFrame(detectZbar);
          return;
        }

        const imageData = captureFrame();
        if (!imageData) {
          rafRef.current = requestAnimationFrame(detectZbar);
          return;
        }

        try {
          const symbols = await scanImageData(imageData);
          if (symbols.length > 0) {
            cooldownRef.current = true;
            const value = symbols[0].decode();
            setLastScanned(value);
            onScan(value);
            setTimeout(() => {
              cooldownRef.current = false;
            }, 2000);
          }
        } catch {
          // Detection can fail on some frames, ignore
        }

        rafRef.current = requestAnimationFrame(detectZbar);
      };

      rafRef.current = requestAnimationFrame(
        useNative ? detectNative : detectZbar
      );
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera access.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError(err.message || "Failed to start camera.");
      }
      stopScanning();
    }
  }, [onScan, stopScanning, captureFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopScanning();
  }, [stopScanning]);

  return {
    videoRef,
    isScanning,
    error,
    lastScanned,
    startScanning,
    stopScanning,
  };
}