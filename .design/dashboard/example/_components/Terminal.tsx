"use client";

import { ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TerminalProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Terminal({ isCollapsed, onToggle }: TerminalProps) {
  return (
    <div
      className={`border-t border-[#2d2d2d] bg-[#1e1e1e] transition-all duration-200 ${
        isCollapsed ? 'h-[35px]' : 'h-[250px]'
      }`}
    >
      {/* Terminal Header */}
      <div className="h-[35px] bg-[#1e1e1e] border-b border-[#2d2d2d] flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#cccccc]">Terminal</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-6 h-6 rounded-none hover:bg-[#2d2d2d] p-0"
            title={isCollapsed ? "Maximize Panel Size" : "Minimize Panel Size"}
          >
            {isCollapsed ? (
              <ChevronUp className="w-3 h-3 text-[#858585] hover:text-[#cccccc]" />
            ) : (
              <ChevronDown className="w-3 h-3 text-[#858585] hover:text-[#cccccc]" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-6 h-6 rounded-none hover:bg-[#2d2d2d] p-0"
            title="Close Panel"
          >
            <X className="w-3 h-3 text-[#858585] hover:text-[#cccccc]" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      {!isCollapsed && (
        <div className="p-4 font-mono text-xs text-[#cccccc] h-[calc(100%-35px)] overflow-auto">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-[#007acc]">$</span>
              <span>SmolAccount Terminal</span>
            </div>
            <div className="text-[#858585]">
              Terminal functionality coming soon...
            </div>
            <div className="flex items-start gap-2 mt-4">
              <span className="text-[#007acc]">$</span>
              <span className="text-[#858585]">_</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
