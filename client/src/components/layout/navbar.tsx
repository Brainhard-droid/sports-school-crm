import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
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
  UserRound,
} from "lucide-react";
import { LanguageSwitcher } from "../language-switcher";
import { useTranslation } from "react-i18next";

const navigation = [
  { name: "navigation.dashboard", href: "/", icon: LayoutDashboard, protected: true },
  { name: "navigation.students", href: "/students", icon: Users, protected: true },
  { name: "Ученики (новая)", href: "/students-new", icon: UserRound, protected: true },
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="fixed top-0 right-0 left-0 h-16 bg-background border-b z-50 flex items-center justify-between px-4">
        <div className="text-xl font-semibold">Sports School CRM</div>
        <LanguageSwitcher />
      </div>

      <div className="flex pt-16">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow border-r bg-sidebar py-5">
            <nav className="flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                (!item.protected || user) && (
                  <Link key={item.name} href={item.href}>
                    <a className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent">
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

        {/* Main content */}
        <div className="flex flex-col flex-1">
          <main className="flex-1 bg-background">{children}</main>
        </div>
      </div>
    </div>
  );
}