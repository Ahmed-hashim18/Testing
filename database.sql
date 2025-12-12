-- ============================================================================
-- Naqel Trade ERP - Complete Database Setup
-- ============================================================================
-- This file contains everything needed to set up the database from scratch:
-- - All ENUM types
-- - All tables with correct column names
-- - All indexes
-- - All triggers
-- - All RLS policies
-- - Realtime subscriptions
-- ============================================================================
-- Run this entire file in Supabase SQL Editor for a fresh installation
-- ============================================================================

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

-- App Roles Enum
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'manager', 'accountant', 'sales', 'inventory', 'hr', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Account Types
DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Account Status
DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Transaction Types
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('sale', 'purchase', 'payment', 'receipt', 'expense', 'refund', 'adjustment', 'transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Transaction Status
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'posted', 'reconciled', 'void');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Product Status
DO $$ BEGIN
    CREATE TYPE product_status AS ENUM ('active', 'inactive', 'discontinued');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sales Status
DO $$ BEGIN
    CREATE TYPE sales_status AS ENUM ('draft', 'confirmed', 'invoiced', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Purchase Status
DO $$ BEGIN
    CREATE TYPE purchase_status AS ENUM ('draft', 'ordered', 'received', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Employee Status
DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'terminated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Employee Type
DO $$ BEGIN
    CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'intern');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payroll Status
DO $$ BEGIN
    CREATE TYPE payroll_status AS ENUM ('draft', 'processed', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User Status
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- USER MANAGEMENT TABLES
-- ============================================================================

-- User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    status user_status DEFAULT 'active',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    UNIQUE(user_id, role)
);

-- Roles Configuration Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    role_type app_role NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module Permissions Table
CREATE TABLE IF NOT EXISTS module_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    UNIQUE(role_id, module)
);

-- ============================================================================
-- ORGANIZATION STRUCTURE
-- ============================================================================

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    manager_id UUID REFERENCES profiles(id),
    description TEXT,
    budget DECIMAL(15, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CHART OF ACCOUNTS
-- ============================================================================

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    account_type account_type NOT NULL,
    parent_id UUID REFERENCES accounts(id),
    description TEXT,
    balance DECIMAL(15, 2) DEFAULT 0,
    currency TEXT DEFAULT 'MRU',
    is_system_account BOOLEAN DEFAULT false,
    is_imported BOOLEAN DEFAULT false,
    status account_status DEFAULT 'active',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CUSTOMERS AND VENDORS
-- ============================================================================

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    tax_id TEXT,
    credit_limit DECIMAL(15, 2),
    balance DECIMAL(15, 2) DEFAULT 0,
    status user_status DEFAULT 'active',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    tax_id TEXT,
    payment_terms TEXT,
    balance DECIMAL(15, 2) DEFAULT 0,
    status user_status DEFAULT 'active',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRODUCTS AND INVENTORY
-- ============================================================================

-- Product Categories Table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(id),
    unit TEXT NOT NULL,
    cost_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(15, 2) NOT NULL,
    current_stock INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    supplier_id UUID REFERENCES vendors(id),
    status product_status DEFAULT 'active',
    image_url TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Movements Table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    movement_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRANSACTIONS
-- ============================================================================

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    type transaction_type NOT NULL,
    description TEXT NOT NULL,
    account_from UUID REFERENCES accounts(id),
    account_to UUID REFERENCES accounts(id),
    amount DECIMAL(15, 2) NOT NULL,
    status transaction_status DEFAULT 'pending',
    reference TEXT,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SALES
-- ============================================================================

-- Sales Orders Table
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_date DATE NOT NULL,
    status sales_status DEFAULT 'draft',
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Line Items Table
CREATE TABLE IF NOT EXISTS sales_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    discount DECIMAL(5, 2) DEFAULT 0,
    tax DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PURCHASES
-- ============================================================================

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    date DATE NOT NULL,
    status purchase_status DEFAULT 'draft',
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax DECIMAL(15, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL,
    amount_paid DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    received_date DATE,
    payment_date DATE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Line Items Table (FIXED: using purchase_order_id, not purchase_id)
CREATE TABLE IF NOT EXISTS purchase_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HR AND PAYROLL
-- ============================================================================

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    date_of_birth DATE,
    hire_date DATE NOT NULL,
    department_id UUID REFERENCES departments(id),
    position TEXT,
    employment_type employment_type DEFAULT 'full_time',
    salary DECIMAL(15, 2),
    currency TEXT DEFAULT 'MRU',
    status employee_status DEFAULT 'active',
    address TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    basic_salary DECIMAL(15, 2) NOT NULL,
    allowances DECIMAL(15, 2) DEFAULT 0,
    deductions DECIMAL(15, 2) DEFAULT 0,
    overtime DECIMAL(15, 2) DEFAULT 0,
    net_salary DECIMAL(15, 2) NOT NULL,
    status payroll_status DEFAULT 'draft',
    payment_date DATE,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACTIVITY LOG
-- ============================================================================

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    action_type TEXT,
    module TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    description TEXT,
    metadata JSONB,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_is_imported ON accounts(is_imported);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchases_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchase_orders(date);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON activity_logs(module);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_orders_updated_at ON sales_orders;
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_updated_at ON payroll;
CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER FOR USER PROFILE CREATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_count INTEGER;
    assigned_role app_role;
BEGIN
    -- Create the profile
    INSERT INTO public.profiles (id, email, name, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'active'
    );
    
    -- Check if this is the first user (make them admin)
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    IF user_count <= 1 THEN
        assigned_role := 'admin';
    ELSE
        assigned_role := 'viewer'; -- Default role for new users (can be changed by admin)
    END IF;
    
    -- Create user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role);
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS FOR RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = ANY(_roles)
    )
