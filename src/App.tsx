import React, { Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InlineNotificationProvider } from "@/contexts/InlineNotificationContext";
import ScrollToTop from "@/components/ScrollToTop";
import { useAuthStore } from "@/stores/auth-store";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { ModuleGuard } from "./components/ModuleGuard";
import { RoleGuard } from "./components/RoleGuard";

// Lazy-loaded heavy pages — each gets its own Rollup chunk,
// preventing cross-module TDZ (Cannot access before initialization) errors
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Roleta = React.lazy(() => import("./pages/Roleta"));
const Outros = React.lazy(() => import("./pages/Outros"));
const SuperAdmin = React.lazy(() => import("./pages/SuperAdmin"));

const queryClient = new QueryClient();

// Ensure token-based session is restored before rendering routes
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getMe, isLoading } = useAuthStore();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("salt_token");
    if (!token) {
      setBooting(false);
      return;
    }

    getMe().finally(() => setBooting(false));
  }, [getMe]);

  if (booting || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
};

// Minimal full-screen loader for lazy pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <InlineNotificationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthInitializer>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/home"
                  element={
                    <RoleGuard requiredPermission="canAccessDashboard">
                      <ModuleGuard moduleId="dashboard">
                        <Dashboard />
                      </ModuleGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/roleta"
                  element={
                    <RoleGuard requiredPermission="canAccessRoleta">
                      <ModuleGuard moduleId="roleta">
                        <Roleta />
                      </ModuleGuard>
                    </RoleGuard>
                  }
                />
                <Route
                  path="/outros"
                  element={
                    <RoleGuard requiredPermission="canAccessOutros">
                      <Outros />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/super-admin"
                  element={
                    <RoleGuard requiredPermission="canAccessSuperAdmin" fallbackPath="/home">
                      <SuperAdmin />
                    </RoleGuard>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthInitializer>
        </BrowserRouter>
      </InlineNotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
