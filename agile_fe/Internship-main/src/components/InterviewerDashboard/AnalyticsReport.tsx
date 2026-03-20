// src/pages/interviewer/AnalyticsReport.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar,
} from 'recharts';
import {
  BarChart3,
  Briefcase,
  Calendar,
  ClipboardList,
  Download,
  Filter,
  Trophy,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Target,
  Users,
  GitBranch,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../../components/skeleton/InterviewerDashboardSkeleton';

const baseApi = import.meta.env.VITE_BASE_API;

const api = axios.create({
  baseURL: baseApi,
  headers: { 'Content-Type': 'application/json' },
});

const DATE_RANGES = ['7d', '30d', '90d', 'ytd', 'all'];

const STATUS_COLORS = ['#3b82f6', '#14b8a6', '#f97316', '#ef4444'];

const INTERVIEW_STAGE_COLORS: Record<string, string> = {
  Scheduled: '#8b5cf6',
  Attended: '#06b6d4',
  Absent: '#ef4444',
  Selected: '#22c55e',
  'Not Selected': '#f59e0b',
  Pending: '#6366f1',
};

const FUNNEL_COLORS = ['#2563eb', '#6366f1', '#a855f7', '#06b6d4', '#22c55e'];

interface ChartValueItem {
  name: string;
  value: number;
}

interface RoleBreakdownItem {
  role: string;
  applications: number;
  completed_quiz: number;
  accepted: number;
  rejected: number;
  passed_quiz: number;
  selected: number;
}

interface AvgScoreItem {
  role: string;
  average_score: number;
}

interface AnalyticsResponse {
  filters?: {
    date_range: string;
    selected_role: string;
    available_roles: string[];
  };
  overview?: {
    total_jobs_posted: number;
    total_applications: number;
    total_pending: number;
    total_accepted: number;
    total_rejected: number;
    test_completed: number;
    test_passed: number;
    scheduled_interviews: number;
    attended_interviews: number;
    absent_interviews: number;
    selected_candidates: number;
    rejected_after_interview: number;
    pending_interview_decisions: number;
  };
  charts?: {
    application_status: ChartValueItem[];
    assessment_pipeline: ChartValueItem[];
    interview_outcomes: ChartValueItem[];
    role_breakdown: RoleBreakdownItem[];
    avg_scores_by_role: AvgScoreItem[];
  };
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  subtle,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  subtle: string;
}) => (
  <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)] transition-all duration-300">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-2xl ${subtle} flex items-center justify-center shrink-0`}>
        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  </div>
);

const ChartCard = ({
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
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
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
    </div>
    {children}
  </div>
);

const CustomInterviewLegend = ({
  data,
}: {
  data: Array<{ name: string; value: number; fill: string }>;
}) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
    {data.map((item) => (
      <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: item.fill }}
          />
          <span className="text-sm text-slate-700 truncate">{item.name}</span>
        </div>
        <span className="text-sm font-semibold text-slate-900">{item.value}</span>
      </div>
    ))}
  </div>
);

