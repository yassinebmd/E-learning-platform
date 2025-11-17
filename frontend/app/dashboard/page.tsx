'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

// import StudentDashboard from '@/components/dashboard/StudentDashboard';
// import InstructorDashboard from '@/components/dashboard/InstructorDashboard';

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      router.refresh();
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 size={40} className="animate-spin text-accent" />
        <p className="text-muted-foreground mt-4 font-ibm-plex-mono">
          Authenticating session...
        </p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      {/* {user.role === 'INSTRUCTOR' ? (
        <InstructorDashboard user={user} />
      ) : (
        <StudentDashboard user={user} />
      )} */}
        <h1 className="text-3xl font-ibm-plex-mono text-accent">
            Welcome to your Dashboard, {user.name}!
        </h1>
    </div>
  );
}