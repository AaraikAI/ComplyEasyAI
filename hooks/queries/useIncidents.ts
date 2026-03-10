import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IncidentListParams {
  status?: string;
  severity?: string;
  type?: string;
  assignedTo?: string;
  page?: string;
  limit?: string;
  search?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: 'security' | 'privacy' | 'compliance' | 'operational' | 'other';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Investigating' | 'Contained' | 'Remediated' | 'Closed';
  assignedTo: string;
  reportedBy: string;
  detectedAt: string;
  containedAt: string | null;
  resolvedAt: string | null;
  rootCause: string;
  impactAssessment: string;
  lessonsLearned: string;
  affectedSystems: string[];
  affectedData: string[];
  notificationRequired: boolean;
  regulatoryReportFiled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentTimelineEntry {
  id: string;
  incidentId: string;
  action: string;
  description: string;
  performedBy: string;
  timestamp: string;
}

export interface IncidentTask {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
  completedAt: string | null;
}

export interface IncidentMetrics {
  totalIncidents: number;
  openIncidents: number;
  avgTimeToDetect: number;
  avgTimeToContain: number;
  avgTimeToResolve: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  trend: Array<{ period: string; count: number }>;
}

export interface CreateIncidentInput {
  title: string;
  description?: string;
  type: string;
  severity: string;
  assignedTo?: string;
  detectedAt?: string;
  affectedSystems?: string[];
  affectedData?: string[];
}

export interface UpdateIncidentInput {
  title?: string;
  description?: string;
  type?: string;
  severity?: string;
  status?: string;
  assignedTo?: string;
  rootCause?: string;
  impactAssessment?: string;
  lessonsLearned?: string;
  containedAt?: string;
  resolvedAt?: string;
  notificationRequired?: boolean;
  regulatoryReportFiled?: boolean;
}

export interface AddTimelineInput {
  action: string;
  description: string;
  performedBy?: string;
  timestamp?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignedTo?: string;
  status?: string;
  dueDate?: string;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const incidentKeys = {
  all: ['incidents'] as const,
  lists: () => [...incidentKeys.all, 'list'] as const,
  list: (params?: IncidentListParams) => [...incidentKeys.lists(), params] as const,
  details: () => [...incidentKeys.all, 'detail'] as const,
  detail: (id: string) => [...incidentKeys.details(), id] as const,
  timeline: (id: string) => [...incidentKeys.all, 'timeline', id] as const,
  metrics: () => [...incidentKeys.all, 'metrics'] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export const useIncidents = (
  params?: IncidentListParams,
  options?: Omit<UseQueryOptions<Incident[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Incident[], Error>({
    queryKey: incidentKeys.list(params),
    queryFn: async () => {
      const result = await api.incidents.list(params as any);
      if (Array.isArray(result)) return result;
      return (result as any)?.data ?? (result as any)?.incidents ?? [];
    },
    ...options,
  });
};

export const useIncident = (
  id: string,
  options?: Omit<UseQueryOptions<Incident, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Incident, Error>({
    queryKey: incidentKeys.detail(id),
    queryFn: async () => {
      const result = await api.incidents.get(id);
      return (result as any)?.data ?? result;
    },
    enabled: !!id,
    ...options,
  });
};

export const useIncidentTimeline = (
  id: string,
  options?: Omit<UseQueryOptions<IncidentTimelineEntry[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<IncidentTimelineEntry[], Error>({
    queryKey: incidentKeys.timeline(id),
    queryFn: async () => {
      const result = await api.incidents.getTimeline(id);
      if (Array.isArray(result)) return result;
      return (result as any)?.data ?? (result as any)?.timeline ?? [];
    },
    enabled: !!id,
    ...options,
  });
};

export const useIncidentMetrics = (
  options?: Omit<UseQueryOptions<IncidentMetrics, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<IncidentMetrics, Error>({
    queryKey: incidentKeys.metrics(),
    queryFn: async () => {
      const result = await api.incidents.getMetrics();
      return (result as any)?.data ?? result;
    },
    staleTime: 2 * 60 * 1000, // metrics refresh every 2 min
    ...options,
  });
};

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export const useCreateIncident = () => {
  const queryClient = useQueryClient();
  return useMutation<Incident, Error, CreateIncidentInput>({
    mutationFn: async (data) => {
      const result = await api.incidents.create(data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.metrics() });
    },
  });
};

export const useUpdateIncident = () => {
  const queryClient = useQueryClient();
  return useMutation<Incident, Error, { id: string; data: UpdateIncidentInput }>({
    mutationFn: async ({ id, data }) => {
      const result = await api.incidents.update(id, data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.metrics() });
    },
  });
};

export const useDeleteIncident = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.incidents.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.metrics() });
    },
  });
};

export const useAddTimelineEntry = () => {
  const queryClient = useQueryClient();
  return useMutation<IncidentTimelineEntry, Error, { incidentId: string; data: AddTimelineInput }>({
    mutationFn: async ({ incidentId, data }) => {
      const result = await api.incidents.addTimeline(incidentId, data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.timeline(variables.incidentId) });
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(variables.incidentId) });
    },
  });
};

export const useCreateIncidentTask = () => {
  const queryClient = useQueryClient();
  return useMutation<IncidentTask, Error, { incidentId: string; data: CreateTaskInput }>({
    mutationFn: async ({ incidentId, data }) => {
      const result = await api.incidents.createTask(incidentId, data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(variables.incidentId) });
    },
  });
};

export const useUpdateIncidentTask = () => {
  const queryClient = useQueryClient();
  return useMutation<
    IncidentTask,
    Error,
    { incidentId: string; taskId: string; data: UpdateTaskInput }
  >({
    mutationFn: async ({ incidentId, taskId, data }) => {
      const result = await api.incidents.updateTask(incidentId, taskId, data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(variables.incidentId) });
    },
  });
};
