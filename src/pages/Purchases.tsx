import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Pencil, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PurchaseFilters } from "@/components/purchases/PurchaseFilters";
import { PurchaseDetailDialog } from "@/components/purchases/PurchaseDetailDialog";
import { PurchaseFormDialog } from "@/components/purchases/PurchaseFormDialog";
import { PurchaseBulkActionsBar } from "@/components/purchases/PurchaseBulkActionsBar";
import { PurchaseAnalytics } from "@/components/purchases/PurchaseAnalytics";
import { VendorFormDialog } from "@/components/purchases/VendorFormDialog";
import { CollapsibleFilters } from "@/components/common/CollapsibleFilters";
import { PurchaseOrder, PurchaseFilters as PurchaseFiltersType } from "@/types/purchase";
import { Vendor } from "@/types/vendor";
import { format } from "date-fns";
import { usePurchases } from "@/hooks/usePurchases";
import { useVendors } from "@/hooks/useVendors";
import { useProducts } from "@/hooks/useProducts";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { formatAmount } from "@/lib/formatters";

const statusStyles = {
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  ordered: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  received: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export default function Purchases() {
  const { purchases, isLoading, createPurchase, updatePurchase, deletePurchases, bulkUpdateStatus } = usePurchases();
  const { vendors, isLoading: isLoadingVendors, createVendor, refetch: refetchVendors } = useVendors();
  const { products, loading: isLoadingProducts } = useProducts();
  
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseOrder | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<PurchaseFiltersType>({
    search: "",
    status: "all",
    vendorId: "all",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  });

  if (isLoading || isLoadingVendors || isLoadingProducts) {
    return <LoadingSpinner />;
  }

  const filteredPurchases = purchases.filter((purchase) => {
    if (filters.search && !purchase.orderNumber.toLowerCase().includes(filters.search.toLowerCase()) &&
        !purchase.notes?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status !== "all" && purchase.status !== filters.status) return false;
    if (filters.vendorId !== "all" && purchase.vendorId !== filters.vendorId) return false;
    if (filters.dateFrom && new Date(purchase.date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(purchase.date) > new Date(filters.dateTo)) return false;
    if (filters.amountMin && purchase.total < Number(filters.amountMin)) return false;
    if (filters.amountMax && purchase.total > Number(filters.amountMax)) return false;
    return true;
  });

  const handleView = (purchase: PurchaseOrder) => {
    setSelectedPurchase(purchase);
    setIsDetailOpen(true);
  };

  const handleEdit = (purchase: PurchaseOrder) => {
    setSelectedPurchase(purchase);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedPurchase(null);
    setIsFormOpen(true);
  };

  const handleSave = async (purchaseData: Partial<PurchaseOrder>) => {
    if (selectedPurchase) {
      await updatePurchase({ id: selectedPurchase.id, data: purchaseData });
    } else {
      await createPurchase(purchaseData);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredPurchases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPurchases.map((p) => p.id)));
    }
  };

  const handleBulkMarkOrdered = async () => {
    await bulkUpdateStatus({ ids: Array.from(selectedIds), status: "ordered" });
    setSelectedIds(new Set());
  };

  const handleBulkMarkReceived = async () => {
    await bulkUpdateStatus({ 
      ids: Array.from(selectedIds), 
      status: "received",
      updateData: { receivedDate: new Date().toISOString() }
    });
    setSelectedIds(new Set());
  };

  const handleBulkMarkPaid = async () => {
    const updates = purchases
      .filter(p => selectedIds.has(p.id))
      .map(p => ({ 
        amountPaid: p.total, 
        balance: 0,
        paymentDate: new Date().toISOString()
      }));
    
    await bulkUpdateStatus({ 
      ids: Array.from(selectedIds), 
      status: "paid",
      updateData: updates[0]
    });
    setSelectedIds(new Set());
  };

  const handleBulkCancel = async () => {
    await bulkUpdateStatus({ ids: Array.from(selectedIds), status: "cancelled" });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    await deletePurchases(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    const selectedPurchases = purchases.filter((p) => selectedIds.has(p.id));
    const csv = [
      ["Order Number", "Date", "Vendor", "Status", "Subtotal", "Tax", "Total", "Paid", "Balance"],
      ...selectedPurchases.map((p) => [
        p.orderNumber,
        format(new Date(p.date), "yyyy-MM-dd"),
        p.vendorName,
        p.status,
        p.subtotal,
        p.tax,
        p.total,
        p.amountPaid,
        p.balance,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchases-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const handleCreateVendor = () => {
    setSelectedVendor(null);
    setShowVendorDialog(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowVendorDialog(true);
  };

  const handleSaveVendor = async (vendorData: Partial<Vendor>) => {
    await createVendor(vendorData);
    await refetchVendors();
    setShowVendorDialog(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchases</h1>
          <p className="text-muted-foreground mt-1">Manage purchase orders and vendor relationships</p>
        </div>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center justify-end">
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </div>

          <PurchaseAnalytics purchases={purchases} />

          <CollapsibleFilters title="Search & Filters">
            <PurchaseFilters filters={filters} onFiltersChange={setFilters} vendors={vendors} />
          </CollapsibleFilters>

          <div className="bg-card rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="p-4 text-left">
                  <Checkbox
                    checked={selectedIds.size === filteredPurchases.length && filteredPurchases.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-left text-sm font-medium">Order #</th>
                <th className="p-4 text-left text-sm font-medium">Date</th>
                <th className="p-4 text-left text-sm font-medium">Vendor</th>
                <th className="p-4 text-left text-sm font-medium">Status</th>
                <th className="p-4 text-right text-sm font-medium">Total</th>
                <th className="p-4 text-right text-sm font-medium">Paid</th>
                <th className="p-4 text-right text-sm font-medium">Balance</th>
                <th className="p-4 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedIds.has(purchase.id)}
                      onCheckedChange={() => handleToggleSelect(purchase.id)}
                    />
                  </td>
                  <td className="p-4 font-medium">{purchase.orderNumber}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(new Date(purchase.date), "MMM dd, yyyy")}
                  </td>
                  <td className="p-4">{purchase.vendorName}</td>
                  <td className="p-4">
                    <Badge className={statusStyles[purchase.status]}>{purchase.status.toUpperCase()}</Badge>
                  </td>
                  <td className="p-4 text-right font-semibold">MRU {formatAmount(purchase.total)}</td>
                  <td className="p-4 text-right text-green-600">MRU {formatAmount(purchase.amountPaid)}</td>
                  <td className="p-4 text-right text-orange-600">MRU {formatAmount(purchase.balance)}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleView(purchase)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(purchase)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPurchases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No purchase orders found</p>
          </div>
          )}
          </div>

          <PurchaseDetailDialog purchase={selectedPurchase} open={isDetailOpen} onOpenChange={setIsDetailOpen} />

          <PurchaseFormDialog
            purchase={selectedPurchase}
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSave}
            vendors={vendors}
            products={products}
            onCreateVendor={createVendor}
          />

          <PurchaseBulkActionsBar
            selectedCount={selectedIds.size}
            onMarkOrdered={handleBulkMarkOrdered}
            onMarkReceived={handleBulkMarkReceived}
            onMarkPaid={handleBulkMarkPaid}
            onCancel={handleBulkCancel}
            onDelete={handleBulkDelete}
            onExport={handleBulkExport}
            onClearSelection={() => setSelectedIds(new Set())}
          />
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <div className="flex items-center justify-end">
            <Button onClick={handleCreateVendor}>
              <Plus className="h-4 w-4 mr-2" />
              New Vendor
            </Button>
          </div>

          <div className="bg-card rounded-lg border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No vendors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>{vendor.email || "-"}</TableCell>
                        <TableCell>{vendor.phone || "-"}</TableCell>
                        <TableCell>{vendor.city || "-"}</TableCell>
                        <TableCell>{vendor.country || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={vendor.status === "active" ? "default" : "secondary"}>
                            {vendor.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditVendor(vendor)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <VendorFormDialog
        vendor={selectedVendor}
        open={showVendorDialog}
        onOpenChange={setShowVendorDialog}
        onSave={handleSaveVendor}
      />
    </div>
  );
}
