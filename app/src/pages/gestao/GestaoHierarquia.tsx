import { HierarchyTree } from '@/components/gestao/HierarchyTree';
import { useSubordinates } from '@/hooks/useSubordinates';
import { useHierarchy } from '@/hooks/useHierarchy';
import { Skeleton } from '@/components/ui/skeleton';

export default function GestaoHierarquia() {
  const { subordinates, isLoading: subsLoading } = useSubordinates();
  const { hierarchy, isLoading, addSubordinate, removeSubordinate, updateUserRole } = useHierarchy();

  const isDataLoading = isLoading || subsLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hierarquia</h1>
        <p className="text-muted-foreground">Gerencie a estrutura de gestores e subordinados</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {isDataLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="ml-10 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-4 h-px bg-border flex-shrink-0" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-6 w-40" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <HierarchyTree
            hierarchy={hierarchy}
            users={subordinates}
            onAddSubordinate={addSubordinate}
            onRemoveSubordinate={removeSubordinate}
            onUpdateRole={updateUserRole}
          />
        )}
      </div>
    </div>
  );
}
