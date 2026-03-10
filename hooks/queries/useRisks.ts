import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RiskListParams {
  status?: string;
  severity?: string;
  assignedTo?: string;
  page?: string;
  limit?: string;
  search?: string;
}

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  likelihood: number;
  impact: number;
  riskScore: number;
  status: 'Open' | 'Mitigated' | 'Accepted' | 'Transferred' | 'Closed';
  category: string;
  owner: string;
  mitigationPlan: string;
  residualRisk: number;
  reviewDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRiskInput {
  title: string;
  description?: string;
  severity: string;
  likelihood?: number;
  impact?: number;
  status?: string;
  category?: string;
  owner?: string;
  mitigationPlan?: string;
  reviewDate?: string;
}

export interface UpdateRiskInput {
  title?: string;
  description?: string;
  severity?: string;
  likelihood?: number;
  impact?: number;
  status?: string;
  category?: string;
  owner?: string;
  mitigationPlan?: string;
  residualRisk?: number;
  reviewDate?: string;
}

export interface RiskPrioritization {
  risks: Array<{
    id: string;
    title: string;
    priorityScore: number;
    recommendation: string;
  }>;
}

export interface RiskRemediation {
  riskId: string;
  recommendations: string[];
  estimatedEffort: string;
  suggestedControls: string[];
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const riskKeys = {
  all: ['risks'] as const,
  lists: () => [...riskKeys.all, 'list'] as const,
  list: (params?: RiskListParams) => [...riskKeys.lists(), params] as const,
  details: () => [...riskKeys.all, 'detail'] as const,
  detail: (id: string) => [...riskKeys.details(), id] as const,
  prioritization: () => [...riskKeys.all, 'prioritization'] as const,
  remediation: (id: string) => [...riskKeys.all, 'remediation', id] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export const useRisks = (
  params?: RiskListParams,
  options?: Omit<UseQueryOptions<RiskItem[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<RiskItem[], Error>({
    queryKey: riskKeys.list(params),
    queryFn: async () => {
      const result = await api.risks.list(params as any);
      return Array.isArray(result) ? result : (result as any)?.data ?? [];
    },
    ...options,
  });
};

export const useRisk = (
  id: string,
  options?: Omit<UseQueryOptions<RiskItem, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<RiskItem, Error>({
    queryKey: riskKeys.detail(id),
    queryFn: async () => {
      const result = await api.risks.getById(id);
      return (result as any)?.data ?? result;
    },
    enabled: !!id,
    ...options,
  });
};

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export const useCreateRisk = () => {
  const queryClient = useQueryClient();
  return useMutation<RiskItem, Error, CreateRiskInput>({
    mutationFn: async (data) => {
      const result = await api.risks.create(data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.lists() });
    },
  });
};

export const useUpdateRisk = () => {
  const queryClient = useQueryClient();
  return useMutation<RiskItem, Error, { id: string; data: UpdateRiskInput }>({
    mutationFn: async ({ id, data }) => {
      const result = await api.risks.update(id, data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: riskKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: riskKeys.lists() });
    },
  });
};

export const useDeleteRisk = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.risks.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.lists() });
    },
  });
};

export const usePrioritizeRisks = () => {
  const queryClient = useQueryClient();
  return useMutation<RiskPrioritization, Error, void>({
    mutationFn: async () => {
      const result = await api.risks.prioritize();
      return result as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.lists() });
    },
  });
};

export const useGenerateRemediation = () => {
  return useMutation<RiskRemediation, Error, string>({
    mutationFn: async (riskId) => {
      const result = await api.risks.generateRemediation(riskId);
      return result as any;
    },
  });
};

export const useScanRisks = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.risks.scan();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.lists() });
    },
  });
};
