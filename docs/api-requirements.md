# NaqelERP API Requirements Documentation

## Overview
This document outlines the complete API requirements for NaqelERP system integration with Lovable Cloud (Supabase). All endpoints use Supabase's auto-generated REST API with Row Level Security (RLS) for access control.

---

## Authentication APIs

### User Registration
- **Method**: `POST`
- **Endpoint**: `auth.signUp()`
- **Request Body**:
  ```typescript
  {
    email: string;
    password: string;
    options: {
      data: {
        name: string;
      }
    }
  }
  ```
- **Response**: User session with JWT token
- **RLS**: Public access for signup

### User Login
- **Method**: `POST`
- **Endpoint**: `auth.signInWithPassword()`
- **Request Body**:
  ```typescript
  {
    email: string;
    password: string;
  }
  ```
- **Response**: User session with JWT token
- **RLS**: Public access for login

### User Logout
- **Method**: `POST`
- **Endpoint**: `auth.signOut()`
- **Response**: Success confirmation
- **RLS**: Authenticated users only

### Get Current Session
- **Method**: `GET`
- **Endpoint**: `auth.getSession()`
- **Response**: Current user session
- **RLS**: Authenticated users only

---

## User Management APIs

### List Users
- **Method**: `GET`
- **Endpoint**: `/rest/v1/profiles`
- **Query Params**: 
  - `status=eq.active` (filter by status)
  - `order=created_at.desc` (sort order)
- **Response**: Array of user profiles
- **RLS**: Admin and Manager roles only

### Get User Details
- **Method**: `GET`
- **Endpoint**: `/rest/v1/profiles?id=eq.{userId}`
- **Response**: User profile with roles
- **RLS**: Own profile or Admin/Manager

### Create User
- **Method**: `POST`
- **Endpoint**: `auth.signUp()` + `/rest/v1/user_roles`
- **Request Body**:
  ```typescript
  {
    email: string;
    password: string;
    name: string;
    role: app_role;
  }
  ```
- **Response**: Created user profile
- **RLS**: Admin role only

### Update User
- **Method**: `PATCH`
- **Endpoint**: `/rest/v1/profiles?id=eq.{userId}`
- **Request Body**:
  ```typescript
  {
    name?: string;
    status?: 'active' | 'inactive' | 'suspended';
    avatar_url?: string;
  }
  ```
- **Response**: Updated user profile
- **RLS**: Own profile or Admin

### Delete User
- **Method**: `DELETE`
- **Endpoint**: `/rest/v1/profiles?id=eq.{userId}`
- **Response**: Success confirmation
- **RLS**: Admin role only

### Assign Role to User
- **Method**: `POST`
- **Endpoint**: `/rest/v1/user_roles`
- **Request Body**:
  ```typescript
  {
    user_id: uuid;
    role: app_role;
    assigned_by: uuid;
  }
  ```
- **Response**: Created role assignment
- **RLS**: Admin role only

---

## Roles & Permissions APIs

### List Roles
- **Method**: `GET`
- **Endpoint**: `/rest/v1/roles`
- **Response**: Array of roles with permissions
- **RLS**: All authenticated users

### Create Role
- **Method**: `POST`
- **Endpoint**: `/rest/v1/roles`
- **Request Body**:
  ```typescript
  {
    name: string;
    role_type: app_role;
    description: string;
    is_system_role: boolean;
  }
  ```
- **Response**: Created role
- **RLS**: Admin role only

### Update Role Permissions
- **Method**: `POST/PATCH`
- **Endpoint**: `/rest/v1/module_permissions`
- **Request Body**:
  ```typescript
  {
    role_id: uuid;
    module: string;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
    can_export: boolean;
  }
  ```
- **Response**: Updated permissions
- **RLS**: Admin role only

---

## Chart of Accounts APIs

### List Accounts
- **Method**: `GET`
- **Endpoint**: `/rest/v1/accounts`
- **Query Params**:
  - `account_type=eq.asset` (filter by type)
  - `status=eq.active`
  - `order=code.asc`
- **Response**: Array of accounts with hierarchy
- **RLS**: All authenticated users

### Get Account Details
- **Method**: `GET`
- **Endpoint**: `/rest/v1/accounts?id=eq.{accountId}`
- **Response**: Account with transactions
- **RLS**: All authenticated users

### Create Account
- **Method**: `POST`
- **Endpoint**: `/rest/v1/accounts`
- **Request Body**:
  ```typescript
  {
    code: string;
    name: string;
    account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    parent_id?: uuid;
    description?: string;
    currency: string;
  }
  ```
- **Response**: Created account
- **RLS**: Admin, Manager, Accountant

### Update Account
- **Method**: `PATCH`
- **Endpoint**: `/rest/v1/accounts?id=eq.{accountId}`
- **Request Body**: Partial account object
- **Response**: Updated account
- **RLS**: Admin, Manager, Accountant

### Delete Account
- **Method**: `DELETE`
- **Endpoint**: `/rest/v1/accounts?id=eq.{accountId}`
- **Response**: Success confirmation
- **RLS**: Admin only

