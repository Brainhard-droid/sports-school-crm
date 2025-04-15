import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Suspense, lazy } from "react";
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
import ChatPage from "@/pages/chat-page";

// Loading Fallback Component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Добавим временный компонент для диагностики
const DiagnosticPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">Диагностика приложения</h1>
        <p className="mb-4">
          Это диагностическая страница для проверки работы приложения.
        </p>
        <div className="space-y-4">
          <div className="border border-gray-200 p-3 rounded">
            <h2 className="font-medium">Навигация:</h2>
            <div className="mt-2 space-y-2">
              <a href="/trial-request" className="block text-blue-500 hover:underline">
                Запись на пробное занятие
              </a>
              <a href="/auth" className="block text-blue-500 hover:underline">
                Авторизация
              </a>
              <a href="/privacy-policy" className="block text-blue-500 hover:underline">
                Политика конфиденциальности
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={DiagnosticPage} />
        <Route path="/trial-request" component={TrialRequest} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/reset-password/:token" component={ResetPassword} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/students" component={StudentsPage} />
        <ProtectedRoute path="/groups" component={Groups} />
        <ProtectedRoute path="/groups/:id" component={GroupDetails} />
        <ProtectedRoute path="/attendance" component={Attendance} />
        <ProtectedRoute path="/payments" component={Payments} />
        <ProtectedRoute path="/sales-funnel" component={SalesFunnel} />
        <ProtectedRoute path="/chat" component={ChatPage} />
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