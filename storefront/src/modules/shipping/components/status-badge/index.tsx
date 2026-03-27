type StatusBadgeProps = {
  status: string
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  order_placed: {
    label: "Order Placed",
    className:
      "bg-gray-50 text-gray-700 ring-gray-600/20",
  },
  processing: {
    label: "Processing",
    className:
      "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  shipped: {
    label: "Shipped",
    className:
      "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  in_transit: {
    label: "In Transit",
    className:
      "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  arrived_in_country: {
    label: "Arrived in Country",
    className:
      "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    className:
      "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  issue: {
    label: "Issue",
    className:
      "bg-red-50 text-red-700 ring-red-600/20",
  },
  returned: {
    label: "Returned",
    className:
      "bg-orange-50 text-orange-700 ring-orange-600/20",
  },
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, " "),
    className: "bg-gray-50 text-gray-700 ring-gray-600/20",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className}`}
      data-testid="shipping-status-badge"
    >
      {config.label}
    </span>
  )
}

export default StatusBadge
