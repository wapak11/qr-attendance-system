"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { sql, manilaDay, type AttendanceRecord, type Student } from "@/lib/db"

const ADMIN_COOKIE = "qr-attendance-admin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

export type ScanResult =
  | { ok: true; status: "recorded"; name: string; studentId: string; time: string }
  | { ok: true; status: "already"; name: string; studentId: string; time: string }
  | { ok: false; status: "unknown"; studentId: string }
  | { ok: false; status: "error"; message: string }

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_COOKIE)?.value === "true"
}

export async function loginAdmin(formData: FormData): Promise<void> {
  const password = (formData.get("password") ?? "").toString().trim()
  const cookieStore = await cookies()

  if (password === ADMIN_PASSWORD) {
    cookieStore.set(ADMIN_COOKIE, "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8,
    })
    revalidatePath("/admin")
  }
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
  revalidatePath("/admin")
}

// Records a scan for a student. Enforces one record per student per Manila day.
export async function recordScan(rawId: string): Promise<ScanResult> {
  const lookup = rawId.trim()
  if (!lookup) return { ok: false, status: "error", message: "Empty QR code" }

  try {
    const matches = await resolveStudentLookup(lookup)

    if (matches.length === 0) {
      return { ok: false, status: "unknown", studentId: lookup }
    }

    const student = matches[0]
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

async function resolveStudentLookup(lookup: string): Promise<Student[]> {
  const schemaRows = (await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'students'
  `) as Array<{ column_name: string }>

  const columns = new Set(schemaRows.map((row) => row.column_name))

  const idMatches = (await sql`
    SELECT id, name, section FROM students WHERE id = ${lookup} LIMIT 1
  `) as Student[]

  if (idMatches.length > 0) {
    return idMatches
  }

  if (columns.has("nickname")) {
    const nicknameMatches = (await sql`
      SELECT id, name, section, nickname, status, badge_number FROM students
      WHERE nickname ILIKE ${lookup} OR name ILIKE ${lookup}
      LIMIT 1
    `) as Student[]

    if (nicknameMatches.length > 0) {
      return nicknameMatches
    }
  }

  if (columns.has("badge_number")) {
    const badgeMatches = (await sql`
      SELECT id, name, section, nickname, status, badge_number FROM students
      WHERE badge_number = ${lookup}
      LIMIT 1
    `) as Student[]

    if (badgeMatches.length > 0) {
      return badgeMatches
    }
  }

  return []
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

export async function getStudentRecords(studentId: string): Promise<AttendanceRecord[]> {
  const rows = (await sql`
    SELECT id, student_id, name, status, scanned_at, day
    FROM attendance
    WHERE student_id = ${studentId}
    ORDER BY scanned_at DESC
  `) as AttendanceRecord[]
  return rows
}

export async function addStudent(formData: FormData): Promise<void> {
  const rawStatus = (formData.get("status") ?? "Official Member").toString().trim()
  const normalizedStatus = rawStatus === "Aspirant" ? "Aspirant" : "Official Member"

  const id = (formData.get("id") ?? "").toString().trim()
  const nickname = (formData.get("nickname") ?? "").toString().trim()
  const section = (formData.get("section") ?? "").toString().trim()

  if (!nickname) {
    return
  }

  if (normalizedStatus === "Official Member" && !id) {
    return
  }

  let resolvedId = id
  if (normalizedStatus === "Aspirant" && !resolvedId) {
    resolvedId = `ASP-${Math.round(Date.now() / 1000)}`
  }

  const schemaRows = (await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'students'
  `) as Array<{ column_name: string }>

  const columns = new Set(schemaRows.map((row) => row.column_name))

  if (columns.has("status") && columns.has("nickname") && columns.has("badge_number")) {
    await sql`
      INSERT INTO students (id, name, section, status, nickname, badge_number)
      VALUES (${resolvedId}, ${nickname}, ${section || null}, ${normalizedStatus}, ${nickname}, ${normalizedStatus === "Official Member" ? id : null})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        section = EXCLUDED.section,
        status = EXCLUDED.status,
        nickname = EXCLUDED.nickname,
        badge_number = EXCLUDED.badge_number
    `
  } else {
    await sql`
      INSERT INTO students (id, name, section)
      VALUES (${resolvedId}, ${nickname}, ${section || null})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        section = EXCLUDED.section
    `
  }

  revalidatePath("/admin")
  revalidatePath("/records")
}

export async function deleteStudent(formData: FormData): Promise<void> {
  const id = (formData.get("id") ?? "").toString().trim()
  if (!id) {
    return
  }

  await sql`DELETE FROM attendance WHERE student_id = ${id}`
  await sql`DELETE FROM students WHERE id = ${id}`

  revalidatePath("/admin")
  revalidatePath("/records")
}

export async function clearTodayRecords(): Promise<void> {
  const day = manilaDay()
  await sql`DELETE FROM attendance WHERE day = ${day}`
  revalidatePath("/records")
}