---

## Transactions APIs

### List Transactions
- **Method**: `GET`
- **Endpoint**: `/rest/v1/transactions`
- **Query Params**:
  - `date=gte.2024-01-01&date=lte.2024-12-31`
  - `type=eq.sale`
  - `status=eq.completed`
  - `order=date.desc`
- **Response**: Array of transactions
- **RLS**: Admin, Manager, Accountant

### Create Transaction
- **Method**: `POST`
- **Endpoint**: `/rest/v1/transactions`
- **Request Body**:
  ```typescript
  {
    date: string;
    type: transaction_type;
    description: string;
    account_from?: uuid;
    account_to?: uuid;
    amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    reference?: string;
    notes?: string;
  }
  ```
- **Response**: Created transaction
- **RLS**: Admin, Manager, Accountant

### Update Transaction
- **Method**: `PATCH`
- **Endpoint**: `/rest/v1/transactions?id=eq.{transactionId}`
- **Request Body**: Partial transaction object
- **Response**: Updated transaction
- **RLS**: Admin, Manager, Accountant

### Bulk Update Transactions
- **Method**: `PATCH`
- **Endpoint**: `/rest/v1/transactions?id=in.(id1,id2,id3)`
- **Request Body**: Partial transaction object
- **Response**: Updated transactions
- **RLS**: Admin, Manager, Accountant

---

## Products/Inventory APIs

### List Products
- **Method**: `GET`
- **Endpoint**: `/rest/v1/products`
- **Query Params**:
  - `status=eq.active`
  - `category_id=eq.{categoryId}`
  - `current_stock=lt.reorder_level` (low stock)
  - `order=name.asc`
- **Response**: Array of products
- **RLS**: All authenticated users

### Create Product
- **Method**: `POST`
- **Endpoint**: `/rest/v1/products`
- **Request Body**:
  ```typescript
  {
    sku: string;
    name: string;
    description?: string;
    category_id: uuid;
    unit: string;
    cost_price: number;
    selling_price: number;
    current_stock: number;
    reorder_level: number;
    supplier_id?: uuid;
    status: 'active' | 'inactive' | 'discontinued';
  }
  ```
- **Response**: Created product
- **RLS**: Admin, Manager, Inventory, Sales

### Update Product Stock
- **Method**: `PATCH`
- **Endpoint**: `/rest/v1/products?id=eq.{productId}`
- **Request Body**:
  ```typescript
  {
    current_stock: number;
  }
  ```
- **Response**: Updated product
- **RLS**: Admin, Manager, Inventory

### Record Stock Movement
- **Method**: `POST`
- **Endpoint**: `/rest/v1/stock_movements`
- **Request Body**:
  ```typescript
  {
    product_id: uuid;
    movement_type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reference_type?: string;
    reference_id?: uuid;
    notes?: string;
  }
  ```
- **Response**: Created stock movement
- **RLS**: Admin, Manager, Inventory

---

## Sales APIs

### List Sales Orders
- **Method**: `GET`
- **Endpoint**: `/rest/v1/sales_orders`
- **Query Params**:
  - `date=gte.2024-01-01`
  - `customer_id=eq.{customerId}`
  - `status=eq.confirmed`
  - `select=*,customer:customers(*),line_items:sales_line_items(*,product:products(*))`
- **Response**: Array of sales orders with line items
- **RLS**: Admin, Manager, Accountant, Sales

### Create Sales Order
- **Method**: `POST`
- **Endpoint**: `/rest/v1/sales_orders` + `/rest/v1/sales_line_items`
- **Request Body**:
  ```typescript
  {
    order_number: string;
    customer_id: uuid;
    date: string;
    due_date: string;
    status: sales_status;
    line_items: Array<{
      product_id: uuid;
      quantity: number;
      unit_price: number;
      discount: number;
      tax: number;
      total: number;
    }>;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    notes?: string;
  }
  ```
- **Response**: Created sales order
- **RLS**: Admin, Manager, Sales

### Update Sales Order Status
- **Method**: `PATCH`
- **Endpoint**: `/rest/v1/sales_orders?id=eq.{orderId}`
- **Request Body**:
  ```typescript
  {
    status: sales_status;
    paid_amount?: number;
    balance?: number;
  }
  ```
- **Response**: Updated sales order
- **RLS**: Admin, Manager, Sales

---

## Purchases APIs

### List Purchase Orders
- **Method**: `GET`
- **Endpoint**: `/rest/v1/purchase_orders`
- **Query Params**:
  - `date=gte.2024-01-01`
  - `vendor_id=eq.{vendorId}`
  - `status=eq.ordered`
  - `select=*,vendor:vendors(*),line_items:purchase_line_items(*,product:products(*))`
- **Response**: Array of purchase orders with line items
- **RLS**: Admin, Manager, Accountant, Inventory

### Create Purchase Order
- **Method**: `POST`
- **Endpoint**: `/rest/v1/purchase_orders` + `/rest/v1/purchase_line_items`
- **Request Body**:
  ```typescript
  {
    order_number: string;
    vendor_id: uuid;
    date: string;
    status: purchase_status;
    line_items: Array<{
      product_id: uuid;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
    subtotal: number;
    tax: number;
    tax_rate: number;
    total: number;
    notes?: string;
  }
  ```
