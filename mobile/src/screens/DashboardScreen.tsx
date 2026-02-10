/**
 * Dashboard Screen
 *
 * Main dashboard showing compliance metrics, vendor stats,
 * risk overview, recent activity, and quick actions.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import {
  Card,
  StatCard,
  Badge,
  Loading,
  ErrorState,
  SectionHeader,
  ListItem,
  ProgressBar,
  RefreshableScroll,
  colors,
  spacing,
  fontSize,
  borderRadius,
} from '../components/shared';

interface DashboardStats {
  totalVendors: number;
  activeVendors: number;
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  frameworks: number;
  complianceScore: number;
  openIssues: number;
  pendingAssessments: number;
  recentActivity: {
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }[];
}

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();

  const {
    data: stats,
    loading,
    error,
    refreshing,
    onRefresh,
    refetch,
  } = useApi<DashboardStats>(
    () => api.dashboard.stats(),
    'dashboard-stats'
  );

  const {
    data: notifications,
  } = useApi<any[]>(
    () => api.notifications.list(),
    'notifications'
  );

  if (loading && !stats) return <Loading fullScreen message="Loading dashboard..." />;
  if (error && !stats) return <ErrorState message={error} onRetry={refetch} />;

  const dashStats = stats || {
    totalVendors: 0,
    activeVendors: 0,
    totalRisks: 0,
    criticalRisks: 0,
    highRisks: 0,
    frameworks: 0,
    complianceScore: 0,
    openIssues: 0,
    pendingAssessments: 0,
    recentActivity: [],
  };

  const complianceColor =
    dashStats.complianceScore >= 80
      ? colors.success
      : dashStats.complianceScore >= 60
      ? colors.warning
      : colors.danger;

  const unreadNotifications = (notifications || []).filter(
    (n: any) => !n.read
  ).length;

  return (
    <RefreshableScroll refreshing={refreshing} onRefresh={onRefresh}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Welcome back, {user?.firstName || 'User'}
          </Text>
          <Text style={styles.orgName}>
            {user?.organizationName || 'Your Organization'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationBadge}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadNotifications > 0 && (
            <View style={styles.notifCount}>
              <Text style={styles.notifCountText}>
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Compliance Score */}
      <Card style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Overall Compliance Score</Text>
          <Badge
            label={
              dashStats.complianceScore >= 80
                ? 'Good'
                : dashStats.complianceScore >= 60
                ? 'Needs Work'
                : 'At Risk'
            }
            variant={
              dashStats.complianceScore >= 80
                ? 'success'
                : dashStats.complianceScore >= 60
                ? 'warning'
                : 'danger'
            }
          />
        </View>
        <Text style={[styles.scoreValue, { color: complianceColor }]}>
          {dashStats.complianceScore}%
        </Text>
        <ProgressBar
          progress={dashStats.complianceScore}
          color={complianceColor}
          height={8}
        />
        <Text style={styles.scoreSubtext}>
          {dashStats.frameworks} framework{dashStats.frameworks !== 1 ? 's' : ''} active
        </Text>
      </Card>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard
          title="Vendors"
          value={dashStats.totalVendors}
          subtitle={`${dashStats.activeVendors} active`}
          color={colors.primary}
          onPress={() => navigation.navigate('Vendors')}
        />
        <StatCard
          title="Risks"
          value={dashStats.totalRisks}
          subtitle={`${dashStats.criticalRisks} critical`}
          color={dashStats.criticalRisks > 0 ? colors.danger : colors.success}
          onPress={() => navigation.navigate('Risks')}
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          title="Open Issues"
          value={dashStats.openIssues}
          subtitle="Requires attention"
          color={dashStats.openIssues > 0 ? colors.warning : colors.success}
          onPress={() => navigation.navigate('Issues')}
        />
        <StatCard
          title="Assessments"
          value={dashStats.pendingAssessments}
          subtitle="Pending review"
          color={colors.info}
        />
      </View>

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" />
      <View style={styles.quickActions}>
        {[
          { label: 'Add Vendor', icon: '🏢', screen: 'Vendors', action: 'add' },
          { label: 'Log Risk', icon: '⚠️', screen: 'Risks', action: 'add' },
          { label: 'View Frameworks', icon: '📋', screen: 'Frameworks' },
          { label: 'View Issues', icon: '🎫', screen: 'Issues' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.quickAction}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.quickActionIcon}>{item.icon}</Text>
            <Text style={styles.quickActionLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Risk Breakdown */}
      {dashStats.totalRisks > 0 && (
        <>
          <SectionHeader
            title="Risk Overview"
            action="View All"
            onAction={() => navigation.navigate('Risks')}
          />
          <Card>
            {[
              { label: 'Critical', count: dashStats.criticalRisks, color: colors.danger },
              { label: 'High', count: dashStats.highRisks, color: colors.warning },
              {
                label: 'Medium/Low',
                count: dashStats.totalRisks - dashStats.criticalRisks - dashStats.highRisks,
                color: colors.info,
              },
            ].map((risk) => (
              <View key={risk.label} style={styles.riskRow}>
                <View style={styles.riskLabelRow}>
                  <View style={[styles.riskDot, { backgroundColor: risk.color }]} />
                  <Text style={styles.riskLabel}>{risk.label}</Text>
                </View>
                <Text style={[styles.riskCount, { color: risk.color }]}>{risk.count}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Recent Activity */}
      {dashStats.recentActivity && dashStats.recentActivity.length > 0 && (
        <>
          <SectionHeader title="Recent Activity" />
          <Card padding={0}>
            {dashStats.recentActivity.slice(0, 5).map((activity, index) => (
              <ListItem
                key={activity.id || index}
                title={activity.message}
                subtitle={formatTimeAgo(activity.timestamp)}
                leftIcon={getActivityIcon(activity.type)}
              />
            ))}
          </Card>
        </>
      )}

      {/* Bottom spacer */}
      <View style={{ height: spacing.xxxl }} />
    </RefreshableScroll>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    vendor: '🏢',
    risk: '⚠️',
    framework: '📋',
    policy: '📄',
    issue: '🎫',
    assessment: '📊',
    user: '👤',
    monitor: '📡',
  };
  return icons[type] || '📌';
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  orgName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notificationBadge: {
    position: 'relative',
    padding: spacing.sm,
  },
  bellIcon: {
    fontSize: 24,
  },
  notifCount: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.danger,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifCountText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  scoreCard: {
    marginBottom: spacing.lg,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scoreTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  scoreSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  riskLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  riskLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  riskCount: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
