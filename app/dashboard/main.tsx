import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { DashboardView } from '@/components/DashboardView';
import { useStore } from '@/store';

export default function MainDashboard() {
  const router = useRouter();
  const dashboardUser = useStore((s) => s.dashboardUser);
  const verifyDashboardSession = useStore((s) => s.verifyDashboardSession);

  useEffect(() => {
    (async () => {
      const ok = await verifyDashboardSession();
      if (!ok) {
        router.replace('/dashboard/login');
        return;
      }
      const me = useStore.getState().dashboardUser;
      if (!me || !me.isSuper) {
        // Dept admin trying to open main → send to their dept
        if (me?.department) router.replace(`/dashboard/${me.department}`);
        else router.replace('/dashboard/login');
      }
    })();
  }, []);

  if (!dashboardUser?.isSuper) return null;
  return <DashboardView mode="main" />;
}
