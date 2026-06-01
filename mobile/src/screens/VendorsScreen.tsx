/**
 * Vendors Screen
 *
 * Vendor management with list view, search, filtering by risk level,
 * vendor details, and CRUD operations.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { usePaginatedApi, useMutation } from '../hooks/useApi';
import { api } from '../services/api';
import {
  Card,
  Badge,
  SearchBar,
  FilterChips,
  Loading,
  ErrorState,
  EmptyState,
  ListItem,
  Button,
  ProgressBar,
  colors,
  spacing,
  fontSize,
  borderRadius,
} from '../components/shared';

// ============================================================================
// TYPES
// ============================================================================

interface Vendor {
  id: string;
  name: string;
  category: string;
  riskLevel: string;
  status: string;
  complianceScore: number;
  lastAssessment?: string;
  contactEmail?: string;
  description?: string;
  dataProcessed?: string[];
  certifications?: string[];
  createdAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const riskFilters = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const riskBadgeVariant: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'default'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'success',
};

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  pending: 'warning',
  inactive: 'default',
  suspended: 'danger',
};

// ============================================================================
// SCREEN
// ============================================================================

export default function VendorsScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const {
    data: vendors,
    loading,
    error,
    refreshing,
    onRefresh,
    refetch,
    hasMore,
    loadMore,
    loadingMore,
  } = usePaginatedApi<Vendor>(
    (page, pageSize) =>
      api.vendors.list({ page, pageSize, sortBy: 'name', sortOrder: 'asc' }),
    20
  );

  const { mutate: deleteVendor, loading: deleting } = useMutation(
    (id: string) => api.vendors.delete(id) as any
  );

  const { mutate: createVendor } = useMutation(
    (data: { name: string }) => api.vendors.create(data)
  );

  const handleAddVendor = useCallback(() => {
    const submit = async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        Alert.alert('Name Required', 'Please enter a vendor name.');
        return;
      }
      try {
        await createVendor({ name: trimmed });
        refetch();
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to add vendor');
      }
    };

    // Collect the vendor name inline where Alert.prompt is available (iOS);
    // `name` is the only required field for vendor creation.
    if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
      Alert.prompt(
        'Add Vendor',
        'Enter the vendor name to create. You can add more details afterwards.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create', onPress: (value?: string) => submit(value || '') },
        ],
        'plain-text'
      );
      return;
    }

    Alert.alert(
      'Add Vendor',
      'Vendor creation from this view is available on iOS. Use the web app to add vendors with full details.',
      [{ text: 'OK' }]
    );
  }, [createVendor, refetch]);

  // Client-side filtering on loaded data
  const filteredVendors = useMemo(() => {
    let result = vendors || [];

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(term) ||
          v.category?.toLowerCase().includes(term) ||
          v.contactEmail?.toLowerCase().includes(term)
      );
    }

    if (riskFilter !== 'all') {
      result = result.filter(
        (v) => v.riskLevel?.toLowerCase() === riskFilter
      );
    }

    return result;
  }, [vendors, search, riskFilter]);

  const handleDelete = useCallback(
    (vendor: Vendor) => {
      Alert.alert(
        'Delete Vendor',
        `Are you sure you want to delete "${vendor.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteVendor(vendor.id);
                refetch();
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to delete vendor');
              }
            },
          },
        ]
      );
    },
    [deleteVendor, refetch]
  );

  // Detail View
  if (selectedVendor) {
    return (
      <VendorDetail
        vendor={selectedVendor}
        onBack={() => setSelectedVendor(null)}
        onDelete={() => {
          handleDelete(selectedVendor);
          setSelectedVendor(null);
        }}
      />
    );
  }

  if (loading && !vendors?.length) return <Loading fullScreen message="Loading vendors..." />;
  if (error && !vendors?.length) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <View style={styles.container}>
      {/* Search & Filters */}
      <View style={styles.filtersContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search vendors..."
        />
        <FilterChips
          options={riskFilters}
          selected={riskFilter}
          onSelect={setRiskFilter}
        />
      </View>

      {/* Vendor List */}
      <FlatList
        data={filteredVendors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VendorCard
            vendor={item}
            onPress={() => setSelectedVendor(item)}
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
        ListFooterComponent={
          loadingMore ? (
            <Loading message="Loading more..." />
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title="No vendors found"
            description={
              search || riskFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first vendor to get started'
            }
            actionLabel={!search && riskFilter === 'all' ? 'Add Vendor' : undefined}
            onAction={handleAddVendor}
          />
        }
      />
    </View>
  );
}

// ============================================================================
// VENDOR CARD
// ============================================================================

function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  const scoreColor =
    vendor.complianceScore >= 80
      ? colors.success
      : vendor.complianceScore >= 60
      ? colors.warning
      : colors.danger;

  return (
    <Card onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {vendor.name}
          </Text>
          <Badge
            label={vendor.riskLevel || 'Unknown'}
            variant={riskBadgeVariant[vendor.riskLevel?.toLowerCase()] || 'default'}
          />
        </View>
        {vendor.category && (
          <Text style={styles.cardCategory}>{vendor.category}</Text>
        )}
      </View>

      <View style={styles.cardMetrics}>
        <View style={styles.cardMetric}>
          <Text style={styles.metricLabel}>Compliance</Text>
          <Text style={[styles.metricValue, { color: scoreColor }]}>
            {vendor.complianceScore}%
          </Text>
          <ProgressBar progress={vendor.complianceScore} color={scoreColor} />
        </View>
        <View style={styles.cardMetricRight}>
          <Text style={styles.metricLabel}>Status</Text>
          <Badge
            label={vendor.status || 'active'}
            variant={statusBadgeVariant[vendor.status?.toLowerCase()] || 'default'}
            size="md"
          />
        </View>
      </View>

      {vendor.lastAssessment && (
        <Text style={styles.cardFooter}>
          Last assessed: {new Date(vendor.lastAssessment).toLocaleDateString()}
        </Text>
      )}
    </Card>
  );
}

