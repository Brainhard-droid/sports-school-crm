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
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Groups", href: "/groups", icon: Group },
  { name: "Attendance", href: "/attendance", icon: Calendar },
  { name: "Payments", href: "/payments", icon: CreditCard },
];

type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow border-r bg-sidebar pt-5">
          <div className="flex items-center px-4">
            <span className="text-xl font-semibold text-sidebar-foreground">Sports School CRM</span>
          </div>
          <div className="mt-8 flex flex-col flex-1">
            <nav className="flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <a className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent">
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                </Link>
              ))}
            </nav>
            <div className="flex-shrink-0 flex border-t border-sidebar-border p-4">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">{user?.username}</p>
                  <Button
                    variant="ghost"
                    className="mt-1 flex items-center text-sm text-sidebar-foreground"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