const AnalyticsReport: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedRole, setSelectedRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [prefetching, setPrefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  const cacheRef = useRef<Record<string, AnalyticsResponse>>({});
  const prefetchedRef = useRef(false);

  const getCacheKey = (range: string, role: string) => `${range}__${role}`;

  const fetchAnalyticsSummary = async (range: string, role: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found. Please login again.');
    }

    const response = await api.get<AnalyticsResponse>('/interviewer/analytics-summary/', {
      headers: { Authorization: `Token ${token}` },
      params: {
        date_range: range,
        selected_role: role,
      },
    });

    return response.data || {};
  };

  const prefetchAllCombinations = async (roles: string[]) => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    setPrefetching(true);

    try {
      const allRoles = ['all', ...roles.filter((role) => role && role !== 'all')];
      const tasks: Promise<void>[] = [];

      for (const range of DATE_RANGES) {
        for (const role of allRoles) {
          const key = getCacheKey(range, role);
          if (!cacheRef.current[key]) {
            tasks.push(
              fetchAnalyticsSummary(range, role)
                .then((payload) => {
                  cacheRef.current[key] = payload;
                })
                .catch(() => {
                  // Ignore prefetch errors so UI still works
                })
            );
          }
        }
      }

      await Promise.all(tasks);
    } finally {
      setPrefetching(false);
    }
  };

  const loadInitialAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const initialPayload = await fetchAnalyticsSummary('30d', 'all');
      cacheRef.current[getCacheKey('30d', 'all')] = initialPayload;
      setAnalytics(initialPayload);

      const roles = initialPayload.filters?.available_roles || [];
      void prefetchAllCombinations(roles);
    } catch (err) {
      console.error('Failed to load analytics summary:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load analytics report.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialAnalytics();
  }, []);

  useEffect(() => {
    if (loading) return;

    const key = getCacheKey(dateRange, selectedRole);
    const cached = cacheRef.current[key];

    if (cached) {
      setAnalytics(cached);
      setUpdating(false);
      return;
    }

    let cancelled = false;

    const loadOnDemand = async () => {
      try {
        setUpdating(true);
        setError(null);

        const payload = await fetchAnalyticsSummary(dateRange, selectedRole);
        cacheRef.current[key] = payload;

        if (!cancelled) {
          setAnalytics(payload);
        }
      } catch (err) {
        console.error('Failed to load analytics summary:', err);
        if (!cancelled) {
          setError('Failed to load analytics report.');
        }
      } finally {
        if (!cancelled) {
          setUpdating(false);
        }
      }
    };

    void loadOnDemand();

    return () => {
      cancelled = true;
    };
  }, [dateRange, selectedRole, loading]);

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please login again.');
        return;
      }

      const response = await api.get('/interviewer/analytics/download-pdf/', {
        headers: { Authorization: `Token ${token}` },
        params: {
          date_range: dateRange,
          selected_role: selectedRole,
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interviewer-analytics-${dateRange}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  const roleOptions = analytics?.filters?.available_roles || [];
  const overview = analytics?.overview;
  const charts = analytics?.charts;

  const safeOverview = {
    total_jobs_posted: overview?.total_jobs_posted ?? 0,
    total_applications: overview?.total_applications ?? 0,
    total_pending: overview?.total_pending ?? 0,
    total_accepted: overview?.total_accepted ?? 0,
    total_rejected: overview?.total_rejected ?? 0,
    test_completed: overview?.test_completed ?? 0,
    test_passed: overview?.test_passed ?? 0,
    scheduled_interviews: overview?.scheduled_interviews ?? 0,
    attended_interviews: overview?.attended_interviews ?? 0,
    absent_interviews: overview?.absent_interviews ?? 0,
    selected_candidates: overview?.selected_candidates ?? 0,
    rejected_after_interview: overview?.rejected_after_interview ?? 0,
    pending_interview_decisions: overview?.pending_interview_decisions ?? 0,
  };

  const roleRadarData = useMemo(() => {
    return (charts?.role_breakdown || []).map((item) => ({
      role: item.role,
      applications: item.applications,
      completedQuiz: item.completed_quiz ?? 0,
      passedQuiz: item.passed_quiz,
    }));
  }, [charts]);

  const scoreTrendData = useMemo(() => {
    return (charts?.avg_scores_by_role || []).map((item) => ({
      role: item.role,
      average_score: item.average_score,
    }));
  }, [charts]);

  const applicationStatusData = useMemo(() => {
    return (charts?.application_status || []).filter((item) => item.value > 0);
  }, [charts]);

  const interviewOutcomesData = useMemo(() => {
    return (charts?.interview_outcomes || [])
      .filter((item) => item.value > 0)
      .map((item) => ({
        ...item,
        fill: INTERVIEW_STAGE_COLORS[item.name] || '#6366f1',
      }));
  }, [charts]);

  const funnelData = useMemo(() => {
    return [
      { name: 'Applications', value: safeOverview.total_applications, fill: FUNNEL_COLORS[0] },
      { name: 'Quiz Completed', value: safeOverview.test_completed, fill: FUNNEL_COLORS[1] },
      { name: 'Quiz Passed', value: safeOverview.test_passed, fill: FUNNEL_COLORS[2] },
      { name: 'Interviewed', value: safeOverview.attended_interviews, fill: FUNNEL_COLORS[3] },
      { name: 'Selected', value: safeOverview.selected_candidates, fill: FUNNEL_COLORS[4] },
    ].filter((item) => item.value > 0);
  }, [safeOverview]);

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.22),transparent_36%)]" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-slate-200">
                  <Sparkles className="w-4 h-4" />
                  Interviewer Analytics
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold">
                  Recruitment Analytics Report
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  View the most relevant recruitment insights with cleaner visuals, stronger comparisons, and role-based hiring performance.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 min-w-full lg:min-w-[420px]">
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                  <p className="text-slate-300 text-sm">Applications</p>
                  <h3 className="text-3xl font-bold mt-2">{safeOverview.total_applications}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                  <p className="text-slate-300 text-sm">Quiz Passed</p>
                  <h3 className="text-3xl font-bold mt-2">{safeOverview.test_passed}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                  <p className="text-slate-300 text-sm">Interviews</p>
                  <h3 className="text-3xl font-bold mt-2">{safeOverview.scheduled_interviews}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                  <p className="text-slate-300 text-sm">Selected</p>
                  <h3 className="text-3xl font-bold mt-2">{safeOverview.selected_candidates}</h3>
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

          <div className="rounded-[32px] border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Filters</span>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="appearance-none pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="ytd">Year to Date</option>
                    <option value="all">All Time</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>

                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="appearance-none pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
                  >
                    <option value="all">All Roles</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>

                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
                >
                  <Download size={16} />
                  Export PDF
                </button>

                {(updating || prefetching) && (
                  <div className="inline-flex items-center gap-2 text-sm text-slate-500 px-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {updating ? 'Updating' : 'Preparing filters'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`space-y-6 transition-opacity duration-200 ${updating ? 'opacity-80' : 'opacity-100'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              <StatCard
                title="Jobs Posted"
                value={safeOverview.total_jobs_posted}
                icon={Briefcase}
                gradient="from-blue-500 to-indigo-600"
                subtle="bg-blue-50"
              />
              <StatCard
                title="Total Applications"
                value={safeOverview.total_applications}
                icon={ClipboardList}
                gradient="from-fuchsia-500 to-violet-600"
                subtle="bg-fuchsia-50"
              />
              <StatCard
                title="Quiz Passed"
                value={safeOverview.test_passed}
                icon={FileSpreadsheet}
                gradient="from-emerald-500 to-teal-600"
                subtle="bg-emerald-50"
              />
              <StatCard
                title="Selected Candidates"
                value={safeOverview.selected_candidates}
                icon={Trophy}
                gradient="from-amber-500 to-orange-500"
                subtle="bg-amber-50"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard
                title="Application Status"
                subtitle="Pending, accepted, and rejected applications"
                icon={Target}
              >
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={112}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {applicationStatusData.map((_, index) => (
                        <Cell key={index} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Assessment Progress"
                subtitle="Applications, quiz completion, and quiz pass progression"
                icon={BarChart3}
              >
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={charts?.assessment_pipeline || []}>
                    <defs>
                      <linearGradient id="assessmentFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.12} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fill="url(#assessmentFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Interview Outcomes"
                subtitle="Only stages with real values are displayed"
                icon={Users}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart
                    innerRadius="25%"
                    outerRadius="95%"
                    data={interviewOutcomesData}
                    startAngle={180}
                    endAngle={-180}
                    barSize={16}
                  >
                    <RadialBar dataKey="value" background cornerRadius={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>

                <CustomInterviewLegend data={interviewOutcomesData} />
              </ChartCard>

              <ChartCard
                title="Average Quiz Score by Role"
                subtitle="Role-based score comparison using a cleaner visual style"
                icon={FileSpreadsheet}
              >
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={scoreTrendData}>
                    <defs>
                      <linearGradient id="scoreBars" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fb7185" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="role" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <Bar dataKey="average_score" fill="url(#scoreBars)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard
              title="Recruitment Funnel"
              subtitle="Candidate progression across each stage"
              icon={GitBranch}
            >
              <ResponsiveContainer width="100%" height={340}>
                <BarChart layout="vertical" data={funnelData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Role-wise Recruitment Performance"
              subtitle="Spider graph for applications, quiz completion, and quiz pass"
              icon={CheckCircle2}
            >
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart cx="50%" cy="50%" outerRadius={145} data={roleRadarData}>
                  <PolarGrid gridType="polygon" stroke="#cbd5e1" />
                  <PolarAngleAxis
                    dataKey="role"
                    tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                  />

                  <Radar
                    name="Applications"
                    dataKey="applications"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.12}
                    strokeWidth={3}
                  />

                  <Radar
                    name="Quiz Completed"
                    dataKey="completedQuiz"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.12}
                    strokeWidth={3}
                  />

                  <Radar
                    name="Quiz Passed"
                    dataKey="passedQuiz"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.12}
                    strokeWidth={3}
                  />

                  <Legend wrapperStyle={{ paddingTop: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="rounded-[28px] border border-slate-200/70 bg-white px-6 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle2 size={16} />
                Last updated: {new Date().toLocaleDateString()}
              </div>
              <p className="text-sm text-slate-400">Recruitment insights overview</p>
            </div>
          </div>
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default AnalyticsReport;