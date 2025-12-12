import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Pencil, FileText, Download, Users } from "lucide-react";
import { SalesFilters } from "@/components/sales/SalesFilters";
import { SalesDetailDialog } from "@/components/sales/SalesDetailDialog";
import { SalesFormDialog } from "@/components/sales/SalesFormDialog";
import { SalesBulkActionsBar } from "@/components/sales/SalesBulkActionsBar";
import { SalesAnalytics } from "@/components/sales/SalesAnalytics";
import { CustomerFormDialog } from "@/components/sales/CustomerFormDialog";
import { CollapsibleFilters } from "@/components/common/CollapsibleFilters";
import { SalesOrder, SalesFilters as SalesFiltersType } from "@/types/sale";
import { useSales } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { format } from "date-fns";
import { Customer } from "@/types/customer";
import { formatAmount } from "@/lib/formatters";

const statusColors = {
  draft: "bg-gray-500",
  confirmed: "bg-blue-500",
  invoiced: "bg-purple-500",
  paid: "bg-green-500",
  cancelled: "bg-red-500",
};

export default function Sales() {
  const { sales, loading: salesLoading, createSalesOrder, updateSalesOrder, deleteSalesOrders, bulkUpdateStatus } = useSales();
  const { customers, loading: customersLoading, createCustomer, refetch: refetchCustomers } = useCustomers();
  const { products, loading: productsLoading } = useProducts();
  const [selectedSale, setSelectedSale] = useState<SalesOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<SalesFiltersType>({
    search: "",
    status: "all",
    customerId: "all",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
  });

  const filteredSales = sales.filter((sale) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !sale.orderNumber.toLowerCase().includes(searchLower) &&
        !sale.customerName.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (filters.status !== "all" && sale.status !== filters.status) return false;
    if (filters.customerId !== "all" && sale.customerId !== filters.customerId) return false;
    if (filters.dateFrom && sale.date < filters.dateFrom) return false;
    if (filters.dateTo && sale.date > filters.dateTo) return false;
    if (filters.minAmount && sale.total < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && sale.total > parseFloat(filters.maxAmount)) return false;
    return true;
  });

  const handleViewDetails = (sale: SalesOrder) => {
    setSelectedSale(sale);
    setShowDetailDialog(true);
  };

  const handleEdit = (sale: SalesOrder) => {
    setSelectedSale(sale);
    setShowFormDialog(true);
  };

  const handleCreate = () => {
    setSelectedSale(null);
    setShowFormDialog(true);
  };

  const handleSave = async (saleData: Partial<SalesOrder>) => {
    try {
      if (selectedSale) {
        await updateSalesOrder(selectedSale.id, saleData);
      } else {
        await createSalesOrder(saleData);
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredSales.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkConfirm = async () => {
    try {
      await bulkUpdateStatus(Array.from(selectedIds), "confirmed");
      setSelectedIds(new Set());
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleBulkCancel = async () => {
    try {
      await bulkUpdateStatus(Array.from(selectedIds), "cancelled");
      setSelectedIds(new Set());
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleBulkDelete = async () => {
    try {
      await deleteSalesOrders(Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleBulkExport = () => {
    const selectedSales = sales.filter((s) => selectedIds.has(s.id));
    const csv = [
      ["Order Number", "Customer", "Date", "Status", "Total", "Paid", "Balance"].join(","),
      ...selectedSales.map((s) =>
        [s.orderNumber, s.customerName, s.date, s.status, s.total, s.paidAmount, s.balance].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportAll = () => {
    const csv = [
      ["Order Number", "Customer", "Date", "Status", "Total", "Paid", "Balance"].join(","),
      ...filteredSales.map((s) =>
        [s.orderNumber, s.customerName, s.date, s.status, s.total, s.paidAmount, s.balance].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (salesLoading || customersLoading || productsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setShowCustomerDialog(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDialog(true);
  };

  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    await createCustomer(customerData);
    await refetchCustomers();
    setShowCustomerDialog(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground mt-1">Manage sales orders, customers, and invoices</p>
        </div>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders">Sales Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleExportAll}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>

          <SalesAnalytics sales={filteredSales} />

          <CollapsibleFilters title="Search & Filters">
            <SalesFilters filters={filters} onFilterChange={setFilters} customers={customers} />
          </CollapsibleFilters>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left">
                      <Checkbox
                        checked={selectedIds.size === filteredSales.length && filteredSales.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-4 text-left font-medium">Order #</th>
                    <th className="p-4 text-left font-medium">Customer</th>
                    <th className="p-4 text-left font-medium">Date</th>
                    <th className="p-4 text-center font-medium">Qty</th>
                    <th className="p-4 text-left font-medium">Products</th>
                    <th className="p-4 text-left font-medium">Status</th>
                    <th className="p-4 text-right font-medium">Total</th>
                    <th className="p-4 text-right font-medium">Paid</th>
                    <th className="p-4 text-right font-medium">Balance</th>
                    <th className="p-4 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedIds.has(sale.id)}
                          onCheckedChange={(checked) => handleSelectOne(sale.id, checked as boolean)}
                        />
                      </td>
                      <td className="p-4 font-medium">{sale.orderNumber}</td>
                      <td className="p-4">{sale.customerName}</td>
                      <td className="p-4">{format(new Date(sale.date), "PP")}</td>
                      <td className="p-4 text-center">{sale.lineItems.reduce((sum, item) => sum + item.quantity, 0)}</td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {sale.lineItems.length > 0 
                            ? sale.lineItems.map(item => item.productName).filter(Boolean).join(", ") || `${sale.lineItems.length} item(s)`
                            : "-"}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge className={statusColors[sale.status]}>
                          {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-medium">MRU {formatAmount(sale.total)}</td>
                      <td className="p-4 text-right text-green-600">MRU {formatAmount(sale.paidAmount)}</td>
                      <td className="p-4 text-right text-orange-600">MRU {formatAmount(sale.balance)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(sale)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(sale)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(sale)} title="View Invoice">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <SalesDetailDialog sale={selectedSale} open={showDetailDialog} onOpenChange={setShowDetailDialog} />
          <SalesFormDialog
            sale={selectedSale}
            open={showFormDialog}
            onOpenChange={setShowFormDialog}
            onSave={handleSave}
            customers={customers}
            products={products}
            onCreateCustomer={createCustomer}
          />
          <SalesBulkActionsBar
            selectedCount={selectedIds.size}
            onConfirm={handleBulkConfirm}
            onCancel={handleBulkCancel}
            onDelete={handleBulkDelete}
            onExport={handleBulkExport}
            onClearSelection={() => setSelectedIds(new Set())}
          />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="flex items-center justify-end">
            <Button onClick={handleCreateCustomer}>
              <Plus className="h-4 w-4 mr-2" />
              New Customer
            </Button>
          </div>

          <Card>
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
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email || "-"}</TableCell>
                        <TableCell>{customer.phone || "-"}</TableCell>
                        <TableCell>{customer.city || "-"}</TableCell>
                        <TableCell>{customer.country || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">MRU {formatAmount(customer.balance)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <CustomerFormDialog
        customer={selectedCustomer}
        open={showCustomerDialog}
        onOpenChange={setShowCustomerDialog}
        onSave={handleSaveCustomer}
      />
    </div>
  );
}
