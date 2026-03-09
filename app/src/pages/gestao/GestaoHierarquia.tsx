import { HierarchyTree } from '@/components/gestao/HierarchyTree';
import { useSubordinates } from '@/hooks/useSubordinates';
import { useHierarchy } from '@/hooks/useHierarchy';
import { Skeleton } from '@/components/ui/skeleton';

export default function GestaoHierarquia() {
  const { subordinates, isLoading: subsLoading } = useSubordinates();
  const { hierarchy, isLoading, addSubordinate, removeSubordinate, updateUserRole } = useHierarchy();

  if (isLoading || subsLoading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hierarquia</h1>
        <p className="text-muted-foreground">Gerencie a estrutura de gestores e subordinados</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <HierarchyTree
          hierarchy={hierarchy}
          users={subordinates}
          onAddSubordinate={addSubordinate}
          onRemoveSubordinate={removeSubordinate}
          onUpdateRole={updateUserRole}
        />
      </div>
    </div>
  );
}
