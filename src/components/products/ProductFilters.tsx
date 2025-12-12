import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { ProductFilters as Filters } from "@/types/product";

interface ProductFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const handleReset = () => {
    onFiltersChange({
      search: "",
      category: "all",
      status: "all",
      stockStatus: "all",
      priceMin: "",
      priceMax: "",
    });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.category !== "all" ||
    filters.status !== "all" ||
    filters.stockStatus !== "all" ||
    filters.priceMin !== "" ||
    filters.priceMax !== "";

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="text-sm mb-2 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name, SKU, description..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <div className="w-full md:w-48">
          <Label htmlFor="category" className="text-sm mb-2 block">Category</Label>
          <Select value={filters.category} onValueChange={(value) => onFiltersChange({ ...filters, category: value as any })}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="furniture">Furniture</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="books">Books</SelectItem>
              <SelectItem value="office-supplies">Office Supplies</SelectItem>
              <SelectItem value="raw-materials">Raw Materials</SelectItem>
              <SelectItem value="finished-goods">Finished Goods</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-40">
          <Label htmlFor="status" className="text-sm mb-2 block">Status</Label>
          <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value as any })}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-44">
          <Label htmlFor="stockStatus" className="text-sm mb-2 block">Stock Status</Label>
          <Select value={filters.stockStatus} onValueChange={(value) => onFiltersChange({ ...filters, stockStatus: value as any })}>
            <SelectTrigger id="stockStatus">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priceMin" className="text-sm mb-2 block">Min Price</Label>
          <Input
            id="priceMin"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={filters.priceMin}
            onChange={(e) => onFiltersChange({ ...filters, priceMin: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="priceMax" className="text-sm mb-2 block">Max Price</Label>
          <Input
            id="priceMax"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={filters.priceMax}
            onChange={(e) => onFiltersChange({ ...filters, priceMax: e.target.value })}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
