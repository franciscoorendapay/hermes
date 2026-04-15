import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { role, isManager, isLogistica, isLoading: roleLoading } = useUserRole();

  const isLoading = authLoading || roleLoading;

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Redirecionar gestores (que não são comerciais) para área de gestão
  useEffect(() => {
    if (!isLoading && isAuthenticated && isManager && role !== 'comercial' && role !== 'admin') {
      navigate("/gestao", { replace: true });
    }
  }, [isAuthenticated, isLoading, isManager, role, navigate]);

  // Redirecionar logística para área de logística
  useEffect(() => {
    if (!isLoading && isAuthenticated && isLogistica && role !== 'admin') {
      navigate("/logistica", { replace: true });
    }
  }, [isAuthenticated, isLoading, isLogistica, role, navigate]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Se não autenticado, não renderizar nada (o useEffect vai redirecionar)
  if (!isAuthenticated) {
    return null;
  }

  // Se for gestor puro (não comercial), não renderizar (será redirecionado)
  if (isManager && role !== 'comercial') {
    return null;
  }

  // Se for logística, não renderizar (será redirecionado)
  if (isLogistica) {
    return null;
  }

  // Se for admin, não renderizar (será redirecionado pelo useEffect ou manualmente)
  // Mas como AppLayout envolve rotas comerciais, admin não deveria ver esse layout 
  // (a menos que a intenção do botão "Acessar Painel" no AdminDashboard seja permitir entrar aqui - nesse caso permitiríamos).
  // O request diz: "permita que SOMENTE ela consiga entrar na tela de admin". 
  // Não diz explicitamente que ela NÃO pode entrar nas outras.
  // Porém, seguindo o padrão dos redirecionamentos automáticos:
  if (role === 'admin') {
    // Se for admin, permitimos renderizar?
    // O admin tem um dashboard próprio com links para os outros.
    // Se ele clicar em "Comercial", ele vem pra cá.
    // Então NÃO devemos redirecionar admin automaticamente DAQUI para /admin, 
    // senão ele nunca consegue entrar no dashboard comercial.
    // Vamos permitir o acesso do admin aqui.
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div>
        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}