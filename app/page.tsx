"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { QrScanner } from "@/components/qr-scanner"
import { recordScan, type ScanResult } from "@/app/actions"

function formatClock(d: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d)
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d)
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso))
}

export default function ScannerPage() {
  const [now, setNow] = useState<Date | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [manualId, setManualId] = useState("")
  const [pending, setPending] = useState(false)
  const lastScanRef = useRef<{ value: string; at: number }>({ value: "", at: 0 })

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const submit = useCallback(async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return

    // Debounce identical scans fired repeatedly by the camera.
    const nowMs = Date.now()
    if (lastScanRef.current.value === trimmed && nowMs - lastScanRef.current.at < 3000) {
      return
    }
    lastScanRef.current = { value: trimmed, at: nowMs }

    setPending(true)
    try {
      const res = await recordScan(trimmed)
      setResult(res)
    } finally {
      setPending(false)
    }
  }, [])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submit(manualId)
    setManualId("")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <QrIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight">QR Attendance</h1>
              <p className="text-xs text-muted-foreground">Scan to record attendance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/records"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              View Records
            </Link>
            <Link
              href="/admin"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* Clock */}
        <section className="mb-8 text-center">
          <p className="font-mono text-5xl font-semibold tabular-nums tracking-tight text-balance sm:text-6xl">
            {now ? formatClock(now) : "--:--:--"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{now ? formatDate(now) : ""}</p>
        </section>

        {/* Result banner */}
        {result && <ResultBanner result={result} />}

        {/* Scanner */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          {scanning ? (
            <>
              <QrScanner active={scanning} onScan={submit} />
              <button
                onClick={() => setScanning(false)}
                className="mt-4 w-full rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                Stop Camera
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setResult(null)
                setScanning(true)
              }}
              className="flex w-full flex-col items-center gap-3 rounded-xl bg-primary px-6 py-12 text-primary-foreground transition-opacity hover:opacity-90"
            >
              <CameraIcon className="h-8 w-8" />
              <span className="text-base font-semibold">Start Camera Scan</span>
              <span className="text-xs opacity-80">Point the camera at a student QR code</span>
            </button>
          )}

          {/* Manual entry fallback */}
          <form onSubmit={handleManualSubmit} className="mt-5 border-t border-border pt-5">
            <label htmlFor="manual" className="mb-2 block text-xs font-medium text-muted-foreground">
              Or enter a student ID manually
            </label>
            <div className="flex gap-2">
              <input
                id="manual"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="e.g. 2024-IT-0001"
                className="min-w-0 flex-1 rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={pending || !manualId.trim()}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "..." : "Record"}
              </button>
            </div>
          </form>
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground text-pretty">
          Each student is recorded once per day (Asia/Manila). Duplicate scans are ignored.
        </p>
      </main>
    </div>
  )
}

function ResultBanner({ result }: { result: ScanResult }) {
  if (result.ok && result.status === "recorded") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-success/30 bg-success/10 p-5">
        <StatusIcon className="h-10 w-10 shrink-0 text-success" kind="check" />
        <div>
          <p className="text-lg font-semibold text-success">Attendance Recorded</p>
          <p className="text-sm text-foreground">
            {result.name} <span className="font-mono text-muted-foreground">({result.studentId})</span>
          </p>
          <p className="text-xs text-muted-foreground">Marked present at {formatTime(result.time)}</p>
        </div>
      </div>
    )
  }

  if (result.ok && result.status === "already") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-5">
        <StatusIcon className="h-10 w-10 shrink-0 text-primary" kind="info" />
        <div>
          <p className="text-lg font-semibold text-primary">Already Checked In</p>
          <p className="text-sm text-foreground">
            {result.name} <span className="font-mono text-muted-foreground">({result.studentId})</span>
          </p>
          <p className="text-xs text-muted-foreground">First scanned at {formatTime(result.time)}</p>
        </div>
      </div>
    )
  }

  if (!result.ok && result.status === "unknown") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-5">
        <StatusIcon className="h-10 w-10 shrink-0 text-destructive" kind="x" />
        <div>
          <p className="text-lg font-semibold text-destructive">Unknown Student</p>
          <p className="text-sm text-foreground">
            No student matches <span className="font-mono">{result.studentId}</span>
          </p>
          <p className="text-xs text-muted-foreground">Check that the QR code is in the roster.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-5">
      <StatusIcon className="h-10 w-10 shrink-0 text-destructive" kind="x" />
      <div>
        <p className="text-lg font-semibold text-destructive">Something Went Wrong</p>
        <p className="text-sm text-muted-foreground">{!result.ok ? result.message : "Please try again."}</p>
      </div>
    </div>
  )
}

function QrIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 14v.01M14 21h.01M21 17v4M17 21h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function StatusIcon({ className, kind }: { className?: string; kind: "check" | "x" | "info" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      {kind === "check" && <path d="M8 12.5l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />}
      {kind === "x" && <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" strokeLinejoin="round" />}
      {kind === "info" && <path d="M12 8h.01M11 12h1v4h1" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}