// ============================================================================
// VENDOR DETAIL
// ============================================================================

function VendorDetail({
  vendor,
  onBack,
  onDelete,
}: {
  vendor: Vendor;
  onBack: () => void;
  onDelete: () => void;
}) {
  const scoreColor =
    vendor.complianceScore >= 80
      ? colors.success
      : vendor.complianceScore >= 60
      ? colors.warning
      : colors.danger;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to Vendors</Text>
      </TouchableOpacity>

      <FlatList
        data={[vendor]}
        keyExtractor={(item) => item.id}
        renderItem={() => (
          <View style={styles.detailContainer}>
            {/* Header */}
            <View style={styles.detailHeader}>
              <Text style={styles.detailName}>{vendor.name}</Text>
              <View style={styles.detailBadges}>
                <Badge
                  label={vendor.riskLevel || 'Unknown'}
                  variant={riskBadgeVariant[vendor.riskLevel?.toLowerCase()] || 'default'}
                  size="md"
                />
                <Badge
                  label={vendor.status || 'active'}
                  variant={statusBadgeVariant[vendor.status?.toLowerCase()] || 'default'}
                  size="md"
                />
              </View>
            </View>

            {/* Compliance Score */}
            <Card>
              <Text style={styles.sectionLabel}>Compliance Score</Text>
              <Text style={[styles.scoreDisplay, { color: scoreColor }]}>
                {vendor.complianceScore}%
              </Text>
              <ProgressBar
                progress={vendor.complianceScore}
                color={scoreColor}
                height={8}
                showLabel
              />
            </Card>

            {/* Details */}
            <Card>
              <Text style={styles.sectionLabel}>Details</Text>
              {vendor.category && (
                <DetailRow label="Category" value={vendor.category} />
              )}
              {vendor.contactEmail && (
                <DetailRow label="Contact" value={vendor.contactEmail} />
              )}
              {vendor.description && (
                <DetailRow label="Description" value={vendor.description} />
              )}
              <DetailRow
                label="Added"
                value={new Date(vendor.createdAt).toLocaleDateString()}
              />
              {vendor.lastAssessment && (
                <DetailRow
                  label="Last Assessment"
                  value={new Date(vendor.lastAssessment).toLocaleDateString()}
                />
              )}
            </Card>

            {/* Data Processed */}
            {vendor.dataProcessed && vendor.dataProcessed.length > 0 && (
              <Card>
                <Text style={styles.sectionLabel}>Data Processed</Text>
                <View style={styles.tagContainer}>
                  {vendor.dataProcessed.map((data, i) => (
                    <Badge key={i} label={data} variant="info" size="md" />
                  ))}
                </View>
              </Card>
            )}

            {/* Certifications */}
            {vendor.certifications && vendor.certifications.length > 0 && (
              <Card>
                <Text style={styles.sectionLabel}>Certifications</Text>
                <View style={styles.tagContainer}>
                  {vendor.certifications.map((cert, i) => (
                    <Badge key={i} label={cert} variant="success" size="md" />
                  ))}
                </View>
              </Card>
            )}

            {/* Actions */}
            <View style={styles.detailActions}>
              <Button
                label="Delete Vendor"
                onPress={onDelete}
                variant="danger"
                fullWidth
              />
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: spacing.lg }}
      />
    </View>
  );
}

// ============================================================================
// DETAIL ROW
// ============================================================================

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
    marginBottom: spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardCategory: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardMetric: {
    flex: 1,
    marginRight: spacing.lg,
  },
  cardMetricRight: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  cardFooter: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.md,
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
  detailHeader: {
    marginBottom: spacing.md,
  },
  detailName: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  detailBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  scoreDisplay: {
    fontSize: 42,
    fontWeight: '700',
    marginBottom: spacing.sm,
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
    flex: 2,
    textAlign: 'right',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailActions: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxxl,
  },
});
