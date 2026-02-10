/**
 * Risks Screen
 *
 * Risk management with list, search, filtering by severity,
 * risk details, and mitigation tracking.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { usePaginatedApi } from '../hooks/useApi';
import { api } from '../services/api';
import {
  Card,
  Badge,
  SearchBar,
  FilterChips,
  Loading,
  ErrorState,
  EmptyState,
  ProgressBar,
  colors,
  spacing,
  fontSize,
  borderRadius,
} from '../components/shared';

// ============================================================================
// TYPES
// ============================================================================

interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  likelihood: string;
  impact: string;
  status: string;
  owner?: string;
  mitigationPlan?: string;
  mitigationProgress: number;
  vendorId?: string;
  vendorName?: string;
  frameworkId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const severityFilters = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const severityBadgeVariant: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'default'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'success',
};

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  open: 'danger',
  in_progress: 'warning',
  mitigated: 'success',
  accepted: 'info',
  closed: 'default',
};

// ============================================================================
// SCREEN
// ============================================================================

export default function RisksScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  const {
    data: risks,
    loading,
    error,
    refreshing,
    onRefresh,
    refetch,
    hasMore,
    loadMore,
    loadingMore,
  } = usePaginatedApi<Risk>(
    (page, pageSize) =>
      api.risks.list({ page, pageSize, sortBy: 'severity', sortOrder: 'desc' }),
    20
  );

  const filteredRisks = useMemo(() => {
    let result = risks || [];

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          r.description?.toLowerCase().includes(term) ||
          r.category?.toLowerCase().includes(term) ||
          r.vendorName?.toLowerCase().includes(term)
      );
    }

    if (severityFilter !== 'all') {
      result = result.filter(
        (r) => r.severity?.toLowerCase() === severityFilter
      );
    }

    return result;
  }, [risks, search, severityFilter]);

  // Detail View
  if (selectedRisk) {
    return (
      <RiskDetail
        risk={selectedRisk}
        onBack={() => setSelectedRisk(null)}
      />
    );
  }

  if (loading && !risks?.length) return <Loading fullScreen message="Loading risks..." />;
  if (error && !risks?.length) return <ErrorState message={error} onRetry={refetch} />;

  // Summary stats
  const criticalCount = (risks || []).filter((r) => r.severity?.toLowerCase() === 'critical').length;
  const highCount = (risks || []).filter((r) => r.severity?.toLowerCase() === 'high').length;
  const openCount = (risks || []).filter((r) => r.status?.toLowerCase() === 'open').length;

  return (
    <View style={styles.container}>
      {/* Summary Banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>{criticalCount}</Text>
          <Text style={styles.summaryLabel}>Critical</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>{highCount}</Text>
          <Text style={styles.summaryLabel}>High</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.info }]}>{openCount}</Text>
          <Text style={styles.summaryLabel}>Open</Text>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={styles.filtersContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search risks..."
        />
        <FilterChips
          options={severityFilters}
          selected={severityFilter}
          onSelect={setSeverityFilter}
        />
      </View>

      {/* Risk List */}
      <FlatList
        data={filteredRisks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RiskCard risk={item} onPress={() => setSelectedRisk(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <Loading message="Loading more..." /> : null}
        ListEmptyComponent={
          <EmptyState
            title="No risks found"
            description={
              search || severityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No risks have been identified yet'
            }
          />
        }
      />
    </View>
  );
}

// ============================================================================
// RISK CARD
// ============================================================================

function RiskCard({ risk, onPress }: { risk: Risk; onPress: () => void }) {
  const mitigationColor =
    risk.mitigationProgress >= 80
      ? colors.success
      : risk.mitigationProgress >= 40
      ? colors.warning
      : colors.danger;

  return (
    <Card onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {risk.title}
        </Text>
        <View style={styles.cardBadges}>
          <Badge
            label={risk.severity || 'Unknown'}
            variant={severityBadgeVariant[risk.severity?.toLowerCase()] || 'default'}
          />
          <Badge
            label={risk.status?.replace('_', ' ') || 'open'}
            variant={statusBadgeVariant[risk.status?.toLowerCase()] || 'default'}
          />
        </View>
      </View>

      {risk.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {risk.description}
        </Text>
      )}

      <View style={styles.cardMetrics}>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>Category</Text>
          <Text style={styles.metricText}>{risk.category || 'General'}</Text>
        </View>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>Likelihood</Text>
          <Text style={styles.metricText}>{risk.likelihood || 'N/A'}</Text>
        </View>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>Impact</Text>
          <Text style={styles.metricText}>{risk.impact || 'N/A'}</Text>
        </View>
      </View>

      {risk.mitigationProgress > 0 && (
        <View style={styles.mitigationRow}>
          <Text style={styles.mitigationLabel}>Mitigation</Text>
          <View style={styles.mitigationBar}>
            <ProgressBar progress={risk.mitigationProgress} color={mitigationColor} />
          </View>
          <Text style={[styles.mitigationPercent, { color: mitigationColor }]}>
            {risk.mitigationProgress}%
          </Text>
        </View>
      )}

      {risk.vendorName && (
        <Text style={styles.cardFooter}>Vendor: {risk.vendorName}</Text>
      )}
    </Card>
  );
}

