import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Group,
  Calendar,
  CreditCard,
  LogOut,
  ClipboardList,
  Settings,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "../language-switcher";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Определение пунктов навигации
const navigation = [
  { name: "navigation.dashboard", href: "/", icon: LayoutDashboard, protected: true },
  { name: "navigation.students", href: "/students", icon: Users, protected: true },
  { name: "navigation.groups", href: "/groups", icon: Group, protected: true },
  { name: "navigation.attendance", href: "/attendance", icon: Calendar, protected: true },
  { name: "navigation.payments", href: "/payments", icon: CreditCard, protected: true },
  { name: "Воронка продаж", href: "/sales-funnel", icon: ClipboardList, protected: true },
  { name: "navigation.chat", href: "/chat", icon: MessageCircle, protected: true },
  { name: "navigation.trialRequest", href: "/trial-request", icon: ClipboardList, protected: false },
  { name: "navigation.settings", href: "/settings", icon: Settings, protected: true },
];

type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="fixed top-0 right-0 left-0 h-16 bg-background border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Мобильное меню */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Открыть меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="font-semibold">Sports School CRM</div>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex-1 overflow-y-auto py-5 px-3">
                  {navigation.map((item) => (
                    (!item.protected || user) && (
                      <Link key={item.name} href={item.href}>
                        <a 
                          className={`flex items-center px-3 py-2 mb-1 text-sm rounded-md transition-colors ${
                            location === item.href 
                              ? "bg-primary text-primary-foreground" 
                              : "text-foreground hover:bg-muted"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          {t(item.name)}
                        </a>
                      </Link>
                    )
                  ))}
                </nav>
                {user && (
                  <div className="flex-shrink-0 border-t p-4">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.username}</p>
                        <Button
                          variant="ghost"
                          className="mt-1 flex items-center text-sm -ml-3 px-3"
                          onClick={() => {
                            logoutMutation.mutate();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {t('navigation.signOut')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="text-xl font-semibold">Sports School CRM</div>
        </div>
        <LanguageSwitcher />
      </div>

      <div className="flex pt-16">
        {/* Десктопный сайдбар */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow border-r bg-sidebar py-5 fixed h-[calc(100vh-4rem)] top-16 w-64">
            <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
              {navigation.map((item) => (
                (!item.protected || user) && (
                  <Link key={item.name} href={item.href}>
                    <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      location === item.href 
                        ? "bg-primary text-primary-foreground" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}>
                      <item.icon className="mr-3 h-5 w-5" />
                      {t(item.name)}
                    </a>
                  </Link>
                )
              ))}
            </nav>
            {user && (
              <div className="flex-shrink-0 flex border-t border-sidebar-border p-4">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium text-sidebar-foreground">{user.username}</p>
                    <Button
                      variant="ghost"
                      className="mt-1 flex items-center text-sm text-sidebar-foreground"
                      onClick={() => logoutMutation.mutate()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('navigation.signOut')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Основной контент */}
        <div className="flex flex-col flex-1 md:ml-64">
          <main className="flex-1 bg-background">{children}</main>
        </div>
      </div>
    </div>
  );
}