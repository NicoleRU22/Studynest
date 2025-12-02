import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';
import { Loader2 } from 'lucide-react';

export const DashboardLayout = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="container max-w-6xl py-6 px-4 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
