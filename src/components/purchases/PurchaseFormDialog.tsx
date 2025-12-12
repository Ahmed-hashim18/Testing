import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PurchaseOrder, PurchaseLineItem, PurchaseStatus } from "@/types/purchase";
import { Vendor } from "@/types/vendor";
import { Product } from "@/types/product";
import { Trash2, Plus } from "lucide-react";

interface PurchaseFormDialogProps {
  purchase: PurchaseOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (purchase: Partial<PurchaseOrder>) => Promise<void>;
  vendors: Vendor[];
  products: Product[];
  onCreateVendor?: (vendor: Partial<Vendor>) => Promise<any>;
}

export function PurchaseFormDialog({ purchase, open, onOpenChange, onSave, vendors, products, onCreateVendor }: PurchaseFormDialogProps) {
  const [formData, setFormData] = useState<Partial<PurchaseOrder>>({
    orderNumber: "",
    date: new Date().toISOString().split("T")[0],
    vendorId: "",
    vendorName: "",
    status: "draft" as PurchaseStatus,
    lineItems: [],
    taxRate: 10,
    notes: "",
  });
  const [showNewVendor, setShowNewVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");

  useEffect(() => {
    if (purchase) {
      setFormData({
        ...purchase,
        date: purchase.date.split("T")[0],
      });
    } else {
      const nextOrderNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
      setFormData({
        orderNumber: nextOrderNumber,
        date: new Date().toISOString().split("T")[0],
        vendorId: "",
        vendorName: "",
        status: "draft",
        lineItems: [],
        taxRate: 10,
        notes: "",
      });
    }
    setShowNewVendor(false);
    setNewVendorName("");
    setNewVendorEmail("");
    setNewVendorPhone("");
  }, [purchase, open]);

  const calculateTotals = (lineItems: PurchaseLineItem[], taxRate: number) => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = taxRate && taxRate > 0 ? (subtotal * taxRate) / 100 : 0;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleAddLineItem = () => {
    const newItem: PurchaseLineItem = {
      id: `li-${Date.now()}`,
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setFormData({
      ...formData,
      lineItems: [...(formData.lineItems || []), newItem],
    });
  };

  const handleRemoveLineItem = (id: string) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems?.filter((item) => item.id !== id) || [],
    });
  };

  const handleLineItemChange = (id: string, field: keyof PurchaseLineItem, value: any) => {
    const updatedItems = formData.lineItems?.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          if (product) {
            updatedItem.productName = product.name;
            updatedItem.unitPrice = product.costPrice;
          }
        }
        
        updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        return updatedItem;
      }
      return item;
    }) || [];

    setFormData({ ...formData, lineItems: updatedItems });
  };

  const handleVendorChange = (vendorId: string) => {
    if (vendorId === "__create_new__") {
      setShowNewVendor(true);
      return;
    }
    const vendor = vendors.find((v) => v.id === vendorId);
    setFormData({
      ...formData,
      vendorId,
      vendorName: vendor?.name || "",
    });
  };

  const handleCreateVendor = async () => {
    if (!newVendorName.trim()) return;

    if (onCreateVendor) {
      try {
        const newVendor = await onCreateVendor({
          name: newVendorName.trim(),
          email: newVendorEmail.trim() || undefined,
          phone: newVendorPhone.trim() || undefined,
          status: "active",
        });
        setFormData({
          ...formData,
          vendorId: newVendor.id,
          vendorName: newVendor.name,
        });
        setShowNewVendor(false);
        setNewVendorName("");
        setNewVendorEmail("");
        setNewVendorPhone("");
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const handleSubmit = async () => {
    const taxRate = formData.taxRate ?? 0;
    const { subtotal, tax, total } = calculateTotals(formData.lineItems || [], taxRate);
    const amountPaid = formData.amountPaid || 0;
    
    await onSave({
      ...formData,
      taxRate,
      subtotal,
      tax,
      total,
      amountPaid,
      balance: total - amountPaid,
      date: new Date(formData.date!).toISOString(),
    });
    onOpenChange(false);
  };

  const taxRate = formData.taxRate ?? 0;
  const { subtotal, tax, total } = calculateTotals(formData.lineItems || [], taxRate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{purchase ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              {!showNewVendor ? (
                <Select value={formData.vendorId} onValueChange={handleVendorChange}>
                  <SelectTrigger id="vendor">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {onCreateVendor && (
                      <SelectItem value="__create_new__" className="text-primary font-medium">
                        <span className="flex items-center gap-1">
                          <Plus className="h-4 w-4" />
                          Create new vendor
                        </span>
                      </SelectItem>
                    )}
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                  <div className="text-sm font-medium">New Vendor</div>
                  <Input
                    placeholder="Vendor name *"
                    value={newVendorName}
                    onChange={(e) => setNewVendorName(e.target.value)}
                  />
                  <Input
                    placeholder="Email (optional)"
                    type="email"
                    value={newVendorEmail}
                    onChange={(e) => setNewVendorEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Phone (optional)"
                    value={newVendorPhone}
                    onChange={(e) => setNewVendorPhone(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleCreateVendor}>
                      Create
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowNewVendor(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as PurchaseStatus })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Product</th>
                    <th className="text-right p-3 text-sm font-medium">Qty</th>
                    <th className="text-right p-3 text-sm font-medium">Unit Price</th>
                    <th className="text-right p-3 text-sm font-medium">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lineItems?.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2">
                        <Select
                          value={item.productId}
                          onValueChange={(value) => handleLineItemChange(item.id, "productId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {product.costPrice.toFixed(2)} MRU
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(item.id, "quantity", Number(e.target.value))}
                          className="text-right"
                          min="1"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleLineItemChange(item.id, "unitPrice", Number(e.target.value))}
                          className="text-right"
                          step="0.01"
                        />
                      </td>
                      <td className="p-2 text-right font-semibold">{item.total.toFixed(2)} MRU</td>
                      <td className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLineItem(item.id)}
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

          {/* Calculations */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{subtotal.toFixed(2)} MRU</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-muted-foreground">Tax Rate (%)</span>
                <Input
                  type="number"
                  value={formData.taxRate ?? 0}
                  onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) || 0 })}
                  className="w-20 text-right"
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-semibold">{tax.toFixed(2)} MRU</span>
              </div>
              <div className="flex justify-between text-lg border-t pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold">{total.toFixed(2)} MRU</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {purchase ? "Update" : "Create"} Purchase Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
