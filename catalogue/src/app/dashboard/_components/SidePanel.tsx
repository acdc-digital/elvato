"use client";

import { PanelType } from "./ActivityBar";

interface SidePanelProps {
  activePanel: PanelType;
}

export function SidePanel({ activePanel }: SidePanelProps) {
  if (!activePanel) return null;

  const renderPanelContent = () => {
    switch (activePanel) {
      case "dashboard":
        return (
          <div className="flex flex-col gap-4 p-4">
            <div>
              <h3 className="text-xs font-semibold text-[#cccccc] mb-2">Dashboard Overview</h3>
              <div className="space-y-1">
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Quick Stats
                </button>
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Recent Activity
                </button>
              </div>
            </div>
          </div>
        );
      
      case "products":
        return (
          <div className="flex flex-col gap-4 p-4">
            <div>
              <h3 className="text-xs font-semibold text-[#cccccc] mb-2">Products</h3>
              <div className="space-y-1">
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  All Products
                </button>
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Draft
                </button>
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Published
                </button>
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Out of Stock
                </button>
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Featured
                </button>
              </div>
            </div>
          </div>
        );
      
      case "editorial":
        return (
          <div className="flex flex-col gap-4 p-4">
            <div>
              <h3 className="text-xs font-semibold text-[#cccccc] mb-2">Editorial</h3>
              <div className="space-y-1">
                <p className="text-xs text-[#858585]">Content coming soon...</p>
              </div>
            </div>
          </div>
        );
      
      case "calendar":
        return (
          <div className="flex flex-col gap-4 p-4">
            <div>
              <h3 className="text-xs font-semibold text-[#cccccc] mb-2">Calendar</h3>
              <div className="space-y-1">
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Product Launches
                </button>
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Sales Events
                </button>
              </div>
            </div>
          </div>
        );
      
      case "copilot":
        return (
          <div className="flex flex-col gap-4 p-4">
            <div>
              <h3 className="text-xs font-semibold text-[#cccccc] mb-2">Copilot</h3>
              <div className="space-y-1">
                <p className="text-xs text-[#858585]">AI assistant coming soon...</p>
              </div>
            </div>
          </div>
        );
      
      case "image":
        return (
          <div className="flex flex-col gap-4 p-4">
            <div>
              <h3 className="text-xs font-semibold text-[#cccccc] mb-2">Images</h3>
              <div className="space-y-1">
                <p className="text-xs text-[#858585]">Image management coming soon...</p>
              </div>
            </div>
          </div>
        );
      
      case "settings":
        return (
          <div className="flex flex-col gap-4 p-4">
            <div>
              <h3 className="text-xs font-semibold text-[#cccccc] mb-2">Settings</h3>
              <div className="space-y-1">
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  General
                </button>
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Catalogue Config
                </button>
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Integrations
                </button>
              </div>
            </div>
          </div>
        );
      
      case "account":
        return (
          <div className="flex flex-col gap-4 p-4">
            <div>
              <h3 className="text-xs font-semibold text-[#cccccc] mb-2">Account</h3>
              <div className="space-y-1">
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Profile
                </button>
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Preferences
                </button>
                <button className="w-full text-left px-2 py-1.5 text-xs text-[#cccccc] hover:bg-[#2d2d2d] rounded">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-[240px] bg-[#1e1e1e] border-r border-[#2d2d2d] flex-shrink-0 overflow-auto">
      {renderPanelContent()}
    </div>
  );
}
