import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import StudentsPage from "@/pages/students";
import Groups from "@/pages/groups";
import GroupDetails from "@/pages/group-details";
import Attendance from "@/pages/attendance";
import Payments from "@/pages/payments";
import ResetPassword from "@/pages/reset-password";
import TrialRequest from "@/pages/trial-request";
import SalesFunnel from "@/pages/sales-funnel/SalesFunnelPage";
import Settings from "@/pages/settings/index";
import PrivacyPolicy from "@/pages/privacy-policy";

// Loading Fallback Component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/trial-request" component={TrialRequest} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/reset-password/:token" component={ResetPassword} />
        <ProtectedRoute path="/" component={Dashboard} />
        <ProtectedRoute path="/students" component={StudentsPage} />
        <ProtectedRoute path="/groups" component={Groups} />
        <ProtectedRoute path="/groups/:id" component={GroupDetails} />
        <ProtectedRoute path="/attendance" component={Attendance} />
        <ProtectedRoute path="/payments" component={Payments} />
        <ProtectedRoute path="/sales-funnel" component={SalesFunnel} />
        <ProtectedRoute path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;