$$;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own profile" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can update all profiles" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can read own profile" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own profile" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all profiles" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can update any profile" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage user roles" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own roles" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can read own roles" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own roles" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all user roles" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "All users can view roles" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view roles" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage roles" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "All users can view permissions" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage permissions" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "All users can view departments" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can create departments" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can update departments" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can delete departments" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "All users can view accounts" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can create accounts" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can update accounts" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can delete accounts" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can view customers" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can create customers" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can update customers" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can delete customers" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can view vendors" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can create vendors" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can update vendors" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can delete vendors" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "All users can view products" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can create products" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can update products" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can delete products" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can view stock movements" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can create stock movements" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can view transactions" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can create transactions" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can update transactions" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can delete transactions" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can view sales" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can create sales" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can update sales" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can delete sales" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users with sales access can view line items" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can manage line items" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can view purchases" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can create purchases" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can update purchases" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can delete purchases" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users with purchase access can view line items" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can view employees" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can create employees" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can update employees" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can delete employees" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can view payroll" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can create payroll" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can update payroll" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can delete payroll" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own activity" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins and managers can view all activity" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "All users can create activity logs" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Admins can delete activity logs" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "All users can view categories" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authorized users can manage categories" ON ' || r.tablename;
    END LOOP;
END $$;

-- PROFILES TABLE POLICIES
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- All authenticated users can view all profiles (for user management)
CREATE POLICY "Authenticated users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Admins can view all profiles (redundant but kept for clarity)
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- USER_ROLES TABLE POLICIES (Simplified)
-- All authenticated users can view all user roles
CREATE POLICY "Authenticated users can view all user roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert user roles (trigger uses SECURITY DEFINER so it bypasses RLS)
CREATE POLICY "Admins can insert user roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Only admins can update user roles
CREATE POLICY "Admins can update user roles"
ON user_roles FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Only admins can delete user roles
CREATE POLICY "Admins can delete user roles"
ON user_roles FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- ROLES TABLE POLICIES
CREATE POLICY "Authenticated users can view roles"
ON roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage roles"
ON roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- MODULE PERMISSIONS TABLE POLICIES
CREATE POLICY "All users can view permissions"
ON module_permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage permissions"
ON module_permissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- DEPARTMENTS TABLE POLICIES
CREATE POLICY "All users can view departments"
ON departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authorized users can create departments"
ON departments FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'manager', 'hr']::app_role[]));

CREATE POLICY "Authorized users can update departments"
ON departments FOR UPDATE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin', 'manager', 'hr']::app_role[]));

