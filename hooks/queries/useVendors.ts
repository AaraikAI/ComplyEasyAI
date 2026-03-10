import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VendorListParams {
  status?: string;
  riskLevel?: string;
  category?: string;
  page?: string;
  limit?: string;
  search?: string;
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'Active' | 'Inactive' | 'Under Review' | 'Terminated';
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  contractStart: string;
  contractEnd: string;
  dataProcessed: string[];
  dataClassification: string;
  subProcessors: string[];
  complianceCertifications: string[];
  lastAssessmentDate: string;
  nextAssessmentDate: string;
  overallScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorAssessment {
  id: string;
  vendorId: string;
  assessmentDate: string;
  overallScore: number;
  categories: Array<{
    name: string;
    score: number;
    findings: string[];
  }>;
  recommendations: string[];
  assessedBy: string;
  status: 'Draft' | 'Completed' | 'Approved';
}

export interface VendorScorecard {
  vendorId: string;
  vendorName: string;
  overallScore: number;
  securityScore: number;
  complianceScore: number;
  operationalScore: number;
  financialScore: number;
  trend: Array<{ period: string; score: number }>;
  openFindings: number;
  certificates: string[];
}

export interface VendorDashboard {
  totalVendors: number;
  activeVendors: number;
  highRiskVendors: number;
  expiringContracts: number;
  overdueAssessments: number;
  averageScore: number;
  byRiskLevel: Record<string, number>;
  byCategory: Record<string, number>;
  recentAssessments: VendorAssessment[];
}

export interface CreateVendorInput {
  name: string;
  description?: string;
  category?: string;
  status?: string;
  riskLevel?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  contractStart?: string;
  contractEnd?: string;
  dataProcessed?: string[];
  dataClassification?: string;
  complianceCertifications?: string[];
}

export interface UpdateVendorInput {
  name?: string;
  description?: string;
  category?: string;
  status?: string;
  riskLevel?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  contractStart?: string;
  contractEnd?: string;
  dataProcessed?: string[];
  dataClassification?: string;
  subProcessors?: string[];
  complianceCertifications?: string[];
  lastAssessmentDate?: string;
  nextAssessmentDate?: string;
}

export interface CreateAssessmentInput {
  overallScore?: number;
  categories?: Array<{
    name: string;
    score: number;
    findings?: string[];
  }>;
  recommendations?: string[];
  status?: string;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (params?: VendorListParams) => [...vendorKeys.lists(), params] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
  scorecard: (id: string) => [...vendorKeys.all, 'scorecard', id] as const,
  dashboard: () => [...vendorKeys.all, 'dashboard'] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export const useVendors = (
  params?: VendorListParams,
  options?: Omit<UseQueryOptions<Vendor[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Vendor[], Error>({
    queryKey: vendorKeys.list(params),
    queryFn: async () => {
      const result = await api.vendors.list(params as any);
      return Array.isArray(result) ? result : (result as any)?.data ?? [];
    },
    ...options,
  });
};

export const useVendor = (
  id: string,
  options?: Omit<UseQueryOptions<Vendor, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Vendor, Error>({
    queryKey: vendorKeys.detail(id),
    queryFn: async () => {
      const result = await api.vendors.getById(id);
      return (result as any)?.data ?? result;
    },
    enabled: !!id,
    ...options,
  });
};

export const useVendorScorecard = (
  id: string,
  options?: Omit<UseQueryOptions<VendorScorecard, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<VendorScorecard, Error>({
    queryKey: vendorKeys.scorecard(id),
    queryFn: async () => {
      const result = await api.vendors.getScorecard(id);
      return (result as any)?.data ?? result;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // scorecards change infrequently
    ...options,
  });
};

export const useVendorDashboard = (
  options?: Omit<UseQueryOptions<VendorDashboard, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<VendorDashboard, Error>({
    queryKey: vendorKeys.dashboard(),
    queryFn: async () => {
      const result = await api.vendors.getDashboard();
      return (result as any)?.data ?? result;
    },
    staleTime: 2 * 60 * 1000, // dashboard refreshes every 2 min
    ...options,
  });
};

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  return useMutation<Vendor, Error, CreateVendorInput>({
    mutationFn: async (data) => {
      const result = await api.vendors.create(data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vendorKeys.dashboard() });
    },
  });
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();
  return useMutation<Vendor, Error, { id: string; data: UpdateVendorInput }>({
    mutationFn: async ({ id, data }) => {
      const result = await api.vendors.update(id, data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vendorKeys.scorecard(variables.id) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.dashboard() });
    },
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.vendors.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vendorKeys.dashboard() });
    },
  });
};

export const useCreateVendorAssessment = () => {
  const queryClient = useQueryClient();
  return useMutation<VendorAssessment, Error, { vendorId: string; data: CreateAssessmentInput }>({
    mutationFn: async ({ vendorId, data }) => {
      const result = await api.vendors.createAssessment(vendorId, data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(variables.vendorId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.scorecard(variables.vendorId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.dashboard() });
    },
  });
};
