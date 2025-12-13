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
  // Order matters: parent tables must be restored before child tables
  const tables = [
    'accounts',           // No dependencies
    'customers',          // No dependencies (created_by removed)
    'vendors',            // No dependencies (created_by removed)
    'product_categories', // No dependencies (must come before products)
    'products',           // Depends on: product_categories, vendors
    'employees',          // No dependencies (department_id removed)
    'sales_orders',      // Depends on: customers
    'sales_line_items',  // Depends on: sales_orders, products
    'purchase_orders',   // Depends on: vendors
    'purchase_line_items', // Depends on: purchase_orders, products
    'transactions',      // Depends on: accounts (but FKs removed)
    'stock_movements',   // Depends on: products
    'payroll',           // Depends on: employees
    'activity_logs',     // No dependencies (user_id removed)
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
  // Note: Some foreign keys are NOT NULL and cannot be removed - these tables will be skipped if dependencies don't exist
  const foreignKeyFields: Record<string, string[]> = {
    customers: ['created_by'],
    vendors: ['created_by'],
    products: ['created_by', 'supplier_id', 'category_id'],
    product_categories: ['created_by', 'parent_id'],
    sales_orders: ['created_by'], // customer_id is NOT NULL, so we keep it but it may cause errors
    sales_line_items: [], // sale_id and product_id are NOT NULL, cannot remove
    purchase_orders: ['created_by'], // vendor_id is NOT NULL, so we keep it but it may cause errors
    purchase_line_items: [], // purchase_order_id and product_id are NOT NULL, cannot remove
    transactions: ['created_by', 'account_from', 'account_to'],
    stock_movements: ['created_by'], // product_id is NOT NULL, cannot remove
    employees: ['department_id', 'created_by'],
    payroll: ['created_by'], // employee_id is NOT NULL, cannot remove
    activity_logs: ['user_id'],
    accounts: ['parent_id', 'created_by'],
  };

  // Tables that have NOT NULL foreign keys that must reference existing records
  // These tables should be restored after their dependencies
  const tablesWithRequiredForeignKeys: Record<string, string[]> = {
    stock_movements: ['product_id'],
    sales_orders: ['customer_id'],
    sales_line_items: ['sale_id', 'product_id'],
    purchase_orders: ['vendor_id'],
    purchase_line_items: ['purchase_order_id', 'product_id'],
    payroll: ['employee_id'],
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
      const errors: Array<{ table: string; message: string; count?: number }> = [];
      const idMappings: Record<string, Record<string, string>> = {}; // oldId -> newId mappings per table
      const restoredCounts: Record<string, number> = {};

      // First, clear existing data (optional - user should be warned)
      // We'll use upsert for UNIQUE fields instead to avoid data loss

      // Restore data table by table
      for (const table of tables) {
        if (!backup.data[table] || !Array.isArray(backup.data[table])) {
          continue;
        }

        const tableData = backup.data[table];
        if (tableData.length === 0) continue;

        restoredCounts[table] = 0;
        idMappings[table] = {};

        try {
          const batchSize = 50; // Smaller batch size for reliability
          let tableErrors = 0;
          
          for (let i = 0; i < tableData.length; i += batchSize) {
            const batch = tableData.slice(i, i + batchSize);
            const successfulInserts: any[] = [];
            
            // Process records one by one to handle UNIQUE constraint violations
            for (const record of batch) {
              try {
                const { id: oldId, created_at, updated_at, ...rest } = record;
                
                // Remove foreign key fields for this table
                const fkFields = foreignKeyFields[table] || [];
                const cleanRecord: any = {};
                
                // Map of optional foreign keys to their referenced tables (for ID mapping)
                const optionalFkMapping: Record<string, string> = {
                  'category_id': 'product_categories',
                  'supplier_id': 'vendors',
                  'parent_id': 'accounts',
                  'account_from': 'accounts',
                  'account_to': 'accounts',
                };
                
                for (const [key, value] of Object.entries(rest)) {
                  // Skip foreign key fields that we're removing
                  if (fkFields.includes(key)) {
                    continue;
                  }
                  
                  // Map optional foreign keys to new IDs if they exist
                  if (value && optionalFkMapping[key]) {
                    const referencedTable = optionalFkMapping[key];
                    if (idMappings[referencedTable] && idMappings[referencedTable][value as string]) {
                      cleanRecord[key] = idMappings[referencedTable][value as string];
                    } else {
                      // FK doesn't exist, set to null
                      cleanRecord[key] = null;
                    }
                  } else {
                    cleanRecord[key] = value;
                  }
                }
                
                // Skip if record is empty after cleaning
                if (Object.keys(cleanRecord).length === 0) {
                  continue;
                }

                // Check for required foreign keys that must exist and map old IDs to new IDs
                const requiredFks = tablesWithRequiredForeignKeys[table] || [];
                let skipRecord = false;
                for (const fkField of requiredFks) {
                  if (cleanRecord[fkField]) {
                    // The FK value in the backup is the old ID from the referenced table
                    const oldFkId = cleanRecord[fkField];
                    // Find which table this FK references
                    let referencedTable = '';
                    if (fkField === 'customer_id') referencedTable = 'customers';
                    else if (fkField === 'vendor_id') referencedTable = 'vendors';
                    else if (fkField === 'product_id') referencedTable = 'products';
                    else if (fkField === 'sale_id') referencedTable = 'sales_orders';
                    else if (fkField === 'purchase_order_id') referencedTable = 'purchase_orders';
                    else if (fkField === 'employee_id') referencedTable = 'employees';
                    
                    if (referencedTable && idMappings[referencedTable] && idMappings[referencedTable][oldFkId]) {
                      // Map the old FK ID to the new ID
                      cleanRecord[fkField] = idMappings[referencedTable][oldFkId];
                    } else if (referencedTable) {
                      // Foreign key doesn't exist in restored data, skip this record
                      skipRecord = true;
                      break;
                    }
                  } else {
                    // Required FK is missing/null, skip this record
                    skipRecord = true;
                    break;
                  }
                }

                if (skipRecord) {
                  tableErrors++;
                  continue;
                }

                // Determine unique field for upsert
                let uniqueField = '';
                if (table === 'accounts' || table === 'customers' || table === 'vendors') {
                  uniqueField = 'code';
                } else if (table === 'products') {
                  uniqueField = 'sku';
                } else if (table === 'product_categories') {
                  uniqueField = 'name';
                } else if (table === 'sales_orders' || table === 'purchase_orders') {
                  uniqueField = 'order_number';
                } else if (table === 'employees') {
                  uniqueField = 'employee_number';
                }

                let insertResult;
                if (uniqueField && cleanRecord[uniqueField]) {
                  // Use upsert for tables with UNIQUE constraints
                  const { data: existing, error: findError } = await supabase
                    .from(table)
                    .select('id')
                    .eq(uniqueField, cleanRecord[uniqueField])
                    .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when not found

                  if (existing && !findError) {
                    // Update existing record
                    const { error: updateError } = await supabase
                      .from(table)
                      .update(cleanRecord)
                      .eq('id', existing.id);

                    if (updateError) {
                      tableErrors++;
                      continue;
                    }
                    insertResult = { data: [{ id: existing.id }], error: null };
                  } else {
                    // Insert new record
                    const { data: inserted, error: insertError } = await supabase
                      .from(table)
                      .insert(cleanRecord)
                      .select('id');

                    insertResult = { data: inserted, error: insertError };
                  }
                } else {
                  // Regular insert for tables without unique constraints
                  const { data: inserted, error: insertError } = await supabase
                    .from(table)
                    .insert(cleanRecord)
                    .select('id');

                  insertResult = { data: inserted, error: insertError };
                }

                if (insertResult.error) {
                  // Check if it's a UNIQUE constraint violation
                  if (insertResult.error.code === '23505' || insertResult.error.message.includes('duplicate') || insertResult.error.message.includes('unique')) {
                    // Try to find and update existing record (fallback if upsert above didn't work)
                    if (uniqueField && cleanRecord[uniqueField]) {
                      const { data: existing, error: findError } = await supabase
                        .from(table)
                        .select('id')
                        .eq(uniqueField, cleanRecord[uniqueField])
                        .maybeSingle();

                      if (existing && !findError) {
                        const { error: updateError } = await supabase
                          .from(table)
                          .update(cleanRecord)
                          .eq('id', existing.id);

                        if (!updateError) {
                          insertResult = { data: [{ id: existing.id }], error: null };
                        } else {
                          tableErrors++;
                          continue;
                        }
                      } else {
                        // Record doesn't exist but we got a unique violation - skip it
                        tableErrors++;
                        continue;
                      }
                    } else {
                      tableErrors++;
                      continue;
                    }
                  } else {
                    // Other error types
                    tableErrors++;
                    continue;
                  }
                }

                // Store ID mapping if we have old and new IDs
                if (oldId && insertResult.data && insertResult.data.length > 0) {
                  idMappings[table][oldId] = insertResult.data[0].id;
                }

                successfulInserts.push(cleanRecord);
              } catch (recordError: any) {
                tableErrors++;
                console.error(`Error restoring record in ${table}:`, recordError);
              }
            }

            if (tableErrors > 0 && successfulInserts.length === 0) {
              // All records in batch failed
              errors.push({
                table,
                message: `All ${batch.length} records failed to restore`,
                count: batch.length
              });
            } else if (tableErrors > 0) {
              errors.push({
                table,
                message: `${tableErrors} of ${batch.length} records failed to restore`,
                count: tableErrors
              });
            }

            restoredCounts[table] += successfulInserts.length;
            totalRestored += successfulInserts.length;
          }

          if (restoredCounts[table] > 0) {
            console.log(`Restored ${restoredCounts[table]} records to ${table}`);
          }
        } catch (error: any) {
          errors.push({
            table,
            message: error.message || 'Unknown error',
          });
          console.error(`Error restoring ${table}:`, error);
        }
      }

      if (errors.length > 0) {
        const errorSummary = errors.map(e => 
          `${e.table}${e.count ? ` (${e.count} failed)` : ''}`
        ).join(', ');
        
        const totalErrors = errors.reduce((sum, e) => sum + (e.count || 1), 0);
        
        setBackupStatus({
          type: 'error',
          message: `Restore completed with some errors. ${totalRestored} records restored. ${totalErrors} error(s) in ${errors.length} table(s): ${errorSummary}. Check console for details.`,
        });
        toast.error(`Restore completed with some errors (${totalRestored} records restored, ${totalErrors} errors)`);
        console.error('Restore errors:', errors);
        console.error('Restored counts per table:', restoredCounts);
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

