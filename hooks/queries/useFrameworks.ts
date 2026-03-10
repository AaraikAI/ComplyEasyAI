import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FrameworkControl {
  id: string;
  name: string;
  description: string;
  status: 'Not Started' | 'In Progress' | 'Implemented' | 'Not Applicable';
  category: string;
  evidence: string;
  evidenceRequired: boolean;
  ownerId: string;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  type: string;
  progress: number;
  status: string;
  controls: FrameworkControl[];
  totalControls: number;
  implementedControls: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateControlInput {
  name: string;
  description?: string;
  status?: string;
  category?: string;
  ownerId?: string;
}

export interface UpdateControlInput {
  status?: string;
  description?: string;
  evidence?: string;
  evidenceRequired?: boolean;
  ownerId?: string;
  category?: string;
}

export interface BulkUpdateControlsInput {
  controlIds: string[];
  status: string;
  evidenceRequired?: boolean;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const frameworkKeys = {
  all: ['frameworks'] as const,
  lists: () => [...frameworkKeys.all, 'list'] as const,
  list: (params?: Record<string, string>) => [...frameworkKeys.lists(), params] as const,
  details: () => [...frameworkKeys.all, 'detail'] as const,
  detail: (id: string, queryParams?: string) => [...frameworkKeys.details(), id, queryParams] as const,
  controls: (frameworkId: string) => [...frameworkKeys.all, 'controls', frameworkId] as const,
  evidenceUrl: (frameworkId: string, controlId: string) =>
    [...frameworkKeys.all, 'evidence-url', frameworkId, controlId] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export const useFrameworks = (
  options?: Omit<UseQueryOptions<ComplianceFramework[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ComplianceFramework[], Error>({
    queryKey: frameworkKeys.lists(),
    queryFn: async () => {
      const result = await api.frameworks.list();
      return Array.isArray(result) ? result : (result as any)?.data ?? [];
    },
    ...options,
  });
};

export const useFramework = (
  id: string,
  queryParams?: string,
  options?: Omit<UseQueryOptions<ComplianceFramework, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ComplianceFramework, Error>({
    queryKey: frameworkKeys.detail(id, queryParams),
    queryFn: async () => {
      const result = await api.frameworks.getById(id, queryParams);
      return (result as any)?.data ?? result;
    },
    enabled: !!id,
    ...options,
  });
};

export const useEvidenceUrl = (
  frameworkId: string,
  controlId: string,
  options?: Omit<UseQueryOptions<{ url: string }, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<{ url: string }, Error>({
    queryKey: frameworkKeys.evidenceUrl(frameworkId, controlId),
    queryFn: () => api.frameworks.getEvidenceUrl(frameworkId, controlId),
    enabled: !!frameworkId && !!controlId,
    staleTime: 10 * 60 * 1000, // evidence URLs valid for 10 min
    ...options,
  });
};

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export const useCreateControl = () => {
  const queryClient = useQueryClient();
  return useMutation<FrameworkControl, Error, { frameworkId: string; data: CreateControlInput }>({
    mutationFn: async ({ frameworkId, data }) => {
      const result = await api.frameworks.createControl(frameworkId, data);
      return result as any;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: frameworkKeys.detail(variables.frameworkId) });
      queryClient.invalidateQueries({ queryKey: frameworkKeys.lists() });
    },
  });
};

export const useUpdateControl = () => {
  const queryClient = useQueryClient();
  return useMutation<
    FrameworkControl,
    Error,
    { frameworkId: string; controlId: string; data: UpdateControlInput }
  >({
    mutationFn: async ({ frameworkId, controlId, data }) => {
      const result = await api.frameworks.updateControl(frameworkId, controlId, data);
      return result as any;
    },
    onMutate: async ({ frameworkId, controlId, data }) => {
      // Optimistic update for control status changes
      await queryClient.cancelQueries({ queryKey: frameworkKeys.detail(frameworkId) });
      const previousFramework = queryClient.getQueryData<ComplianceFramework>(
        frameworkKeys.detail(frameworkId)
      );

      if (previousFramework && data.status) {
        const updatedControls = previousFramework.controls?.map((ctrl) =>
          ctrl.id === controlId ? { ...ctrl, ...data } : ctrl
        );
        const implementedCount = updatedControls?.filter(
          (c) => c.status === 'Implemented'
        ).length ?? 0;
        const totalCount = updatedControls?.length ?? 1;

        queryClient.setQueryData<ComplianceFramework>(frameworkKeys.detail(frameworkId), {
          ...previousFramework,
          controls: updatedControls as FrameworkControl[],
          implementedControls: implementedCount,
          progress: Math.round((implementedCount / totalCount) * 100),
        });
      }

      return { previousFramework };
    },
    onError: (_err, variables, context) => {
      if ((context as any)?.previousFramework) {
        queryClient.setQueryData(
          frameworkKeys.detail(variables.frameworkId),
          (context as any).previousFramework
        );
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: frameworkKeys.detail(variables.frameworkId) });
      queryClient.invalidateQueries({ queryKey: frameworkKeys.lists() });
    },
  });
};

export const useBulkUpdateControls = () => {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { frameworkId: string; data: BulkUpdateControlsInput }
  >({
    mutationFn: async ({ frameworkId, data }) => {
      await api.frameworks.bulkUpdateControls(frameworkId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: frameworkKeys.detail(variables.frameworkId) });
      queryClient.invalidateQueries({ queryKey: frameworkKeys.lists() });
    },
  });
};

export const useDeleteControl = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { frameworkId: string; controlId: string }>({
    mutationFn: async ({ frameworkId, controlId }) => {
      await api.frameworks.deleteControl(frameworkId, controlId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: frameworkKeys.detail(variables.frameworkId) });
      queryClient.invalidateQueries({ queryKey: frameworkKeys.lists() });
    },
  });
};

export const useUploadEvidence = () => {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    Error,
    { frameworkId: string; controlId: string; formData: FormData }
  >({
    mutationFn: async ({ frameworkId, controlId, formData }) => {
      const result = await api.frameworks.uploadEvidence(frameworkId, controlId, formData);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: frameworkKeys.detail(variables.frameworkId) });
      queryClient.invalidateQueries({
        queryKey: frameworkKeys.evidenceUrl(variables.frameworkId, variables.controlId),
      });
    },
  });
};

export const useExportControl = () => {
  return useMutation<any, Error, { frameworkId: string; controlId: string }>({
    mutationFn: async ({ frameworkId, controlId }) => {
      const result = await api.frameworks.exportControl(frameworkId, controlId);
      return result;
    },
  });
};
