import Link from "next/link"
import { getRecords, getStudents, getTodayCount } from "@/app/actions"
import { manilaDay } from "@/lib/db"
import { ClearTodayButton } from "@/components/clear-today-button"

export const dynamic = "force-dynamic"

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso))
}

export default async function RecordsPage() {
  const [records, students, todayCount] = await Promise.all([
    getRecords(),
    getStudents(),
    getTodayCount(),
  ])

  const today = manilaDay()
  const totalStudents = students.length
  const absentToday = Math.max(totalStudents - todayCount, 0)

  const stats = [
    { label: "Present Today", value: todayCount, tone: "success" as const },
    { label: "Absent Today", value: absentToday, tone: "muted" as const },
    { label: "Total Students", value: totalStudents, tone: "primary" as const },
    { label: "All-time Records", value: records.length, tone: "muted" as const },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <h1 className="text-sm font-semibold leading-tight">Attendance Records</h1>
            <p className="text-xs text-muted-foreground">Asia/Manila &middot; {today}</p>
          </div>
          <div className="flex items-center gap-2">
            <ClearTodayButton />
            <a
              href="/api/export"
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Export CSV
            </a>
            <Link
              href="/"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Scanner
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p
                className={`mt-1 font-mono text-3xl font-semibold tabular-nums ${
                  s.tone === "success"
                    ? "text-success"
                    : s.tone === "primary"
                      ? "text-primary"
                      : "text-foreground"
                }`}
              >
                {s.value}
              </p>
            </div>
          ))}
        </section>

        {/* Records table */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Scan Log</h2>
            <p className="text-xs text-muted-foreground">Most recent scans first</p>
          </div>

          {records.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium">No attendance records yet</p>
              <p className="mt-1 text-xs text-muted-foreground text-pretty">
                Head to the scanner and scan a student QR code to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Student</th>
                    <th className="px-5 py-3 font-medium">ID</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Scanned</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium">{r.name}</td>
                      <td className="px-5 py-3 font-mono text-muted-foreground">{r.student_id}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDateTime(r.scanned_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
