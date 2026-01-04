export default function AnnouncementBanner() {
  return (
    <div className="w-full bg-white border-b border-black">
      <div className="content-container py-3">
        <p className="text-sm font-mono text-black flex items-center gap-1 whitespace-nowrap">
          Elvato; <img src="/black-leaf.svg" alt="" className="w-4 h-4 inline-block" /> Canadian pure-play lighting e-tailor.<span className="hidden md:inline"> Lighting & Controls for your next project.</span>
        </p>
      </div>
    </div>
  )
}
