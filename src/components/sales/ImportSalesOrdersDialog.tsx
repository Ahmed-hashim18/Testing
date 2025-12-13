import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SalesOrder, LineItem, SalesStatus } from "@/types/sale";
import { Customer } from "@/types/customer";
import { Product } from "@/types/product";
import { salesOrderSchema, lineItemSchema } from "@/lib/validations/sale";
import { z } from "zod";

interface ImportSalesOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (salesOrders: Partial<SalesOrder>[]) => Promise<void>;
  customers: Customer[];
  products: Product[];
}

interface ParsedRow {
  row: number;
  data: Partial<SalesOrder>;
  errors: string[];
}

export function ImportSalesOrdersDialog({ open, onOpenChange, onImport, customers, products }: ImportSalesOrdersDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build lookup maps
  const customerByName = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach(c => {
      map.set(c.name.toLowerCase(), c);
    });
    return map;
  }, [customers]);

  const productByName = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => {
      map.set(p.name.toLowerCase(), p);
      map.set(p.sku.toLowerCase(), p);
    });
    return map;
  }, [products]);

  // Get enum values from schema
  const getEnumValues = (fieldName: string): string[] => {
    const shape = salesOrderSchema.shape;
    const field = shape[fieldName as keyof typeof shape];
    if (field instanceof z.ZodEnum) {
      return field._def.values;
    }
    return [];
  };

  // Generate CSV template
  const generateTemplate = () => {
    const headers = [
      "orderNumber",
      "customerName",
      "date",
      "dueDate",
      "status",
      "lineItems",
      "notes"
    ];
    
    const exampleRow = [
      "SO-001",
      "Customer ABC",
      "2024-01-15",
      "2024-02-15",
      "draft",
      "Product A|2|100.00|0.00;Product B|1|50.00|5.00",
      "Monthly order"
    ];
    
    const csv = [
      headers.join(","),
      exampleRow.join(","),
      "",
      "Line Items Format: productName|quantity|unitPrice|discount;productName|quantity|unitPrice|discount"
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales-orders-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Parse line items from format: "productName|qty|price|discount;productName|qty|price|discount"
  const parseLineItems = (lineItemsStr: string): { items: LineItem[]; errors: string[] } => {
    const errors: string[] = [];
    const items: LineItem[] = [];
    
    if (!lineItemsStr || !lineItemsStr.trim()) {
      return { items: [], errors: ['At least one line item is required'] };
    }

    const itemStrings = lineItemsStr.split(';').filter(s => s.trim());
    
    for (let i = 0; i < itemStrings.length; i++) {
      const parts = itemStrings[i].split('|').map(p => p.trim());
      
      if (parts.length < 3) {
        errors.push(`Line item ${i + 1}: Invalid format. Expected: productName|quantity|unitPrice|discount`);
        continue;
      }

      const [productName, qtyStr, priceStr, discountStr = "0"] = parts;
      
      if (!productName) {
        errors.push(`Line item ${i + 1}: Product name is required`);
        continue;
      }

      const product = productByName.get(productName.toLowerCase());
      if (!product) {
        errors.push(`Line item ${i + 1}: Product "${productName}" not found`);
        continue;
      }

      const quantity = parseInt(qtyStr);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push(`Line item ${i + 1}: Quantity must be a positive integer`);
        continue;
      }

      const unitPrice = parseFloat(priceStr);
      if (isNaN(unitPrice) || unitPrice <= 0) {
        errors.push(`Line item ${i + 1}: Unit price must be a positive number`);
        continue;
      }

      const discount = parseFloat(discountStr) || 0;
      if (discount < 0) {
        errors.push(`Line item ${i + 1}: Discount cannot be negative`);
        continue;
      }

      const subtotal = quantity * unitPrice;
      const total = subtotal - discount;

      const lineItem: LineItem = {
        id: `${i}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unitPrice,
        discount,
        tax: 0,
        total: Math.max(0, total),
      };

      // Validate with schema
      try {
        lineItemSchema.parse(lineItem);
        items.push(lineItem);
      } catch (schemaError) {
        if (schemaError instanceof z.ZodError) {
          schemaError.errors.forEach(err => {
            errors.push(`Line item ${i + 1}: ${err.path.join('.')} - ${err.message}`);
          });
        }
      }
    }

    if (items.length === 0 && errors.length === 0) {
      errors.push('At least one valid line item is required');
    }

    return { items, errors };
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const rowErrors: string[] = [];
      const rowData: Partial<SalesOrder> = {};

      // Parse orderNumber
      const orderNumIndex = headers.findIndex(h => h === 'ordernumber' || h === 'order_number' || h === 'orderno');
      if (orderNumIndex >= 0 && values[orderNumIndex]) {
        rowData.orderNumber = values[orderNumIndex];
      }
      if (!rowData.orderNumber || !rowData.orderNumber.trim()) {
        rowErrors.push('Order number is required');
      }

      // Parse customerName
      const customerIndex = headers.findIndex(h => h === 'customername' || h === 'customer_name' || h === 'customer');
      if (customerIndex >= 0 && values[customerIndex]) {
        const customerName = values[customerIndex];
        const customer = customerByName.get(customerName.toLowerCase());
        if (customer) {
          rowData.customerId = customer.id;
          rowData.customerName = customer.name;
        } else {
          rowErrors.push(`Customer "${customerName}" not found`);
        }
      }
      if (!rowData.customerId) {
        rowErrors.push('Customer is required');
      }

      // Parse date
      const dateIndex = headers.findIndex(h => h === 'date' || h === 'orderdate' || h === 'order_date');
      if (dateIndex >= 0 && values[dateIndex]) {
        const dateStr = values[dateIndex];
        if (dateStr) {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            rowErrors.push(`Invalid date format: ${dateStr}`);
          } else {
            rowData.date = date.toISOString().split('T')[0];
          }
        }
      }
      if (!rowData.date) {
        rowErrors.push('Order date is required');
      }

      // Parse dueDate
      const dueDateIndex = headers.findIndex(h => h === 'duedate' || h === 'due_date');
      if (dueDateIndex >= 0 && values[dueDateIndex]) {
        const dateStr = values[dueDateIndex];
        if (dateStr) {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            rowErrors.push(`Invalid due date format: ${dateStr}`);
          } else {
            rowData.dueDate = date.toISOString().split('T')[0];
          }
        }
      }
      if (!rowData.dueDate) {
        // Default to order date if not provided
        rowData.dueDate = rowData.date;
      }

      // Validate due date is after order date
      if (rowData.date && rowData.dueDate) {
        if (new Date(rowData.dueDate) < new Date(rowData.date)) {
          rowErrors.push('Due date must be on or after the order date');
        }
      }

      // Parse status
      const statusIndex = headers.findIndex(h => h === 'status');
      if (statusIndex >= 0 && values[statusIndex]) {
        const statusStr = values[statusIndex].toLowerCase();
        const validStatuses = getEnumValues('status');
        if (validStatuses.includes(statusStr)) {
          rowData.status = statusStr as SalesStatus;
        } else {
          rowErrors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
      }
      if (!rowData.status) {
        rowData.status = 'draft';
      }

      // Parse lineItems
      const lineItemsIndex = headers.findIndex(h => h === 'lineitems' || h === 'line_items' || h === 'items');
      if (lineItemsIndex >= 0 && values[lineItemsIndex]) {
        const { items, errors: itemErrors } = parseLineItems(values[lineItemsIndex]);
        rowErrors.push(...itemErrors);
        rowData.lineItems = items;
      }
      if (!rowData.lineItems || rowData.lineItems.length === 0) {
        rowErrors.push('At least one line item is required');
      }

      // Calculate totals
      if (rowData.lineItems && rowData.lineItems.length > 0) {
        const subtotal = rowData.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const discountAmount = rowData.lineItems.reduce((sum, item) => sum + (item.discount || 0), 0);
        const total = rowData.lineItems.reduce((sum, item) => sum + item.total, 0);
        
        rowData.subtotal = subtotal;
        rowData.discountAmount = discountAmount;
        rowData.taxAmount = 0;
        rowData.total = total;
        rowData.paidAmount = 0;
        rowData.balance = total;
      }

      // Parse notes
      const notesIndex = headers.findIndex(h => h === 'notes' || h === 'note');
      if (notesIndex >= 0 && values[notesIndex]) {
        const notes = values[notesIndex];
        if (notes.length > 1000) {
          rowErrors.push('Notes must not exceed 1000 characters');
        } else {
          rowData.notes = notes;
        }
      }

      // Validate with schema
      try {
        salesOrderSchema.parse(rowData);
      } catch (schemaError) {
        if (schemaError instanceof z.ZodError) {
          schemaError.errors.forEach(err => {
            const errorMsg = `${err.path.join('.')}: ${err.message}`;
            if (!rowErrors.some(e => e.includes(errorMsg))) {
              rowErrors.push(errorMsg);
            }
          });
        }
      }

      rows.push({
        row: i + 1,
        data: rowData,
        errors: rowErrors,
      });
    }

    return rows;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);
      setParsedRows(rows);
      
      const validRows = rows.filter(r => r.errors.length === 0);
      if (validRows.length === 0) {
        setError('No valid sales orders found. Please check your CSV file.');
      }
    } catch (err: any) {
      setError(err.message || 'Error processing CSV file');
      setParsedRows([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) {
      setError('No valid sales orders to import');
      return;
    }

    // Check if there are any errors
    const hasErrors = parsedRows.some(r => r.errors.length > 0);
    if (hasErrors) {
      setError('Please fix all errors before importing. All rows must be valid.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onImport(validRows.map(r => r.data));
      setFile(null);
      setParsedRows([]);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Error importing sales orders');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setFile(null);
      setParsedRows([]);
      setError(null);
      onOpenChange(false);
    }
  };

  const validRows = parsedRows.filter(r => r.errors.length === 0);
  const invalidRows = parsedRows.filter(r => r.errors.length > 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Sales Orders</DialogTitle>
          <DialogDescription>
            Import sales orders from a CSV file. All rows must be valid before importing.
            <br />
            <strong>Required fields:</strong> orderNumber, customerName, date, lineItems
            <br />
            <strong>Optional fields:</strong> dueDate (defaults to date), status (default: draft), notes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Label htmlFor="csv-file">CSV File</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  className="flex-1"
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={generateTemplate} className="ml-4">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-semibold">CSV Format Instructions:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>orderNumber:</strong> Unique order identifier (required)</li>
              <li><strong>customerName:</strong> Customer name (must exist in system) (required)</li>
              <li><strong>date:</strong> Order date, format YYYY-MM-DD (required)</li>
              <li><strong>dueDate:</strong> Due date, format YYYY-MM-DD (optional, defaults to order date)</li>
              <li><strong>status:</strong> One of: draft, confirmed, invoiced, paid, cancelled (optional, default: draft)</li>
              <li><strong>lineItems:</strong> Format: productName|quantity|unitPrice|discount;productName|quantity|unitPrice|discount (required)</li>
              <li><strong>notes:</strong> Max 1000 characters (optional)</li>
            </ul>
            <p className="text-xs mt-2">
              <strong>Line Items Format:</strong> Each line item is separated by semicolon (;). Each item has: productName|quantity|unitPrice|discount
              <br />
              Example: "Product A|2|100.00|0.00;Product B|1|50.00|5.00"
              <br />
              <strong>Note:</strong> Discount is in MRU amount (not percentage)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Preview ({parsedRows.length} rows)</Label>
                  <div className="text-sm text-muted-foreground">
                    {validRows.length} valid, {invalidRows.length} with errors
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row) => (
                      <TableRow key={row.row} className={row.errors.length > 0 ? "bg-destructive/10" : ""}>
                        <TableCell className="font-medium">{row.row}</TableCell>
                        <TableCell>{row.data.orderNumber || '-'}</TableCell>
                        <TableCell>{row.data.customerName || '-'}</TableCell>
                        <TableCell>{row.data.date || '-'}</TableCell>
                        <TableCell>
                          {row.data.lineItems ? `${row.data.lineItems.length} item(s)` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.data.total ? `MRU ${row.data.total.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          {row.data.status && (
                            <Badge variant="secondary" className="capitalize">
                              {row.data.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.errors.length > 0 ? (
                            <div className="space-y-1 max-w-xs">
                              {row.errors.map((err, idx) => (
                                <div key={idx} className="text-xs text-destructive">
                                  {err}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={parsedRows.length === 0 || invalidRows.length > 0 || isProcessing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isProcessing ? 'Importing...' : `Import ${validRows.length} Sales Order(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
