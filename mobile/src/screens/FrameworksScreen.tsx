/**
 * Frameworks Screen
 *
 * Compliance framework listing with progress tracking,
 * control counts, and framework details.
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

interface Framework {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  status: string;
  controlCount: number;
  implementedControls: number;
  completionPercentage: number;
  lastUpdated: string;
  createdAt: string;
  templateId?: string;
  domains?: {
    name: string;
    controlCount: number;
    completedCount: number;
  }[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  active: 'success',
  draft: 'warning',
  archived: 'default',
  in_progress: 'info',
};

const frameworkIcons: Record<string, string> = {
  'SOC 2': '🔒',
  'ISO 27001': '🌐',
  'HIPAA': '🏥',
  'GDPR': '🇪🇺',
  'NIST': '🏛️',
  'PCI DSS': '💳',
  'SOX': '📊',
  'CCPA': '🔐',
  'FedRAMP': '🏢',
  'CMMC': '🛡️',
};

// ============================================================================
// SCREEN
// ============================================================================

export default function FrameworksScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);

  const {
    data: frameworks,
    loading,
    error,
    refreshing,
    onRefresh,
    refetch,
    hasMore,
    loadMore,
    loadingMore,
  } = usePaginatedApi<Framework>(
    (page, pageSize) =>
      api.frameworks.list({ page, pageSize, sortBy: 'name', sortOrder: 'asc' }),
    20
  );

  const filteredFrameworks = useMemo(() => {
    if (!search.trim()) return frameworks || [];
    const term = search.toLowerCase();
    return (frameworks || []).filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        f.category?.toLowerCase().includes(term) ||
        f.description?.toLowerCase().includes(term)
    );
  }, [frameworks, search]);

  // Detail View
  if (selectedFramework) {
    return (
      <FrameworkDetail
        framework={selectedFramework}
        onBack={() => setSelectedFramework(null)}
      />
    );
  }

  if (loading && !frameworks?.length) return <Loading fullScreen message="Loading frameworks..." />;
  if (error && !frameworks?.length) return <ErrorState message={error} onRetry={refetch} />;

  // Summary
  const totalControls = (frameworks || []).reduce((sum, f) => sum + (f.controlCount || 0), 0);
  const implementedControls = (frameworks || []).reduce((sum, f) => sum + (f.implementedControls || 0), 0);
  const avgCompletion =
    (frameworks || []).length > 0
      ? Math.round(
          (frameworks || []).reduce((sum, f) => sum + (f.completionPercentage || 0), 0) /
            (frameworks || []).length
        )
      : 0;

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>
            {(frameworks || []).length}
          </Text>
          <Text style={styles.summaryLabel}>Frameworks</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.secondary }]}>
            {totalControls}
          </Text>
          <Text style={styles.summaryLabel}>Controls</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text
            style={[
              styles.summaryValue,
              {
                color:
                  avgCompletion >= 80
                    ? colors.success
                    : avgCompletion >= 50
                    ? colors.warning
                    : colors.danger,
              },
            ]}
          >
            {avgCompletion}%
          </Text>
          <Text style={styles.summaryLabel}>Avg Progress</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search frameworks..."
        />
      </View>

      {/* Framework List */}
      <FlatList
        data={filteredFrameworks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FrameworkCard
            framework={item}
            onPress={() => setSelectedFramework(item)}
          />
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
            title="No frameworks found"
            description={
              search
                ? 'Try adjusting your search'
                : 'Add a compliance framework to get started'
            }
          />
        }
      />
    </View>
  );
}

// ============================================================================
// FRAMEWORK CARD
// ============================================================================

function FrameworkCard({
  framework,
  onPress,
}: {
  framework: Framework;
  onPress: () => void;
}) {
  const progressColor =
    framework.completionPercentage >= 80
      ? colors.success
      : framework.completionPercentage >= 50
      ? colors.warning
      : colors.danger;

  const icon = Object.entries(frameworkIcons).find(([key]) =>
    framework.name.toLowerCase().includes(key.toLowerCase())
  )?.[1] || '📋';

  return (
    <Card onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconTitle}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {framework.name}
            </Text>
            {framework.version && (
              <Text style={styles.cardVersion}>v{framework.version}</Text>
            )}
          </View>
        </View>
        <Badge
          label={framework.status || 'active'}
          variant={statusBadgeVariant[framework.status?.toLowerCase()] || 'default'}
        />
      </View>

      {framework.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {framework.description}
        </Text>
      )}

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Implementation Progress</Text>
          <Text style={[styles.progressPercent, { color: progressColor }]}>
            {framework.completionPercentage}%
          </Text>
        </View>
        <ProgressBar progress={framework.completionPercentage} color={progressColor} height={6} />
        <Text style={styles.controlsText}>
          {framework.implementedControls} / {framework.controlCount} controls implemented
        </Text>
      </View>

      {framework.category && (
        <View style={styles.cardFooter}>
          <Badge label={framework.category} variant="default" />
          <Text style={styles.lastUpdated}>
            Updated {new Date(framework.lastUpdated || framework.createdAt).toLocaleDateString()}
          </Text>
        </View>
      )}
    </Card>
  );
}

