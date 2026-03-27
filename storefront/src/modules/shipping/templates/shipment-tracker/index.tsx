"use client"

import { useShipment } from "@lib/data/shipping"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProgressTracker from "@modules/shipping/components/progress-tracker"
import StatusBadge from "@modules/shipping/components/status-badge"

type ShipmentTrackerProps = {
  medusaOrderId: string
}

const ShipmentTracker = ({ medusaOrderId }: ShipmentTrackerProps) => {
  const shipment = useShipment(medusaOrderId)

  if (shipment === undefined) {
    return (
      <div className="flex-1 small:py-12">
        <div className="content-container max-w-4xl mx-auto py-12">
          <div className="animate-pulse flex flex-col gap-y-8">
            <div className="h-8 bg-gray-100 rounded w-64" />
            <div className="h-24 bg-gray-100 rounded" />
            <div className="h-48 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (shipment === null) {
    return (
      <div className="flex-1 small:py-12">
        <div className="content-container max-w-4xl mx-auto py-12 text-center">
          <h1 className="text-2xl-semi font-sans mb-4">Shipment Not Found</h1>
          <p className="text-base-regular text-ui-fg-subtle mb-6">
            We couldn&apos;t find tracking information for this order.
          </p>
          <LocalizedClientLink href="/shipping">
            <button className="text-ui-fg-interactive underline">
              Back to Shipping
            </button>
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  const isException =
    shipment.currentStatus === "issue" ||
    shipment.currentStatus === "returned"

  const sortedEvents = [...shipment.trackingEvents].sort(
    (a, b) => b.timestamp - a.timestamp
  )

  return (
    <div className="flex-1 small:py-12" data-testid="shipment-tracker">
      <div className="content-container max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="flex items-center gap-x-4 mb-8">
          <LocalizedClientLink href="/shipping">
            <button className="flex items-center text-ui-fg-subtle hover:text-black transition-colors">
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
              Back
            </button>
          </LocalizedClientLink>
          <div className="flex-1">
            <h1 className="text-2xl-semi font-sans">Shipment Tracking</h1>
          </div>
          <div className="uppercase text-large-semi">
            #{shipment.medusaOrderDisplayId}
          </div>
        </div>

        {/* Date header row */}
        <div className="flex items-start justify-between mb-10 border-b border-gray-200 pb-6">
          <div>
            <span className="text-small-regular text-ui-fg-subtle">
              Ordered
            </span>
            <p className="text-base-semi">
              {new Date(shipment.orderDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            {shipment.currentStatus === "delivered" &&
            shipment.actualDeliveryDate ? (
              <div>
                <span className="text-small-regular text-emerald-600">
                  Delivered
                </span>
                <p className="text-base-semi text-emerald-700">
                  {new Date(
                    shipment.actualDeliveryDate
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            ) : shipment.estimatedDeliveryDate ? (
              <div>
                <span className="text-small-regular text-ui-fg-subtle">
                  Expected Delivery
                </span>
                <p className="text-base-semi">
                  {new Date(
                    shipment.estimatedDeliveryDate
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-small-regular text-ui-fg-subtle">
                  Estimated Delivery
                </span>
                <p className="text-base-semi text-ui-fg-subtle">Pending</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="mb-10">
          <ProgressTracker
            currentStatus={shipment.currentStatus}
            isException={isException}
          />
        </div>

        {/* Status summary card */}
        <div className="bg-gray-50 rounded-lg p-6 mb-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-x-3 mb-2">
                <StatusBadge status={shipment.currentStatus} />
                {sortedEvents[0] && (
                  <span className="text-small-regular text-ui-fg-subtle">
                    {new Date(sortedEvents[0].timestamp).toLocaleString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                )}
              </div>
              {sortedEvents[0] && (
                <p className="text-base-regular text-ui-fg-base">
                  {sortedEvents[0].description}
                </p>
              )}
            </div>
            <div className="text-right text-small-regular">
              {shipment.logisticName && (
                <p className="text-ui-fg-base">
                  Carrier: {shipment.logisticName}
                </p>
              )}
              {shipment.trackingNumber && (
                <p className="text-ui-fg-subtle mt-1">
                  Tracking #: {shipment.trackingNumber}
                </p>
              )}
              {shipment.lastMileCarrier && (
                <p className="text-ui-fg-subtle mt-1">
                  Last mile: {shipment.lastMileCarrier}
                  {shipment.lastMileTrackingNumber &&
                    ` (${shipment.lastMileTrackingNumber})`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className="mb-10">
          <h2 className="text-large-semi mb-4">Order Items</h2>
          <div className="grid grid-cols-2 small:grid-cols-4 gap-4">
            {shipment.orderItems.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-y-2">
                {item.thumbnail ? (
                  <div className="relative w-full aspect-square bg-gray-100 rounded overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-ui-fg-subtle text-xs">
                      No image
                    </span>
                  </div>
                )}
                <div className="text-small-regular">
                  <p className="font-semibold text-ui-fg-base truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center text-ui-fg-subtle gap-x-2">
                    <span>Qty: {item.quantity}</span>
                    <span>·</span>
                    <span>
                      {convertToLocale({
                        amount: item.unitPrice,
                        currency_code: shipment.currencyCode,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
            <div className="text-base-semi">
              Total:{" "}
              {convertToLocale({
                amount: shipment.orderTotal,
                currency_code: shipment.currencyCode,
              })}
            </div>
          </div>
        </div>

        {/* Tracking timeline */}
        {sortedEvents.length > 0 && (
          <div className="mb-10">
            <h2 className="text-large-semi mb-4">Tracking Timeline</h2>
            <div className="relative">
              {sortedEvents.map((event, idx) => {
                const isFirst = idx === 0
                const isLast = idx === sortedEvents.length - 1

                return (
                  <div key={idx} className="relative flex gap-x-4">
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${
                          isFirst ? "bg-accent-700" : "bg-gray-300"
                        }`}
                        style={isFirst ? { backgroundColor: "#8B6914" } : undefined}
                      />
                      {!isLast && (
                        <div className="w-px flex-1 bg-gray-200 min-h-[32px]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-6 flex-1">
                      <div className="flex items-baseline gap-x-3">
                        <span className="text-small-regular text-ui-fg-subtle whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        {event.location && (
                          <span className="text-small-regular text-ui-fg-muted">
                            · {event.location}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-base-regular mt-0.5 ${
                          isFirst
                            ? "text-ui-fg-base font-medium"
                            : "text-ui-fg-subtle"
                        }`}
                      >
                        {event.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Shipping address */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-large-semi mb-4">Delivery Address</h2>
          <div className="flex items-start gap-x-8">
            <div className="flex flex-col w-1/3">
              <span className="txt-medium-plus text-ui-fg-base mb-1">
                Shipping Address
              </span>
              <span className="txt-medium text-ui-fg-subtle">
                {shipment.shippingAddress.firstName}{" "}
                {shipment.shippingAddress.lastName}
              </span>
              <span className="txt-medium text-ui-fg-subtle">
                {shipment.shippingAddress.address1}
                {shipment.shippingAddress.address2 &&
                  ` ${shipment.shippingAddress.address2}`}
              </span>
              <span className="txt-medium text-ui-fg-subtle">
                {shipment.shippingAddress.postalCode},{" "}
                {shipment.shippingAddress.city}
              </span>
              <span className="txt-medium text-ui-fg-subtle">
                {shipment.shippingAddress.countryCode.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col w-1/3">
              <span className="txt-medium-plus text-ui-fg-base mb-1">
                Contact
              </span>
              {shipment.shippingAddress.phone && (
                <span className="txt-medium text-ui-fg-subtle">
                  {shipment.shippingAddress.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShipmentTracker
