"use client"

import { useMutation, useQuery } from "convex/react"
import { anyApi } from "convex/server"
import { useMemo, useState } from "react"

type CustomerQuestionsProps = {
  productId: string
  productHandle: string
}

type Comment = {
  _id: string
  _creationTime: number
  authorName: string
  body: string
  parentId?: string
  isStaff: boolean
  createdAt: number
}

const formatTimestamp = (ts: number) => {
  const diff = Date.now() - ts
  const min = 60_000
  const hr = 60 * min
  const day = 24 * hr
  if (diff < min) return "just now"
  if (diff < hr) return `${Math.floor(diff / min)}m ago`
  if (diff < day) return `${Math.floor(diff / hr)}h ago`
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?"

const CustomerQuestions = ({
  productId,
  productHandle,
}: CustomerQuestionsProps) => {
  const comments = useQuery(anyApi.customerComments.listByProduct, {
    medusaProductId: productId,
  }) as Comment[] | undefined

  const post = useMutation(anyApi.customerComments.post)

  const [name, setName] = useState("")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = comments?.length ?? 0
  const isLoading = comments === undefined

  const sorted = useMemo(
    () =>
      comments
        ? [...comments].sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [comments]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) {
      setError("Please enter your name.")
      return
    }
    if (body.trim().length < 4) {
      setError("Please write a question (at least a few words).")
      return
    }
    setSubmitting(true)
    try {
      await post({
        medusaProductId: productId,
        medusaProductHandle: productHandle,
        authorName: name.trim(),
        body: body.trim(),
      })
      setBody("")
    } catch (err: any) {
      setError(err?.message || "Could not post your question. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border-t border-ui-border-base pt-12">
      <div className="flex flex-col">
        <p className="text-xs font-medium uppercase tracking-wider text-ui-fg-muted mb-1">
          Q&amp;A
        </p>
        <h2 className="text-xl font-semibold text-ui-fg-base mb-2">
          Customer Questions
        </h2>
        <p className="text-sm text-ui-fg-subtle max-w-md">
          Ask us anything about installation, finishes, dimensions, or
          shipping — we usually reply within a business day.
        </p>

        {/* Composer (shadcn-style open comment box) */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-lg border border-ui-border-base bg-ui-bg-base p-4 flex flex-col gap-y-3"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={80}
            className="w-full rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-2 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:ring-1 focus:ring-ui-fg-base focus:border-ui-fg-base"
            disabled={submitting}
            aria-label="Your name"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ask a question about this product…"
            rows={3}
            maxLength={2000}
            className="w-full rounded-md border border-ui-border-base bg-ui-bg-subtle px-3 py-2 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:ring-1 focus:ring-ui-fg-base focus:border-ui-fg-base resize-y min-h-[80px]"
            disabled={submitting}
            aria-label="Your question"
          />
          {error && (
            <p className="text-xs text-rose-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-ui-fg-muted">
              {body.length}/2000
            </span>
            <button
              type="submit"
              disabled={
                submitting ||
                body.trim().length < 4 ||
                name.trim().length < 2
              }
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-ui-fg-base text-ui-bg-base hover:bg-ui-fg-base/90 disabled:bg-ui-bg-subtle disabled:text-ui-fg-muted disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Posting…" : "Post question"}
            </button>
          </div>
        </form>

        {/* Thread */}
        <div className="mt-8 w-full">
          <div className="flex items-center gap-x-2 mb-4 text-ui-fg-muted">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z"
              />
            </svg>
            <span className="text-xs uppercase tracking-wider">
              {isLoading
                ? "Loading…"
                : `${total} question${total === 1 ? "" : "s"}`}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-ui-border-base p-3 animate-pulse"
                >
                  <div className="h-3 w-24 bg-ui-bg-subtle rounded mb-2" />
                  <div className="h-3 w-full bg-ui-bg-subtle rounded mb-1" />
                  <div className="h-3 w-3/4 bg-ui-bg-subtle rounded" />
                </div>
              ))}
            </div>
          ) : total === 0 ? (
            <p className="text-sm text-ui-fg-subtle">
              No questions yet. Be the first to ask.
            </p>
          ) : (
            <ul className="flex flex-col gap-y-4">
              {sorted.map((c) => (
                <li
                  key={c._id}
                  className="flex items-start gap-x-3 rounded-lg border border-ui-border-base bg-ui-bg-base p-3"
                >
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      c.isStaff
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-ui-bg-subtle text-ui-fg-base"
                    }`}
                    aria-hidden
                  >
                    {initials(c.authorName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-x-2 mb-0.5">
                      <span className="text-sm font-medium text-ui-fg-base truncate">
                        {c.authorName}
                      </span>
                      {c.isStaff && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          Staff
                        </span>
                      )}
                      <span className="text-xs text-ui-fg-muted">
                        · {formatTimestamp(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-ui-fg-subtle whitespace-pre-line break-words">
                      {c.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerQuestions
