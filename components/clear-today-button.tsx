"use client"

import { useState, useTransition } from "react"
import { clearTodayRecords } from "@/app/actions"

export function ClearTodayButton() {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        Clear Today
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Are you sure?</span>
      <button
        onClick={() => startTransition(() => clearTodayRecords())}
        disabled={pending}
        className="rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Clearing..." : "Yes, clear"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
      >
        Cancel
      </button>
    </div>
  )
}
