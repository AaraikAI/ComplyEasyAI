import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssetListParams {
  status?: string;
  type?: string;
  criticality?: string;
  owner?: string;
  page?: string;
  limit?: string;
  search?: string;
}

export interface Asset {
  id: string;
  name: string;
  description: string;
  type: 'Hardware' | 'Software' | 'Data' | 'Network' | 'Cloud' | 'People' | 'Facility' | 'Other';
  status: 'Active' | 'Inactive' | 'Decommissioned' | 'Under Review';
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  owner: string;
  department: string;
  location: string;
  ipAddress: string;
  macAddress: string;
  serialNumber: string;
  vendor: string;
  purchaseDate: string;
  warrantyExpiry: string;
  lastAuditDate: string;
  nextAuditDate: string;
  complianceTags: string[];
  riskAssessments: string[];
  dataClassification: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
  createdAt: string;
  updatedAt: string;
}

export interface AssetStats {
  totalAssets: number;
  activeAssets: number;
  inactiveAssets: number;
  decommissionedAssets: number;
  byType: Record<string, number>;
  byCriticality: Record<string, number>;
  byDataClassification: Record<string, number>;
  overdueAudits: number;
  upcomingAudits: number;
}

export interface CreateAssetInput {
  name: string;
  description?: string;
  type: string;
  status?: string;
  criticality?: string;
  owner?: string;
  department?: string;
  location?: string;
  ipAddress?: string;
  macAddress?: string;
  serialNumber?: string;
  vendor?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  complianceTags?: string[];
  dataClassification?: string;
}

export interface UpdateAssetInput {
  name?: string;
  description?: string;
  type?: string;
  status?: string;
  criticality?: string;
  owner?: string;
  department?: string;
  location?: string;
  ipAddress?: string;
  macAddress?: string;
  serialNumber?: string;
  vendor?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  lastAuditDate?: string;
  nextAuditDate?: string;
  complianceTags?: string[];
  dataClassification?: string;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (params?: AssetListParams) => [...assetKeys.lists(), params] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  stats: () => [...assetKeys.all, 'stats'] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export const useAssets = (
  params?: AssetListParams,
  options?: Omit<UseQueryOptions<Asset[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Asset[], Error>({
    queryKey: assetKeys.list(params),
    queryFn: async () => {
      const result = await api.assets.list(params as any);
      if (Array.isArray(result)) return result;
      return (result as any)?.data ?? (result as any)?.assets ?? [];
    },
    ...options,
  });
};

export const useAsset = (
  id: string,
  options?: Omit<UseQueryOptions<Asset, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Asset, Error>({
    queryKey: assetKeys.detail(id),
    queryFn: async () => {
      const result = await api.assets.get(id);
      return (result as any)?.data ?? result;
    },
    enabled: !!id,
    ...options,
  });
};

export const useAssetStats = (
  options?: Omit<UseQueryOptions<AssetStats, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<AssetStats, Error>({
    queryKey: assetKeys.stats(),
    queryFn: async () => {
      const result = await api.assets.getStats();
      return (result as any)?.data ?? result;
    },
    staleTime: 2 * 60 * 1000, // stats refresh every 2 min
    ...options,
  });
};

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation<Asset, Error, CreateAssetInput>({
    mutationFn: async (data) => {
      const result = await api.assets.create(data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation<Asset, Error, { id: string; data: UpdateAssetInput }>({
    mutationFn: async ({ id, data }) => {
      const result = await api.assets.update(id, data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.assets.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
};
