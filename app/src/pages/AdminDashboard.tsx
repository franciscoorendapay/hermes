import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Truck, LineChart, LogOut, Shield, FileCheck, FileText, Users, Package } from "lucide-react";
import { UserImpersonationSelector } from "@/components/admin/UserImpersonationSelector";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { role } = useUserRole();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    if (role && role !== 'admin') {
      // Se não for admin, chutar para fora
      if (role === 'comercial') navigate("/dashboard");
      else if (role === 'logistica') navigate("/logistica");
      else navigate("/gestao");
    }
  }, [role, navigate]);

  const dashboards = [
    {
      title: "Comercial",
      description: "Interface para vendedores e gerenciamento de leads",
      icon: LayoutDashboard,
      path: "/dashboard",
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "Gestão",
      description: "Dashboards de gerência, metas e equipe",
      icon: LineChart,
      path: "/gestao",
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      title: "Inventário",
      description: "Controle de estoque e maquininhas disponíveis",
      icon: Package,
      path: "/admin/inventory",
      color: "text-teal-500",
      bgColor: "bg-teal-50"
    },
    {
      title: "Logística",
      description: "Controle de ordens e rotas",
      icon: Truck,
      path: "/logistica",
      color: "text-orange-500",
      bgColor: "bg-orange-50"
    },
    {
      title: "Gestão de Credenciamentos",
      description: "Aprovação de leads e análise de documentos",
      icon: FileCheck,
      path: "/admin/accreditations",
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      title: "Gestão de Leads",
      description: "Visualização e edição de todos os leads do sistema",
      icon: Users,
      path: "/admin/leads",
      color: "text-indigo-500",
      bgColor: "bg-indigo-50"
    },
    {
      title: "Leads Duplicados",
      description: "Identifique e remova leads repetidos entre comerciais",
      icon: Users,
      path: "/admin/leads/duplicates",
      color: "text-rose-500",
      bgColor: "bg-rose-50"
    },
    {
      title: "Logs do Sistema",
      description: "Monitoramento de atividades, erros e eventos",
      icon: FileText,
      path: "/admin/logs",
      color: "text-red-500",
      bgColor: "bg-red-50"
    }
  ];

  return (
    <div className="min-h-screen bg-muted/20 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
            <p className="text-muted-foreground mt-2">
              Olá, {user?.name || 'Admin'}. Selecione um painel para acessar.
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </header>

        {/* User Impersonation Selector */}
        <UserImpersonationSelector />

        <div className="grid md:grid-cols-3 gap-6">
          {dashboards.map((dash) => (
            <Card
              key={dash.path}
              className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/20"
              onClick={() => navigate(dash.path)}
            >
              <CardHeader className="space-y-1">
                <div className={`w-12 h-12 rounded-lg ${dash.bgColor} flex items-center justify-center mb-4`}>
                  <dash.icon className={`h-6 w-6 ${dash.color}`} />
                </div>
                <CardTitle>{dash.title}</CardTitle>
                <CardDescription>
                  {dash.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">
                  Acessar Painel
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-slate-100">
              <Shield className="h-6 w-6 text-slate-700" />
            </div>
            <div>
              <h3 className="font-semibold">Modo de Manutenção</h3>
              <p className="text-sm text-muted-foreground">
                Você está acessando como Administrador. Você tem acesso irrestrito a todas as áreas do sistema para fins de desenvolvimento e suporte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
