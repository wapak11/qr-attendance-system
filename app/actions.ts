"use server"

import { revalidatePath } from "next/cache"
import { sql, manilaDay, type AttendanceRecord, type Student } from "@/lib/db"

export type ScanResult =
  | { ok: true; status: "recorded"; name: string; studentId: string; time: string }
  | { ok: true; status: "already"; name: string; studentId: string; time: string }
  | { ok: false; status: "unknown"; studentId: string }
  | { ok: false; status: "error"; message: string }

// Records a scan for a student. Enforces one record per student per Manila day.
export async function recordScan(rawId: string): Promise<ScanResult> {
  const studentId = rawId.trim()
  if (!studentId) return { ok: false, status: "error", message: "Empty QR code" }

  try {
    const students = (await sql`
      SELECT id, name, section FROM students WHERE id = ${studentId} LIMIT 1
    `) as Student[]

    if (students.length === 0) {
      return { ok: false, status: "unknown", studentId }
    }

    const student = students[0]
    const day = manilaDay()

    // Try to insert; the unique (student_id, day) index blocks duplicates.
    const inserted = (await sql`
      INSERT INTO attendance (student_id, name, status, day)
      VALUES (${student.id}, ${student.name}, 'Present', ${day})
      ON CONFLICT (student_id, day) DO NOTHING
      RETURNING scanned_at
    `) as { scanned_at: string }[]

    if (inserted.length === 0) {
      // Already present today — fetch the original scan time.
      const existing = (await sql`
        SELECT scanned_at FROM attendance
        WHERE student_id = ${student.id} AND day = ${day}
        LIMIT 1
      `) as { scanned_at: string }[]
      revalidatePath("/records")
      return {
        ok: true,
        status: "already",
        name: student.name,
        studentId: student.id,
        time: existing[0]?.scanned_at ?? new Date().toISOString(),
      }
    }

    revalidatePath("/records")
    return {
      ok: true,
      status: "recorded",
      name: student.name,
      studentId: student.id,
      time: inserted[0].scanned_at,
    }
  } catch (err) {
    console.log("[v0] recordScan error:", err instanceof Error ? err.message : err)
    return { ok: false, status: "error", message: "Database error" }
  }
}

export async function getRecords(): Promise<AttendanceRecord[]> {
  const rows = (await sql`
    SELECT id, student_id, name, status, scanned_at, day
    FROM attendance
    ORDER BY scanned_at DESC
  `) as AttendanceRecord[]
  return rows
}

export async function getTodayCount(): Promise<number> {
  const day = manilaDay()
  const rows = (await sql`
    SELECT COUNT(*)::int AS count FROM attendance WHERE day = ${day}
  `) as { count: number }[]
  return rows[0]?.count ?? 0
}

export async function getStudents(): Promise<Student[]> {
  const rows = (await sql`
    SELECT id, name, section FROM students ORDER BY name ASC
  `) as Student[]
  return rows
}

export async function clearTodayRecords(): Promise<void> {
  const day = manilaDay()
  await sql`DELETE FROM attendance WHERE day = ${day}`
  revalidatePath("/records")
}
