import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Subordinate } from '@/hooks/useSubordinates';
import { UserRole } from '@/hooks/useUserRole';
import { Plus, Trash2, ChevronDown, ChevronRight, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HierarchyRelation {
  id: string;
  manager_id: string;
  subordinate_id: string;
  manager_nome: string;
  subordinate_nome: string;
}

interface HierarchyTreeProps {
  hierarchy: HierarchyRelation[];
  users: Subordinate[];
  onAddSubordinate: (managerId: string, subordinateId: string) => Promise<boolean>;
  onRemoveSubordinate: (relationId: string) => Promise<boolean>;
  onUpdateRole: (userId: string, role: UserRole) => Promise<boolean>;
}

const roleLabels: Record<UserRole, string> = {
  comercial: 'Comercial',
  regional: 'Regional',
  nacional: 'Nacional',
  diretor: 'Diretor',
  logistica: 'Logística',
};

const roleBadgeVariants: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  diretor: 'default',
  nacional: 'default',
  regional: 'secondary',
  comercial: 'outline',
  logistica: 'secondary',
};

export function HierarchyTree({
  hierarchy,
  users,
  onAddSubordinate,
  onRemoveSubordinate,
  onUpdateRole,
}: HierarchyTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [selectedSubordinate, setSelectedSubordinate] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<Subordinate | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('comercial');
  const [isLoading, setIsLoading] = useState(false);

  // Agrupar hierarquia por manager
  const hierarchyByManager = hierarchy.reduce((acc, rel) => {
    if (!acc[rel.manager_id]) {
      acc[rel.manager_id] = {
        manager_nome: rel.manager_nome,
        subordinates: [],
      };
    }
    acc[rel.manager_id].subordinates.push({
      id: rel.subordinate_id,
      nome: rel.subordinate_nome,
      relationId: rel.id,
    });
    return acc;
  }, {} as Record<string, { manager_nome: string; subordinates: { id: string; nome: string; relationId: string }[] }>);

  // Usuários que são managers (regional, nacional, diretor)
  const managers = users.filter(u => ['regional', 'nacional', 'diretor'].includes(u.role));

  // Usuários sem subordinados ainda
  const usersWithoutManager = users.filter(u => {
    return !hierarchy.some(h => h.subordinate_id === u.id);
  });

  const toggleExpanded = (managerId: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(managerId)) {
      newExpanded.delete(managerId);
    } else {
      newExpanded.add(managerId);
    }
    setExpanded(newExpanded);
  };

  const handleAddSubordinate = async () => {
    if (!selectedManager || !selectedSubordinate) return;
    
    setIsLoading(true);
    await onAddSubordinate(selectedManager, selectedSubordinate);
    setIsLoading(false);
    setAddDialogOpen(false);
    setSelectedManager(null);
    setSelectedSubordinate('');
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    await onUpdateRole(selectedUser.id, selectedRole);
    setIsLoading(false);
    setRoleDialogOpen(false);
    setSelectedUser(null);
  };

  const openRoleDialog = (user: Subordinate) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setRoleDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header com botão de adicionar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Estrutura Hierárquica</h3>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Atribuir Subordinado
        </Button>
      </div>

      {/* Lista de managers e seus subordinados */}
      <div className="space-y-2">
        {managers.map((manager) => {
          const managerData = hierarchyByManager[manager.id];
          const hasSubordinates = managerData && managerData.subordinates.length > 0;
          const isExpanded = expanded.has(manager.id);

          return (
            <div key={manager.id} className="border border-border rounded-lg overflow-hidden">
              {/* Manager row */}
              <div
                className={cn(
                  'flex items-center justify-between p-4 bg-card cursor-pointer hover:bg-accent/50 transition-colors',
                  hasSubordinates && 'border-b border-border'
                )}
                onClick={() => hasSubordinates && toggleExpanded(manager.id)}
              >
                <div className="flex items-center gap-3">
                  {hasSubordinates ? (
                    isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )
                  ) : (
                    <div className="w-4" />
                  )}
                  <span className="font-medium text-foreground">{manager.nome}</span>
                  <Badge variant={roleBadgeVariants[manager.role]}>
                    {roleLabels[manager.role]}
                  </Badge>
                  {hasSubordinates && (
                    <span className="text-sm text-muted-foreground">
                      ({managerData.subordinates.length} subordinados)
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    openRoleDialog(manager);
                  }}
                >
                  <UserCog className="h-4 w-4" />
                </Button>
              </div>

              {/* Subordinates */}
              {hasSubordinates && isExpanded && (
                <div className="bg-muted/30">
                  {managerData.subordinates.map((sub) => {
                    const subUser = users.find(u => u.id === sub.id);
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3 pl-12 border-b border-border last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-foreground">{sub.nome}</span>
                          {subUser && (
                            <Badge variant={roleBadgeVariants[subUser.role]}>
                              {roleLabels[subUser.role]}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {subUser && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openRoleDialog(subUser)}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onRemoveSubordinate(sub.relationId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {managers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum gestor encontrado. Primeiro defina os cargos dos usuários.
          </div>
        )}
      </div>

      {/* Usuários sem gestor */}
      {usersWithoutManager.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Usuários sem gestor atribuído ({usersWithoutManager.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {usersWithoutManager.map((user) => (
              <Badge 
                key={user.id} 
                variant="outline" 
                className="cursor-pointer hover:bg-accent"
                onClick={() => openRoleDialog(user)}
              >
                {user.nome} ({roleLabels[user.role]})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dialog para adicionar subordinado */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Subordinado</DialogTitle>
            <DialogDescription>
              Selecione o gestor e o subordinado para criar a relação hierárquica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Gestor</label>
              <Select
                value={selectedManager || ''}
                onValueChange={setSelectedManager}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome} ({roleLabels[m.role]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subordinado</label>
              <Select
                value={selectedSubordinate}
                onValueChange={setSelectedSubordinate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o subordinado" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => u.id !== selectedManager)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome} ({roleLabels[u.role]})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddSubordinate}
              disabled={!selectedManager || !selectedSubordinate || isLoading}
            >
              {isLoading ? 'Salvando...' : 'Atribuir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para alterar cargo */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Cargo</DialogTitle>
            <DialogDescription>
              Altere o cargo de {selectedUser?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="regional">Regional</SelectItem>
                <SelectItem value="nacional">Nacional</SelectItem>
                <SelectItem value="diretor">Diretor</SelectItem>
                <SelectItem value="logistica">Logística</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateRole} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
