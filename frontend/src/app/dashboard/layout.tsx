import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { GamificationProvider } from '@/lib/gamification-context';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <GamificationProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </GamificationProvider>
    </ProtectedRoute>
  );
}
