import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import StudentsPage from "@/pages/students";
import Groups from "@/pages/groups";
import GroupDetails from "@/pages/group-details"; // Добавляем новую страницу
import Attendance from "@/pages/attendance";
import Payments from "@/pages/payments";
import ResetPassword from "@/pages/reset-password";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/students" component={StudentsPage} />
      <ProtectedRoute path="/groups" component={Groups} />
      <ProtectedRoute path="/groups/:id" component={GroupDetails} />
      <ProtectedRoute path="/attendance" component={Attendance} />
      <ProtectedRoute path="/payments" component={Payments} />
      <Route component={NotFound} />
    </Switch>
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