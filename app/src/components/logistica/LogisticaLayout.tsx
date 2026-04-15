import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  History,
  LogOut,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/logistica", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/logistica/ordens", label: "Ordens", icon: ClipboardList },
  { path: "/logistica/rotas", label: "Rotas", icon: MapPin },
  { path: "/logistica/historico", label: "Histórico", icon: History },
];

export default function LogisticaLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { isLogistica, isAdmin, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/", { replace: true });
      return;
    }

    // Se não for logística E não for admin, chutar
    if (!authLoading && !roleLoading && !isLogistica && !isAdmin) {
      navigate("/dashboard", { replace: true });
      toast.error("Acesso restrito ao setor de logística");
    }
  }, [authLoading, roleLoading, isAuthenticated, isLogistica, isAdmin, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Permitir se for logística OU admin
  if (!isLogistica && !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div>
            <h1 className="font-bold text-foreground text-sm">Logística</h1>
            <p className="text-xs text-muted-foreground">{profile?.nome || 'Usuário'}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container p-4 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-around px-4">
          {/* Back button */}
          <button
            onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-[10px] font-medium">{isAdmin ? 'Admin' : 'Voltar'}</span>
          </button>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
