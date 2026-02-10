/**
 * Issues Screen
 *
 * Issue tracking with list view, filtering by priority/status,
 * issue details, and commenting functionality.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
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
  Button,
  colors,
  spacing,
  fontSize,
  borderRadius,
} from '../components/shared';

// ============================================================================
// TYPES
// ============================================================================

interface Issue {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  assignee?: string;
  reporter?: string;
  dueDate?: string;
  frameworkId?: string;
  frameworkName?: string;
  vendorId?: string;
  vendorName?: string;
  tags?: string[];
  comments?: {
    id: string;
    content: string;
    author: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const priorityFilters = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const priorityBadgeVariant: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'default'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'success',
};

const statusBadgeVariant: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'default' | 'secondary'> = {
  open: 'danger',
  in_progress: 'warning',
  in_review: 'info',
  resolved: 'success',
  closed: 'default',
  blocked: 'danger',
};

// ============================================================================
// SCREEN
// ============================================================================

export default function IssuesScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const {
    data: issues,
    loading,
    error,
    refreshing,
    onRefresh,
    refetch,
    hasMore,
    loadMore,
    loadingMore,
  } = usePaginatedApi<Issue>(
    (page, pageSize) =>
      api.issues.list({ page, pageSize, sortBy: 'priority', sortOrder: 'desc' }),
    20
  );

  const filteredIssues = useMemo(() => {
    let result = issues || [];

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(term) ||
          i.description?.toLowerCase().includes(term) ||
          i.category?.toLowerCase().includes(term) ||
          i.assignee?.toLowerCase().includes(term)
      );
    }

    if (priorityFilter !== 'all') {
      result = result.filter(
        (i) => i.priority?.toLowerCase() === priorityFilter
      );
    }

    return result;
  }, [issues, search, priorityFilter]);

  // Detail View
  if (selectedIssue) {
    return (
      <IssueDetail
        issue={selectedIssue}
        onBack={() => {
          setSelectedIssue(null);
          refetch();
        }}
      />
    );
  }

  if (loading && !issues?.length) return <Loading fullScreen message="Loading issues..." />;
  if (error && !issues?.length) return <ErrorState message={error} onRetry={refetch} />;

  const openCount = (issues || []).filter((i) =>
    ['open', 'in_progress', 'blocked'].includes(i.status?.toLowerCase())
  ).length;
  const criticalCount = (issues || []).filter(
    (i) => i.priority?.toLowerCase() === 'critical'
  ).length;

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>
            {(issues || []).length}
          </Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>{openCount}</Text>
          <Text style={styles.summaryLabel}>Open</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>{criticalCount}</Text>
          <Text style={styles.summaryLabel}>Critical</Text>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={styles.filtersContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search issues..."
        />
        <FilterChips
          options={priorityFilters}
          selected={priorityFilter}
          onSelect={setPriorityFilter}
        />
      </View>

      {/* Issue List */}
      <FlatList
        data={filteredIssues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <IssueCard issue={item} onPress={() => setSelectedIssue(item)} />
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
            title="No issues found"
            description={
              search || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No issues have been reported yet'
            }
          />
        }
      />
    </View>
  );
}

// ============================================================================
// ISSUE CARD
// ============================================================================