CREATE POLICY "Admins can delete departments"
ON departments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ACCOUNTS TABLE POLICIES
-- ACCOUNTS TABLE POLICIES (Simplified)
CREATE POLICY "Authenticated users can view accounts"
ON accounts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create accounts"
ON accounts FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update accounts"
ON accounts FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can delete accounts"
ON accounts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- CUSTOMERS TABLE POLICIES
-- Simplified: All authenticated users can manage customers
CREATE POLICY "Authenticated users can view customers"
ON customers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create customers"
ON customers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
ON customers FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can delete customers"
ON customers FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- VENDORS TABLE POLICIES
-- Simplified: All authenticated users can manage vendors
CREATE POLICY "Authenticated users can view vendors"
ON vendors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create vendors"
ON vendors FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update vendors"
ON vendors FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can delete vendors"
ON vendors FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- PRODUCTS TABLE POLICIES
-- Simplified: All authenticated users can manage products
CREATE POLICY "Authenticated users can view products"
ON products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create products"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON products FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can delete products"
ON products FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'inventory')
  )
);

-- STOCK MOVEMENTS TABLE POLICIES (Simplified)
CREATE POLICY "Authenticated users can view stock movements"
ON stock_movements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create stock movements"
ON stock_movements FOR INSERT
TO authenticated
WITH CHECK (true);

-- TRANSACTIONS TABLE POLICIES (Simplified)
CREATE POLICY "Authenticated users can view transactions"
ON transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
ON transactions FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can delete transactions"
ON transactions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'accountant')
  )
);

-- SALES ORDERS TABLE POLICIES (Simplified)
CREATE POLICY "Authenticated users can view sales"
ON sales_orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create sales"
ON sales_orders FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales"
ON sales_orders FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can delete sales"
ON sales_orders FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'sales', 'accountant')
  )
);

-- SALES LINE ITEMS TABLE POLICIES (Simplified)
CREATE POLICY "Authenticated users can view sales line items"
ON sales_line_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage sales line items"
ON sales_line_items FOR ALL
TO authenticated
USING (true);

-- PURCHASE ORDERS TABLE POLICIES (Simplified)
CREATE POLICY "Authenticated users can view purchases"
ON purchase_orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create purchases"
ON purchase_orders FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchases"
ON purchase_orders FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can delete purchases"
ON purchase_orders FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager', 'accountant')
  )
);

-- PURCHASE LINE ITEMS TABLE POLICIES (Simplified)
CREATE POLICY "Authenticated users can view purchase line items"
ON purchase_line_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage purchase line items"
ON purchase_line_items FOR ALL
TO authenticated
USING (true);

-- EMPLOYEES TABLE POLICIES (Simplified)
CREATE POLICY "Authenticated users can view employees"
ON employees FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create employees"
ON employees FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
ON employees FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can delete employees"
ON employees FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'hr')
  )
);

-- PAYROLL TABLE POLICIES (Simplified)
CREATE POLICY "Authenticated users can view payroll"
ON payroll FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create payroll"
ON payroll FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update payroll"
ON payroll FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins can delete payroll"
ON payroll FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'hr', 'accountant')
  )
);

-- ACTIVITY LOGS TABLE POLICIES (Simplified)
CREATE POLICY "Authenticated users can view all activity"
ON activity_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create activity logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can delete activity logs"
ON activity_logs FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- PRODUCT CATEGORIES TABLE POLICIES (Simplified)
CREATE POLICY "Authenticated users can view categories"
ON product_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage categories"
ON product_categories FOR ALL
TO authenticated
USING (true);

-- ============================================================================
-- ENABLE REALTIME SUBSCRIPTIONS
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE sales_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE vendors;

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- Your database is now fully set up with:
-- - All tables created
-- - All indexes for performance
-- - All triggers for auto-updates
-- - All RLS policies for security
-- - Realtime subscriptions enabled
-- 
-- FIRST USER = ADMIN:
-- The first user to sign up will automatically be assigned the 'admin' role.
-- All subsequent users will be assigned the 'viewer' role by default.
-- ============================================================================

