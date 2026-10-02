import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DashboardView } from '@/components/DashboardView';
import { useStore } from '@/store';

export default function DeptDashboard() {
  const { dept } = useLocalSearchParams<{ dept: string }>();
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
      if (!me) {
        router.replace('/dashboard/login');
        return;
      }
      // Dept admin can only see their own department
      if (!me.isSuper && me.department !== dept) {
        router.replace(`/dashboard/${me.department}`);
      }
      // Super admin opening a dept URL is fine — they can view any dept
    })();
  }, [dept]);

  if (!dashboardUser) return null;
  return <DashboardView mode="dept" department={dept} />;
}
