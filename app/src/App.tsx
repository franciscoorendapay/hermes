import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "@/features/auth/RequireAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import RoutesPage from "./pages/Routes";
import Visits from "./pages/Visits";
import Carteira from "./pages/Carteira";
import NotFound from "./pages/NotFound";
import GestaoLayout from "./pages/gestao/GestaoLayout";
import GestaoDashboard from "./pages/gestao/GestaoDashboard";
import GestaoEquipe from "./pages/gestao/GestaoEquipe";
import GestaoComerciais from "./pages/gestao/GestaoComerciais";
import GestaoMetas from "./pages/gestao/GestaoMetas";
import GestaoRelatorios from "./pages/gestao/GestaoRelatorios";
import GestaoHierarquia from "./pages/gestao/GestaoHierarquia";
import GestaoSLA from "./pages/gestao/GestaoSLA";
// Logística
import LogisticaLayout from "./components/logistica/LogisticaLayout";
import LogisticaDashboard from "./pages/LogisticaDashboard";
import LogisticaOrdens from "./pages/LogisticaOrdens";
import LogisticaRoutes from "./pages/LogisticaRoutes";
import LogisticaHistorico from "./pages/LogisticaHistorico";

import AdminDashboard from "./pages/AdminDashboard";
import AdminLeads from "./pages/AdminLeads";
import AccreditationAdmin from "./pages/AccreditationAdmin";
import AdminLogs from "./pages/AdminLogs";
import { MobilePwaBlocker } from "@/components/MobilePwaBlocker";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const queryClient = new QueryClient();

const App = () => {
  const { installPwa } = usePwaInstall();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route element={<RequireAuth />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/leads" element={<AdminLeads />} />
              <Route path="/admin/accreditations" element={<AccreditationAdmin />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/routes" element={<RoutesPage />} />
                <Route path="/visits" element={<Visits />} />
                <Route path="/carteira" element={<Carteira />} />
              </Route>

              {/* Área de Logística */}
              <Route path="/logistica" element={<LogisticaLayout />}>
                <Route index element={<LogisticaDashboard />} />
                <Route path="ordens" element={<LogisticaOrdens />} />
                <Route path="rotas" element={<LogisticaRoutes />} />
                <Route path="historico" element={<LogisticaHistorico />} />
              </Route>

              {/* Área de Gestão */}
              <Route path="/gestao" element={<GestaoLayout />}>
                <Route index element={<GestaoDashboard />} />
                <Route path="equipe" element={<GestaoEquipe />} />
                <Route path="comerciais" element={<GestaoComerciais />} />
                <Route path="metas" element={<GestaoMetas />} />
                <Route path="relatorios" element={<GestaoRelatorios />} />
                <Route path="hierarquia" element={<GestaoHierarquia />} />
                <Route path="sla" element={<GestaoSLA />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>

        {/* Mobile PWA Blocker - Blocks all access on mobile until PWA is installed */}
        <MobilePwaBlocker onInstall={installPwa} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
