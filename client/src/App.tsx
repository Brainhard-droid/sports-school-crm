import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Groups from "@/pages/groups";
import Attendance from "@/pages/attendance";
import Payments from "@/pages/payments";
import ResetPassword from "@/pages/reset-password"; // Add import

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password/:token" component={ResetPassword} /> {/* Add reset password route */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/students" component={Students} />
      <ProtectedRoute path="/groups" component={Groups} />
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
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;