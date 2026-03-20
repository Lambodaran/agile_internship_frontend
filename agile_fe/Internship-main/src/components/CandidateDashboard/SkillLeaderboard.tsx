// src/pages/candidate/SkillLeaderboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Filter,
  Search,
  ChevronDown,
  TrendingUp,
  Users,
  Crown,
  Target,
  BarChart2,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import CandidateDashboardSkeleton from '../../components/skeleton/CandidateDashboardSkeleton';
import axios from 'axios';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

const baseApi = import.meta.env.VITE_BASE_API;

const api = axios.create({
  baseURL: baseApi,
  headers: { 'Content-Type': 'application/json' },
});

interface LeaderboardEntry {
  user_id: number;
  name: string;
  username: string | null;
  rank: number;
  average_score: number;
  tests_completed: number;
  primary_field: string;
}

interface LeaderboardResponse {
  summary: {
    total_participants: number;
    top_score: number;
    average_score: number;
  };
  current_user: {
    user_id: number;
    name: string;
    username: string | null;
    rank: number | null;
    average_score: number;
    tests_completed: number;
  } | null;
  filters: {
    fields: string[];
  };
  leaderboard: LeaderboardEntry[];
}

const PODIUM_COLORS = {
  1: 'from-yellow-400 to-amber-500',
  2: 'from-slate-300 to-slate-500',
  3: 'from-amber-600 to-orange-700',
};

const CHART_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
];

const getRankBadge = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
  return null;
};

