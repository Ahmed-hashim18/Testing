import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Eye, Edit, Download, Grid3X3, List, AlertTriangle } from "lucide-react";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductDetailDialog } from "@/components/products/ProductDetailDialog";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { ProductBulkActionsBar } from "@/components/products/ProductBulkActionsBar";
import { CollapsibleFilters } from "@/components/common/CollapsibleFilters";
import { Product, ProductFilters as Filters, ProductViewMode } from "@/types/product";
import { useProducts } from "@/hooks/useProducts";
import { useVendors } from "@/hooks/useVendors";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

export default function Products() {
  const { products, loading, createProduct, updateProduct, deleteProducts, bulkUpdateStatus } = useProducts();
  const { vendors } = useVendors();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ProductViewMode>("table");
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "all",
    status: "all",
    stockStatus: "all",
    priceMin: "",
    priceMax: "",
  });

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      if (filters.category !== "all" && product.category !== filters.category) return false;
      if (filters.status !== "all" && product.status !== filters.status) return false;

      if (filters.stockStatus !== "all") {
        if (filters.stockStatus === "out-of-stock" && product.stockQuantity > 0) return false;
        if (filters.stockStatus === "low-stock" && (product.stockQuantity === 0 || product.stockQuantity > product.lowStockThreshold)) return false;
        if (filters.stockStatus === "in-stock" && product.stockQuantity <= product.lowStockThreshold) return false;
      }

      if (filters.priceMin && product.sellingPrice < parseFloat(filters.priceMin)) return false;
      if (filters.priceMax && product.sellingPrice > parseFloat(filters.priceMax)) return false;

      return true;
    });
  }, [products, filters]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold && p.status === "active");
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter(p => p.stockQuantity === 0 && p.status === "active");
  }, [products]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredProducts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleView = (product: Product) => {
    setDetailProduct(product);
    setShowDetailDialog(true);
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setShowFormDialog(true);
  };

  const handleCreate = () => {
    setEditProduct(null);
    setShowFormDialog(true);
  };

  const handleSave = async (productData: Partial<Product>) => {
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, productData);
      } else {
        await createProduct(productData);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleActivate = async () => {
    try {
      await bulkUpdateStatus(selectedIds, "active");
      setSelectedIds([]);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeactivate = async () => {
    try {
      await bulkUpdateStatus(selectedIds, "inactive");
      setSelectedIds([]);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDiscontinue = async () => {
    try {
      await bulkUpdateStatus(selectedIds, "discontinued");
      setSelectedIds([]);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProducts(selectedIds);
      setSelectedIds([]);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["ID", "SKU", "Name", "Category", "Stock", "Cost", "Price", "Markup", "Status"].join(","),
      ...filteredProducts.map((p) =>
        [
          p.id,
          p.sku,
          `"${p.name}"`,
          p.category,
          p.stockQuantity,
          p.costPrice,
          p.sellingPrice,
          p.markup.toFixed(2),
          p.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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

  const getStockBadge = (product: Product) => {
    if (product.stockQuantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (product.stockQuantity <= product.lowStockThreshold) {
      return <Badge variant="secondary">Low Stock</Badge>;
    }
    return <Badge variant="outline">In Stock</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products & Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage products, track stock levels, and monitor inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Product
          </Button>
        </div>
      </div>

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {outOfStockProducts.length > 0 && (
            <Card className="p-4 border-destructive">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive">Out of Stock</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {outOfStockProducts.length} product{outOfStockProducts.length !== 1 ? 's' : ''} out of stock
                  </p>
                </div>
              </div>
            </Card>
          )}
          {lowStockProducts.length > 0 && (
            <Card className="p-4 border-secondary">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-secondary-foreground mt-0.5" />
                <div>
                  <h3 className="font-semibold">Low Stock Alert</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} below threshold
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      <CollapsibleFilters title="Search & Filters">
        <ProductFilters filters={filters} onFiltersChange={setFilters} />
      </CollapsibleFilters>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
        </p>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <ProductBulkActionsBar
          selectedCount={selectedIds.length}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onDiscontinue={handleDiscontinue}
          onDelete={handleDelete}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      {viewMode === "table" ? (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Markup</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No products found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(product.id)}
                          onCheckedChange={(checked) => handleSelectOne(product.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.sku}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{product.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {product.category.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-medium">{product.stockQuantity}</span>
                          {getStockBadge(product)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">MRU {product.costPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">MRU {product.sellingPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm text-green-600">{product.markup.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(product.status)} className="capitalize">
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleView(product)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-4 relative">
              <div className="absolute top-4 left-4">
                <Checkbox
                  checked={selectedIds.includes(product.id)}
                  onCheckedChange={(checked) => handleSelectOne(product.id, checked as boolean)}
                />
              </div>
              <div className="mt-8 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                  <Badge variant={getStatusVariant(product.status)} className="shrink-0">
                    {product.status[0].toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{product.sku}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Stock</p>
                    <p className="font-semibold">{product.stockQuantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold text-primary">MRU {product.sellingPrice.toFixed(2)}</p>
                  </div>
                </div>
                {getStockBadge(product)}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleView(product)}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(product)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProductDetailDialog
        product={detailProduct}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      <ProductFormDialog
        product={editProduct}
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        onSave={handleSave}
        vendors={vendors}
      />
    </div>
  );
}
