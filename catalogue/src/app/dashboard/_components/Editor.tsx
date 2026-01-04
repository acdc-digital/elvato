"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { PanelType } from "./ActivityBar";
import { ProductList } from "./ProductList";
import { TrashList } from "./TrashList";
import { ProductForm } from "./ProductForm";
import { InventoryList } from "./InventoryList";

export interface Tab {
  id: string;
  title: string;
  type: "products" | "inventory" | "trash" | "product-detail" | "new-product";
  productId?: string; // For product-detail tabs
}

interface EditorProps {
  activePanel: PanelType;
}

// Map panel types to tab configurations
const panelToTab: Record<string, { id: string; title: string; type: Tab["type"] }> = {
  products: { id: "products", title: "Products", type: "products" },
  inventory: { id: "inventory", title: "Inventory", type: "inventory" },
  trash: { id: "trash", title: "Trash", type: "trash" },
};

export function Editor({ activePanel }: EditorProps) {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "products", title: "Products", type: "products" }
  ]);
  const [activeTabId, setActiveTabId] = useState("products");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Respond to sidebar panel changes - open or switch to corresponding tab
  useEffect(() => {
    if (activePanel && panelToTab[activePanel]) {
      const tabConfig = panelToTab[activePanel];
      const existingTab = tabs.find(tab => tab.id === tabConfig.id);
      
      if (existingTab) {
        // Tab exists, switch to it
        setActiveTabId(existingTab.id);
      } else {
        // Create new tab
        const newTab: Tab = {
          id: tabConfig.id,
          title: tabConfig.title,
          type: tabConfig.type,
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
      }
    }
  }, [activePanel]);

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
  };

  // Open a new tab for a specific product
  const openProductTab = useCallback((productId: string, productName: string) => {
    const existingTab = tabs.find(tab => tab.productId === productId);
    
    if (existingTab) {
      // Tab already exists, just switch to it
      setActiveTabId(existingTab.id);
    } else {
      // Create new product detail tab
      const newTab: Tab = {
        id: `product-${productId}`,
        title: productName,
        type: "product-detail",
        productId,
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    }
  }, [tabs]);

  // Open new product form tab
  const openNewProductTab = useCallback(() => {
    const existingTab = tabs.find(tab => tab.type === "new-product");
    
    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      const newTab: Tab = {
        id: `new-product-${Date.now()}`,
        title: "New Product",
        type: "new-product",
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    }
  }, [tabs]);

  // Handle product save - close tab and switch to products
  const handleProductSaved = useCallback((productId: string) => {
    // Close the new product tab
    const newProductTab = tabs.find(tab => tab.type === "new-product");
    if (newProductTab) {
      closeTab(newProductTab.id);
    }
    // Switch to inventory tab
    setActiveTabId("inventory");
  }, [tabs]);

  const renderContent = () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    
    if (!activeTab) {
      return (
        <div className="flex-1 flex items-center justify-center text-[#858585]">
          No tab selected
        </div>
      );
    }

    // Render content based on tab type
    switch (activeTab.type) {
      case "products":
        return <ProductList onProductClick={openProductTab} onAddProduct={openNewProductTab} />;
      
      case "inventory":
        return <InventoryList />;
      
      case "trash":
        return <TrashList onProductClick={openProductTab} />;
      
      case "new-product":
        return (
          <ProductForm
            onSave={handleProductSaved}
            onCancel={() => closeTab(activeTab.id)}
          />
        );
      
      case "product-detail":
        // Empty content for now - will be filled in during testing
        return (
          <div className="flex-1 flex items-center justify-center text-[#858585]">
            {/* Product detail view for: {activeTab.productId} */}
          </div>
        );
      
      default:
        return null;
    }
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
