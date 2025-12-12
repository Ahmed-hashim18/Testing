import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/types/product";
import { format } from "date-fns";
import { Package, DollarSign, TrendingUp, User, Barcode, MapPin, Weight } from "lucide-react";

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailDialog({ product, open, onOpenChange }: ProductDetailDialogProps) {
  if (!product) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "discontinued":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStockStatus = () => {
    if (product.stockQuantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (product.stockQuantity <= product.lowStockThreshold) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const stockStatus = getStockStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            {product.name}
            <Badge variant={getStatusVariant(product.status)} className="capitalize">
              {product.status}
            </Badge>
            <Badge variant={stockStatus.variant}>
              {stockStatus.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Product ID</p>
              <p className="font-medium">{product.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">SKU</p>
              <p className="font-medium">{product.sku}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Category</p>
              <Badge variant="outline" className="capitalize">
                {product.category.replace("-", " ")}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Unit</p>
              <p className="font-medium capitalize">{product.unit}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{product.description}</p>
          </div>

          <Separator />

          {/* Stock Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stock Information
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Stock</p>
                <p className="text-2xl font-bold text-primary">{product.stockQuantity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Low Stock Threshold</p>
                <p className="text-xl font-semibold">{product.lowStockThreshold}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reorder Point</p>
                <p className="text-xl font-semibold">{product.reorderPoint}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cost Price</p>
                <p className="text-xl font-semibold">
                  MRU {product.costPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Selling Price</p>
                <p className="text-xl font-semibold text-primary">
                  MRU {product.sellingPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Markup
                </p>
                <p className="text-xl font-semibold text-green-600">
                  {product.markup.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {product.supplierName && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Supplier Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Supplier</p>
                    <p className="font-medium">{product.supplierName}</p>
                  </div>
                  {product.supplierSku && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Supplier SKU</p>
                      <p className="font-medium">{product.supplierSku}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Additional Details */}
          <div>
            <h3 className="font-semibold mb-3">Additional Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.barcode && (
                <div className="flex items-start gap-2">
                  <Barcode className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Barcode</p>
                    <p className="font-medium">{product.barcode}</p>
                  </div>
                </div>
              )}
              {product.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{product.location}</p>
                  </div>
                </div>
              )}
              {product.weight && (
                <div className="flex items-start gap-2">
                  <Weight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Weight</p>
                    <p className="font-medium">{product.weight} kg</p>
                  </div>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <p className="text-muted-foreground">Dimensions</p>
                  <p className="font-medium">{product.dimensions}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Created By</p>
              <p className="font-medium">{product.createdBy}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Created At</p>
              <p className="font-medium">{format(new Date(product.createdAt), "MMM dd, yyyy HH:mm")}</p>
            </div>
            {product.updatedAt && (
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">Last Updated</p>
                <p className="font-medium">{format(new Date(product.updatedAt), "MMM dd, yyyy HH:mm")}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
