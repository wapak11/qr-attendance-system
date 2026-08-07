"use client"

import { useEffect, useRef, useState } from "react"

type QrScannerProps = {
  active: boolean
  onScan: (text: string) => void
}

const REGION_ID = "qr-reader-region"

export function QrScanner({ active, onScan }: QrScannerProps) {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null)
  const onScanRef = useRef(onScan)
  const startedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)

  // Keep latest callback without restarting the camera.
  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!active) return

    let cancelled = false

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode")
        if (cancelled) return

        const scanner = new Html5Qrcode(REGION_ID, { verbose: false })
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => onScanRef.current(decodedText),
          () => {
            // per-frame decode failures are normal; ignore
          },
        )
        startedRef.current = true
        setError(null)
      } catch (err) {
        console.log("[v0] scanner start error:", err instanceof Error ? err.message : err)
        setError(
          "Unable to access the camera. Grant camera permission and use a secure (HTTPS) connection.",
        )
      }
    }

    start()

    return () => {
      cancelled = true
      const scanner = scannerRef.current
      if (scanner && startedRef.current) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {})
        startedRef.current = false
      }
      scannerRef.current = null
    }
  }, [active])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
      <div id={REGION_ID} className="aspect-square w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />

      {/* Scan frame overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-3/5 w-3/5">
          <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-primary" />
          <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-primary" />
          <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-primary" />
          <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-primary" />
        </div>
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center">
          <p className="text-sm leading-relaxed text-white text-pretty">{error}</p>
        </div>
      )}
    </div>
  )
}