const getRankPillClass = (rank: number) => {
  if (rank === 1) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (rank === 2) return 'bg-slate-100 text-slate-700 border-slate-200';
  if (rank === 3) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const SectionCard = ({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="rounded-[30px] border border-slate-200/70 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
    <div className="mb-5">
      <div className="flex items-center gap-2">
        {Icon ? (
          <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Icon className="w-4 h-4" />
          </div>
        ) : null}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
    {children}
  </div>
);

const SkillLeaderboard: React.FC = () => {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [search, setSearch] = useState('');
  const [fieldFilter, setFieldFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      setError('No access token found. Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<LeaderboardResponse>('/candidates/skill-leaderboard/', {
        headers: { Authorization: `Token ${token}` },
      });

      setData(response.data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const leaderboard = data?.leaderboard || [];
  const currentUser = data?.current_user;
  const summary = data?.summary;
  const fields = data?.filters?.fields || ['All'];

  const cleanedFields = useMemo(() => {
    return fields.filter((item) => item && item !== 'General');
  }, [fields]);

  const filteredLeaderboard = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leaderboard.filter((item) => {
      const matchesField =
        fieldFilter === 'All' || item.primary_field === fieldFilter;

      const matchesSearch =
        !query ||
        (item.name || '').toLowerCase().includes(query) ||
        (item.username || '').toLowerCase().includes(query) ||
        (item.primary_field || '').toLowerCase().includes(query);

      return matchesField && matchesSearch;
    });
  }, [leaderboard, search, fieldFilter]);

  const podium = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);

  const topPerformerChartData = useMemo(() => {
    return filteredLeaderboard.slice(0, 8).map((item) => ({
      name: item.username || item.name,
      score: item.average_score,
    }));
  }, [filteredLeaderboard]);

  const fieldDistributionData = useMemo(() => {
    const fieldMap = new Map<string, number>();

    leaderboard.forEach((item) => {
      if (item.primary_field) {
        fieldMap.set(item.primary_field, (fieldMap.get(item.primary_field) || 0) + 1);
      }
    });

    return Array.from(fieldMap.entries()).map(([name, value]) => ({ name, value }));
  }, [leaderboard]);

  if (loading) {
    return (
      <CandidateDashboardSkeleton>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">Loading leaderboard...</p>
          </div>
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  return (
    <CandidateDashboardSkeleton>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />

            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200 whitespace-nowrap">
                  <Trophy className="w-4 h-4 shrink-0" />
                  <span>Candidate performance rankings</span>
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Skill Leaderboard
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                  See where you stand and compare completed quiz performance across candidates.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 min-w-full xl:min-w-[620px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Participants</p>
                  <h3 className="text-3xl font-bold mt-2">{summary?.total_participants || 0}</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Your Rank</p>
                  <h3 className="text-3xl font-bold mt-2">{currentUser?.rank || '-'}</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Highest Average</p>
                  <h3 className="text-3xl font-bold mt-2">{summary?.top_score || 0}%</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Overall Average</p>
                  <h3 className="text-3xl font-bold mt-2">{summary?.average_score || 0}%</h3>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-[28px] border border-red-200 bg-red-50 p-4 sm:p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {podium.length > 0 && (
            <SectionCard
              title="Top Performers"
              subtitle="Highest ranked candidates based on average completed quiz score"
              icon={Trophy}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {podium.map((entry) => (
                  <div
                    key={entry.user_id}
                    className={`relative rounded-[28px] border p-5 shadow-sm ${
                      currentUser?.user_id === entry.user_id
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getRankPillClass(entry.rank)}`}>
                          Rank {entry.rank}
                          {getRankBadge(entry.rank)}
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                          {entry.name}
                        </h3>
                        {entry.username ? <p className="text-sm text-slate-500">@{entry.username}</p> : null}
                      </div>

                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${PODIUM_COLORS[entry.rank as 1 | 2 | 3]} flex items-center justify-center text-white shrink-0`}>
                        <Trophy className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white p-3 border border-slate-200">
                        <p className="text-xs text-slate-500">Avg Quiz Score</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{entry.average_score}%</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 border border-slate-200">
                        <p className="text-xs text-slate-500">Tests</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{entry.tests_completed}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SectionCard
              title="Top Score Comparison"
              subtitle="Top visible candidates by average quiz score"
              icon={BarChart2}
            >
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topPerformerChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Average Score']}
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  <Bar dataKey="score" radius={[10, 10, 0, 0]}>
                    {topPerformerChartData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard
              title="Candidates by Internship Field"
              subtitle="Candidates grouped by internship field"
              icon={Target}
            >
              {fieldDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={fieldDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {fieldDistributionData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm">
                  No field data available
                </div>
              )}
            </SectionCard>
          </div>

          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Filter leaderboard:</span>
              </div>

              <div className="flex flex-wrap gap-3 flex-1 justify-end">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, username, or field..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-11 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  />
                </div>

                <div className="relative">
                  <select
                    value={fieldFilter}
                    onChange={(e) => setFieldFilter(e.target.value)}
                    className="appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition min-w-[180px] cursor-pointer"
                  >
                    {cleanedFields.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 size={20} className="text-blue-600" />
                  Global Rankings
                </h2>
                <p className="text-sm text-slate-500">
                  Showing {filteredLeaderboard.length} of {summary?.total_participants || 0} participants
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Quiz Score</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaderboard.map((entry) => (
                    <tr
                      key={entry.user_id}
                      className={`hover:bg-slate-50 transition-colors ${
                        currentUser?.user_id === entry.user_id ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold ${getRankPillClass(entry.rank)}`}>
                            {entry.rank}
                          </div>
                          {entry.rank <= 3 && getRankBadge(entry.rank)}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-slate-900">{entry.name}</p>
                          {entry.username ? <p className="text-xs text-slate-500">@{entry.username}</p> : null}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-slate-900">{entry.average_score}%</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{entry.tests_completed}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLeaderboard.length === 0 && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  No results found
                </h3>
                <p className="text-sm text-slate-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl px-6 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <TrendingUp size={16} />
                Rankings are based on completed quiz averages
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users size={16} />
                  Compare against all participating candidates
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 size={16} />
                  Complete more quizzes to improve your position
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default SkillLeaderboard;