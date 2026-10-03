import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DashboardView } from '@/components/DashboardView';
import { useStore } from '@/store';
import { useTheme } from '@/hooks/useTheme';

export default function DrillingGroupDashboard() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const router = useRouter();
  const { colors } = useTheme();
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
      // A drilling supervisor can only see their own group
      if (!me.isSuper && me.subcategory && me.subcategory !== group) {
        router.replace(`/dashboard/drilling/${me.subcategory}`);
        return;
      }
      // If somehow a non-drilling admin lands here, send them back
      if (!me.isSuper && me.department !== 'drilling') {
        router.replace(me.department ? `/dashboard/${me.department}` : '/dashboard/login');
      }
    })();
  }, [group]);

  if (!dashboardUser) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <DashboardView mode="dept" department="drilling" group={group} />;
}
