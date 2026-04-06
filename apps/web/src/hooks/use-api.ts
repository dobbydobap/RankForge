import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function useToken() {
  return useAuthStore((s) => s.accessToken);
}

// ── Problems ──

export function useProblems(params?: {
  difficulty?: string;
  tag?: string;
  search?: string;
  page?: number;
}) {
  const token = useToken();
  const query = new URLSearchParams();
  if (params?.difficulty) query.set('difficulty', params.difficulty);
  if (params?.tag) query.set('tag', params.tag);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));

  const qs = query.toString();
  return useQuery({
    queryKey: ['problems', params],
    queryFn: () =>
      api.get<{
        problems: any[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/problems${qs ? `?${qs}` : ''}`, { token: token ?? undefined }),
  });
}

export function useProblem(slug: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['problem', slug],
    queryFn: () => api.get<any>(`/problems/${slug}`, { token: token ?? undefined }),
    enabled: !!slug,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get<any[]>('/problems/tags'),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Submissions ──

export function useSubmitCode() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      problemId: string;
      contestId?: string;
      language: string;
      sourceCode: string;
    }) => api.post<any>('/submissions', data, { token: token ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export function useSubmissions(params?: {
  userId?: string;
  problemId?: string;
  page?: number;
}) {
  const token = useToken();
  const query = new URLSearchParams();
  if (params?.userId) query.set('userId', params.userId);
  if (params?.problemId) query.set('problemId', params.problemId);
  if (params?.page) query.set('page', String(params.page));

  const qs = query.toString();
  return useQuery({
    queryKey: ['submissions', params],
    queryFn: () =>
      api.get<{ submissions: any[]; total: number; page: number; totalPages: number }>(
        `/submissions${qs ? `?${qs}` : ''}`,
        { token: token ?? undefined },
      ),
  });
}

export function useSubmission(id: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['submission', id],
    queryFn: () => api.get<any>(`/submissions/${id}`, { token: token ?? undefined }),
    enabled: !!id,
  });
}
