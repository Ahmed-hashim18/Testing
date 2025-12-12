import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoadingSpinner } from "./components/loading/LoadingSpinner";

// Eager load critical pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

// Lazy load non-critical pages for faster initial load
const Transactions = lazy(() => import("./pages/Transactions"));
const Sales = lazy(() => import("./pages/Sales"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Products = lazy(() => import("./pages/Products"));
const ChartOfAccounts = lazy(() => import("./pages/ChartOfAccounts"));
const Accounting = lazy(() => import("./pages/Accounting"));
const HRPayroll = lazy(() => import("./pages/HRPayroll"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const RolesPermissions = lazy(() => import("./pages/RolesPermissions"));
const BackupRestore = lazy(() => import("./pages/BackupRestore"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // Data stays fresh for 1 minute
      gcTime: 300000, // Cache for 5 minutes (formerly cacheTime)
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/products" element={<Products />} />
                <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
                <Route path="/accounting" element={<Accounting />} />
                <Route path="/hr-payroll" element={<HRPayroll />} />
                <Route path="/activity-log" element={<ActivityLog />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/roles-permissions" element={<RolesPermissions />} />
                <Route path="/backup-restore" element={<BackupRestore />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