- **Response**: Created purchase order
- **RLS**: Admin, Manager, Inventory

### Receive Purchase Order
- **Method**: `PATCH`
- **Endpoint**: `/rest/v1/purchase_orders?id=eq.{orderId}` + Update stock
- **Request Body**:
  ```typescript
  {
    status: 'received';
    received_date: string;
  }
  ```
- **Response**: Updated purchase order
- **RLS**: Admin, Manager, Inventory

---

## HR & Payroll APIs

### List Employees
- **Method**: `GET`
- **Endpoint**: `/rest/v1/employees`
- **Query Params**:
  - `department_id=eq.{deptId}`
  - `status=eq.active`
  - `select=*,department:departments(*)`
- **Response**: Array of employees
- **RLS**: Admin, Manager, HR

### Create Employee
- **Method**: `POST`
- **Endpoint**: `/rest/v1/employees`
- **Request Body**:
  ```typescript
  {
    employee_number: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    hire_date: string;
    department_id: uuid;
    position: string;
    employment_type: employment_type;
    salary: number;
    currency: string;
    status: employee_status;
  }
  ```
- **Response**: Created employee
- **RLS**: Admin, Manager, HR

### Process Payroll
- **Method**: `POST`
- **Endpoint**: `/rest/v1/payroll`
- **Request Body**:
  ```typescript
  {
    employee_id: uuid;
    period_start: string;
    period_end: string;
    basic_salary: number;
    allowances: number;
    deductions: number;
    overtime: number;
    net_salary: number;
    status: 'draft' | 'processed' | 'paid';
    notes?: string;
  }
  ```
- **Response**: Created payroll record
- **RLS**: Admin, Manager, HR

---

## Activity Log APIs

### List Activity Logs
- **Method**: `GET`
- **Endpoint**: `/rest/v1/activity_logs`
- **Query Params**:
  - `module=eq.sales`
  - `user_id=eq.{userId}`
  - `created_at=gte.2024-01-01`
  - `order=created_at.desc`
  - `select=*,user:profiles(*)`
- **Response**: Array of activity logs
- **RLS**: Own logs or Admin/Manager

### Create Activity Log
- **Method**: `POST`
- **Endpoint**: `/rest/v1/activity_logs`
- **Request Body**:
  ```typescript
  {
    user_id: uuid;
    action: string;
    module: string;
    entity_type?: string;
    entity_id?: uuid;
    details?: object;
    ip_address?: string;
    user_agent?: string;
  }
  ```
- **Response**: Created activity log
- **RLS**: Authenticated users (own logs)

---

## Reporting APIs (Edge Functions)

### Generate Financial Report
- **Method**: `POST`
- **Endpoint**: `/functions/v1/generate-financial-report`
- **Request Body**:
  ```typescript
  {
    report_type: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'trial_balance';
    start_date: string;
    end_date: string;
    format: 'json' | 'pdf' | 'excel';
  }
  ```
- **Response**: Generated report data or file
- **RLS**: Admin, Manager, Accountant

### Export Data
- **Method**: `POST`
- **Endpoint**: `/functions/v1/export-data`
- **Request Body**:
  ```typescript
  {
    module: string;
    filters: object;
    format: 'csv' | 'excel' | 'pdf';
  }
  ```
- **Response**: Exported file
- **RLS**: Based on module permissions

---

## Real-time Subscriptions

### Subscribe to Table Changes
```typescript
supabase
  .channel('table-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'table_name'
  }, (payload) => {
    // Handle changes
  })
  .subscribe()
```

### Supported Tables for Real-time:
- `transactions`
- `sales_orders`
- `purchase_orders`
- `products` (stock updates)
- `activity_logs`

---

## Error Handling

All API responses follow standard HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate records)
- `500`: Server Error

Error Response Format:
```typescript
{
  error: string;
  message: string;
  details?: object;
}
```

---

## Rate Limiting

Lovable Cloud uses Supabase's default rate limits:
- **Anonymous requests**: 100 requests per minute
- **Authenticated requests**: 300 requests per minute
- **Edge Functions**: 500 requests per minute

---

## Data Validation

All API requests are validated against Zod schemas defined in:
- `/src/lib/validations/transaction.ts`
- `/src/lib/validations/sale.ts`
- `/src/lib/validations/purchase.ts`
- `/src/lib/validations/product.ts`
- `/src/lib/validations/employee.ts`
- `/src/lib/validations/user.ts`
- `/src/lib/validations/account.ts`
- `/src/lib/validations/role.ts`

---

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT token
2. **RLS Policies**: Database-level security enforced
3. **Input Validation**: Client and server-side validation
4. **Audit Logging**: All mutations logged to `activity_logs`
5. **Password Security**: Minimum 8 characters, complexity requirements
6. **Session Management**: 1-hour token expiry, refresh token rotation
7. **CORS**: Configured for allowed origins only
