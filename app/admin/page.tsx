import { addStudent, deleteStudent, getStudents } from "@/app/actions"

export default async function AdminPage() {
  const students = await getStudents()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <h1 className="text-sm font-semibold leading-tight">Student Administration</h1>
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-semibold">Add Student</h2>
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

              <div>
                <label htmlFor="name" className="mb-2 block text-xs font-medium text-muted-foreground">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Juan Dela Cruz"
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
                Add Student
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold">Students</h2>
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
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 font-mono text-muted-foreground">{student.id}</td>
                        <td className="px-5 py-3 font-medium">{student.name}</td>
                        <td className="px-5 py-3 text-muted-foreground">{student.section ?? "—"}</td>
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
                    ))}
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
