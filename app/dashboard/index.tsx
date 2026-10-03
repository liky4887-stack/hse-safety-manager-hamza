import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store';
import { useTheme } from '@/hooks/useTheme';

// This screen decides where to send the user:
// - No session → /dashboard/login
// - Super admin → /dashboard/main
// - Dept admin → /dashboard/[dept]
export default function DashboardIndex() {
  const { colors } = useTheme();
  const router = useRouter();
  const dashboardUser = useStore((s) => s.dashboardUser);
  const verifyDashboardSession = useStore((s) => s.verifyDashboardSession);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Re-verify token (session might have expired while app was closed)
      await verifyDashboardSession();
      if (cancelled) return;

      const me = useStore.getState().dashboardUser;

      if (!me) {
        router.replace('/dashboard/login');
      } else if (me.isSuper) {
        router.replace('/dashboard/main');
      } else if (me.department === 'drilling' && me.subcategory) {
        // Drilling supervisor → dedicated group dashboard
        router.replace(`/dashboard/drilling/${me.subcategory}`);
      } else if (me.department) {
        router.replace(`/dashboard/${me.department}`);
      } else {
        // Malformed session
        router.replace('/dashboard/login');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