function IssueCard({ issue, onPress }: { issue: Issue; onPress: () => void }) {
  const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date();

  return (
    <Card onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {issue.title}
        </Text>
        <View style={styles.cardBadges}>
          <Badge
            label={issue.priority || 'medium'}
            variant={priorityBadgeVariant[issue.priority?.toLowerCase()] || 'default'}
          />
          <Badge
            label={issue.status?.replace('_', ' ') || 'open'}
            variant={statusBadgeVariant[issue.status?.toLowerCase()] || 'default'}
          />
        </View>
      </View>

      {issue.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {issue.description}
        </Text>
      )}

      <View style={styles.cardMeta}>
        {issue.category && (
          <Badge label={issue.category} variant="default" />
        )}
        {issue.assignee && (
          <Text style={styles.assignee}>
            Assigned: {issue.assignee}
          </Text>
        )}
      </View>

      <View style={styles.cardFooter}>
        {issue.dueDate && (
          <Text
            style={[
              styles.dueDate,
              isOverdue && { color: colors.danger },
            ]}
          >
            Due: {new Date(issue.dueDate).toLocaleDateString()}
            {isOverdue && ' (overdue)'}
          </Text>
        )}
        {issue.comments && issue.comments.length > 0 && (
          <Text style={styles.commentCount}>
            {issue.comments.length} comment{issue.comments.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </Card>
  );
}

// ============================================================================
// ISSUE DETAIL
// ============================================================================

function IssueDetail({ issue, onBack }: { issue: Issue; onBack: () => void }) {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(issue.comments || []);

  const { mutate: addComment, loading: submitting } = useMutation(
    (content: string) => api.issues.addComment(issue.id, content)
  );

  const handleAddComment = useCallback(async () => {
    if (!comment.trim()) return;

    try {
      const result = await addComment(comment.trim());
      setComments((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: comment.trim(),
          author: 'You',
          createdAt: new Date().toISOString(),
        },
      ]);
      setComment('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add comment');
    }
  }, [comment, addComment]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to Issues</Text>
      </TouchableOpacity>

      <FlatList
        data={[issue]}
        keyExtractor={(item) => item.id}
        renderItem={() => (
          <View style={styles.detailContainer}>
            <Text style={styles.detailTitle}>{issue.title}</Text>
            <View style={styles.detailBadges}>
              <Badge
                label={issue.priority || 'medium'}
                variant={priorityBadgeVariant[issue.priority?.toLowerCase()] || 'default'}
                size="md"
              />
              <Badge
                label={issue.status?.replace('_', ' ') || 'open'}
                variant={statusBadgeVariant[issue.status?.toLowerCase()] || 'default'}
                size="md"
              />
              {issue.category && (
                <Badge label={issue.category} variant="default" size="md" />
              )}
            </View>

            {/* Description */}
            {issue.description && (
              <Card>
                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{issue.description}</Text>
              </Card>
            )}

            {/* Details */}
            <Card>
              <Text style={styles.sectionLabel}>Details</Text>
              {issue.assignee && <DetailRow label="Assignee" value={issue.assignee} />}
              {issue.reporter && <DetailRow label="Reporter" value={issue.reporter} />}
              {issue.dueDate && (
                <DetailRow
                  label="Due Date"
                  value={new Date(issue.dueDate).toLocaleDateString()}
                />
              )}
              {issue.frameworkName && (
                <DetailRow label="Framework" value={issue.frameworkName} />
              )}
              {issue.vendorName && (
                <DetailRow label="Vendor" value={issue.vendorName} />
              )}
              <DetailRow
                label="Created"
                value={new Date(issue.createdAt).toLocaleDateString()}
              />
              <DetailRow
                label="Updated"
                value={new Date(issue.updatedAt).toLocaleDateString()}
              />
            </Card>

            {/* Tags */}
            {issue.tags && issue.tags.length > 0 && (
              <Card>
                <Text style={styles.sectionLabel}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {issue.tags.map((tag, i) => (
                    <Badge key={i} label={tag} variant="secondary" size="md" />
                  ))}
                </View>
              </Card>
            )}

            {/* Comments */}
            <Card>
              <Text style={styles.sectionLabel}>
                Comments ({comments.length})
              </Text>

              {comments.length === 0 && (
                <Text style={styles.noComments}>No comments yet</Text>
              )}

              {comments.map((c, index) => (
                <View
                  key={c.id || index}
                  style={[
                    styles.commentItem,
                    index < comments.length - 1 && styles.commentBorder,
                  ]}
                >
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{c.author}</Text>
                    <Text style={styles.commentDate}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{c.content}</Text>
                </View>
              ))}

              {/* Add Comment */}
              <View style={styles.addCommentSection}>
                <TextInput
                  style={styles.commentInput}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.gray400}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <Button
                  label="Add Comment"
                  onPress={handleAddComment}
                  disabled={!comment.trim() || submitting}
                  loading={submitting}
                  size="sm"
                  style={styles.commentButton}
                />
              </View>
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
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  assignee: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  dueDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  commentCount: {
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
  detailTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  detailBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  noComments: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  commentItem: {
    paddingVertical: spacing.md,
  },
  commentBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  commentAuthor: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  commentDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  commentContent: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  addCommentSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentInput: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    minHeight: 80,
    marginBottom: spacing.md,
  },
  commentButton: {
    alignSelf: 'flex-end',
  },
});
