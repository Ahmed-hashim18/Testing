import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Account, AccountType } from "@/types/account";

interface ImportAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (accounts: Partial<Account>[]) => Promise<void>;
  existingAccounts: Account[];
}

export function ImportAccountsDialog({ open, onOpenChange, onImport, existingAccounts }: ImportAccountsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedAccounts, setParsedAccounts] = useState<Partial<Account>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const accountTypeMap: Record<string, AccountType> = {
    'asset': 'Assets',
    'assets': 'Assets',
    'liability': 'Liabilities',
    'liabilities': 'Liabilities',
    'equity': 'Equity',
    'revenue': 'Revenue',
    'expenses': 'Expenses',
    'expense': 'Expenses',
  };

  const parseCSV = (text: string): Partial<Account>[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('El archivo CSV debe tener al menos una fila de encabezado y una fila de datos');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['code', 'name', 'type'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}. Las columnas requeridas son: code, name, type`);
    }

    const accounts: Partial<Account>[] = [];
    const existingCodes = new Set(existingAccounts.map(acc => acc.code.toLowerCase()));

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 3) continue;

      const codeIndex = headers.indexOf('code');
      const nameIndex = headers.indexOf('name');
      const typeIndex = headers.indexOf('type');
      const parentCodeIndex = headers.indexOf('parentcode') >= 0 ? headers.indexOf('parentcode') : headers.indexOf('parent_code');
      const descriptionIndex = headers.indexOf('description');
      const balanceIndex = headers.indexOf('balance');

      const code = values[codeIndex]?.trim();
      const name = values[nameIndex]?.trim();
      const typeStr = values[typeIndex]?.trim().toLowerCase();
      const parentCode = parentCodeIndex >= 0 ? values[parentCodeIndex]?.trim() : undefined;
      const description = descriptionIndex >= 0 ? values[descriptionIndex]?.trim() : undefined;
      const balance = balanceIndex >= 0 ? parseFloat(values[balanceIndex] || '0') : 0;

      if (!code || !name || !typeStr) {
        continue;
      }

      if (existingCodes.has(code.toLowerCase())) {
        continue; // Skip existing accounts
      }

      const type = accountTypeMap[typeStr] || 'Assets';
      let parentId: string | null = null;

      if (parentCode) {
        const parentAccount = existingAccounts.find(acc => acc.code.toLowerCase() === parentCode.toLowerCase());
        if (parentAccount) {
          parentId = parentAccount.id;
        }
      }

      accounts.push({
        code,
        name,
        type,
        parentId,
        description,
        balance: isNaN(balance) ? 0 : balance,
        status: 'active',
      });
    }

    return accounts;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Por favor, selecciona un archivo CSV');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const accounts = parseCSV(text);
      
      if (accounts.length === 0) {
        setError('No se encontraron cuentas válidas para importar. Verifica que el formato del CSV sea correcto.');
        setParsedAccounts([]);
      } else {
        setParsedAccounts(accounts);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo CSV');
      setParsedAccounts([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (parsedAccounts.length === 0) {
      setError('No hay cuentas para importar');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onImport(parsedAccounts);
      setSuccess(true);
      setFile(null);
      setParsedAccounts([]);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al importar las cuentas');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setFile(null);
      setParsedAccounts([]);
      setError(null);
      setSuccess(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Chart of Accounts</DialogTitle>
          <DialogDescription>
            Importa todas tus cuentas contables desde un archivo CSV. Las cuentas importadas no podrán ser eliminadas.
            <br />
            <strong>Formato requerido:</strong> code, name, type, [parentcode], [description], [balance]
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Archivo CSV</Label>
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

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && parsedAccounts.length > 0 && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Se encontraron {parsedAccounts.length} cuenta(s) válida(s) para importar
              </AlertDescription>
            </Alert>
          )}

          {parsedAccounts.length > 0 && (
            <div className="space-y-2">
              <Label>Vista previa ({parsedAccounts.length} cuentas)</Label>
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Código</th>
                      <th className="p-2 text-left">Nombre</th>
                      <th className="p-2 text-left">Tipo</th>
                      <th className="p-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedAccounts.slice(0, 10).map((acc, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{acc.code}</td>
                        <td className="p-2">{acc.name}</td>
                        <td className="p-2">{acc.type}</td>
                        <td className="p-2 text-right">{acc.balance?.toFixed(2) || '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedAccounts.length > 10 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    ... y {parsedAccounts.length - 10} más
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-semibold">Ejemplo de formato CSV:</p>
            <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`code,name,type,parentcode,description,balance
1000,Assets,Assets,,,0
1100,Current Assets,Assets,1000,,0
1110,Cash and Cash Equivalents,Assets,1100,,0
1111,Petty Cash,Assets,1110,,2000`}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={parsedAccounts.length === 0 || isProcessing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isProcessing ? 'Importando...' : `Importar ${parsedAccounts.length} Cuenta(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

