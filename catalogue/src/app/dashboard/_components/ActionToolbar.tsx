"use client";

import { Trash2, Undo, Redo, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionToolbarProps {
  selectedCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onAddProduct: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function ActionToolbar({
  selectedCount,
  canUndo,
  canRedo,
  onAddProduct,
  onDelete,
  onUndo,
  onRedo,
}: ActionToolbarProps) {
  return (
    <div className="px-4 py-2 border-b border-[#2d2d2d] bg-[#1a1a1a] flex items-center justify-between">
      {/* Left side - Action buttons */}
      <div className="flex items-center gap-2">
        {/* Add Product button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddProduct}
          className="h-7 px-2 text-xs text-[#858585] hover:text-[#007acc] hover:bg-[#2d2d2d] border border-[#2d2d2d]"
          title="Add new product"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>

        {/* Delete button - always visible, disabled when nothing selected */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={selectedCount === 0}
          className="h-7 px-2 text-xs text-[#858585] hover:text-[#f14c4c] hover:bg-[#2d2d2d] border border-[#2d2d2d] disabled:opacity-30 disabled:cursor-not-allowed"
          title="Delete selected items"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>

        {/* Undo button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-7 px-2 text-xs text-[#858585] hover:text-[#cccccc] hover:bg-[#2d2d2d] border border-[#2d2d2d] disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo last action"
        >
          <Undo className="w-3.5 h-3.5" />
        </Button>

        {/* Redo button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-7 px-2 text-xs text-[#858585] hover:text-[#cccccc] hover:bg-[#2d2d2d] border border-[#2d2d2d] disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo last action"
        >
          <Redo className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Right side - Selection info */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-[#858585]">
          {selectedCount > 0 && `${selectedCount} selected`}
        </span>
      </div>
    </div>
  );
}
