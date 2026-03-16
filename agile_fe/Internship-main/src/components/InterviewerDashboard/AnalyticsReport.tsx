// src/pages/interviewer/AnalyticsReport.tsx
import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Calendar,
  Download,
  Filter,
  Briefcase,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  BarChart2Icon as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Award,
  Target,
  AlertCircle,
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../../components/skeleton/InterviewerDashboardSkeleton';

// ─── Mock Data ────────────────────────────────────────────────
const funnelData = [
  { name: 'Applied', value: 480, fill: '#3b82f6' },
  { name: 'Took Quiz', value: 320, fill: '#60a5fa' },
  { name: 'Passed Quiz', value: 180, fill: '#93c5fd' },
  { name: 'Interview', value: 95, fill: '#bfdbfe' },
  { name: 'Hired', value: 42, fill: '#1e40af' },
];

const timeToHireData = [
  { month: 'Jan', days: 18 },
  { month: 'Feb', days: 15 },
  { month: 'Mar', days: 14 },
  { month: 'Apr', days: 12 },
  { month: 'May', days: 13 },
  { month: 'Jun', days: 11 },
];

const assessmentScores = [
  { quiz: 'HTML/CSS', avg: 78, passRate: 82 },
  { quiz: 'JavaScript', avg: 65, passRate: 68 },
  { quiz: 'React', avg: 71, passRate: 75 },
  { quiz: 'Python', avg: 82, passRate: 88 },
];

const sourceData = [
  { name: 'University Portal', value: 38 },
  { name: 'LinkedIn', value: 24 },
  { name: 'Job Board', value: 18 },
  { name: 'Referral', value: 12 },
  { name: 'Other', value: 8 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a78bfa'];

const KPICard = ({ icon: Icon, title, value, trend }: any) => (
  <div className="rounded-[28px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)] hover:shadow-lg transition-all duration-200">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {trend && (
          <p className="text-sm flex items-center gap-1">
            <span className={trend.startsWith('+') ? 'text-green-600' : trend.startsWith('-') ? 'text-red-600' : 'text-slate-600'}>
              {trend}
            </span>
            <span className="text-slate-400">vs last period</span>
          </p>
        )}
      </div>
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const AnalyticsReport: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedRole, setSelectedRole] = useState('all');

  // In real app → fetch data here based on filters
  // useEffect(() => { fetchAggregatedData(dateRange, selectedRole) }, [dateRange, selectedRole]);

  const handleExport = (format: 'pdf' | 'csv') => {
    alert(`Exporting current view as ${format.toUpperCase()}... (mock)`);
    // Real: call API endpoint /api/reports/export?format=pdf&range=30d...
  };

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />

            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200 whitespace-nowrap">
                  <BarChartIcon className="w-4 h-4 shrink-0" />
                  <span>Analytics & reporting dashboard</span>
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Analytics & Reports
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                  Track hiring metrics, analyze candidate performance, and optimize your recruitment process with data-driven insights.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 min-w-full xl:min-w-[620px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Applications</p>
                  <h3 className="text-3xl font-bold mt-2">480</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Hired</p>
                  <h3 className="text-3xl font-bold mt-2">42</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Conv. Rate</p>
                  <h3 className="text-3xl font-bold mt-2">8.75%</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Time to Hire</p>
                  <h3 className="text-3xl font-bold mt-2">13.8d</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Filters:</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="pl-10 pr-8 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none appearance-none cursor-pointer"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="ytd">Year to Date</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="pl-10 pr-8 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="frontend">Frontend Developer</option>
                    <option value="python">Python Backend</option>
                    <option value="mobile">Mobile Dev Intern</option>
                  </select>
                </div>

                <button
                  onClick={() => handleExport('pdf')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                >
                  <Download size={16} />
                  Export PDF
                </button>

                <button
                  onClick={() => handleExport('csv')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KPICard icon={Users} title="Total Applications" value="480" trend="+18%" />
            <KPICard icon={CheckCircle} title="Hired Candidates" value="42" trend="+5%" />
            <KPICard icon={Clock} title="Avg. Time-to-Hire" value="13.8 days" trend="-2.1 days" />
            <KPICard icon={TrendingUp} title="Conversion Rate" value="8.75%" trend="+1.2%" />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Hiring Funnel */}
            <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-600" />
                  Hiring Funnel (Drop-off Analysis)
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Stage-wise
                </span>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 40px rgba(15,23,42,0.08)'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 2. Time to Hire Trend */}
            <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" />
                  Average Time-to-Hire Trend
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Monthly
                </span>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={timeToHireData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis unit=" days" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 40px rgba(15,23,42,0.08)'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Line type="monotone" dataKey="days" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 3. Assessment Scores (Full Width) */}
            <div className="lg:col-span-2 rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Award size={20} className="text-blue-600" />
                  Quiz Performance Breakdown
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Average Score vs Pass Rate
                </span>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={assessmentScores} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="quiz" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis yAxisId="left" orientation="left" unit="%" stroke="#3b82f6" tick={{ fill: '#3b82f6', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" unit="%" stroke="#10b981" tick={{ fill: '#10b981', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 40px rgba(15,23,42,0.08)'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Bar yAxisId="left" dataKey="avg" name="Average Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="passRate" name="Pass Rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 4. Source of Candidates */}
            <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Target size={20} className="text-blue-600" />
                  Candidate Sources
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Distribution
                </span>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 40px rgba(15,23,42,0.08)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer */}
          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl px-6 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock size={16} />
                Last updated: February 26, 2026
              </div>
              <p className="text-sm text-slate-400">
                Data is aggregated from all internship applications
              </p>
            </div>
          </div>
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default AnalyticsReport;