"use client";

import { 
  RefreshCw, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  Loader2
} from "lucide-react";

interface InventoryToolbarProps {
  selectedCount: number;
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  isLoading: boolean;
  onImportSelected: () => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function InventoryToolbar({
  selectedCount,
  totalRecords,
  currentPage,
  totalPages,
  pageSize,
  isLoading,
  onImportSelected,
  onRefresh,
  onPageChange,
  onPageSizeChange,
}: InventoryToolbarProps) {
  const startRecord = totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[#2d2d2d] bg-[#252526]">
      {/* Left side - Actions */}
      <div className="flex items-center gap-2">
        {/* Import Selected Button */}
        <button
          onClick={onImportSelected}
          disabled={selectedCount === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
            selectedCount > 0
              ? 'bg-[#007acc] text-white hover:bg-[#0069ac]'
              : 'bg-[#3d3d3d] text-[#858585] cursor-not-allowed'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          Import Selected ({selectedCount})
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#3d3d3d] text-[#cccccc] rounded hover:bg-[#4d4d4d] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Refresh
        </button>
      </div>

      {/* Center - Results Info */}
      <div className="flex items-center gap-2 text-xs text-[#858585]">
        <Package className="w-3.5 h-3.5" />
        {isLoading ? (
          <span>Loading...</span>
        ) : (
          <span>
            Showing {startRecord.toLocaleString()}-{endRecord.toLocaleString()} of {totalRecords.toLocaleString()} products
          </span>
        )}
      </div>

      {/* Right side - Pagination */}
      <div className="flex items-center gap-3">
        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#858585]">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            className="px-2 py-1 text-xs bg-[#3c3c3c] border border-[#3d3d3d] rounded text-[#cccccc] focus:outline-none focus:border-[#007acc]"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || isLoading}
            className="p-1.5 rounded hover:bg-[#3d3d3d] disabled:opacity-30 disabled:cursor-not-allowed"
            title="First page"
          >
            <ChevronsLeft className="w-3.5 h-3.5 text-[#cccccc]" />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="p-1.5 rounded hover:bg-[#3d3d3d] disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#cccccc]" />
          </button>

          {/* Page Info */}
          <span className="px-2 text-xs text-[#cccccc]">
            Page {currentPage} of {totalPages || 1}
          </span>

          {/* Next Page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="p-1.5 rounded hover:bg-[#3d3d3d] disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#cccccc]" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages || isLoading}
            className="p-1.5 rounded hover:bg-[#3d3d3d] disabled:opacity-30 disabled:cursor-not-allowed"
            title="Last page"
          >
            <ChevronsRight className="w-3.5 h-3.5 text-[#cccccc]" />
          </button>
        </div>
      </div>
    </div>
  );
}
