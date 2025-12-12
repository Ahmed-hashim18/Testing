export type ProductStatus = "active" | "inactive" | "discontinued";

export type ProductCategory = 
  | "electronics"
  | "furniture"
  | "clothing"
  | "food"
  | "books"
  | "office-supplies"
  | "raw-materials"
  | "finished-goods"
  | "other";

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  status: ProductStatus;
  
  // Stock
  stockQuantity: number;
  lowStockThreshold: number;
  reorderPoint: number;
  unit: string;
  
  // Pricing
  costPrice: number;
  sellingPrice: number;
  markup: number;
  
  // Supplier
  supplierId?: string;
  vendorId?: string;
  supplierName?: string;
  supplierSku?: string;
  
  // Metadata
  barcode?: string;
  imageUrl?: string;
  location?: string;
  weight?: number;
  dimensions?: string;
  
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
}

export interface ProductFilters {
  search: string;
  category: ProductCategory | "all";
  status: ProductStatus | "all";
  stockStatus: "all" | "in-stock" | "low-stock" | "out-of-stock";
  priceMin: string;
  priceMax: string;
}

export type ProductViewMode = "grid" | "table";