// ============================================================================
// RISK DETAIL
// ============================================================================

function RiskDetail({ risk, onBack }: { risk: Risk; onBack: () => void }) {
  const mitigationColor =
    risk.mitigationProgress >= 80
      ? colors.success
      : risk.mitigationProgress >= 40
      ? colors.warning
      : colors.danger;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to Risks</Text>
      </TouchableOpacity>

      <FlatList
        data={[risk]}
        keyExtractor={(item) => item.id}
        renderItem={() => (
          <View style={styles.detailContainer}>
            <Text style={styles.detailTitle}>{risk.title}</Text>
            <View style={styles.detailBadges}>
              <Badge
                label={risk.severity || 'Unknown'}
                variant={severityBadgeVariant[risk.severity?.toLowerCase()] || 'default'}
                size="md"
              />
              <Badge
                label={risk.status?.replace('_', ' ') || 'open'}
                variant={statusBadgeVariant[risk.status?.toLowerCase()] || 'default'}
                size="md"
              />
            </View>

            {risk.description && (
              <Card>
                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{risk.description}</Text>
              </Card>
            )}

            <Card>
              <Text style={styles.sectionLabel}>Risk Assessment</Text>
              <DetailRow label="Category" value={risk.category || 'General'} />
              <DetailRow label="Severity" value={risk.severity || 'N/A'} />
              <DetailRow label="Likelihood" value={risk.likelihood || 'N/A'} />
              <DetailRow label="Impact" value={risk.impact || 'N/A'} />
              {risk.owner && <DetailRow label="Owner" value={risk.owner} />}
              {risk.dueDate && (
                <DetailRow
                  label="Due Date"
                  value={new Date(risk.dueDate).toLocaleDateString()}
                />
              )}
            </Card>

            <Card>
              <Text style={styles.sectionLabel}>Mitigation Progress</Text>
              <Text style={[styles.mitigationScoreDisplay, { color: mitigationColor }]}>
                {risk.mitigationProgress}%
              </Text>
              <ProgressBar
                progress={risk.mitigationProgress}
                color={mitigationColor}
                height={8}
              />
              {risk.mitigationPlan && (
                <View style={styles.mitigationPlanSection}>
                  <Text style={styles.mitigationPlanLabel}>Plan</Text>
                  <Text style={styles.mitigationPlanText}>{risk.mitigationPlan}</Text>
                </View>
              )}
            </Card>

            {risk.vendorName && (
              <Card>
                <Text style={styles.sectionLabel}>Associated Vendor</Text>
                <Text style={styles.vendorNameText}>{risk.vendorName}</Text>
              </Card>
            )}

            <Card>
              <Text style={styles.sectionLabel}>Timeline</Text>
              <DetailRow
                label="Created"
                value={new Date(risk.createdAt).toLocaleDateString()}
              />
              <DetailRow
                label="Last Updated"
                value={new Date(risk.updatedAt).toLocaleDateString()}
              />
            </Card>
          </View>
        )}
        contentContainerStyle={{ padding: spacing.lg }}
      />
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  // Card
  cardHeader: {
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  mitigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  mitigationLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    width: 70,
  },
  mitigationBar: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  mitigationPercent: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },
  cardFooter: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  // Detail
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  detailContainer: {
    gap: spacing.md,
  },
  detailTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  detailBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  mitigationScoreDisplay: {
    fontSize: 42,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  mitigationPlanSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mitigationPlanLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  mitigationPlanText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  vendorNameText: {
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: '500',
  },
});
