import { addStudent, deleteStudent, getStudentRecords, getStudents, isAdminAuthenticated, loginAdmin, logoutAdmin } from "@/app/actions"

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated()

  if (!authenticated) {
    return <AdminLogin />
  }

  const students = await getStudents()
  const studentsWithRecords = await Promise.all(
    students.map(async (student) => {
      const records = await getStudentRecords(student.id)
      return { student, records }
    }),
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <h1 className="text-sm font-semibold leading-tight">Member Administration</h1>
            <p className="text-xs text-muted-foreground">Manage QR roster</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/records"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Records
            </a>
            <a
              href="/"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Scanner
            </a>
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-semibold">Add Member</h2>
              <p className="mt-1 text-xs text-muted-foreground">Create a roster record that matches a QR ID.</p>
            </div>

            <form action={addStudent} className="space-y-4">
              <div>
                <label htmlFor="id" className="mb-2 block text-xs font-medium text-muted-foreground">
                  Student ID
                </label>
                <input
                  id="id"
                  name="id"
                  required
                  placeholder="e.g. 2024-IT-0001"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="mb-2 block text-xs font-medium text-muted-foreground">
                  Membership Status
                </legend>
                <div className="flex gap-6">
                  <label className="inline-flex items-center gap-2 text-sm text-foreground">
                    <input type="radio" name="status" value="Official Member" className="accent-primary" defaultChecked />
                    Official Member
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-foreground">
                    <input type="radio" name="status" value="Aspirant" className="accent-primary" />
                    Aspirant
                  </label>
                </div>
              </fieldset>

              <div>
                <label htmlFor="nickname" className="mb-2 block text-xs font-medium text-muted-foreground">
                  Nickname
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  required
                  placeholder="e.g. Biker Joe"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div id="badge-number-container">
                <label htmlFor="badge_number" className="mb-2 block text-xs font-medium text-muted-foreground">
                  Badge Number
                </label>
                <input
                  id="badge_number"
                  name="badge_number"
                  placeholder="e.g. MC-001"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="section" className="mb-2 block text-xs font-medium text-muted-foreground">
                  Section
                </label>
                <input
                  id="section"
                  name="section"
                  placeholder="e.g. IT 101"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Add Member
              </button>
            </form>

            <script dangerouslySetInnerHTML={{ __html: `
              (() => {
                const statusRadios = Array.from(document.querySelectorAll('input[name="status"]'))
                const badgeField = document.getElementById('badge_number')
                const badgeContainer = document.getElementById('badge-number-container')

                const syncMembershipFields = () => {
                  const selected = document.querySelector('input[name="status"]:checked')?.value || 'Official Member'
                  const isOfficial = selected === 'Official Member'

                  badgeContainer?.classList.toggle('hidden', !isOfficial)
                  badgeField?.toggleAttribute('disabled', !isOfficial)
                  badgeField?.toggleAttribute('aria-disabled', !isOfficial)

                  if (isOfficial) {
                    badgeField?.setAttribute('required', 'required')
                    badgeField?.setAttribute('aria-required', 'true')
                  } else {
                    badgeField?.removeAttribute('required')
                    badgeField?.removeAttribute('aria-required')
                    badgeField?.value = ''
                  }
                }

                statusRadios.forEach((radio) => radio.addEventListener('change', syncMembershipFields))
                syncMembershipFields()
              })()
            ` }} />
          </section>

          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold">Members</h2>
                  <p className="text-xs text-muted-foreground">{students.length} enrolled</p>
                </div>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <p className="text-sm font-medium">No students yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Add a student to create the QR roster.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Student ID</th>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Section</th>
                      <th className="px-5 py-3 font-medium">QR</th>
                      <th className="px-5 py-3 font-medium">Attendance</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsWithRecords.map(({ student, records }) => {
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(student.id)}`
                      return (
                        <tr key={student.id} className="border-b border-border last:border-0 align-top">
                          <td className="px-5 py-3 font-mono text-muted-foreground">{student.id}</td>
                          <td className="px-5 py-3 font-medium">{student.name}</td>
                          <td className="px-5 py-3 text-muted-foreground">{student.section ?? "—"}</td>
                          <td className="px-5 py-3">
                            <a href={qrUrl} target="_blank" rel="noreferrer" aria-label={`Open QR code for ${student.id}`}>
                              <img src={qrUrl} alt={`QR for ${student.id}`} className="h-16 w-16 rounded-lg border border-border bg-white p-1" />
                            </a>
                          </td>
                          <td className="px-5 py-3">
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              {records.length}
                            </span>
                            {records.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {records.slice(0, 2).map((r) => (
                                  <div key={r.id} className="text-[11px] text-muted-foreground">
                                    {new Date(r.scanned_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <form action={deleteStudent}>
                              <input type="hidden" name="id" value={student.id} />
                              <button
                                type="submit"
                                className="ml-auto block rounded-lg border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                              >
                                Remove
                              </button>
                            </form>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  )
}

function AdminLogin() {
  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-sm font-semibold leading-tight">Admin Login</h1>
          <p className="mt-2 text-xs text-muted-foreground">The scanner remains public, but the admin roster is protected.</p>
        </div>

        <form action={loginAdmin} className="space-y-4">
          <div>
            <label htmlFor="admin-password" className="mb-2 block text-xs font-medium text-muted-foreground">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Enter Admin
          </button>
        </form>
      </div>
    </div>
  )
}
