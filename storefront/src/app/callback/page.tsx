import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Etsy Authorization Callback | Elvato",
  robots: {
    index: false,
    follow: false,
  },
}

type CallbackSearchParams = {
  code?: string
  state?: string
  error?: string
  error_description?: string
}

export default async function EtsyCallbackPage(props: {
  searchParams: Promise<CallbackSearchParams>
}) {
  const searchParams = await props.searchParams
  const hasCode = Boolean(searchParams.code)
  const hasError = Boolean(searchParams.error)

  return (
    <div className="min-h-screen bg-white px-6 py-12 text-black small:px-12">
      <div className="mx-auto max-w-2xl border border-black p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          Elvato Marketplace
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight">
          Etsy authorization callback
        </h1>

        {hasError ? (
          <div className="mt-8 border border-red-300 bg-red-50 p-5">
            <h2 className="text-base font-semibold text-red-900">
              Etsy returned an authorization error.
            </h2>
            <dl className="mt-4 space-y-3 text-sm text-red-900">
              <div>
                <dt className="font-semibold">Error</dt>
                <dd className="mt-1 break-words font-mono">{searchParams.error}</dd>
              </div>
              {searchParams.error_description && (
                <div>
                  <dt className="font-semibold">Description</dt>
                  <dd className="mt-1 break-words">
                    {searchParams.error_description}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        ) : hasCode ? (
          <div className="mt-8 border border-green-300 bg-green-50 p-5">
            <h2 className="text-base font-semibold text-green-950">
              Authorization code received.
            </h2>
            <dl className="mt-4 space-y-3 text-sm text-green-950">
              <div>
                <dt className="font-semibold">Code</dt>
                <dd className="mt-1 break-all font-mono">{searchParams.code}</dd>
              </div>
              {searchParams.state && (
                <div>
                  <dt className="font-semibold">State</dt>
                  <dd className="mt-1 break-all font-mono">{searchParams.state}</dd>
                </div>
              )}
            </dl>
          </div>
        ) : (
          <div className="mt-8 border border-gray-300 bg-gray-50 p-5">
            <h2 className="text-base font-semibold">
              This callback route is ready.
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              Etsy will redirect here with a temporary authorization code after
              you approve the Elvato app.
            </p>
          </div>
        )}

        <p className="mt-8 text-sm leading-6 text-gray-600">
          Exchange the authorization code from a local or server-side marketplace
          command so the Etsy client secret is never exposed in browser code.
        </p>
      </div>
    </div>
  )
}
