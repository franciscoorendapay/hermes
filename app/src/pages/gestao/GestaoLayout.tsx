import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { GestaoSidebar } from '@/components/gestao/GestaoSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { HRMSLogo } from '@/components/ui/hrms-logo';

export default function GestaoLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isManager, isAdmin, isLoading: roleLoading } = useUserRole();
  const [open, setOpen] = useState(false);

  const isLoading = authLoading || roleLoading;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isManager && !isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [isManager, isAdmin, isAuthenticated, isLoading, navigate]);

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

  if (!isAuthenticated || (!isManager && !isAdmin)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r">
              <GestaoSidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <HRMSLogo />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-50 w-64">
        <GestaoSidebar className="h-full" />
      </div>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 pt-6">
        <Outlet />
      </main>
    </div>
  );
}
