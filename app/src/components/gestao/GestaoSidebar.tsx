import { NavLink, useNavigate } from 'react-router-dom';
import { HRMSLogo } from '@/components/ui/hrms-logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Target,
  Network,
  LogOut,
  ChevronLeft,
  UserPlus,
  FileBarChart,
  Coins,
  Clock,
  TrendingUp,
  BookUser
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

const navItems = [
  { to: '/gestao', icon: LayoutDashboard, label: 'Dashboard', end: true, roles: ['diretor', 'nacional', 'regional'] as const },
  { to: '/gestao/equipe', icon: Users, label: 'Equipe', roles: ['diretor', 'nacional', 'regional'] as const },
  { to: '/gestao/comerciais', icon: UserPlus, label: 'Comerciais', roles: ['diretor', 'nacional', 'regional'] as const },
  { to: '/gestao/metas', icon: Target, label: 'Metas', roles: ['diretor', 'nacional', 'regional'] as const },
  { to: '/gestao/relatorios', icon: FileBarChart, label: 'Relatórios', roles: ['diretor', 'nacional', 'regional'] as const },
  { to: '/gestao/comissoes', icon: Coins, label: 'Comissões', roles: ['diretor', 'nacional', 'regional'] as const },
  { to: '/gestao/transacionado', icon: TrendingUp, label: 'Transacionado', roles: ['diretor', 'nacional', 'regional'] as const },
  { to: '/gestao/hierarquia', icon: Network, label: 'Hierarquia', roles: ['diretor', 'nacional'] as const },
  { to: '/gestao/sla', icon: Clock, label: 'SLA Logística', roles: ['diretor', 'logistica'] as const },
  { to: '/gestao/leads', icon: BookUser, label: 'Gestão de Leads', roles: ['nacional'] as const },
];

interface GestaoSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function GestaoSidebar({ className, onNavigate }: GestaoSidebarProps) {
  const navigate = useNavigate();
  const { logout, profile } = useAuth();
  const { role, isAdmin } = useUserRole();

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    navigate('/');
  };

  const roleLabels: Record<string, string> = {
    comercial: 'Comercial',
    regional: 'Regional',
    nacional: 'Nacional',
    diretor: 'Diretor',
    admin: 'Administrador',
    logistica: 'Logística',
  };

  return (
    <aside className={cn("bg-card border-r border-border flex flex-col w-64 h-full", className)}>
      {/* Header */}
      <div className="px-3 py-3 border-b border-border flex items-center justify-between gap-1">
        <div className="scale-90 origin-left shrink-0">
          <HRMSLogo />
        </div>

        <div className="flex items-center gap-2 bg-muted/20 pl-2 pr-1 py-1 rounded-full border border-border/50 max-w-[140px]">
          <div className="flex flex-col items-end leading-none overflow-hidden">
            <span className="text-[11px] font-semibold text-foreground truncate w-full text-right">
              {profile?.nome?.split(' ')[0] || 'Usuário'}
            </span>
            <span className="text-[9px] text-muted-foreground truncate w-full text-right">
              {profile?.regiao || roleLabels[role] || 'Gestor'}
            </span>
          </div>
          <Avatar className="h-7 w-7 border border-border/50 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
              {profile?.nome?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          // Check role permission - Admin sees all
          if (!isAdmin && item.roles && !item.roles.includes(role as any)) {
            return null;
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => {
            onNavigate?.();
            navigate(isAdmin ? '/admin' : '/dashboard');
          }}
        >
          <ChevronLeft className="h-5 w-5" />
          {isAdmin ? 'Voltar ao Admin' : 'Voltar ao App'}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
