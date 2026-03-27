"use client"

import { useShipments } from "@lib/data/shipping"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StatusBadge from "@modules/shipping/components/status-badge"
import { Button } from "@medusajs/ui"

type ShippingDashboardProps = {
  customerId: string
}

const ShippingDashboard = ({ customerId }: ShippingDashboardProps) => {
  const shipments = useShipments(customerId)

  return (
    <div className="flex-1 small:py-12" data-testid="shipping-dashboard">
      <div className="content-container max-w-5xl mx-auto flex flex-col py-12">
        <h1 className="text-2xl-semi font-sans mb-8">Shipping & Tracking</h1>

        {shipments === undefined && (
          <div className="flex flex-col gap-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-50 rounded animate-pulse"
              />
            ))}
          </div>
        )}

        {shipments && shipments.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
            <p className="text-large-semi text-ui-fg-base">
              No shipments yet
            </p>
            <p className="text-base-regular text-ui-fg-subtle text-center max-w-sm">
              Once you place an order, your shipping details will appear here.
            </p>
            <LocalizedClientLink href="/store">
              <Button variant="secondary" className="mt-2">
                Continue Shopping
              </Button>
            </LocalizedClientLink>
          </div>
        )}

        {shipments && shipments.length > 0 && (
          <div
            className="flex flex-col gap-y-8 w-full"
            data-testid="shipments-list"
          >
            {shipments.map((shipment) => (
              <div
                key={shipment._id}
                className="bg-white flex flex-col border-b border-gray-200 pb-8"
                data-testid="shipment-card"
              >
                {/* Order number + status */}
                <div className="flex items-center justify-between mb-1">
                  <div className="uppercase text-large-semi">
                    #
                    <span data-testid="shipment-display-id">
                      {shipment.medusaOrderDisplayId}
                    </span>
                  </div>
                  <StatusBadge status={shipment.currentStatus} />
                </div>

                {/* Meta row */}
                <div className="flex items-center divide-x divide-gray-200 text-small-regular text-ui-fg-base mb-4">
                  <span className="pr-2">
                    {new Date(shipment.orderDate).toDateString()}
                  </span>
                  <span className="px-2">
                    {convertToLocale({
                      amount: shipment.orderTotal,
                      currency_code: shipment.currencyCode,
                    })}
                  </span>
                  <span className="pl-2">
                    {shipment.orderItems.length}{" "}
                    {shipment.orderItems.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {/* Item thumbnails */}
                <div className="grid grid-cols-2 small:grid-cols-4 gap-4 my-4">
                  {shipment.orderItems.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-y-2"
                      data-testid="shipment-item"
                    >
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
                      <div className="flex items-center text-small-regular text-ui-fg-base">
                        <span className="font-semibold truncate">
                          {item.title}
                        </span>
                        <span className="ml-2">x</span>
                        <span>{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tracking info + CTA */}
                <div className="flex items-center justify-between mt-2">
                  <div className="text-small-regular text-ui-fg-subtle">
                    {shipment.trackingNumber && (
                      <span>Tracking: {shipment.trackingNumber}</span>
                    )}
                    {shipment.logisticName && (
                      <span className="ml-2">
                        via {shipment.logisticName}
                      </span>
                    )}
                  </div>
                  <LocalizedClientLink
                    href={`/shipping/${shipment.medusaOrderId}`}
                  >
                    <Button
                      variant="secondary"
                      data-testid="track-shipment-link"
                    >
                      Track Shipment
                    </Button>
                  </LocalizedClientLink>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ShippingDashboard
