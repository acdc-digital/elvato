"use client";

import { useState } from "react";
import { Save, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

interface ProductFormProps {
  onSave: (productId: string) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  sku: string;
  lists: number;
  price: number;
  sourceUrl: string;
  image1: string;
  image2: string;
  image3: string;
  image4: string;
  image5: string;
  image6: string;
  image7: string;
  image8: string;
  image9: string;
  image10: string;
}

const initialFormData: FormData = {
  name: "",
  sku: "",
  lists: 0,
  price: 0,
  sourceUrl: "",
  image1: "",
  image2: "",
  image3: "",
  image4: "",
  image5: "",
  image6: "",
  image7: "",
  image8: "",
  image9: "",
  image10: "",
};

export function ProductForm({ onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showImages, setShowImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);

  // Convex mutations and queries
  const createProduct = useMutation(api.products.createProduct);
  const existingProduct = useQuery(
    api.products.getProductBySku,
    formData.sku ? { sku: formData.sku } : "skip"
  );

  // Check for duplicate SKU
  const checkSkuDuplicate = (sku: string) => {
    if (existingProduct && sku) {
      setSkuError("This SKU already exists");
    } else {
      setSkuError(null);
    }
  };

  // Update form field
  const updateField = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === "sku") {
      checkSkuDuplicate(value as string);
    }
  };

  // Check if form is valid
  const isValid = formData.name.trim() !== "" && 
                  formData.sku.trim() !== "" && 
                  !skuError;

  // Handle save
  const handleSave = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    try {
      const productId = await createProduct({
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        lists: formData.lists,
        price: formData.price,
        sourceUrl: formData.sourceUrl.trim(),
        image1: formData.image1.trim() || undefined,
        image2: formData.image2.trim() || undefined,
        image3: formData.image3.trim() || undefined,
        image4: formData.image4.trim() || undefined,
        image5: formData.image5.trim() || undefined,
        image6: formData.image6.trim() || undefined,
        image7: formData.image7.trim() || undefined,
        image8: formData.image8.trim() || undefined,
        image9: formData.image9.trim() || undefined,
        image10: formData.image10.trim() || undefined,
      });
      
      onSave(productId);
    } catch (error) {
      console.error("Failed to create product:", error);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Form Header */}
      <div className="px-4 py-3 border-b border-[#2d2d2d] bg-[#1a1a1a] flex items-center justify-between shrink-0">
        <h2 className="text-sm font-medium text-[#cccccc]">New Product</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 px-3 text-xs text-[#858585] hover:text-[#cccccc] hover:bg-[#2d2d2d] border border-[#2d2d2d]"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Cancel
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="h-7 px-3 text-xs text-[#858585] hover:text-[#007acc] hover:bg-[#2d2d2d] border border-[#2d2d2d] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {isSaving ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl space-y-4">
          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-xs text-[#858585]">
              Product Name <span className="text-[#f14c4c]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Enter product name"
              className="w-full h-8 px-3 text-sm bg-[#252526] border border-[#2d2d2d] rounded text-[#cccccc] placeholder:text-[#858585] focus:outline-none focus:border-[#007acc]"
            />
          </div>

          {/* SKU */}
          <div className="space-y-1.5">
            <label className="text-xs text-[#858585]">
              SKU <span className="text-[#f14c4c]">*</span>
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              placeholder="Enter SKU"
              className={`w-full h-8 px-3 text-sm bg-[#252526] border rounded text-[#cccccc] placeholder:text-[#858585] focus:outline-none ${
                skuError ? "border-[#f14c4c]" : "border-[#2d2d2d] focus:border-[#007acc]"
              }`}
            />
            {skuError && (
              <p className="text-xs text-[#f14c4c]">{skuError}</p>
            )}
          </div>

          {/* Lists and Price - Side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#858585]">Lists</label>
              <input
                type="number"
                value={formData.lists}
                onChange={(e) => updateField("lists", parseInt(e.target.value) || 0)}
                min="0"
                placeholder="0"
                className="w-full h-8 px-3 text-sm bg-[#252526] border border-[#2d2d2d] rounded text-[#cccccc] focus:outline-none focus:border-[#007acc]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#858585]">Price ($)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full h-8 px-3 text-sm bg-[#252526] border border-[#2d2d2d] rounded text-[#cccccc] focus:outline-none focus:border-[#007acc]"
              />
            </div>
          </div>

          {/* Source URL */}
          <div className="space-y-1.5">
            <label className="text-xs text-[#858585]">Source URL</label>
            <input
              type="url"
              value={formData.sourceUrl}
              onChange={(e) => updateField("sourceUrl", e.target.value)}
              placeholder="https://example.com/product"
              className="w-full h-8 px-3 text-sm bg-[#252526] border border-[#2d2d2d] rounded text-[#cccccc] placeholder:text-[#858585] focus:outline-none focus:border-[#007acc]"
            />
          </div>

          {/* Image URLs - Collapsible Section */}
          <div className="border border-[#2d2d2d] rounded">
            <button
              type="button"
              onClick={() => setShowImages(!showImages)}
              className="w-full px-3 py-2 flex items-center justify-between text-xs text-[#858585] hover:bg-[#252526]"
            >
              <span>Image URLs (optional)</span>
              {showImages ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            
            {showImages && (
              <div className="px-3 pb-3 space-y-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <div key={num} className="space-y-1">
                    <label className="text-xs text-[#858585]">Image {num}</label>
                    <input
                      type="url"
                      value={formData[`image${num}` as keyof FormData] as string}
                      onChange={(e) => updateField(`image${num}` as keyof FormData, e.target.value)}
                      placeholder={`https://example.com/image${num}.jpg`}
                      className="w-full h-8 px-3 text-sm bg-[#252526] border border-[#2d2d2d] rounded text-[#cccccc] placeholder:text-[#858585] focus:outline-none focus:border-[#007acc]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
