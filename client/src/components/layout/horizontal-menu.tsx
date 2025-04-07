import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Group,
  Calendar,
  CreditCard,
  ClipboardList,
  Settings,
  MessageCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const mainNavigation = [
  { name: "navigation.dashboard", href: "/", icon: LayoutDashboard },
  { name: "navigation.students", href: "/students", icon: Users },
  { name: "navigation.groups", href: "/groups", icon: Group },
  { name: "navigation.attendance", href: "/attendance", icon: Calendar },
  { name: "navigation.payments", href: "/payments", icon: CreditCard },
  { name: "Воронка продаж", href: "/sales-funnel", icon: ClipboardList },
  { name: "navigation.chat", href: "/chat", icon: MessageCircle },
  { name: "navigation.settings", href: "/settings", icon: Settings },
];

export function HorizontalMenu() {
  const [location] = useLocation();
  const { t } = useTranslation();
  
  // Не показываем горизонтальное меню на странице учеников
  if (location === "/students") {
    return null;
  }

  return (
    <div className="border-b">
      <div className="container py-4">
        <nav className="flex space-x-4">
          {mainNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {t(item.name)}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}