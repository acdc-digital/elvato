const CustomerQuestions = () => {
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
          No questions yet. Ask us anything about installation, finishes,
          dimensions, or shipping — we usually reply within a business day.
        </p>

        {/* Placeholder for future Q&A threads */}
        <div className="mt-8 w-full">
          <div className="flex items-center gap-x-2 mb-6 text-ui-fg-disabled">
            <svg
              className="w-5 h-5"
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
              0 questions answered
            </span>
          </div>

          <button
            disabled
            className="inline-flex items-center justify-center px-6 py-2.5 border border-ui-border-base rounded-md text-sm font-medium text-ui-fg-muted cursor-not-allowed"
          >
            Ask a Question
          </button>

          <p className="text-xs text-ui-fg-disabled mt-3">
            Q&amp;A coming soon
          </p>
        </div>
      </div>
    </div>
  )
}

export default CustomerQuestions
