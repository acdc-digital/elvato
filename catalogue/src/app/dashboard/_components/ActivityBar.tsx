"use client";

import { 
  FileText, 
  Calendar, 
  Package, 
  Barcode,
  BarChart3, 
  Settings,
  User,
  Trash2,
  RefreshCw,
  Bot,
  Image,
  LucideIcon 
} from "lucide-react";

export type PanelType = 
  | "products"
  | "editorial"
  | "inventory" 
  | "trash"
  | "calendar"
  | "copilot"
  | "image"
  | "settings"
  | "account"
  | null;

interface ActivityBarProps {
  activePanel: PanelType;
  onPanelChange: (panel: PanelType) => void;
}

export function ActivityBar({ activePanel, onPanelChange }: ActivityBarProps) {
  const activityItems: Array<{ id: PanelType; icon: LucideIcon; label: string }> = [
    { id: "products", icon: Barcode, label: "Products" },
    { id: "editorial", icon: RefreshCw, label: "Editorial" },
    { id: "inventory", icon: Package, label: "Inventory" },
    { id: "trash", icon: Trash2, label: "Trash" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
    { id: "copilot", icon: Bot, label: "Copilot" },
    { id: "image", icon: Image, label: "Images" },
    { id: "account", icon: User, label: "Account" },
  ];

  const bottomItems: Array<{ id: PanelType; icon: LucideIcon; label: string }> = [
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const handleActivityClick = (id: PanelType) => {
    onPanelChange(id);
  };

  const getUserInitial = () => {
    // TODO: Get from auth context
    return 'U';
  };

  return (
    <aside className="w-12 bg-[#181818] border-r border-[#2d2d2d] flex flex-col">
      {/* Activity Icons */}
      <div className="flex flex-col items-center">
        {activityItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          
          // Special handling for account icon
          if (item.id === 'account') {
            return (
              <button
                key={item.id}
                className={`w-12 h-12 hover:bg-[#2d2d2d] flex items-center justify-center cursor-pointer relative ${
                  isActive ? 'bg-[#2d2d2d]' : ''
                }`}
                onClick={() => handleActivityClick(item.id)}
                title={item.label}
              >
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium ${
                    isActive
                      ? 'border-[#cccccc] text-[#cccccc]'
                      : 'border-[#858585] text-[#858585]'
                  }`}
                >
                  {getUserInitial()}
                </div>
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-[#007acc]" />
                )}
              </button>
            );
          }
          
          return (
            <button
              key={item.id}
              onClick={() => handleActivityClick(item.id)}
              className={`w-12 h-12 hover:bg-[#2d2d2d] flex items-center justify-center relative ${
                isActive ? 'bg-[#2d2d2d]' : ''
              }`}
              title={item.label}
            >
              <Icon
                className={`w-4.5 h-4.5 ${
                  isActive ? 'text-[#cccccc]' : 'text-[#858585]'
                }`}
              />
              {isActive && (
                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-[#007acc]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="mt-auto flex flex-col items-center">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleActivityClick(item.id)}
              className={`w-12 h-12 hover:bg-[#2d2d2d] flex items-center justify-center relative ${
                isActive ? 'bg-[#2d2d2d]' : ''
              }`}
              title={item.label}
            >
              <Icon
                className={`w-4.5 h-4.5 ${
                  isActive ? 'text-[#cccccc]' : 'text-[#858585]'
                }`}
              />
              {isActive && (
                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-[#007acc]" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
