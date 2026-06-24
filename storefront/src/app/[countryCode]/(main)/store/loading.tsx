import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

function StoreFilterSkeleton() {
  return (
    <aside className="flex small:flex-col gap-12 py-4 mb-8 small:px-0 pl-6 pr-6 small:pr-8 small:min-w-[250px] small:ml-[1.675rem]">
      <div className="hidden small:block space-y-6 w-full">
        <div className="h-10 rounded bg-grey-10 animate-pulse" />
        <div className="border-t border-grey-10" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="h-4 w-24 rounded bg-grey-20 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-grey-10 animate-pulse" />
              <div className="h-3 w-28 rounded bg-grey-10 animate-pulse" />
              <div className="h-3 w-36 rounded bg-grey-10 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="small:hidden flex w-full items-center justify-between gap-4">
        <div className="h-10 w-28 rounded bg-grey-10 animate-pulse" />
        <div className="h-10 w-36 rounded bg-grey-10 animate-pulse" />
      </div>
    </aside>
  )
}

export default function StoreLoading() {
  return (
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
      <StoreFilterSkeleton />
      <div className="w-full">
        <div className="mb-8 flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-8 w-36 rounded bg-grey-20 animate-pulse" />
            <div className="h-4 w-64 rounded bg-grey-10 animate-pulse" />
          </div>
          <div className="hidden small:flex items-center gap-2">
            <div className="h-10 w-32 rounded bg-grey-10 animate-pulse" />
            <div className="h-10 w-28 rounded bg-grey-10 animate-pulse" />
          </div>
        </div>
        <SkeletonProductGrid numberOfProducts={12} />
      </div>
    </div>
  )
}