"use client";

import { SmolTradesLogo } from "./SmolTradesLogo";

export function Header() {
  return (
    <header className="h-8 bg-[#181818] border-b border-[#2d2d2d] flex items-center px-0 select-none">
      {/* Title */}
      <div className="flex-1 flex justify-start items-center ml-2">
        <div className="flex items-center gap-2">
          <SmolTradesLogo className="pl-2 h-4 w-auto text-[#858585]" />
          <span className="text-xs text-[#858585]">
            SmolAccount | Financial Management for Tradies
          </span>
        </div>
      </div>
      
      {/* Future: Theme Toggle */}
      <div className="flex items-center pr-4">
        {/* ThemeToggle component can be added here */}
      </div>
    </header>
  );
}
