import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PurchaseFilters as PurchaseFiltersType } from "@/types/purchase";
import { Vendor } from "@/types/vendor";

interface PurchaseFiltersProps {
  filters: PurchaseFiltersType;
  onFiltersChange: (filters: PurchaseFiltersType) => void;
  vendors: Vendor[];
}

export function PurchaseFilters({ filters, onFiltersChange, vendors }: PurchaseFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Order number, notes..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value as any })}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor">Vendor</Label>
        <Select value={filters.vendorId} onValueChange={(value) => onFiltersChange({ ...filters, vendorId: value })}>
          <SelectTrigger id="vendor">
            <SelectValue placeholder="All vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateFrom">Date From</Label>
        <Input
          id="dateFrom"
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateTo">Date To</Label>
        <Input
          id="dateTo"
          type="date"
          value={filters.dateTo}
          onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amountMin">Min Amount</Label>
        <Input
          id="amountMin"
          type="number"
          placeholder="0"
          value={filters.amountMin}
          onChange={(e) => onFiltersChange({ ...filters, amountMin: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amountMax">Max Amount</Label>
        <Input
          id="amountMax"
          type="number"
          placeholder="Any"
          value={filters.amountMax}
          onChange={(e) => onFiltersChange({ ...filters, amountMax: e.target.value })}
        />
      </div>
    </div>
  );
}
