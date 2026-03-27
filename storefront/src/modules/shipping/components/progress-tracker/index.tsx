const STEPS = [
  { key: "order_placed", label: "Order Placed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "in_transit", label: "In Transit" },
  { key: "arrived_in_country", label: "Arrived" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
] as const

type ProgressTrackerProps = {
  currentStatus: string
  isException?: boolean
}

const STATUS_ORDER: Record<string, number> = {
  order_placed: 0,
  processing: 1,
  shipped: 2,
  in_transit: 3,
  arrived_in_country: 4,
  out_for_delivery: 5,
  delivered: 6,
}

const ProgressTracker = ({
  currentStatus,
  isException = false,
}: ProgressTrackerProps) => {
  const currentIndex = STATUS_ORDER[currentStatus] ?? 0

  return (
    <div data-testid="progress-tracker">
      {/* Desktop: Horizontal */}
      <div className="hidden small:block">
        <div className="relative flex items-center justify-between">
          {/* Background line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
          {/* Active line */}
          <div
            className="absolute top-4 left-0 h-0.5 transition-all duration-500 ease-in-out"
            style={{
              width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
              backgroundColor: isException ? "#ef4444" : "#8B6914",
            }}
          />

          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex
            const isFuture = index > currentIndex

            return (
              <div
                key={step.key}
                className="relative flex flex-col items-center"
                style={{ width: `${100 / STEPS.length}%` }}
              >
                {/* Dot */}
                <div
                  className={`relative z-10 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isCompleted
                      ? "w-8 h-8 border-transparent"
                      : isCurrent
                        ? "w-10 h-10 border-transparent"
                        : "w-8 h-8 border-gray-300 bg-white"
                  }`}
                  style={
                    isCompleted
                      ? { backgroundColor: "#8B6914" }
                      : isCurrent
                        ? {
                            backgroundColor: isException
                              ? "#ef4444"
                              : "#8B6914",
                          }
                        : undefined
                  }
                >
                  {isCompleted && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {isCurrent && !isException && (
                    <div className="w-3 h-3 rounded-full bg-white" />
                  )}
                  {isCurrent && isException && (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  )}
                  {isFuture && (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`mt-2 text-xs text-center leading-tight ${
                    isCurrent
                      ? "font-semibold text-black"
                      : isCompleted
                        ? "font-medium text-ui-fg-base"
                        : "text-ui-fg-subtle"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: Vertical */}
      <div className="block small:hidden">
        <div className="relative flex flex-col gap-y-0">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex
            const isLast = index === STEPS.length - 1

            return (
              <div key={step.key} className="relative flex items-start gap-x-3">
                {/* Vertical line + dot column */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center rounded-full border-2 shrink-0 ${
                      isCompleted
                        ? "w-6 h-6 border-transparent"
                        : isCurrent
                          ? "w-8 h-8 border-transparent"
                          : "w-6 h-6 border-gray-300 bg-white"
                    }`}
                    style={
                      isCompleted
                        ? { backgroundColor: "#8B6914" }
                        : isCurrent
                          ? {
                              backgroundColor: isException
                                ? "#ef4444"
                                : "#8B6914",
                            }
                          : undefined
                    }
                  >
                    {isCompleted && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {isCurrent && !isException && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                    {isCurrent && isException && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        />
                      </svg>
                    )}
                  </div>
                  {/* Connecting line */}
                  {!isLast && (
                    <div
                      className="w-0.5 flex-1 min-h-[24px]"
                      style={{
                        backgroundColor: isCompleted ? "#8B6914" : "#e5e7eb",
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`pt-0.5 pb-4 text-sm ${
                    isCurrent
                      ? "font-semibold text-black"
                      : isCompleted
                        ? "font-medium text-ui-fg-base"
                        : "text-ui-fg-subtle"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ProgressTracker
