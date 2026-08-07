import { getRecords } from "@/app/actions"

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export async function GET() {
  const records = await getRecords()

  const header = "Student ID,Name,Status,Date and Time\n"
  const rows = records
    .map((r) => {
      const time = new Date(r.scanned_at).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
      })
      return [r.student_id, r.name, r.status, time].map(csvEscape).join(",")
    })
    .join("\n")

  const csv = header + rows

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance_report.csv"`,
    },
  })
}
