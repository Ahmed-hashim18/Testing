import { useState } from "react";
import { Download, Upload, Database, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function BackupRestore() {
  const { user } = useAuth();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Tables to backup/restore (in order of dependencies)
  const tables = [
    'accounts',
    'customers',
    'vendors',
    'products',
    'product_categories',
    'sales_orders',
    'sales_line_items',
    'purchase_orders',
    'purchase_line_items',
    'transactions',
    'stock_movements',
    'employees',
    'payroll',
    'activity_logs',
  ];

  const createBackup = async () => {
    // Check authentication directly with Supabase
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      toast.error("You must be authenticated to create a backup");
      return;
    }

    setIsBackingUp(true);
    setBackupStatus({ type: null, message: '' });

    try {
      const backupData: Record<string, any[]> = {};
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupInfo = {
        version: '1.0',
        created_at: new Date().toISOString(),
        created_by: authUser.id,
        created_by_email: authUser.email,
      };

      // Fetch data from all tables
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: true });

          if (error) {
            console.error(`Error fetching ${table}:`, error);
            backupData[table] = [];
          } else {
            backupData[table] = data || [];
          }
        } catch (error) {
          console.error(`Error fetching ${table}:`, error);
          backupData[table] = [];
        }
      }

      // Create backup object
      const backup = {
        ...backupInfo,
        data: backupData,
      };

      // Convert to JSON and create blob
      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `naqel-erp-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const totalRecords = Object.values(backupData).reduce((sum, arr) => sum + arr.length, 0);
      setBackupStatus({
        type: 'success',
        message: `Backup created successfully. ${totalRecords} records exported.`,
      });
      toast.success(`Backup created successfully (${totalRecords} records)`);
    } catch (error: any) {
      console.error('Error creating backup:', error);
      setBackupStatus({
        type: 'error',
        message: `Error creating backup: ${error.message}`,
      });
      toast.error('Error creating backup: ' + error.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Foreign key fields to remove for each table (these reference other tables that may not exist)
  const foreignKeyFields: Record<string, string[]> = {
    customers: ['created_by'],
    vendors: ['created_by'],
    products: ['created_by', 'supplier_id', 'category_id'],
    product_categories: ['created_by', 'parent_id'],
    sales_orders: ['customer_id', 'created_by'],
    sales_line_items: ['sale_id', 'product_id'],
    purchase_orders: ['vendor_id', 'created_by'],
    purchase_line_items: ['purchase_order_id', 'product_id'],
    transactions: ['created_by', 'account_from', 'account_to'],
    stock_movements: ['product_id', 'created_by'],
    employees: ['department_id', 'created_by'],
    payroll: ['employee_id', 'created_by'],
    activity_logs: ['user_id'],
    accounts: ['parent_id', 'created_by'],
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check authentication directly with Supabase
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      toast.error("You must be authenticated to restore a backup");
      return;
    }

    setIsRestoring(true);
    setBackupStatus({ type: null, message: '' });

    try {
      // Read file
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.data || typeof backup.data !== 'object') {
        throw new Error('Invalid backup format');
      }

      // Confirm restore
      const confirmed = window.confirm(
        `Are you sure you want to restore this backup?\n\n` +
        `Backup date: ${backup.created_at ? new Date(backup.created_at).toLocaleString() : 'Unknown'}\n` +
        `Created by: ${backup.created_by_email || 'Unknown'}\n\n` +
        `WARNING: This will restore data without relationships (foreign keys will be removed to avoid conflicts).`
      );

      if (!confirmed) {
        setIsRestoring(false);
        return;
      }

      let totalRestored = 0;
      const errors: string[] = [];

      // Restore data table by table
      for (const table of tables) {
        if (!backup.data[table] || !Array.isArray(backup.data[table])) {
          continue;
        }

        const tableData = backup.data[table];
        if (tableData.length === 0) continue;

        try {
          const batchSize = 50; // Smaller batch size for reliability
          
          for (let i = 0; i < tableData.length; i += batchSize) {
            const batch = tableData.slice(i, i + batchSize);
            
            // Clean the batch - remove foreign keys and timestamps
            const cleanBatch = batch.map((record: any) => {
              const { id, created_at, updated_at, ...rest } = record;
              
              // Remove foreign key fields for this table
              const fkFields = foreignKeyFields[table] || [];
              const cleanRecord: any = {};
              
              for (const [key, value] of Object.entries(rest)) {
                // Skip foreign key fields
                if (!fkFields.includes(key)) {
                  cleanRecord[key] = value;
                }
              }
              
              return cleanRecord;
            });

            // Filter out empty records
            const validBatch = cleanBatch.filter((r: any) => Object.keys(r).length > 0);
            
            if (validBatch.length === 0) continue;

            // Insert without IDs (let database generate new ones)
            const { error: insertError } = await supabase
              .from(table)
              .insert(validBatch);

            if (insertError) {
              console.error(`Error restoring ${table}:`, insertError);
              errors.push(`${table}: ${insertError.message}`);
            } else {
              totalRestored += validBatch.length;
              console.log(`Restored ${validBatch.length} records to ${table}`);
            }
          }
        } catch (error: any) {
          errors.push(`${table}: ${error.message}`);
          console.error(`Error restoring ${table}:`, error);
        }
      }

      if (errors.length > 0) {
        setBackupStatus({
          type: 'error',
          message: `Restore completed with some errors. ${totalRestored} records restored. Some tables had issues: ${errors.length} errors.`,
        });
        toast.error(`Restore completed with some errors (${totalRestored} records)`);
        console.error('Restore errors:', errors);
      } else {
        setBackupStatus({
          type: 'success',
          message: `Restore completed successfully. ${totalRestored} records restored.`,
        });
        toast.success(`Restore completed successfully (${totalRestored} records)`);
        
        // Refresh the page after a delay to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      setBackupStatus({
        type: 'error',
        message: `Error restoring backup: ${error.message}`,
      });
      toast.error('Error restoring backup: ' + error.message);
    } finally {
      setIsRestoring(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backup & Restore</h1>
        <p className="text-muted-foreground mt-2">
          Create backups of your data and restore them when needed
        </p>
      </div>

      {backupStatus.type && (
        <Alert variant={backupStatus.type === 'success' ? 'default' : 'destructive'}>
          {backupStatus.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>
            {backupStatus.type === 'success' ? 'Success' : 'Error'}
          </AlertTitle>
          <AlertDescription>{backupStatus.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Backup Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Create Backup</CardTitle>
            </div>
            <CardDescription>
              Export all your data to a JSON file for safe storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                The backup will include:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Chart of accounts</li>
                <li>Customers and vendors</li>
                <li>Products and inventory</li>
                <li>Sales and purchase orders</li>
                <li>Transactions</li>
                <li>Employees and payroll</li>
                <li>Activity logs</li>
              </ul>
            </div>
            <Button
              onClick={createBackup}
              disabled={isBackingUp}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              {isBackingUp ? 'Creating backup...' : 'Create Backup'}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle>Restore Backup</CardTitle>
            </div>
            <CardDescription>
              Restore your data from a previously created backup file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Restoring a backup will replace all current data. 
                Make sure to create a backup before restoring.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <label htmlFor="restore-file" className="cursor-pointer">
                <Button
                  asChild
                  variant="outline"
                  disabled={isRestoring}
                  className="w-full"
                  size="lg"
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {isRestoring ? 'Restoring...' : 'Select Backup File'}
                  </span>
                </Button>
              </label>
              <input
                id="restore-file"
                type="file"
                accept=".json"
                onChange={handleRestore}
                className="hidden"
                disabled={isRestoring}
              />
              <p className="text-xs text-muted-foreground text-center">
                .json files only
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Recommendations:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Create backups regularly, especially before making important changes</li>
              <li>Store backup files in a safe location outside the server</li>
              <li>Verify that the backup was created correctly before deleting data</li>
              <li>Backups include all data except user information and authentication</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Limitations:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Backups do not include user information, roles, and authentication</li>
              <li>When restoring, relationships (foreign keys) are removed to avoid conflicts</li>
              <li>New IDs are generated for all restored records</li>
              <li>Timestamps are regenerated when restoring</li>
              <li>Best used for migrating data like accounts, products, customers, etc.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

