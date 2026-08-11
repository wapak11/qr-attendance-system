import { neon } from "@neondatabase/serverless"

// Single shared SQL client backed by the Neon integration's DATABASE_URL.
export const sql = neon(process.env.DATABASE_URL!)

export type Student = {
  id: string
  name: string
  section: string | null
  status?: "Official Member" | "Aspirant" | string | null
  nickname?: string | null
  badge_number?: string | null
}

export type AttendanceRecord = {
  id: number
  student_id: string
  name: string
  status: string
  scanned_at: string
  day: string
}

// Returns the current calendar day in Asia/Manila as a YYYY-MM-DD string,
// so "once per day" dedupe matches the local school day regardless of server TZ.
export function manilaDay(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}