// ============================================================================
// FRAMEWORK DETAIL
// ============================================================================

function FrameworkDetail({
  framework,
  onBack,
}: {
  framework: Framework;
  onBack: () => void;
}) {
  const progressColor =
    framework.completionPercentage >= 80
      ? colors.success
      : framework.completionPercentage >= 50
      ? colors.warning
      : colors.danger;

  const icon = Object.entries(frameworkIcons).find(([key]) =>
    framework.name.toLowerCase().includes(key.toLowerCase())
  )?.[1] || '📋';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to Frameworks</Text>
      </TouchableOpacity>

      <FlatList
        data={[framework]}
        keyExtractor={(item) => item.id}
        renderItem={() => (
          <View style={styles.detailContainer}>
            {/* Header */}
            <View style={styles.detailHeaderRow}>
              <Text style={styles.detailIcon}>{icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>{framework.name}</Text>
                {framework.version && (
                  <Text style={styles.detailVersion}>Version {framework.version}</Text>
                )}
              </View>
            </View>

            <View style={styles.detailBadges}>
              <Badge
                label={framework.status || 'active'}
                variant={statusBadgeVariant[framework.status?.toLowerCase()] || 'default'}
                size="md"
              />
              {framework.category && (
                <Badge label={framework.category} variant="default" size="md" />
              )}
            </View>

            {/* Description */}
            {framework.description && (
              <Card>
                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{framework.description}</Text>
              </Card>
            )}

            {/* Overall Progress */}
            <Card>
              <Text style={styles.sectionLabel}>Implementation Progress</Text>
              <Text style={[styles.progressDisplay, { color: progressColor }]}>
                {framework.completionPercentage}%
              </Text>
              <ProgressBar
                progress={framework.completionPercentage}
                color={progressColor}
                height={8}
              />
              <Text style={styles.controlsSummary}>
                {framework.implementedControls} of {framework.controlCount} controls implemented
              </Text>
            </Card>

            {/* Domains */}
            {framework.domains && framework.domains.length > 0 && (
              <Card>
                <Text style={styles.sectionLabel}>
                  Control Domains ({framework.domains.length})
                </Text>
                {framework.domains.map((domain, index) => {
                  const domainProgress =
                    domain.controlCount > 0
                      ? Math.round((domain.completedCount / domain.controlCount) * 100)
                      : 0;
                  const domainColor =
                    domainProgress >= 80
                      ? colors.success
                      : domainProgress >= 50
                      ? colors.warning
                      : colors.danger;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.domainRow,
                        index < framework.domains!.length - 1 && styles.domainRowBorder,
                      ]}
                    >
                      <View style={styles.domainHeader}>
                        <Text style={styles.domainName}>{domain.name}</Text>
                        <Text style={[styles.domainPercent, { color: domainColor }]}>
                          {domainProgress}%
                        </Text>
                      </View>
                      <ProgressBar progress={domainProgress} color={domainColor} />
                      <Text style={styles.domainControls}>
                        {domain.completedCount}/{domain.controlCount} controls
                      </Text>
                    </View>
                  );
                })}
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <Text style={styles.sectionLabel}>Details</Text>
              <DetailRow label="Total Controls" value={String(framework.controlCount)} />
              <DetailRow
                label="Implemented"
                value={String(framework.implementedControls)}
              />
              <DetailRow
                label="Created"
                value={new Date(framework.createdAt).toLocaleDateString()}
              />
              {framework.lastUpdated && (
                <DetailRow
                  label="Last Updated"
                  value={new Date(framework.lastUpdated).toLocaleDateString()}
                />
              )}
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  // Card
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  cardIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardVersion: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  progressSection: {
    marginBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  progressPercent: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  controlsText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  lastUpdated: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
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
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailIcon: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  detailTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailVersion: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  progressDisplay: {
    fontSize: 42,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  controlsSummary: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  domainRow: {
    paddingVertical: spacing.md,
  },
  domainRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  domainName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  domainPercent: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  domainControls: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
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
});
