import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle, CheckCircle2, Download, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Transaction, TransactionType, TransactionStatus } from "@/types/transaction";
import { Account } from "@/types/account";
import { transactionSchema } from "@/lib/validations/transaction";
import { z } from "zod";

interface ImportTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (transactions: Partial<Transaction>[]) => Promise<void>;
  accounts: Account[];
}

interface ParsedRow {
  row: number;
  data: Partial<Transaction>;
  errors: string[];
}

export function ImportTransactionsDialog({ open, onOpenChange, onImport, accounts }: ImportTransactionsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Infer CSV structure from schema
  const csvFields = useMemo(() => {
    const shape = transactionSchema.shape;
    const required: string[] = [];
    const optional: string[] = [];
    
    // Extract field info from schema
    Object.keys(shape).forEach((key) => {
      const field = shape[key as keyof typeof shape];
      if (field instanceof z.ZodString && field._def.checks?.some((c: any) => c.kind === "min")) {
        required.push(key);
      } else if (field instanceof z.ZodNumber && field._def.checks?.some((c: any) => c.kind === "min")) {
        required.push(key);
      } else if (field instanceof z.ZodEnum) {
        required.push(key);
      } else {
        optional.push(key);
      }
    });
    
    return { required, optional };
  }, []);

  // Generate CSV template
  const generateTemplate = () => {
    const headers = [
      "date",
      "type",
      "description",
      "accountFrom",
      "accountTo",
      "amount",
      "status",
      "reference",
      "notes"
    ];
    
    const exampleRow = [
      "2024-01-15",
      "sale",
      "Product sale to customer",
      "Cash Account",
      "Revenue Account",
      "1000.00",
      "pending",
      "INV-001",
      "Monthly sale"
    ];
    
    const csv = [headers.join(","), exampleRow.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get enum values from schema
  const getEnumValues = (fieldName: string): string[] => {
    const shape = transactionSchema.shape;
    const field = shape[fieldName as keyof typeof shape];
    if (field instanceof z.ZodEnum) {
      return field._def.values;
    }
    if (field instanceof z.ZodNativeEnum) {
      return Object.values(field._def.values);
    }
    return [];
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows: ParsedRow[] = [];

    // Build account lookup maps (by name and by code)
    const accountByName = new Map<string, Account>();
    const accountByCode = new Map<string, Account>();
    accounts.forEach(acc => {
      accountByName.set(acc.name.toLowerCase(), acc);
      if (acc.code) {
        accountByCode.set(acc.code.toLowerCase(), acc);
      }
    });

    // Find leaf accounts (accounts without children)
    const childrenMap = new Map<string, Account[]>();
    accounts.forEach(acc => {
      if (acc.parentId) {
        if (!childrenMap.has(acc.parentId)) {
          childrenMap.set(acc.parentId, []);
        }
        childrenMap.get(acc.parentId)!.push(acc);
      }
    });
    const leafAccountIds = new Set(
      accounts
        .filter(acc => !childrenMap.has(acc.id))
        .map(acc => acc.id)
    );

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const rowErrors: string[] = [];
      const rowData: Partial<Transaction> = {};

      // Parse date
      const dateIndex = headers.findIndex(h => h === 'date');
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
        rowErrors.push('Date is required');
      }

      // Parse type
      const typeIndex = headers.findIndex(h => h === 'type');
      if (typeIndex >= 0 && values[typeIndex]) {
        const typeStr = values[typeIndex].toLowerCase();
        const validTypes = getEnumValues('type');
        if (validTypes.includes(typeStr)) {
          rowData.type = typeStr as TransactionType;
        } else {
          rowErrors.push(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
        }
      }
      if (!rowData.type) {
        rowErrors.push('Type is required');
      }

      // Parse description
      const descIndex = headers.findIndex(h => h === 'description' || h === 'desc');
      if (descIndex >= 0 && values[descIndex]) {
        rowData.description = values[descIndex];
      }
      if (!rowData.description || rowData.description.length < 3) {
        rowErrors.push('Description must be at least 3 characters');
      }

      // Parse accountFrom
      const fromIndex = headers.findIndex(h => h === 'accountfrom' || h === 'account_from' || h === 'fromaccount' || h === 'from_account');
      if (fromIndex >= 0 && values[fromIndex]) {
        const accountName = values[fromIndex];
        let account = accountByName.get(accountName.toLowerCase());
        if (!account) {
          account = accountByCode.get(accountName.toLowerCase());
        }
        if (account) {
          if (!leafAccountIds.has(account.id)) {
            rowErrors.push(`Account "${accountName}" is a parent account and cannot be used`);
          } else {
            rowData.accountFrom = account.name;
            rowData.accountFromId = account.id;
          }
        } else {
          rowErrors.push(`Account "${accountName}" not found`);
        }
      }
      if (!rowData.accountFrom && rowData.type === 'transfer') {
        rowErrors.push('From Account is required for transfer transactions');
      }

      // Parse accountTo
      const toIndex = headers.findIndex(h => h === 'accountto' || h === 'account_to' || h === 'toaccount' || h === 'to_account');
      if (toIndex >= 0 && values[toIndex]) {
        const accountName = values[toIndex];
        let account = accountByName.get(accountName.toLowerCase());
        if (!account) {
          account = accountByCode.get(accountName.toLowerCase());
        }
        if (account) {
          if (!leafAccountIds.has(account.id)) {
            rowErrors.push(`Account "${accountName}" is a parent account and cannot be used`);
          } else {
            rowData.accountTo = account.name;
            rowData.accountToId = account.id;
          }
        } else {
          rowErrors.push(`Account "${accountName}" not found`);
        }
      }
      if (!rowData.accountTo && rowData.type === 'transfer') {
        rowErrors.push('To Account is required for transfer transactions');
      }

      // Validate transfer accounts are different
      if (rowData.type === 'transfer' && rowData.accountFromId && rowData.accountToId) {
        if (rowData.accountFromId === rowData.accountToId) {
          rowErrors.push('From and To accounts must be different for transfer transactions');
        }
      }

      // Parse amount
      const amountIndex = headers.findIndex(h => h === 'amount');
      if (amountIndex >= 0 && values[amountIndex]) {
        const amount = parseFloat(values[amountIndex]);
        if (isNaN(amount) || amount <= 0) {
          rowErrors.push('Amount must be a positive number');
        } else if (amount > 999999999) {
          rowErrors.push('Amount is too large (max 999,999,999)');
        } else {
          rowData.amount = amount;
        }
      }
      if (!rowData.amount) {
        rowErrors.push('Amount is required and must be greater than zero');
      }

      // Parse status
      const statusIndex = headers.findIndex(h => h === 'status');
      if (statusIndex >= 0 && values[statusIndex]) {
        const statusStr = values[statusIndex].toLowerCase();
        const validStatuses = getEnumValues('status');
        if (validStatuses.includes(statusStr)) {
          rowData.status = statusStr as TransactionStatus;
        } else {
          rowErrors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
      }
      if (!rowData.status) {
        rowData.status = 'pending';
      }

      // Parse reference
      const refIndex = headers.findIndex(h => h === 'reference' || h === 'ref');
      if (refIndex >= 0 && values[refIndex]) {
        const ref = values[refIndex];
        if (ref.length > 100) {
          rowErrors.push('Reference must not exceed 100 characters');
        } else {
          rowData.reference = ref;
        }
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
        transactionSchema.parse(rowData);
      } catch (schemaError) {
        if (schemaError instanceof z.ZodError) {
          schemaError.errors.forEach(err => {
            if (!rowErrors.some(e => e.includes(err.path.join('.')))) {
              rowErrors.push(`${err.path.join('.')}: ${err.message}`);
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
        setError('No valid transactions found. Please check your CSV file.');
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
      setError('No valid transactions to import');
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
      setError(err.message || 'Error importing transactions');
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
            Import transactions from a CSV file. All rows must be valid before importing.
            <br />
            <strong>Required fields:</strong> date, type, description, accountFrom, accountTo, amount
            <br />
            <strong>Optional fields:</strong> status (default: pending), reference, notes
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
              <li><strong>date:</strong> Format YYYY-MM-DD (required)</li>
              <li><strong>type:</strong> One of: sale, purchase, payment, expense, transfer (required)</li>
              <li><strong>description:</strong> At least 3 characters (required)</li>
              <li><strong>accountFrom:</strong> Account name or code (required for transfers)</li>
              <li><strong>accountTo:</strong> Account name or code (required for transfers)</li>
              <li><strong>amount:</strong> Positive number (required)</li>
              <li><strong>status:</strong> One of: pending, posted, reconciled, void (optional, default: pending)</li>
              <li><strong>reference:</strong> Max 100 characters (optional)</li>
              <li><strong>notes:</strong> Max 1000 characters (optional)</li>
            </ul>
            <p className="text-xs mt-2">
              <strong>Note:</strong> Accounts must be leaf accounts (not parent accounts). Use account names or codes.
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
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row) => (
                      <TableRow key={row.row} className={row.errors.length > 0 ? "bg-destructive/10" : ""}>
                        <TableCell className="font-medium">{row.row}</TableCell>
                        <TableCell>{row.data.date || '-'}</TableCell>
                        <TableCell>
                          {row.data.type && (
                            <Badge variant="outline" className="capitalize">
                              {row.data.type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{row.data.description || '-'}</TableCell>
                        <TableCell className="text-sm">{row.data.accountFrom || '-'}</TableCell>
                        <TableCell className="text-sm">{row.data.accountTo || '-'}</TableCell>
                        <TableCell className="text-right">
                          {row.data.amount ? `MRU ${row.data.amount.toFixed(2)}` : '-'}
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
                            <div className="space-y-1">
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
            {isProcessing ? 'Importing...' : `Import ${validRows.length} Transaction(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
