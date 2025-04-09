import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

// Типы навигационных элементов
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  protected: boolean;
}

// Список навигационных элементов, такой же как в navbar.tsx
const navigation: NavigationItem[] = [
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

export function MobileMenu() {
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Функция закрытия меню после перехода
  const handleNavigate = () => {
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[80%] pt-10">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left">Sports School CRM</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-1">
            {navigation.map((item) => {
              // Показываем только те элементы, для которых у пользователя есть доступ
              if (item.protected && !user) return null;
              
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={handleNavigate}
                >
                  <a
                    className={cn(
                      "flex items-center px-3 py-3 text-sm font-medium rounded-md",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {t(item.name)}
                  </a>
                </Link>
              );
            })}
          </nav>
          
          {user && (
            <div className="absolute bottom-8 left-4 right-4 border-t pt-4">
              <div className="flex items-center mb-2">
                <p className="text-sm font-medium">{user.username}</p>
              </div>
              <Button 
                variant="outline"
                className="w-full flex items-center justify-center"
                onClick={() => {
                  logoutMutation.mutate();
                  setIsOpen(false);
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('navigation.signOut')}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}