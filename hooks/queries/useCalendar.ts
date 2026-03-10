import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeadlineListParams {
  status?: string;
  framework?: string;
  assignedTo?: string;
  page?: string;
  limit?: string;
  search?: string;
}

export interface Deadline {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'Upcoming' | 'Overdue' | 'Completed' | 'Cancelled';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  framework: string;
  controlId: string;
  assignedTo: string;
  reminderDays: number;
  recurrence: 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';
  completedAt: string | null;
  completedBy: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeadlineInput {
  title: string;
  description?: string;
  dueDate: string;
  priority?: string;
  framework?: string;
  controlId?: string;
  assignedTo?: string;
  reminderDays?: number;
  recurrence?: string;
  notes?: string;
}

export interface UpdateDeadlineInput {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  framework?: string;
  controlId?: string;
  assignedTo?: string;
  reminderDays?: number;
  recurrence?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const calendarKeys = {
  all: ['calendar'] as const,
  deadlines: () => [...calendarKeys.all, 'deadlines'] as const,
  deadlineList: (params?: DeadlineListParams) => [...calendarKeys.deadlines(), 'list', params] as const,
  deadlineDetail: (id: string) => [...calendarKeys.deadlines(), 'detail', id] as const,
  upcoming: (days?: number) => [...calendarKeys.all, 'upcoming', days] as const,
  overdue: () => [...calendarKeys.all, 'overdue'] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export const useDeadlines = (
  params?: DeadlineListParams,
  options?: Omit<UseQueryOptions<Deadline[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Deadline[], Error>({
    queryKey: calendarKeys.deadlineList(params),
    queryFn: async () => {
      const result = await api.calendar.listDeadlines(params as any);
      if (Array.isArray(result)) return result;
      return (result as any)?.data ?? (result as any)?.deadlines ?? [];
    },
    ...options,
  });
};

export const useDeadline = (
  id: string,
  options?: Omit<UseQueryOptions<Deadline, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Deadline, Error>({
    queryKey: calendarKeys.deadlineDetail(id),
    queryFn: async () => {
      const result = await api.calendar.getDeadline(id);
      return (result as any)?.data ?? result;
    },
    enabled: !!id,
    ...options,
  });
};

export const useUpcomingDeadlines = (
  days?: number,
  options?: Omit<UseQueryOptions<Deadline[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Deadline[], Error>({
    queryKey: calendarKeys.upcoming(days),
    queryFn: async () => {
      const result = await api.calendar.getUpcoming(days);
      if (Array.isArray(result)) return result;
      return (result as any)?.data ?? (result as any)?.deadlines ?? [];
    },
    staleTime: 60 * 1000, // upcoming deadlines refresh every minute
    ...options,
  });
};

export const useOverdueDeadlines = (
  options?: Omit<UseQueryOptions<Deadline[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Deadline[], Error>({
    queryKey: calendarKeys.overdue(),
    queryFn: async () => {
      const result = await api.calendar.getOverdue();
      if (Array.isArray(result)) return result;
      return (result as any)?.data ?? (result as any)?.deadlines ?? [];
    },
    staleTime: 60 * 1000, // overdue deadlines refresh every minute
    ...options,
  });
};

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export const useCreateDeadline = () => {
  const queryClient = useQueryClient();
  return useMutation<Deadline, Error, CreateDeadlineInput>({
    mutationFn: async (data) => {
      const result = await api.calendar.createDeadline(data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.deadlines() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.overdue() });
    },
  });
};

export const useUpdateDeadline = () => {
  const queryClient = useQueryClient();
  return useMutation<Deadline, Error, { id: string; data: UpdateDeadlineInput }>({
    mutationFn: async ({ id, data }) => {
      const result = await api.calendar.updateDeadline(id, data as any);
      return (result as any)?.data ?? result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.deadlineDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: calendarKeys.deadlines() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.overdue() });
    },
  });
};

export const useDeleteDeadline = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.calendar.deleteDeadline(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.deadlines() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.overdue() });
    },
  });
};

export const useCompleteDeadline = () => {
  const queryClient = useQueryClient();
  return useMutation<Deadline, Error, string>({
    mutationFn: async (id) => {
      const result = await api.calendar.completeDeadline(id);
      return (result as any)?.data ?? result;
    },
    onMutate: async (id) => {
      // Optimistic update: mark as completed
      await queryClient.cancelQueries({ queryKey: calendarKeys.deadlineDetail(id) });
      const previousDeadline = queryClient.getQueryData<Deadline>(calendarKeys.deadlineDetail(id));

      if (previousDeadline) {
        queryClient.setQueryData<Deadline>(calendarKeys.deadlineDetail(id), {
          ...previousDeadline,
          status: 'Completed',
          completedAt: new Date().toISOString(),
        });
      }

      return { previousDeadline };
    },
    onError: (_err, id, context) => {
      if ((context as any)?.previousDeadline) {
        queryClient.setQueryData(calendarKeys.deadlineDetail(id), (context as any).previousDeadline);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.deadlines() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.overdue() });
    },
  });
};
