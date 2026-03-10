import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExecutiveDashboardData {
  overallCompliance: number;
  riskScore: number;
  openIncidents: number;
  pendingAudits: number;
  frameworkProgress: Array<{
    id: string;
    name: string;
    progress: number;
    status: string;
    totalControls: number;
    implementedControls: number;
  }>;
  riskDistribution: Record<string, number>;
  incidentTrend: Array<{ period: string; count: number }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    framework: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
    details: string;
  }>;
  complianceScore: number;
  vendorRiskSummary: {
    totalVendors: number;
    highRisk: number;
    avgScore: number;
  };
}

export interface RAGStatus {
  overall: 'Red' | 'Amber' | 'Green';
  categories: Array<{
    name: string;
    status: 'Red' | 'Amber' | 'Green';
    score: number;
    issues: number;
    details: string;
  }>;
  lastUpdated: string;
}

export interface BoardPack {
  generatedAt: string;
  executiveSummary: string;
  complianceOverview: {
    overallScore: number;
    frameworks: Array<{
      name: string;
      score: number;
      change: number;
    }>;
  };
  riskOverview: {
    totalRisks: number;
    criticalRisks: number;
    mitigatedRisks: number;
    newRisks: number;
  };
  incidentSummary: {
    totalIncidents: number;
    openIncidents: number;
    avgResolutionTime: number;
    bySeverity: Record<string, number>;
  };
  vendorSummary: {
    totalVendors: number;
    highRiskVendors: number;
    expiringContracts: number;
  };
  recommendations: string[];
  keyMetrics: Array<{
    name: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
    target: number;
  }>;
}

export interface TrendsData {
  compliance: Array<{ period: string; score: number }>;
  risk: Array<{ period: string; score: number }>;
  incidents: Array<{ period: string; count: number }>;
  controls: Array<{ period: string; implemented: number; total: number }>;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const dashboardKeys = {
  all: ['dashboard'] as const,
  executive: () => [...dashboardKeys.all, 'executive'] as const,
  ragStatus: () => [...dashboardKeys.all, 'rag-status'] as const,
  boardPack: () => [...dashboardKeys.all, 'board-pack'] as const,
  trends: () => [...dashboardKeys.all, 'trends'] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export const useExecutiveDashboard = (
  options?: Omit<UseQueryOptions<ExecutiveDashboardData, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ExecutiveDashboardData, Error>({
    queryKey: dashboardKeys.executive(),
    queryFn: async () => {
      const result = await api.executive.getDashboard();
      return (result as any)?.data ?? result;
    },
    refetchInterval: 60 * 1000, // auto-refresh every 1 minute
    staleTime: 30 * 1000, // 30 seconds stale time for real-time feel
    ...options,
  });
};

export const useRAGStatus = (
  options?: Omit<UseQueryOptions<RAGStatus, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<RAGStatus, Error>({
    queryKey: dashboardKeys.ragStatus(),
    queryFn: async () => {
      const result = await api.executive.getRAGStatus();
      return (result as any)?.data ?? result;
    },
    refetchInterval: 60 * 1000, // auto-refresh every 1 minute
    staleTime: 30 * 1000,
    ...options,
  });
};

export const useTrends = (
  options?: Omit<UseQueryOptions<TrendsData, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TrendsData, Error>({
    queryKey: dashboardKeys.trends(),
    queryFn: async () => {
      const result = await api.executive.getTrends();
      return (result as any)?.data ?? result;
    },
    staleTime: 5 * 60 * 1000, // trends are less time-sensitive
    ...options,
  });
};

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export const useGenerateBoardPack = () => {
  return useMutation<BoardPack, Error, void>({
    mutationFn: async () => {
      const result = await api.executive.generateBoardPack();
      return (result as any)?.data ?? result;
    },
  });
};
