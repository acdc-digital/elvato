"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { PanelType } from "./ActivityBar";

interface Tab {
  id: string;
  title: string;
  type: string;
}

interface EditorProps {
  activePanel: PanelType;
}

export function Editor({}: EditorProps) {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "welcome", title: "Welcome", type: "welcome" }
  ]);
  const [activeTabId, setActiveTabId] = useState("welcome");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const renderContent = () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    
    if (!activeTab) {
      return (
        <div className="p-4 space-y-3">
          <div className="inline-block px-3 py-1 bg-[#252526] border border-[#2d2d2d] rounded text-xs text-[#cccccc]">
            this could be my second language.
          </div>
          <div className="inline-block px-3 py-1 bg-[#252526] border border-[#2d2d2d] rounded text-xs text-[#cccccc]">
            gamblers think about profit, traders think about risk
          </div>
        </div>
      );
    }

    // Future: Render different content based on activePanel and tab type
    return (
      <div className="p-4 space-y-3 space-x-2">
        <div className="inline-block px-3 py-1 bg-[#252526] border border-[#2d2d2d] rounded text-xs text-[#cccccc]">
          this could be my second language.
        </div>
        <div className="inline-block px-3 py-1 bg-[#252526] border border-[#2d2d2d] rounded text-xs text-[#cccccc]">
          gamblers think about profit, traders think about risk.
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1a1a1a] h-full">
      {/* Tab Bar */}
      <div className="h-[35px] bg-[#1e1e1e] border-b border-[#2d2d2d] relative flex-shrink-0">
        {/* Tabs Container */}
        <div className="absolute left-8 right-16 top-0 bottom-0 overflow-hidden bg-[#1e1e1e]">
          <div className="flex h-full">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`
                  flex items-center gap-2 px-3 h-[35px] text-xs border-r border-[#2d2d2d] cursor-pointer flex-shrink-0 transition-colors duration-150 w-[200px]
                  ${activeTabId === tab.id
                    ? 'bg-[#1a1a1a] text-[#cccccc]'
                    : 'bg-[#0e0e0e] text-[#858585] hover:bg-[#181818]'
                  }
                `}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="truncate flex-1">{tab.title}</span>
                
                {hoveredTab === tab.id && (
                  <X
                    className="w-3 h-3 hover:bg-[#2d2d2d] rounded flex-shrink-0 text-[#858585] hover:text-[#cccccc] transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Left Scroll Button */}
        <div className="absolute left-0 z-10 w-8 h-[35px] border-r border-b border-[#2d2d2d] bg-[#1e1e1e]">
          <button
            disabled
            className="w-full h-full flex items-center justify-center text-[#3d3d3d] opacity-30"
            title="Scroll left"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>

        {/* Right side buttons container */}
        <div className="absolute right-0 z-10 flex h-[35px] bg-[#1e1e1e] border-b border-[#2d2d2d]">
          {/* Right Scroll Button */}
          <div className="w-8 h-[35px] border-l border-[#2d2d2d]">
            <button
              disabled
              className="w-full h-full flex items-center justify-center text-[#3d3d3d] opacity-30"
              title="Scroll right"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
            
          {/* Add New Tab Button */}
          <button
            className="flex items-center justify-center w-8 h-[35px] text-xs border-l border-[#2d2d2d] transition-colors text-[#858585] hover:bg-[#2d2d2d]"
            title="New tab"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Editor Content - Scrollable */}
      <div className="flex-1 overflow-auto bg-[#1e1e1e]">
        {renderContent()}
      </div>
    </div>
  );
}
