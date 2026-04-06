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

// ── Contests ──

export function useContests(params?: { status?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));

  const qs = query.toString();
  return useQuery({
    queryKey: ['contests', params],
    queryFn: () =>
      api.get<{ contests: any[]; total: number; page: number; totalPages: number }>(
        `/contests${qs ? `?${qs}` : ''}`,
      ),
  });
}

export function useContest(slug: string) {
  const token = useToken();
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['contest', slug, userId],
    queryFn: () =>
      api.get<any>(`/contests/${slug}${userId ? `?userId=${userId}` : ''}`, {
        token: token ?? undefined,
      }),
    enabled: !!slug,
  });
}

export function useRegisterContest() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contestId: string) =>
      api.post<any>(`/contests/${contestId}/register`, {}, { token: token ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contest'] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    },
  });
}

export function useLeaderboard(contestId: string) {
  return useQuery({
    queryKey: ['leaderboard', contestId],
    queryFn: () => api.get<any>(`/leaderboard/${contestId}`),
    enabled: !!contestId,
    refetchInterval: 30000, // refresh every 30s during live contests
  });
}

export function useProblemStats(contestId: string) {
  return useQuery({
    queryKey: ['problemStats', contestId],
    queryFn: () => api.get<any[]>(`/leaderboard/${contestId}/stats`),
    enabled: !!contestId,
  });
}

// ── Temporal Leaderboard ──

export function useLeaderboardAtTime(contestId: string, minute: number) {
  return useQuery({
    queryKey: ['leaderboard', contestId, 'at', minute],
    queryFn: () => api.get<any>(`/leaderboard/${contestId}/at/${minute}`),
    enabled: !!contestId && minute >= 0,
  });
}

export function useUserProgression(contestId: string, userId: string) {
  return useQuery({
    queryKey: ['progression', contestId, userId],
    queryFn: () => api.get<any>(`/leaderboard/${contestId}/user/${userId}`),
    enabled: !!contestId && !!userId,
  });
}

export function useContestAnalytics(contestId: string) {
  return useQuery({
    queryKey: ['analytics', contestId],
    queryFn: () => api.get<any>(`/leaderboard/${contestId}/analytics`),
    enabled: !!contestId,
  });
}

export function useReplayData(contestId: string) {
  return useQuery({
    queryKey: ['replay', contestId],
    queryFn: () => api.get<any>(`/leaderboard/${contestId}/replay`),
    enabled: !!contestId,
  });
}

// ── User Profile ──

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ['userProfile', username],
    queryFn: () => api.get<any>(`/users/${username}`),
    enabled: !!username,
  });
}

export function useUserContestHistory(username: string) {
  return useQuery({
    queryKey: ['userContests', username],
    queryFn: () => api.get<any[]>(`/users/${username}/contests`),
    enabled: !!username,
  });
}

export function useUserRatingHistory(username: string) {
  return useQuery({
    queryKey: ['userRatings', username],
    queryFn: () => api.get<any[]>(`/users/${username}/ratings`),
    enabled: !!username,
  });
}

export function useUserSolvedProblems(username: string) {
  return useQuery({
    queryKey: ['userSolved', username],
    queryFn: () => api.get<any[]>(`/users/${username}/solved`),
    enabled: !!username,
  });
}

export function useDashboardStats() {
  const token = useToken();
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<any>('/users/me/dashboard', { token: token ?? undefined }),
    enabled: !!token,
  });
}
