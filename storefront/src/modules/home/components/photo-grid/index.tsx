const PhotoGrid = () => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`aspect-square bg-gray-200 border-b border-l border-black flex items-center justify-center ${i === 3 ? 'border-r' : ''}`}
          >
            <span className="text-gray-400 font-sans text-sm">Photo {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PhotoGrid
