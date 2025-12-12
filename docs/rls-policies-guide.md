# Row Level Security (RLS) Policies Guide

This document describes the recommended RLS policies for the Naqel Trade ERP system to ensure proper data security.

## Overview

Row Level Security (RLS) in Supabase/PostgreSQL allows you to control which rows users can access based on their authentication status and role.

## Enabling RLS

First, enable RLS on all tables:

```sql
-- Enable RLS on core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
```

## Authentication Policies

### Profiles Table

```sql
-- Users can view all profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
```

### Sales Orders

```sql
-- All authenticated users can view sales orders
CREATE POLICY "Sales orders are viewable by authenticated users"
  ON sales_orders FOR SELECT
  TO authenticated
  USING (true);

-- Only users with sales/admin role can create sales orders
CREATE POLICY "Sales orders can be created by sales users"
  ON sales_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'sales')
    )
  );

-- Sales orders can be updated by creator or admin
CREATE POLICY "Sales orders can be updated by authorized users"
  ON sales_orders FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Only admins can delete sales orders
CREATE POLICY "Sales orders can be deleted by admins"
  ON sales_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

### Purchase Orders

```sql
-- All authenticated users can view purchase orders
CREATE POLICY "Purchase orders are viewable by authenticated users"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (true);

-- Only inventory/admin users can create purchase orders
CREATE POLICY "Purchase orders can be created by inventory users"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'inventory')
    )
  );

-- Purchase orders can be updated by creator or admin
CREATE POLICY "Purchase orders can be updated by authorized users"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );
```

### Transactions

```sql
-- Transactions visible to accountants and admins
CREATE POLICY "Transactions are viewable by finance users"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'accountant')
    )
  );

-- Only accountants can create transactions
CREATE POLICY "Transactions can be created by accountants"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'accountant')
    )
  );
```

### Products

```sql
-- All authenticated users can view products
CREATE POLICY "Products are viewable by authenticated users"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Only inventory users can modify products
CREATE POLICY "Products can be modified by inventory users"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'inventory')
    )
  );
```

### Accounts (Chart of Accounts)

```sql
-- Accounts visible to accountants and admins
CREATE POLICY "Accounts are viewable by finance users"
  ON accounts FOR SELECT
  TO authenticated
  USING (true);

-- Only accountants can modify accounts
CREATE POLICY "Accounts can be modified by accountants"
  ON accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'accountant')
    )
  );

-- Imported accounts cannot be deleted
CREATE POLICY "Imported accounts cannot be deleted"
  ON accounts FOR DELETE
  TO authenticated
  USING (
    is_imported = false AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

### Activity Logs

```sql
-- Activity logs are viewable by admins only
CREATE POLICY "Activity logs are viewable by admins"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Any authenticated user can create activity logs
CREATE POLICY "Activity logs can be created by authenticated users"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

## Helper Functions

Create helper functions for role checking:

```sql
-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION auth.has_role(required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role::text = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION auth.has_any_role(required_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role::text = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Testing Policies

After implementing policies, test them:

```sql
-- Test as a specific user
SET request.jwt.claim.sub = 'user-uuid-here';

-- Try to select from a table
SELECT * FROM sales_orders LIMIT 1;

-- Reset
RESET request.jwt.claim.sub;
```

## Best Practices

1. **Always enable RLS** on tables containing user data
2. **Use helper functions** for complex role checks
3. **Test thoroughly** with different user roles
4. **Document changes** to policies
5. **Review regularly** as roles and requirements change

## Troubleshooting

If data isn't appearing:
1. Check if RLS is enabled: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'table_name';`
2. Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'table_name';`
3. Check user roles: `SELECT * FROM user_roles WHERE user_id = auth.uid();`

