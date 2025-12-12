import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SalesOrder, LineItem } from "@/types/sale";
import { Customer } from "@/types/customer";
import { Product } from "@/types/product";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SalesFormDialogProps {
  sale: SalesOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sale: Partial<SalesOrder>) => Promise<void>;
  customers: Customer[];
  products: Product[];
  onCreateCustomer?: (customer: Partial<Customer>) => Promise<any>;
}

export function SalesFormDialog({ sale, open, onOpenChange, onSave, customers, products, onCreateCustomer }: SalesFormDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<SalesOrder>>({
    orderNumber: "",
    customerId: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "draft",
    lineItems: [],
    notes: "",
  });
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  useEffect(() => {
    if (sale) {
      setFormData(sale);
    } else {
      setFormData({
        orderNumber: "",
        customerId: "",
        date: new Date().toISOString().split("T")[0],
        dueDate: "",
        status: "draft",
        lineItems: [],
        notes: "",
      });
    }
    setShowNewCustomer(false);
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewCustomerPhone("");
  }, [sale, open]);

  const calculateLineItem = (item: Partial<LineItem>): LineItem => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const discount = item.discount || 0; // Now MRU amount, not percentage

    const subtotal = quantity * unitPrice;
    const total = subtotal - discount;

    return {
      ...item,
      quantity,
      unitPrice,
      discount,
      tax: 0,
      total: Math.max(0, total),
    } as LineItem;
  };

  const calculateTotals = (items: LineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discountAmount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);

    return { subtotal, discountAmount, taxAmount: 0, total };
  };

  const addLineItem = () => {
    const newItem: Partial<LineItem> = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      sku: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0,
      total: 0,
    };
    setFormData({
      ...formData,
      lineItems: [...(formData.lineItems || []), calculateLineItem(newItem)],
    });
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const items = [...(formData.lineItems || [])];
    items[index] = { ...items[index], [field]: value };

    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        items[index].productName = product.name;
        items[index].sku = product.sku;
        items[index].unitPrice = product.sellingPrice;
      }
    }

    items[index] = calculateLineItem(items[index]);
    setFormData({ ...formData, lineItems: items });
  };

  const removeLineItem = (index: number) => {
    const items = formData.lineItems?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, lineItems: items });
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast({ title: "Error", description: "Customer name is required", variant: "destructive" });
      return;
    }

    if (onCreateCustomer) {
      try {
        const newCustomer = await onCreateCustomer({
          name: newCustomerName.trim(),
          email: newCustomerEmail.trim() || undefined,
          phone: newCustomerPhone.trim() || undefined,
          status: "active",
        });
        setFormData({ ...formData, customerId: newCustomer.id });
        setShowNewCustomer(false);
        setNewCustomerName("");
        setNewCustomerEmail("");
        setNewCustomerPhone("");
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.orderNumber?.trim()) {
      toast({ title: "Error", description: "Please enter an order number", variant: "destructive" });
      return;
    }
    if (!formData.customerId) {
      toast({ title: "Error", description: "Please select a customer", variant: "destructive" });
      return;
    }
    if (!formData.lineItems || formData.lineItems.length === 0) {
      toast({ title: "Error", description: "Please add at least one line item", variant: "destructive" });
      return;
    }

    const customer = customers.find((c) => c.id === formData.customerId);
    const totals = calculateTotals(formData.lineItems);

    // Only update paidAmount and balance when status is transitioning TO "paid"
    // This preserves partial payment tracking and audit trails
    const previousStatus = sale?.status || "draft";
    const isTransitioningToPaid = formData.status === "paid" && previousStatus !== "paid";
    
    let paidAmount = sale?.paidAmount || 0;
    let balance = totals.total - paidAmount;
    
    if (isTransitioningToPaid) {
      // Status is changing to "paid" - mark as fully paid
      paidAmount = totals.total;
      balance = 0;
    } else if (formData.status === "paid") {
      // Status is already "paid" - preserve existing payment info
      // Cap paidAmount to not exceed the new total (prevents negative balance)
      // This handles cases where line items are removed and total is reduced
      if (paidAmount > totals.total) {
        paidAmount = totals.total;
      }
      balance = totals.total - paidAmount;
    } else {
      // Status is not "paid" - calculate balance normally
      // Also cap paidAmount to total to prevent negative balance
      if (paidAmount > totals.total) {
        paidAmount = totals.total;
      }
      balance = totals.total - paidAmount;
    }

    const saleData: Partial<SalesOrder> = {
      ...formData,
      customerName: customer?.name || "",
      ...totals,
      paidAmount,
      balance,
    };

    try {
      await onSave(saleData);
      onOpenChange(false);
    } catch (error) {
      // Error handled in parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sale ? "Edit Sales Order" : "Create Sales Order"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number *</Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber || ""}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                placeholder="e.g., SO-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              {!showNewCustomer ? (
                <div className="space-y-2">
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => {
                      if (value === "__create_new__") {
                        setShowNewCustomer(true);
                      } else {
                        setFormData({ ...formData, customerId: value });
                      }
                    }}
                  >
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {onCreateCustomer && (
                        <SelectItem value="__create_new__" className="text-primary font-medium">
                          <span className="flex items-center gap-1">
                            <Plus className="h-4 w-4" />
                            Create new customer
                          </span>
                        </SelectItem>
                      )}
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                  <div className="text-sm font-medium">New Customer</div>
                  <Input
                    placeholder="Customer name *"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                  />
                  <Input
                    placeholder="Email (optional)"
                    type="email"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Phone (optional)"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleCreateCustomer}>
                      Create
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowNewCustomer(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Order Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 text-sm">Product</th>
                      <th className="text-right p-2 text-sm">Qty</th>
                      <th className="text-right p-2 text-sm">Price</th>
                      <th className="text-right p-2 text-sm">Disc (MRU)</th>
                      <th className="text-right p-2 text-sm">Total</th>
                      <th className="p-2 text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lineItems?.map((item, index) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">
                          <Select
                            value={item.productId}
                            onValueChange={(value) => updateLineItem(index, "productId", value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 0)}
                            className="w-20 text-right"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="w-24 text-right"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount}
                            onChange={(e) => updateLineItem(index, "discount", parseFloat(e.target.value) || 0)}
                            className="w-24 text-right"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-2 text-right font-medium">{item.total.toFixed(2)} MRU</td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {formData.lineItems && formData.lineItems.length > 0 && (
              <div className="flex justify-end">
                <div className="w-64 space-y-2 pt-4">
                  {(() => {
                    const totals = calculateTotals(formData.lineItems);
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>{totals.subtotal.toFixed(2)} MRU</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Discount:</span>
                          <span className="text-red-500">-{totals.discountAmount.toFixed(2)} MRU</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>{totals.total.toFixed(2)} MRU</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {sale ? "Update" : "Create"} Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
