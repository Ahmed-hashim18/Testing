# Naqel Trade ERP

A comprehensive Enterprise Resource Planning (ERP) system built with React, TypeScript, and Supabase.

## Features

- **Sales Management**: Create and manage sales orders, track customers, and monitor revenue
- **Purchase Management**: Handle purchase orders, manage vendors, and track inventory
- **Inventory Management**: Track products, stock levels, and stock movements
- **Accounting**: Chart of Accounts, transactions, and financial reporting
- **HR & Payroll**: Employee management and payroll processing
- **Activity Logging**: Complete audit trail of all system activities
- **User Management**: Role-based access control with granular permissions
- **Real-time Updates**: Automatic data synchronization across the application

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Realtime)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm/bun
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd Naqel_Trade_ERP
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure Supabase credentials**
   
   You have two options to configure your Supabase connection:

   **Option A: Environment Variables (Recommended for production)**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   **Option B: Direct Code Update (Quick setup)**
   
   Edit the file `src/integrations/supabase/client.ts`:
   ```typescript
   const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co';
   const supabaseAnonKey = 'YOUR_ANON_KEY';
   ```
   
   You can find these values in your Supabase dashboard:
   - Go to **Settings** → **API**
   - Copy the **Project URL** and **anon public** key

4. **Set up the database**
   
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Open the `database.sql` file from the root of this project
   - Copy and paste the entire contents into the SQL Editor
   - Click "Run" to execute
   
   This will create:
   - All database tables
   - All indexes for performance
   - All triggers for auto-updates
   - All Row Level Security (RLS) policies
   - Realtime subscriptions
   - **Default admin user**

5. **Start the development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

6. **Access the application**
   
   Open your browser and navigate to `http://localhost:5173`

7. **Create your admin account**
   
   The **first user to sign up** will automatically become the administrator.
   
   - Click "Sign up" on the login page
   - Enter your email and password
   - You will be assigned the 'admin' role automatically
   
   All subsequent users will be assigned the 'viewer' role by default.

## Database Setup

The `database.sql` file contains everything needed for a fresh database installation:

- **ENUM Types**: All custom types (app_role, account_type, transaction_type, etc.)
- **Tables**: All 18+ tables with correct column names
- **Indexes**: Performance indexes on frequently queried columns
- **Triggers**: Auto-update triggers for `updated_at` columns
- **RLS Policies**: Complete Row Level Security policies for all tables
- **Realtime**: Realtime subscriptions enabled for key tables
- **Default Admin User**: Automatically created for initial access

### First User = Admin

When you run `database.sql`, no default user is created. Instead:

- **The first user to sign up** becomes the administrator automatically
- All subsequent users are assigned the 'viewer' role by default
- Admins can change user roles from the User Management page

This approach is more secure than having default credentials.

### Important Notes

- The `database.sql` file is **idempotent** - you can run it multiple times safely
- It uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` to avoid errors
- All existing policies are dropped before creating new ones to prevent duplicates
- The file fixes the `purchase_line_items` table to use `purchase_order_id` (not `purchase_id`)
- The admin user is only created if it doesn't already exist

## Project Structure

```
Naqel_Trade_ERP/
├── src/
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── types/          # TypeScript type definitions
│   ├── contexts/       # React contexts (Auth, etc.)
│   └── lib/            # Utility functions
├── public/             # Static assets
├── database.sql        # Complete database setup script
└── README.md          # This file
```

## Key Features

### Authentication
- Email/password authentication via Supabase Auth
- Automatic profile creation on signup
- Role-based access control (admin, manager, accountant, sales, inventory, hr, viewer)
- Default admin account for initial setup

### Backup & Restore
- Export all data to JSON file
- Restore data from backup file
- Accessible from the Backup & Restore menu

### Sales Module
- Create and manage sales orders
- Track customer information
- Automatic inventory updates
- Transaction creation
- Activity logging

### Purchase Module
- Create and manage purchase orders
- Track vendor information
- Automatic inventory updates
- Transaction creation
- Activity logging

### Chart of Accounts
- Hierarchical account structure
- CSV import functionality
- Protection for imported accounts
- Account balance tracking

### Real-time Updates
- Automatic data synchronization
- No page refresh needed
- Live updates across all modules

## Deployment

### Deploy to Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Netlify:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

3. The `public/_redirects` file ensures proper SPA routing

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the Vite configuration
3. Add environment variables in Vercel dashboard

## Supabase Configuration

### Where to Update Database Credentials

The Supabase URL and API key are configured in:

```
src/integrations/supabase/client.ts
```

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

### How to Get Your Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIs...`

### Updating for a New Project

When switching to a new Supabase project:

1. Update `src/integrations/supabase/client.ts` with new URL and key
2. Run `database.sql` in the new project's SQL Editor
3. Login with default admin: `admin@admin.com` / `Admin1234`

## Troubleshooting

### Database Issues

If you encounter RLS policy errors:
1. Make sure you've run the complete `database.sql` file
2. Verify that all tables have RLS enabled
3. Check that policies exist: `SELECT * FROM pg_policies;`

### Login Issues

If login doesn't work:
1. Verify RLS policies for `profiles` and `user_roles` tables
2. Check that the `handle_new_user()` trigger is created
3. Ensure your user has a role assigned in `user_roles` table

### Build Issues

If the build fails:
1. Check for TypeScript errors: `npm run build`
2. Verify all environment variables are set
3. Ensure all dependencies are installed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary software.

## Support

For issues and questions, please open an issue in the GitHub repository.
