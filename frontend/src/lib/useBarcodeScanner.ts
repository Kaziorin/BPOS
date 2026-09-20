"use client";

import { useEffect, useRef } from "react";

/**
 * Synthesizes a crisp, positive POS confirmation beep using Web Audio API.
 * 100% offline, zero latency, no audio files required.
 */
export function playScanSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1760, ctx.currentTime); // High-pitch 1760Hz (A6) POS beep
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // AudioContext blocked or unsupported - silently fail
  }
}

/**
 * Synthesizes a low-pitch warning buzz for unfound barcodes.
 */
export function playScanErrorBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {}
}

export interface UseBarcodeScannerOptions {
  /** Callback fired when a barcode is successfully detected and terminated with Enter/Tab */
  onScan: (barcode: string) => void | Promise<void>;
  /** Toggle scanner listening on/off (e.g. disable when modal is open) */
  enabled?: boolean;
  /** Minimum characters to qualify as a barcode (default: 3) */
  minChars?: number;
  /** Maximum interval between keystrokes in ms to distinguish hardware scanner from human typing (default: 60) */
  maxIntervalMs?: number;
  /** Whether to play auditory beep on scan (default: true) */
  soundEnabled?: boolean;
}

/**
 * Global Hardware Barcode Scanner Listener Hook.
 * Listens for rapid keystroke sequences (typical of USB/Bluetooth HID laser readers)
 * across the whole window, even when no search input is focused.
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minChars = 3,
  maxIntervalMs = 60,
  soundEnabled = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore modifier key combinations
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now = Date.now();
      const timeDiff = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // When Enter or Tab arrives, check if we have accumulated a rapid barcode scan
      if (e.key === "Enter" || e.key === "Tab") {
        const barcode = bufferRef.current.trim();
        bufferRef.current = "";

        if (barcode.length >= minChars) {
          e.preventDefault();
          e.stopPropagation();
          if (soundEnabled) {
            playScanSuccessBeep();
          }
          onScanRef.current(barcode);
        }
        return;
      }

      // Normal printable characters
      if (e.key.length === 1) {
        // If the gap between characters is too long (> maxIntervalMs), it's human typing — reset buffer
        if (timeDiff > maxIntervalMs) {
          bufferRef.current = "";
        }
        bufferRef.current += e.key;
      }
    }

    // Capture phase listener ensures hardware scanner is detected regardless of DOM focus
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, minChars, maxIntervalMs, soundEnabled]);
}
